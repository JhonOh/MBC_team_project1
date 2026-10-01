import os
from flask import Blueprint, render_template, request, jsonify, url_for
from odysay.models import db, TripLocationmd, User, Post

bp = Blueprint('community', __name__, url_prefix='/homepage/community')


# -----------------------------------------------------------
# 1. 페이지 라우트
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

        results.append({
            'id': f"place_{p.id}",
            'title': p.place,
            'country': p.country,
            'region': p.region,
            'category': '여행 후기',
            'intro': p.intro,
            'photos': p.photos,
            'likes': getattr(p, 'likes', 0) or 0,
            'author': author_name,
            'created_at': p.created_at.strftime("%Y.%m.%d") if getattr(p, 'created_at', None) else "",
            'detail_url': url_for('detail.detail', post_type='place', item_id=p.id)
        })

    # 2) Post (여행 팁 / 자유 게시판)
    posts = Post.query.order_by(Post.id.desc()).all()
    for post in posts:
        author_name = "익명 작성자"
        if post.user_id:
            user = User.query.get(post.user_id)
            if user:
                author_name = user.nickname or user.username

        results.append({
            'id': f"post_{post.id}",
            'title': post.title,
            'country': '커뮤니티',
            'region': post.category,
            'category': post.category,  # '여행 팁' 또는 '자유 게시판'
            'intro': post.content,      # 본문 내용을 요약/소개로 표시
            'photos': getattr(post, 'photos', None),  # DB의 photos 필드 연결
            'likes': getattr(post, 'likes', 0) or 0,
            'author': author_name,
            'created_at': post.created_at.strftime("%Y.%m.%d") if getattr(post, 'created_at', None) else "",
            'detail_url': url_for('detail.detail', post_type='post', item_id=post.id)  # 상세페이지 라우트 연결
        })

    return jsonify(results)