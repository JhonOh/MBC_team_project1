from flask import Blueprint, render_template, redirect, url_for, jsonify, g
from sqlalchemy import func
from odysay.models import db, User, TripLocationmd, Bookmark

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


@bp.route('', strict_slashes=False)
def homepage():
    # 비동기로 데이터를 불러오므로 단순 템플릿 렌더링만 진행
    return render_template('homepage.html')


@bp.route('/api/recommended')
def get_recommended_places():
    """인기 여행지 (좋아요 순 TOP 3) API"""
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


@bp.route('/api/recent')
def get_recent_places():
    """최근 등록된 여행지 (최신순 TOP 3) API"""
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


@bp.route('/map')
def map_page():
    return redirect(url_for('homepage.homepage'))


@bp.route('/api/places')
def get_places():
    places = TripLocationmd.query.all()
    results = []
    for p in places:
        if p.latitude and p.longitude:
            results.append({
                'id': p.id,
                'title': p.place,
                'country': p.country,
                'detail_url': url_for('trip_location.trip_location_detail', place_id=p.id),
                'region': p.region,
                'intro': p.intro,
                'lat': p.latitude,
                'lng': p.longitude
            })
    return jsonify(results)


# -----------------------------------------------------------
# 여행지 목록 페이지
# -----------------------------------------------------------
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
    if g.user is None:
        return redirect(url_for('homepage.homepage'))

    my_places_count = TripLocationmd.query.filter_by(
        user_id=g.user.id
    ).count()

    return render_template(
        'mypage.html',
        my_places_count=my_places_count
    )


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')