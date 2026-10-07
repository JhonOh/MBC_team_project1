from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    g,
    flash,
    request,
    jsonify,
)

from odysay.models import (
    TripLocationmd,
    Post,
    Bookmark,
    TravelTalk,
)

bp = Blueprint(
    'mypage',
    __name__,
    url_prefix='/homepage/mypage'
)


@bp.route('/places')
def my_places():
    # 로그인한 회원만 접근 가능
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    # 본인이 작성한 여행지만 최신순으로 조회
    places = (
        TripLocationmd.query
        .filter_by(user_id=g.user.id)
        .order_by(
            TripLocationmd.created_at.desc(),
            TripLocationmd.id.desc()
        )
        .all()
    )

    return render_template(
        'mypage_my_places.html',
        places=places
    )

@bp.route('/bookmarks')
def my_bookmarks():
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


@bp.route('/posts')
def my_posts():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    category = request.args.get('category','ALL')
    sort = request.args.get('sort','latest')

    if category not in ('ALL' , '여행 후기' , '여행 팁' , '자유 게시판') :
        category = 'ALL'

    if sort not in ('latest' , 'popular' , 'comments'):
        sort = 'latest'

    return render_template(
        'community.html',
        my_posts_mode=True,
        current_category=category,
        initial_sort=sort,
    )

@bp.route('/api/posts')
def my_posts_api():
    if g.user is None:
        return jsonify(error='로그인이 필요합니다.'), 401

    user_id = g.user.id
    author_name = g.user.nickname or g.user.username
    results = []

    # 1. 내가 작성한 여행 후기
    places = TripLocationmd.query.filter_by(
        user_id=user_id
    ).all()

    for place in places:
        created_at = place.created_at

        results.append({
            'id': f'place_{place.id}',
            'raw_id': place.id,
            'title': place.place,
            'country': place.country,
            'region': place.region,
            'category': '여행 후기',
            'intro': place.intro,
            'photos': place.photos,
            'likes': Bookmark.query.filter_by(
                place_id=place.id
            ).count(),
            'comment_count': TravelTalk.query.filter_by(
                place_id=place.id
            ).count(),
            'author': author_name,
            'created_at': (
                created_at.strftime('%Y.%m.%d') if created_at else ''
            ),
            'raw_date': created_at.isoformat() if created_at else '',
            'detail_url': url_for(
                'trip_location.trip_location_detail',
                place_id=place.id,
            ),
        })

    # 2. 내가 작성한 여행 팁 / 자유 게시판
    posts = Post.query.filter_by(
        user_id=user_id
    ).all()

    for post in posts:
        created_at = post.created_at

        results.append({
            'id': f'post_{post.id}',
            'raw_id': post.id,
            'title': post.title,
            'country': '커뮤니티',
            'region': post.category,
            'category': post.category,
            'intro': post.content,
            'photos': post.photos,
            'likes': post.likes or 0,
            'comment_count': len(post.comments),
            'author': author_name,
            'created_at': (
                created_at.strftime('%Y.%m.%d') if created_at else ''
            ),
            'raw_date': created_at.isoformat() if created_at else '',
            'detail_url': url_for(
                'detail.detail',
                post_type='post',
                item_id=post.id,
            ),
        })

    results.sort(key=lambda item: item['raw_date'], reverse=True)

    return jsonify(results)
