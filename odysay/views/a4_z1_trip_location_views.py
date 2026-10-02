import os
import time
import math
from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, current_app, g
from werkzeug.utils import secure_filename
from odysay.models import (
    db, User, Uploadmd, TripLocationmd,
    Bookmark, Review, TravelTalk,
    TravelTalkComment, Comment
)

bp = Blueprint('trip_location', __name__, url_prefix='/homepage/trip_location')

#  거리 계산 함수 (지도)
def calculate_distance(lat1, lon1, lat2, lon2):
    earth_radius = 6371

    lat1, lon1 = math.radians(lat1), math.radians(lon1)
    lat2, lon2 = math.radians(lat2), math.radians(lon2)

    lat_diff = lat2 - lat1
    lon_diff = lon2 - lon1

    a = math.sin(lat_diff / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(lon_diff / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius * c

# -----------------------------------------------------------
# 여행지 상세 페이지
# -----------------------------------------------------------
@bp.route('/<int:place_id>')
def trip_location_detail(place_id):
    place_data = TripLocationmd.query.get_or_404(place_id)
    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    restaurant_photos = (
        [p.strip() for p in place_data.restaurant_photos.split(',') if p.strip()]
        if place_data.restaurant_photos else []
    )
    nearby_photos = (
        [p.strip() for p in place_data.nearby_photos.split(',') if p.strip()]
        if place_data.nearby_photos else []
    )

    author = User.query.get(place_data.user_id) if place_data.user_id else None

    # 10km 이내 주변 여행지
    nearby_places = []

    if place_data.latitude is not None and place_data.longitude is not None:
        other_places = TripLocationmd.query.filter(
            TripLocationmd.id != place_data.id,
            TripLocationmd.latitude.isnot(None),
            TripLocationmd.longitude.isnot(None)
        ).all()

        for other_place in other_places:
            distance = calculate_distance(
                place_data.latitude,
                place_data.longitude,
                other_place.latitude,
                other_place.longitude
            )

            if distance <= 10:
                nearby_places.append({
                    'place': other_place,
                    'distance': round(distance, 1)
                })

        nearby_places.sort(key=lambda item: item['distance'])
        nearby_places = nearby_places[:3]

    return render_template(
        'trip_location.html',
        place=place_data,
        photos=photos,
        restaurant_photos=restaurant_photos,
        nearby_photos=nearby_photos,
        author=author,
        nearby_places=nearby_places
    )


# -----------------------------------------------------------
# 여행지 수정 페이지
# -----------------------------------------------------------
@bp.route('/<int:place_id>/edit', methods=['GET', 'POST'])
def trip_location_edit(place_id):
    place_data = TripLocationmd.query.get_or_404(place_id)

    # 작성자 확인 및 로그인 체크
    if not g.user or place_data.user_id != g.user.id:
        return redirect(url_for('trip_location.trip_location_detail', place_id=place_id))

    if request.method == 'POST':
        place_data.country = request.form.get('country', '')
        place_data.region = request.form.get('region', '')
        place_data.place = request.form.get('place', '')

        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)

        place_data.category = ', '.join(categories)
        place_data.intro = request.form.get('intro')
        place_data.reason = request.form.get('reason')
        place_data.restaurant = request.form.get('restaurant')
        place_data.nearby = request.form.get('nearby')

        existing_photos = request.form.getlist('existing_photos')
        existing_restaurant_photos = request.form.getlist('existing_restaurant_photos')
        existing_nearby_photos = request.form.getlist('existing_nearby_photos')

        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        def save_new_files(file_field_name):
            new_files = []
            for file in request.files.getlist(file_field_name):
                if file and file.filename.strip() != '':
                    filename = secure_filename(file.filename)
                    unique_filename = f"{int(time.time())}_{filename}"
                    file.save(os.path.join(upload_folder, unique_filename))
                    new_files.append(unique_filename)
            return new_files

        new_photos = save_new_files('photos')
        new_restaurant_photos = save_new_files('restaurant_photos')
        new_nearby_photos = save_new_files('nearby_photos')

        final_photos = existing_photos + new_photos
        final_restaurant_photos = existing_restaurant_photos + new_restaurant_photos
        final_nearby_photos = existing_nearby_photos + new_nearby_photos

        place_data.photos = ','.join(final_photos) if final_photos else None
        place_data.restaurant_photos = ','.join(final_restaurant_photos) if final_restaurant_photos else None
        place_data.nearby_photos = ','.join(final_nearby_photos) if final_nearby_photos else None
        place_data.updated_at = datetime.now()

        db.session.commit()

        return redirect(
            url_for('trip_location.trip_location_detail', place_id=place_data.id)
        )

    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    restaurant_photos = [p.strip() for p in place_data.restaurant_photos.split(',') if p.strip()] if place_data.restaurant_photos else []
    nearby_photos = [p.strip() for p in place_data.nearby_photos.split(',') if p.strip()] if place_data.nearby_photos else []

    return render_template(
        'upload.html',
        place=place_data,
        edit_mode=True,
        photos=photos,
        restaurant_photos=restaurant_photos,
        nearby_photos=nearby_photos
    )

# -----------------------------------------------------------
# 여행지 삭제
# -----------------------------------------------------------
@bp.route('/<int:place_id>/delete', methods=['POST'])
def trip_location_delete(place_id):
    place_data = TripLocationmd.query.get_or_404(place_id)

    # 작성자만 삭제 가능
    if not g.user or place_data.user_id != g.user.id:
        return redirect(
            url_for('trip_location.trip_location_detail', place_id=place_id)
        )

    # 여행톡에 달린 댓글 삭제
    talk_ids = [
        talk.id for talk in
        TravelTalk.query.filter_by(place_id=place_id).all()
    ]

    if talk_ids:
        TravelTalkComment.query.filter(
            TravelTalkComment.travel_talk_id.in_(talk_ids)
        ).delete(synchronize_session=False)

    # 연결된 데이터 삭제
    Bookmark.query.filter_by(place_id=place_id).delete()
    Review.query.filter_by(place_id=place_id).delete()
    TravelTalk.query.filter_by(place_id=place_id).delete()
    Comment.query.filter_by(travel_place_id=place_id).delete()

    # 상세페이지 삭제
    db.session.delete(place_data)

    db.session.commit()

    return redirect(url_for('homepage.sjw'))


# -----------------------------------------------------------
# 최근 등록된 여행지 보기
# -----------------------------------------------------------
@bp.route('/')
def trip_location():
    place_data = TripLocationmd.query.order_by(TripLocationmd.id.desc()).first()

    if not place_data:
        return "<script>alert('등록된 여행지가 없습니다. 먼저 여행지를 등록해주세요!'); location.href='/homepage/upload';</script>"

    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    return render_template('trip_location.html', place=place_data, photos=photos)
