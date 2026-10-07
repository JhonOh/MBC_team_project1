from flask import Blueprint, render_template, redirect, url_for, jsonify, g
from sqlalchemy import func
from odysay.travel_tags import TRAVEL_TAG_LABELS
from odysay.models import db, User, TripLocationmd, Bookmark, Post, TravelTalk, PostLike
from datetime import datetime, timedelta, timezone

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



def build_my_preferences(user_id):
    # 로그인한 사용자가 찜한 여행지
    bookmarked_rows = (
        db.session.query(
            TripLocationmd.country,
            TripLocationmd.region,
            TripLocationmd.travel_tags,
            Bookmark.created_at.label('reacted_at'),
            Bookmark.id.label('reaction_id'),
        )
        .select_from(TripLocationmd)
        .join(
            Bookmark,
            Bookmark.place_id == TripLocationmd.id,
        )
        .filter(Bookmark.user_id == user_id)
        .order_by(
            Bookmark.created_at.desc(),
            Bookmark.id.desc(),
        )
        .all()
    )

    # 로그인한 사용자가 좋아요를 누른 커뮤니티 글
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

    # 관심 여행지: 기존과 동일하게 찜한 국가·지역으로 계산
    for position, row in enumerate(bookmarked_rows):
        country = normalize(row.country)
        region = normalize(row.region)

        if country or region:
            key = (country.casefold(), region.casefold())
            label = ' · '.join(
                value for value in (country, region) if value
            )

            add_score(
                destination_scores,
                key,
                label,
                position,
            )

    # 두 종류의 반응을 하나로 합쳐 최근순 정렬
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

    # 각 반응의 태그를 집계
    for position, reaction in enumerate(reactions):
        tags = reaction['tags']

        # 태그 없는 과거 글이나 잘못 저장된 값은 제외
        if not isinstance(tags, list):
            continue

        # 같은 글에 동일한 태그가 중복되어도 한 번만 집계
        valid_tags = {
            tag
            for tag in tags
            if isinstance(tag, str) and tag in TRAVEL_TAG_LABELS
        }

        for tag in sorted(valid_tags):
            add_score(
                style_scores,
                tag,
                TRAVEL_TAG_LABELS[tag],
                position,
            )

    return (
        top_three(destination_scores),
        top_three(style_scores),
    )

@bp.route('/mypage')
def mypage():
    if g.user is None:
        return redirect(url_for('homepage.homepage'))

    user_id = g.user.id
    interest_destinations, preferred_styles = build_my_preferences(
        user_id
    )
    # 가입일 표시는 한국 시각을 기준으로 계산
    korea_timezone = timezone(timedelta(hours=9))

    joined_date = None
    membership_days = None

    if g.user.created_at is not None:
        joined_at = g.user.created_at

        # DB에는 시간대 정보 없이 UTC로 저장
        if joined_at.tzinfo is None:
            joined_at = joined_at.replace(tzinfo=timezone.utc)

        joined_date = joined_at.astimezone(korea_timezone).date()
        today = datetime.now(korea_timezone).date()

        membership_days = (today - joined_date).days
    recent_limit = 3

    # 로그인한 사용자가 작성한 여행지와 커뮤니티 글
    my_places_query = TripLocationmd.query.filter_by(user_id=user_id)
    my_posts_query = Post.query.filter_by(user_id=user_id)

    my_places_count = my_places_query.count()
    my_community_posts_count = my_posts_query.count()

    # 내 여행지에 다른 사용자가 누른 찜
    received_place_bookmarks = (
        Bookmark.query
        .join(
            TripLocationmd,
            Bookmark.place_id == TripLocationmd.id,
        )
        .filter(
            TripLocationmd.user_id == user_id,
            Bookmark.user_id != user_id,
        )
        .count()
    )

    # 내 커뮤니티 글에 다른 사용자가 누른 좋아요
    received_post_likes = (
        PostLike.query
        .join(
            Post,
            PostLike.post_id == Post.id,
        )
        .filter(
            Post.user_id == user_id,
            PostLike.user_id != user_id,
        )
        .count()
    )

    received_recommendations_count = (
            received_place_bookmarks + received_post_likes
    )

    my_bookmarks_count = (
        TripLocationmd.query
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == user_id)
        .count()
    )

    # 각 종류에서 최신 3개를 가져온 뒤 합쳐서 다시 정렬
    recent_places = (
        my_places_query
        .order_by(
            TripLocationmd.created_at.desc(),
            TripLocationmd.id.desc(),
        )
        .limit(recent_limit)
        .all()
    )

    recent_posts = (
        my_posts_query
        .order_by(
            Post.created_at.desc(),
            Post.id.desc(),
        )
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
            'likes': Bookmark.query.filter_by(
                place_id=place.id
            ).count(),
            'comment_count': TravelTalk.query.filter_by(
                place_id=place.id
            ).count(),
            'detail_url': url_for(
                'trip_location.trip_location_detail',
                place_id=place.id,
            ),
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
            'comment_count': len(post.comments),
            'detail_url': url_for(
                'detail.detail',
                post_type='post',
                item_id=post.id,
            ),
        })

    # 게시 시간이 없는 과거 데이터는 뒤로 배치
    # 시간이 같으면 ID와 종류로 표시 순서를 일정하게 유지
    recent_items.sort(
        key=lambda item: (
            item['created_at'] or datetime.min,
            item['id'],
            item['kind'],
        ),
        reverse=True,
    )
    # 최근 찜한 순서로 여행지 5개
    recent_bookmarked_places = (
        TripLocationmd.query
        .join(Bookmark, Bookmark.place_id == TripLocationmd.id)
        .filter(Bookmark.user_id == user_id)
        .order_by(
            Bookmark.created_at.desc(),
            Bookmark.id.desc(),
        )
        .limit(5)
        .all()
    )

    # 위에서 조회한 내 여행지 중 가장 최근 등록한 1개
    recent_registered_places = recent_places[:1]

    # 표시할 여행지의 실제 찜 수를 한 번에 조회
    displayed_place_ids = {
        place.id
        for place in recent_bookmarked_places + recent_registered_places
    }

    place_bookmark_counts = {}

    if displayed_place_ids:
        bookmark_counts = (
            db.session.query(
                Bookmark.place_id,
                func.count(Bookmark.id),
            )
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


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('mypage_settings.html')
