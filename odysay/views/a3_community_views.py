import os
from flask import Blueprint, render_template, request, jsonify, url_for ,g
from odysay.models import db, TripLocationmd, User, Post, Bookmark, TravelTalk

bp = Blueprint('community', __name__, url_prefix='/homepage/community')


@bp.route('')
@bp.route('/')
@bp.route('/all')
def community_all():
    sort = request.args.get('sort', 'latest')
    return render_template('community.html', current_category='ALL', initial_sort=sort)


@bp.route('/review')
def community_review():
    sort = request.args.get('sort', 'latest')
    return render_template('community.html', current_category='여행 후기', initial_sort=sort)


@bp.route('/tip')
def community_tip():
    sort = request.args.get('sort', 'latest')
    return render_template('community.html', current_category='여행 팁', initial_sort=sort)


@bp.route('/free')
def community_free():
    sort = request.args.get('sort', 'latest')
    return render_template('community.html', current_category='자유 게시판', initial_sort=sort)


# @bp.route('/check')
# def community_check():
#     sort = request.args.get('sort', 'latest')
#     return render_template('community.html', current_category='출석', initial_sort=sort)


# -----------------------------------------------------------
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

        # [연동 1] 찜하기(Bookmark) 개수를 좋아요(likes) 수로 연동
        likes_count = Bookmark.query.filter_by(place_id=p.id).count()

        # [연동 2] 여행톡(TravelTalk) 개수를 댓글(comment_count) 수로 연동
        talk_count = TravelTalk.query.filter_by(place_id=p.id).count()

        results.append({
            'id': f"place_{p.id}",
            'raw_id': p.id,
            'title': p.place,
            'country': p.country,
            'region': p.region,
            'category': '여행 후기',
            'intro': p.intro,
            'photos': p.photos,
            'likes': likes_count,           # 찜하기 수 = 좋아요 수
            'comment_count': talk_count,    # 여행톡 수 = 댓글 수
            'author': author_name,
            'created_at': raw_created_at.strftime("%Y.%m.%d") if raw_created_at else "",
            'raw_date': raw_created_at.isoformat() if raw_created_at else "",
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