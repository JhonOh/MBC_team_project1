from flask import Blueprint, render_template, redirect, url_for, g, flash, request, jsonify
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from odysay.models import db, User, TripLocationmd, Post, Bookmark, TravelTalk, PostLike
from odysay.travel_tags import TRAVEL_TAG_LABELS

bp = Blueprint('mypage', __name__, url_prefix='/homepage/mypage')


# -----------------------------------------------------------
# 사용자 취향 분석 함수
# -----------------------------------------------------------
def build_my_preferences(user_id):
    bookmarked_rows = (
        db.session.query(
            TripLocationmd.country,
            TripLocationmd.region,
            TripLocationmd.travel_tags,
            Bookmark.created_at.label('reacted_at'),
            Bookmark.id.label('reaction_id'),
        )
        .select_from(TripLocationmd)
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == user_id)
        .order_by(Bookmark.created_at.desc(), Bookmark.id.desc())
        .all()
    )

    liked_rows = (
        db.session.query(
            Post.travel_tags,
            PostLike.created_at.label('reacted_at'),
            PostLike.id.label('reaction_id'),
        )
        .select_from(Post)
        .join(PostLike, PostLike.post_id == Post.id)
        .filter(PostLike.user_id == user_id)
        .all()
    )

    destination_scores = {}
    style_scores = {}

    def normalize(value):
        return ' '.join((value or '').split())

    def add_score(scores, key, label, position):
        if key not in scores:
            scores[key] = {
                'label': label,
                'count': 0,
                'recent_position': position,
            }
        scores[key]['count'] += 1

    def top_three(scores):
        ranked = sorted(
            scores.values(),
            key=lambda item: (
                -item['count'],
                item['recent_position'],
                item['label'],
            ),
        )
        return [item['label'] for item in ranked[:3]]

    for position, row in enumerate(bookmarked_rows):
        country = normalize(row.country)
        region = normalize(row.region)

        if country or region:
            key = (country.casefold(), region.casefold())
            label = ' · '.join(value for value in (country, region) if value)
            add_score(destination_scores, key, label, position)

    reactions = []
    for row in bookmarked_rows:
        reactions.append({
            'tags': row.travel_tags,
            'created_at': row.reacted_at,
            'id': row.reaction_id,
            'kind': 'bookmark',
        })

    for row in liked_rows:
        reactions.append({
            'tags': row.travel_tags,
            'created_at': row.reacted_at,
            'id': row.reaction_id,
            'kind': 'like',
        })

    reactions.sort(
        key=lambda item: (
            item['created_at'] or datetime.min,
            item['kind'],
            item['id'],
        ),
        reverse=True,
    )

    for position, reaction in enumerate(reactions):
        tags = reaction['tags']
        if not isinstance(tags, list):
            continue

        valid_tags = {
            tag for tag in tags if isinstance(tag, str) and tag in TRAVEL_TAG_LABELS
        }

        for tag in sorted(valid_tags):
            add_score(style_scores, tag, TRAVEL_TAG_LABELS[tag], position)

    return top_three(destination_scores), top_three(style_scores)


# -----------------------------------------------------------
# 1. 마이페이지 메인 (/homepage/mypage)
# -----------------------------------------------------------
@bp.route('')
@bp.route('/')
def mypage():
    if g.user is None:
        return redirect(url_for('homepage.homepage'))

    user_id = g.user.id
    interest_destinations, preferred_styles = build_my_preferences(user_id)

    korea_timezone = timezone(timedelta(hours=9))
    joined_date = None
    membership_days = None

    if g.user.created_at is not None:
        joined_at = g.user.created_at
        if joined_at.tzinfo is None:
            joined_at = joined_at.replace(tzinfo=timezone.utc)
        joined_date = joined_at.astimezone(korea_timezone).date()
        today = datetime.now(korea_timezone).date()
        membership_days = (today - joined_date).days

    recent_limit = 3

    my_places_query = TripLocationmd.query.filter_by(user_id=user_id)
    my_posts_query = Post.query.filter_by(user_id=user_id)

    my_places_count = my_places_query.count()
    my_community_posts_count = my_posts_query.count()

    received_place_bookmarks = (
        Bookmark.query
        .join(TripLocationmd, Bookmark.place_id == TripLocationmd.id)
        .filter(TripLocationmd.user_id == user_id, Bookmark.user_id != user_id)
        .count()
    )

    received_post_likes = (
        PostLike.query
        .join(Post, PostLike.post_id == Post.id)
        .filter(Post.user_id == user_id, PostLike.user_id != user_id)
        .count()
    )

    received_recommendations_count = received_place_bookmarks + received_post_likes

    my_bookmarks_count = (
        TripLocationmd.query
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == user_id)
        .count()
    )

    recent_places = (
        my_places_query
        .order_by(TripLocationmd.created_at.desc(), TripLocationmd.id.desc())
        .limit(recent_limit)
        .all()
    )

    recent_posts = (
        my_posts_query
        .order_by(Post.created_at.desc(), Post.id.desc())
        .limit(recent_limit)
        .all()
    )

    recent_items = []
    for place in recent_places:
        recent_items.append({
            'id': place.id,
            'kind': 'place',
            'title': place.place,
            'category': '여행 후기',
            'photos': place.photos,
            'created_at': place.created_at,
            'likes': Bookmark.query.filter_by(place_id=place.id).count(),
            'comment_count': TravelTalk.query.filter_by(place_id=place.id).count(),
            'detail_url': url_for('trip_location.trip_location_detail', place_id=place.id),
        })

    for post in recent_posts:
        recent_items.append({
            'id': post.id,
            'kind': 'post',
            'title': post.title,
            'category': post.category,
            'photos': post.photos,
            'created_at': post.created_at,
            'likes': post.likes or 0,
            'comment_count': len(post.comments) if post.comments else 0,
            'detail_url': url_for('detail.detail', post_type='post', item_id=post.id),
        })

    recent_items.sort(
        key=lambda item: (item['created_at'] or datetime.min, item['id'], item['kind']),
        reverse=True,
    )

    recent_bookmarked_places = (
        TripLocationmd.query
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == user_id)
        .order_by(Bookmark.created_at.desc(), Bookmark.id.desc())
        .limit(5)
        .all()
    )

    recent_registered_places = recent_places[:1]
    displayed_place_ids = {
        place.id for place in recent_bookmarked_places + recent_registered_places
    }

    place_bookmark_counts = {}
    if displayed_place_ids:
        bookmark_counts = (
            db.session.query(Bookmark.place_id, func.count(Bookmark.id))
            .filter(Bookmark.place_id.in_(displayed_place_ids))
            .group_by(Bookmark.place_id)
            .all()
        )
        place_bookmark_counts = dict(bookmark_counts)

    return render_template(
        'mypage.html',
        my_places_count=my_places_count,
        my_posts_count=my_places_count + my_community_posts_count,
        my_bookmarks_count=my_bookmarks_count,
        recent_items=recent_items[:recent_limit],
        recent_bookmarked_places=recent_bookmarked_places,
        recent_registered_places=recent_registered_places,
        place_bookmark_counts=place_bookmark_counts,
        received_recommendations_count=received_recommendations_count,
        joined_date=joined_date,
        membership_days=membership_days,
        interest_destinations=interest_destinations,
        preferred_styles=preferred_styles,
    )


# -----------------------------------------------------------
# 2. header.html 연동용 마이페이지 서브 라우트
# -----------------------------------------------------------

# 내가 쓴 글 페이지
@bp.route('/posts')
def mypage_posts():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    category = request.args.get('category', 'ALL')
    sort = request.args.get('sort', 'latest')

    if category not in ('ALL', '여행 후기', '여행 팁', '자유 게시판'):
        category = 'ALL'

    if sort not in ('latest', 'popular', 'comments'):
        sort = 'latest'

    return render_template(
        'community.html',
        mypage_posts_mode=True,
        current_category=category,
        initial_sort=sort,
    )

my_posts = mypage_posts


# 내가 찜한 여행지
@bp.route('/bookmarks')
def mypage_bookmarks():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    places = (
        TripLocationmd.query
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == g.user.id)
        .order_by(Bookmark.created_at.desc(), Bookmark.id.desc())
        .all()
    )
    return render_template('mypage_my_bookmarks.html', places=places)

my_bookmarks = mypage_bookmarks


# 내가 만든 여행지
@bp.route('/places')
def mypage_places():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    places = (
        TripLocationmd.query
        .filter_by(user_id=g.user.id)
        .order_by(TripLocationmd.created_at.desc(), TripLocationmd.id.desc())
        .all()
    )
    return render_template('mypage_my_places.html', places=places)

my_places = mypage_places

# 설정
@bp.route('/settings')
def mypage_settings():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    return render_template('mypage_settings.html')


# -----------------------------------------------------------
# 3. API (내가 쓴 글 목록 전용 API - endpoint='mypage_posts_api')
# -----------------------------------------------------------
@bp.route('/api/posts', endpoint='mypage_posts_api')
def my_posts_api():
    if g.user is None:
        return jsonify(error='로그인이 필요합니다.'), 401

    user_id = g.user.id
    author_name = g.user.nickname or g.user.username

    category = request.args.get('category', 'ALL')
    sort = request.args.get('sort', 'latest')

    results = []

    # 1. 여행지/여행 후기 (TripLocationmd)
    if category in ('ALL', '여행 후기'):
        places = TripLocationmd.query.filter_by(user_id=user_id).all()
        for place in places:
            created_at = place.created_at
            likes_count = Bookmark.query.filter_by(place_id=place.id).count()
            comment_count = TravelTalk.query.filter_by(place_id=place.id).count()

            results.append({
                'id': f'place_{place.id}',
                'raw_id': place.id,
                'title': place.place,
                'country': place.country or '',
                'region': place.region or '',
                'category': '여행 후기',
                'intro': place.intro or '',
                'photos': place.photos,
                'likes': likes_count,
                'comment_count': comment_count,
                'author': author_name,
                'created_at': created_at.strftime('%Y.%m.%d') if created_at else '',
                'raw_date': created_at.isoformat() if created_at else '',
                'detail_url': url_for('trip_location.trip_location_detail', place_id=place.id),
            })

    # 2. 일반 커뮤니티 게시글 (Post - 여행 팁, 자유 게시판)
    if category != '여행 후기':
        post_query = Post.query.filter_by(user_id=user_id)
        if category in ('여행 팁', '자유 게시판'):
            post_query = post_query.filter_by(category=category)

        posts = post_query.all()
        for post in posts:
            created_at = post.created_at
            likes_count = post.likes or 0
            comment_count = len(post.comments) if post.comments else 0

            results.append({
                'id': f'post_{post.id}',
                'raw_id': post.id,
                'title': post.title,
                'country': '커뮤니티',
                'region': post.category,
                'category': post.category,
                'intro': post.content or '',
                'photos': post.photos,
                'likes': likes_count,
                'comment_count': comment_count,
                'author': author_name,
                'created_at': created_at.strftime('%Y.%m.%d') if created_at else '',
                'raw_date': created_at.isoformat() if created_at else '',
                'detail_url': url_for('detail.detail', post_type='post', item_id=post.id),
            })

    # 3. 정렬 조건 적용
    if sort == 'popular':
        results.sort(key=lambda item: (item['likes'] + item['comment_count'], item['likes'], item['raw_date']), reverse=True)
    elif sort == 'comments':
        results.sort(key=lambda item: (item['comment_count'], item['raw_date']), reverse=True)
    else:
        results.sort(key=lambda item: item['raw_date'], reverse=True)

    return jsonify(results)