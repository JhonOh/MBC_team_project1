import os
from flask import Blueprint, render_template, request, jsonify, url_for
from odysay.models import db, TravelPlace, User  # 프로젝트 구조에 맞춰 import 경로 확인

# community 블루프린트 생성 (/community 경로로 매핑)
bp = Blueprint('community', __name__, url_prefix='/homepage/community')


# -----------------------------------------------------------
# 1. 페이지 라우트 (URL 분리: /all, /review, /tip, /free, /check)
# -----------------------------------------------------------
@bp.route('')
@bp.route('/')
@bp.route('/all')
def community_all():
    return render_template('community.html', current_category='ALL')


@bp.route('/review')
def community_review():
    return render_template('community.html', current_category='여행 후기')


@bp.route('/tip')
def community_tip():
    return render_template('community.html', current_category='여행 팁')


@bp.route('/free')
def community_free():
    return render_template('community.html', current_category='자유 게시판')


@bp.route('/check')
def community_check():
    return render_template('community.html', current_category='출석')

# -----------------------------------------------------------
# 2. 커뮤니티 데이터 제공 API (누락되었던 부분)
# -----------------------------------------------------------
@bp.route('/api/places')
def get_places():
    places = TravelPlace.query.order_by(TravelPlace.id.desc()).all()
    results = []

    for p in places:
        author_name = "지구여행자"
        if p.user_id:
            user = User.query.get(p.user_id)
            if user:
                author_name = user.nickname or user.username

        results.append({
            'id': p.id,
            'title': p.place,
            'country': p.country,
            'region': p.region,
            'category': '여행 후기',  # 👈 모든 TravelPlace 등록글을 '여행 후기'로 고정
            'intro': p.intro,
            'photos': p.photos,
            'likes': getattr(p, 'likes', 0) or 0,
            'author': author_name,
            'created_at': p.created_at.strftime("%Y.%m.%d") if getattr(p, 'created_at', None) else "",
            'detail_url': url_for('trip_location.trip_location_detail', place_id=p.id)
        })

    return jsonify(results)