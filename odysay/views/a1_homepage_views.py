from flask import Blueprint, render_template, redirect, url_for, jsonify, g
from sqlalchemy import func
from odysay.models import db, User, TripLocationmd, Bookmark

bp = Blueprint('homepage', __name__, url_prefix='/homepage')

@bp.route('', strict_slashes=False)
def homepage():
    # 1. 최근 등록된 여행지 (최신순 3개)
    recent_places = TripLocationmd.query.order_by(TripLocationmd.id.desc()).limit(3).all()

    for p in recent_places:
        author_name = "익명"
        if p.user_id:
            user = User.query.get(p.user_id)
            if user:
                author_name = user.nickname or user.username
        p.author = author_name
        p.like_count = Bookmark.query.filter_by(place_id=p.id).count()

    # 2. 추천 여행지: 여행후기(TripLocationmd) 중 좋아요(Bookmark 수)가 많은 순서 top 3
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

    recommended_places = []
    for place, count in recommended_query:
        place.like_count = count
        recommended_places.append(place)

    return render_template(
        'homepage.html',
        recent_places=recent_places,
        recommended_places=recommended_places
    )


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