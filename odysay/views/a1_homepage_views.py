from flask import Blueprint, render_template, redirect, url_for, jsonify
from sqlalchemy import func
from odysay.models import db, User, TripLocationmd, Bookmark

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


# 1. 홈페이지 메인 화면
@bp.route('', strict_slashes=False)
def homepage():
    return render_template('homepage.html')


# 2. 메인 페이지 - 인기 여행지 TOP 3 API
@bp.route('/api/recommended')
def get_recommended_places():
    recommended_query = db.session.query(
        TripLocationmd,
        func.count(Bookmark.id).label('like_count')
    ).outerjoin(
        Bookmark, TripLocationmd.id == Bookmark.place_id
    ).group_by(
        TripLocationmd.id
    ).order_by(
        func.count(Bookmark.id).desc(),
        TripLocationmd.id.desc()
    ).limit(3).all()

    results = []
    for place, count in recommended_query:
        results.append({
            'id': place.id,
            'place': place.place,
            'country': place.country,
            'region': place.region,
            'photos': place.photos or '',
            'like_count': count,
            'detail_url': url_for('trip_location.trip_location_detail', place_id=place.id)
        })
    return jsonify(results)


# 3. 메인 페이지 - 최근 등록 여행지 TOP 3 API
@bp.route('/api/recent')
def get_recent_places():
    recent_places = TripLocationmd.query.order_by(TripLocationmd.id.desc()).limit(3).all()

    results = []
    for p in recent_places:
        author_name = "익명"
        if p.user_id:
            user = User.query.get(p.user_id)
            if user:
                author_name = user.nickname or user.username

        like_count = Bookmark.query.filter_by(place_id=p.id).count()
        created_at_str = p.created_at.strftime('%Y. %m. %d') if hasattr(p, 'created_at') and p.created_at else '방금 전'

        results.append({
            'id': p.id,
            'place': p.place,
            'country': p.country,
            'region': p.region,
            'photos': p.photos or '',
            'author': author_name,
            'like_count': like_count,
            'created_at': created_at_str,
            'detail_url': url_for('trip_location.trip_location_detail', place_id=p.id)
        })
    return jsonify(results)


# 4. 지도 연동 리다이렉트 및 위치 데이터 API
@bp.route('/map')
def map_page():
    return redirect(url_for('homepage.homepage'))


@bp.route('/api/places')
def get_places():
    places = TripLocationmd.query.all()
    like_counts = dict(db.session.query(Bookmark.place_id, func.count(Bookmark.id)).group_by(Bookmark.place_id).all())
    results = []
    for p in places:
        if p.latitude and p.longitude:
            cover_photo = next((name.strip() for name in (p.photos or '').split(',') if name.strip()), None)
            results.append({
                'id': p.id,
                'title': p.place,
                'country': p.country,
                'detail_url': url_for('trip_location.trip_location_detail', place_id=p.id),
                'region': p.region,
                'intro': p.intro,
                'photo_url': url_for('static', filename='uploads/' + cover_photo) if cover_photo else None,
                'like_count': like_counts.get(p.id, 0),
                'lat': p.latitude,
                'lng': p.longitude
            })
    return jsonify(results)


# 5. GNB 메인 메뉴 연결 페이지들
@bp.route('/trip_list')
def trip_list():
    return render_template('trip_list.html')


@bp.route('/community')
def community():
    return render_template('community.html')


@bp.route('/upload')
def upload():
    return redirect(url_for('upload.upload'))

@bp.route('/mypage')
def mypage():
    return redirect(url_for('mypage.mypage'))