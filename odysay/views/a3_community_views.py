import os
from flask import Blueprint, render_template, request, jsonify, url_for
from odysay.models import db, TripLocationmd, User, Post

bp = Blueprint('community', __name__, url_prefix='/homepage/community')


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


# ----------------------------------------
# 2. 커뮤니티 데이터 제공 API (TripLocationmd + Post 통합 조회)
# -----------------------------------------------------------

@bp.route('/api/places')
def get_places():
    results = []


    # 1) TripLocationmd (여행 후기 게시글)
    places = TripLocationmd.query.order_by(TripLocationmd.id.desc()).all()

    for p in places:
        author_name = "지구여행자"
        if p.user_id:
            user = User.query.get(p.user_id)
            if user:
                author_name = user.nickname or user.username

        raw_created_at = getattr(p, 'created_at', None)

        comment_count = 0
        if hasattr(p, 'comments'):
            comment_count = len(p.comments) if p.comments else 0

        results.append({
            'id': f"place_{p.id}",
            'raw_id': p.id,
            'title': p.place,
            'country': p.country,
            'region': p.region,
            'category': '여행 후기',
            'intro': p.intro,
            'photos': p.photos,
            'likes': getattr(p, 'likes', 0) or 0,
            'comment_count': comment_count,
            'author': author_name,
            'created_at': raw_created_at.strftime("%Y.%m.%d") if raw_created_at else "",
            'raw_date': raw_created_at.isoformat() if raw_created_at else "",
            # trip_location.trip_location_detail 엔드포인트로 수정
            'detail_url': url_for('trip_location.trip_location_detail', place_id=p.id)
        })

    # 2) Post (여행 팁 / 자유 게시판 -> community_detail 상세페이지로 연결)
    posts = Post.query.all()
    for post in posts:
        author_name = "익명 작성자"
        if post.user_id:
            user = User.query.get(post.user_id)
            if user:
                author_name = user.nickname or user.username

        raw_created_at = getattr(post, 'created_at', None)

        comment_count = 0
        if hasattr(post, 'comments'):
            comment_count = len(post.comments) if post.comments else 0

        results.append({
            'id': f"post_{post.id}",
            'raw_id': post.id,
            'title': post.title,
            'country': '커뮤니티',
            'region': post.category,
            'category': post.category,
            'intro': post.content,
            'photos': getattr(post, 'photos', None),
            'likes': getattr(post, 'likes', 0) or 0,
            'comment_count': comment_count,
            'author': author_name,
            'created_at': raw_created_at.strftime("%Y.%m.%d") if raw_created_at else "",
            'raw_date': raw_created_at.isoformat() if raw_created_at else "",
            'detail_url': url_for('detail.detail', post_type='post', item_id=post.id)
        })

    results.sort(key=lambda x: x['raw_date'], reverse=True)
    return jsonify(results)