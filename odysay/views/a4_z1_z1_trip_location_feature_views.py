from flask import Blueprint, jsonify, g, request
from odysay.models import db, Bookmark, TripLocationmd, Review, User, TravelTalk, TravelTalkComment

bp = Blueprint('feature', __name__, url_prefix='/homepage/trip_location/feature')


# ==========================================
# 찜하기 / 찜 취소
# ==========================================
@bp.route('/bookmark/<int:place_id>', methods=['POST'])
def bookmark_toggle(place_id):

    # 로그인 확인
    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    # 상세페이지 여행지 확인
    TripLocationmd.query.get_or_404(place_id)

    # 현재 사용자가 이미 찜했는지 확인
    bookmark = Bookmark.query.filter_by(
        user_id=g.user.id,
        place_id=place_id
    ).first()

    # 이미 찜했다면 → 찜 취소
    if bookmark:
        db.session.delete(bookmark)
        db.session.commit()

        count = Bookmark.query.filter_by(
            place_id=place_id
        ).count()

        return jsonify({
            'success': True,
            'bookmarked': False,
            'count': count
        })

    # 찜하지 않았다면 → 찜 추가
    new_bookmark = Bookmark(
        user_id=g.user.id,
        place_id=place_id
    )

    db.session.add(new_bookmark)
    db.session.commit()

    count = Bookmark.query.filter_by(
        place_id=place_id
    ).count()

    return jsonify({
        'success': True,
        'bookmarked': True,
        'count': count
    })

# ==========================================
# 찜 상태 / 찜 개수 조회
# ==========================================
@bp.route('/bookmark/<int:place_id>', methods=['GET'])
def bookmark_status(place_id):

    # 존재하는 상세페이지인지 확인
    TripLocationmd.query.get_or_404(place_id)

    # 전체 찜 개수
    count = Bookmark.query.filter_by(
        place_id=place_id
    ).count()

    # 로그인하지 않은 사용자
    if g.user is None:
        return jsonify({
            'success': True,
            'bookmarked': False,
            'count': count
        })

    # 현재 로그인한 사용자가 찜했는지 확인
    bookmark = Bookmark.query.filter_by(
        user_id=g.user.id,
        place_id=place_id
    ).first()

    return jsonify({
        'success': True,
        'bookmarked': bookmark is not None,
        'count': count
    })

# ==========================================
# 리뷰 목록 조회
# ==========================================
@bp.route('/review/<int:place_id>', methods=['GET'])
def review_list(place_id):

    TripLocationmd.query.get_or_404(place_id)

    reviews = Review.query.filter_by(
        place_id=place_id
    ).order_by(Review.created_at.desc()).all()

    review_list = []

    for review in reviews:
        user = User.query.get(review.user_id)

        review_list.append({
            'id': review.id,
            'user_id': review.user_id,
            'nickname': user.nickname if user and user.nickname else '사용자',
            'rating': review.rating,
            'content': review.content,
            'created_at': review.created_at.isoformat(),
            'is_owner': g.user is not None and review.user_id == g.user.id
        })

    return jsonify({
        'success': True,
        'reviews': review_list
    })


# ==========================================
# 리뷰 등록
# ==========================================
@bp.route('/review/<int:place_id>', methods=['POST'])
def review_create(place_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    TripLocationmd.query.get_or_404(place_id)

    data = request.get_json()

    rating = data.get('rating')
    content = data.get('content', '').strip()

    if not rating or not 1 <= int(rating) <= 5:
        return jsonify({
            'success': False,
            'message': '별점을 선택해주세요.'
        }), 400

    if not content:
        return jsonify({
            'success': False,
            'message': '리뷰 내용을 입력해주세요.'
        }), 400

    review = Review(
        user_id=g.user.id,
        place_id=place_id,
        rating=int(rating),
        content=content
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({
        'success': True,
        'review': {
            'id': review.id,
            'user_id': review.user_id,
            'nickname': g.user.nickname,
            'rating': review.rating,
            'content': review.content,
            'created_at': review.created_at.isoformat(),
            'is_owner': True
        }
    })

# ==========================================
# 리뷰 수정
# ==========================================
@bp.route('/review/edit/<int:review_id>', methods=['POST'])
def review_edit(review_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    review = Review.query.get_or_404(review_id)

    # 리뷰 작성자 본인만 수정 가능
    if review.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '수정 권한이 없습니다.'
        }), 403

    data = request.get_json()

    rating = data.get('rating')
    content = data.get('content', '').strip()

    if not rating or not 1 <= int(rating) <= 5:
        return jsonify({
            'success': False,
            'message': '별점을 선택해주세요.'
        }), 400

    if not content:
        return jsonify({
            'success': False,
            'message': '리뷰 내용을 입력해주세요.'
        }), 400

    review.rating = int(rating)
    review.content = content

    db.session.commit()

    return jsonify({
        'success': True
    })


# ==========================================
# 리뷰 삭제
# ==========================================
@bp.route('/review/delete/<int:review_id>', methods=['POST'])
def review_delete(review_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    review = Review.query.get_or_404(review_id)

    # 리뷰 작성자 본인만 삭제 가능
    if review.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '삭제 권한이 없습니다.'
        }), 403

    db.session.delete(review)
    db.session.commit()

    return jsonify({
        'success': True
    })

# ==========================================
# 여행톡 목록 조회
# ==========================================
@bp.route('/travel-talk/<int:place_id>', methods=['GET'])
def travel_talk_list(place_id):

    TripLocationmd.query.get_or_404(place_id)

    travel_talks = TravelTalk.query.filter_by(
        place_id=place_id
    ).order_by(
        TravelTalk.created_at.desc()
    ).all()

    talk_list = []

    for talk in travel_talks:

        user = User.query.get(talk.user_id)

        talk_list.append({
            'id': talk.id,
            'user_id': talk.user_id,
            'nickname': (
                user.nickname
                if user and user.nickname
                else '사용자'
            ),
            'title': talk.title,
            'content': talk.content,
            'created_at': talk.created_at.isoformat(),
            'is_owner': (
                g.user is not None
                and talk.user_id == g.user.id
            )
        })

    return jsonify({
        'success': True,
        'travel_talks': talk_list
    })

# ==========================================
# 여행톡 등록
# ==========================================
@bp.route('/travel-talk/<int:place_id>', methods=['POST'])
def travel_talk_create(place_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    TripLocationmd.query.get_or_404(place_id)

    data = request.get_json()

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title:
        return jsonify({
            'success': False,
            'message': '제목을 입력해주세요.'
        }), 400

    if not content:
        return jsonify({
            'success': False,
            'message': '내용을 입력해주세요.'
        }), 400

    travel_talk = TravelTalk(
        user_id=g.user.id,
        place_id=place_id,
        title=title,
        content=content
    )

    db.session.add(travel_talk)
    db.session.commit()

    return jsonify({
        'success': True,
        'travel_talk': {
            'id': travel_talk.id,
            'user_id': travel_talk.user_id,
            'nickname': (
                g.user.nickname
                if g.user.nickname
                else '사용자'
            ),
            'title': travel_talk.title,
            'content': travel_talk.content,
            'created_at': travel_talk.created_at.isoformat(),
            'is_owner': True
        }
    })

# ==========================================
# 여행톡 수정
# ==========================================
@bp.route('/travel-talk/edit/<int:talk_id>', methods=['POST'])
def travel_talk_edit(talk_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    talk = TravelTalk.query.get_or_404(talk_id)

    # 작성자 본인만 수정 가능
    if talk.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '수정 권한이 없습니다.'
        }), 403

    data = request.get_json()

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()

    if not title:
        return jsonify({
            'success': False,
            'message': '제목을 입력해주세요.'
        }), 400

    if not content:
        return jsonify({
            'success': False,
            'message': '내용을 입력해주세요.'
        }), 400

    talk.title = title
    talk.content = content

    db.session.commit()

    return jsonify({
        'success': True
    })

# ==========================================
# 여행톡 삭제
# ==========================================
@bp.route('/travel-talk/delete/<int:talk_id>', methods=['POST'])
def travel_talk_delete(talk_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    talk = TravelTalk.query.get_or_404(talk_id)

    # 작성자 본인만 삭제 가능
    if talk.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '삭제 권한이 없습니다.'
        }), 403

    TravelTalkComment.query.filter_by(
        travel_talk_id=talk.id
    ).delete()

    db.session.delete(talk)
    db.session.commit()

    return jsonify({
        'success': True
    })

# ==========================================
# 여행톡 댓글 목록 조회
# ==========================================
@bp.route('/travel-talk/comment/<int:talk_id>', methods=['GET'])
def travel_talk_comment_list(talk_id):

    TravelTalk.query.get_or_404(talk_id)

    comments = TravelTalkComment.query.filter_by(
        travel_talk_id=talk_id
    ).order_by(
        TravelTalkComment.created_at.asc()
    ).all()

    comment_list = []

    for comment in comments:

        user = User.query.get(comment.user_id)

        comment_list.append({
            'id': comment.id,
            'user_id': comment.user_id,
            'nickname': (
                user.nickname
                if user and user.nickname
                else '사용자'
            ),
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'is_owner': (
                g.user is not None
                and comment.user_id == g.user.id
            )
        })

    return jsonify({
        'success': True,
        'comments': comment_list
    })

# ==========================================
# 여행톡 댓글 등록
# ==========================================
@bp.route('/travel-talk/comment/<int:talk_id>', methods=['POST'])
def travel_talk_comment_create(talk_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    TravelTalk.query.get_or_404(talk_id)

    data = request.get_json()

    content = data.get('content', '').strip()

    if not content:
        return jsonify({
            'success': False,
            'message': '댓글 내용을 입력해주세요.'
        }), 400

    comment = TravelTalkComment(
        user_id=g.user.id,
        travel_talk_id=talk_id,
        content=content
    )

    db.session.add(comment)
    db.session.commit()

    return jsonify({
        'success': True
    })

# ==========================================
# 여행톡 댓글 수정
# ==========================================
@bp.route('/travel-talk/comment/edit/<int:comment_id>', methods=['POST'])
def travel_talk_comment_edit(comment_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    comment = TravelTalkComment.query.get_or_404(comment_id)

    if comment.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '수정 권한이 없습니다.'
        }), 403

    data = request.get_json()

    content = data.get('content', '').strip()

    if not content:
        return jsonify({
            'success': False,
            'message': '댓글 내용을 입력해주세요.'
        }), 400

    comment.content = content

    db.session.commit()

    return jsonify({
        'success': True
    })


# ==========================================
# 여행톡 댓글 삭제
# ==========================================
@bp.route('/travel-talk/comment/delete/<int:comment_id>', methods=['POST'])
def travel_talk_comment_delete(comment_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    comment = TravelTalkComment.query.get_or_404(comment_id)

    if comment.user_id != g.user.id:
        return jsonify({
            'success': False,
            'message': '삭제 권한이 없습니다.'
        }), 403

    db.session.delete(comment)
    db.session.commit()

    return jsonify({
        'success': True
    })