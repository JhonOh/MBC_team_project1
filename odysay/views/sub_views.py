import os
import time
from flask import Blueprint, render_template, request, redirect, url_for, current_app
from werkzeug.utils import secure_filename
from odysay.models import db, TravelPlace

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


@bp.route('/sjw')
def homepage():
    return render_template('shin2ryu/sjw.html')


# 1. 여행지 등록 (GET / POST)
@bp.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        country = request.form.get('country')
        region = request.form.get('region')
        place = request.form.get('place')

        # 카테고리
        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)
        category_str = ', '.join(categories)

        intro = request.form.get('intro')
        reason = request.form.get('reason')
        restaurant = request.form.get('restaurant')
        nearby = request.form.get('nearby')

        # 이미지 업로드 저장 처리
        saved_photos = []
        if 'photos' in request.files:
            files = request.files.getlist('photos')
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)

            for file in files:
                if file and file.filename.strip() != '':
                    # 파일명 중복 방지 (타임스탬프 추가)
                    filename = secure_filename(file.filename)
                    unique_filename = f"{int(time.time())}_{filename}"
                    file.save(os.path.join(upload_folder, unique_filename))
                    saved_photos.append(unique_filename)

        new_place = TravelPlace(
            country=country,
            region=region,
            place=place,
            category=category_str,
            intro=intro,
            reason=reason,
            restaurant=restaurant,
            nearby=nearby,
            photos=','.join(saved_photos) if saved_photos else None
        )

        db.session.add(new_place)
        db.session.commit()

        return redirect(url_for('homepage.trip_location_detail', place_id=new_place.id))

    return render_template('upload.html')


# 2. 여행지 상세 페이지
@bp.route('/trip_location/<int:place_id>')
def trip_location_detail(place_id):
    place_data = TravelPlace.query.get_or_404(place_id)

    # 이미지 파싱 (공백 및 빈 문자열 제거)
    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []

    return render_template('trip_location.html', place=place_data, photos=photos)


# 3. 테스트용 라우트
@bp.route('/trip_location')
def trip_location():
    place_data = TravelPlace.query.order_by(TravelPlace.id.desc()).first()

    if not place_data:
        return "<script>alert('등록된 여행지가 없습니다. 먼저 여행지를 등록해주세요!'); location.href='/homepage/upload';</script>"

    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    return render_template('trip_location.html', place=place_data, photos=photos)


@bp.route('/trip_list')
def trip_list():
    return render_template('trip_list.html')


@bp.route('/mypage')
def mypage():
    return render_template('mypage.html')


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')