from flask import Blueprint, jsonify, g, request
from datetime import datetime
from odysay.models import db, Bookmark, TripLocationmd, Review, User, TravelTalk, TravelTalkComment
from odysay.models import ReviewRecommend
from odysay.models import TravelTalkRecommend

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
    place = TripLocationmd.query.get_or_404(place_id)

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
    place = TripLocationmd.query.get_or_404(place_id)

    reviews = Review.query.filter_by(
        place_id=place_id
    ).order_by(Review.created_at.desc()).all()

    review_list = []

    for review in reviews:
        user = User.query.get(review.user_id)

        recommend_count = ReviewRecommend.query.filter_by(
            review_id=review.id
        ).count()

        is_recommended = False

        if g.user is not None:
            is_recommended = ReviewRecommend.query.filter_by(
                user_id=g.user.id,
                review_id=review.id
            ).first() is not None

        review_list.append({
            'id': review.id,
            'user_id': review.user_id,
            'nickname': user.nickname if user and user.nickname else '사용자',
            'profile_image': user.profile_image if user else None,
            'rating': review.rating,
            'content': review.content,
            'created_at': review.created_at.isoformat(),
            'updated_at': review.updated_at.isoformat() if review.updated_at else None,
            'is_owner': g.user is not None and review.user_id == g.user.id,
            'is_place_author': review.user_id == place.user_id,
            'recommend_count': recommend_count,
            'is_recommended': is_recommended,
            'is_best': False,
        })

    best_reviews = [review for review in review_list if review['recommend_count'] >= 1]

    if best_reviews:
        max_recommend_count = max(
            review['recommend_count'] for review in best_reviews
        )

        best_reviews = [
            review for review in best_reviews
            if review['recommend_count'] == max_recommend_count
        ]

        for review in best_reviews:
            review['is_best'] = True

        review_list = best_reviews + [
            review for review in review_list
            if review not in best_reviews
        ]

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
    place = TripLocationmd.query.get_or_404(place_id)

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
    review.updated_at = datetime.now()

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
# 리뷰 추천 / 추천 취소
# ==========================================
@bp.route('/review/recommend/<int:review_id>', methods=['POST'])
def review_recommend_toggle(review_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    Review.query.get_or_404(review_id)

    recommend = ReviewRecommend.query.filter_by(
        user_id=g.user.id,
        review_id=review_id
    ).first()

    # 이미 추천했다면 → 추천 취소
    if recommend:

        db.session.delete(recommend)
        db.session.commit()

        count = ReviewRecommend.query.filter_by(
            review_id=review_id
        ).count()

        return jsonify({
            'success': True,
            'recommended': False,
            'count': count
        })

    # 추천하지 않았다면 → 추천 추가
    new_recommend = ReviewRecommend(
        user_id=g.user.id,
        review_id=review_id
    )

    db.session.add(new_recommend)
    db.session.commit()

    count = ReviewRecommend.query.filter_by(
        review_id=review_id
    ).count()

    return jsonify({
        'success': True,
        'recommended': True,
        'count': count
    })

# ==========================================
# 여행톡 목록 조회
# ==========================================
@bp.route('/travel-talk/<int:place_id>', methods=['GET'])
def travel_talk_list(place_id):

    TripLocationmd.query.get_or_404(place_id)
    place = TripLocationmd.query.get_or_404(place_id)

    travel_talks = TravelTalk.query.filter_by(
        place_id=place_id
    ).order_by(
        TravelTalk.created_at.desc()
    ).all()

    talk_list = []

    for talk in travel_talks:

        user = User.query.get(talk.user_id)

        recommend_count = TravelTalkRecommend.query.filter_by(travel_talk_id=talk.id).count()

        is_recommended = False
        if g.user is not None:
            is_recommended = TravelTalkRecommend.query.filter_by(
                user_id=g.user.id,
                travel_talk_id=talk.id
            ).first() is not None

        talk_list.append({
            'id': talk.id,
            'user_id': talk.user_id,
            'nickname': (
                user.nickname
                if user and user.nickname
                else '사용자'
            ),
            'profile_image': user.profile_image if user else None,
            'title': talk.title,
            'content': talk.content,
            'created_at': talk.created_at.isoformat(),
            'updated_at': talk.updated_at.isoformat() if talk.updated_at else None,
            'is_owner': (
                g.user is not None
                and talk.user_id == g.user.id
            ),
            'is_place_author': talk.user_id == place.user_id,
            'recommend_count': recommend_count,
            'is_recommended': is_recommended,
            'is_best': False
        })

    best_talks = [talk for talk in talk_list if talk['recommend_count'] >= 1]

    if best_talks:
        max_recommend_count = max(
            talk['recommend_count'] for talk in best_talks
        )

        best_talks = [
            talk for talk in best_talks
            if talk['recommend_count'] == max_recommend_count
        ]

        for talk in best_talks:
            talk['is_best'] = True

        talk_list = best_talks + [
            talk for talk in talk_list
            if talk not in best_talks
        ]

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
    place = TripLocationmd.query.get_or_404(talk.place_id)

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
    talk.updated_at = datetime.now()

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
# 여행톡 추천 / 추천 취소
# ==========================================
@bp.route('/travel-talk/recommend/<int:talk_id>', methods=['POST'])
def travel_talk_recommend_toggle(talk_id):

    if g.user is None:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    TravelTalk.query.get_or_404(talk_id)

    recommend = TravelTalkRecommend.query.filter_by(
        user_id=g.user.id,
        travel_talk_id=talk_id
    ).first()

    if recommend:
        db.session.delete(recommend)
        db.session.commit()

        count = TravelTalkRecommend.query.filter_by(travel_talk_id=talk_id).count()
        return jsonify({'success': True, 'recommended': False, 'count': count})

    recommend = TravelTalkRecommend(
        user_id=g.user.id,
        travel_talk_id=talk_id
    )

    db.session.add(recommend)
    db.session.commit()

    count = TravelTalkRecommend.query.filter_by(travel_talk_id=talk_id).count()
    return jsonify({'success': True, 'recommended': True, 'count': count})

# ==========================================
# 여행톡 댓글 목록 조회
# ==========================================
@bp.route('/travel-talk/comment/<int:talk_id>', methods=['GET'])
def travel_talk_comment_list(talk_id):

    TravelTalk.query.get_or_404(talk_id)
    talk = TravelTalk.query.get_or_404(talk_id)
    place = TripLocationmd.query.get_or_404(talk.place_id)

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
            'updated_at': comment.updated_at.isoformat() if comment.updated_at else None,
            'is_owner': (
                g.user is not None
                and comment.user_id == g.user.id
            ),
            'is_place_author': comment.user_id == place.user_id
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
    talk = TravelTalk.query.get_or_404(talk_id)

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
    comment.updated_at = datetime.now()

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

# ==========================================
# 여행톡 대댓글 등록
# ==========================================
@bp.route('/travel-talk/comment/reply/<int:comment_id>', methods=['POST'])
def travel_talk_comment_reply_create(comment_id):

    if g.user is None:
        return jsonify({
            'success': False,
            'message': '로그인이 필요합니다.'
        }), 401

    parent_comment = TravelTalkComment.query.get_or_404(comment_id)

    data = request.get_json()

    content = data.get('content', '').strip()

    if not content:
        return jsonify({
            'success': False,
            'message': '대댓글 내용을 입력해주세요.'
        }), 400

    reply = TravelTalkComment(
        user_id=g.user.id,
        travel_talk_id=parent_comment.travel_talk_id,
        content=content,
        parent_id=parent_comment.id
    )

    db.session.add(reply)
    db.session.commit()

    return jsonify({
        'success': True
    })

# ==========================================
# 여행톡 대댓글 목록 조회
# ==========================================
@bp.route('/travel-talk/comment/reply/<int:comment_id>', methods=['GET'])
def travel_talk_comment_reply_list(comment_id):

    parent_comment = TravelTalkComment.query.get_or_404(comment_id)

    talk = TravelTalk.query.get_or_404(
        parent_comment.travel_talk_id
    )

    place = TripLocationmd.query.get_or_404(
        talk.place_id
    )

    replies = TravelTalkComment.query.filter_by(
        parent_id=comment_id
    ).order_by(
        TravelTalkComment.created_at.asc()
    ).all()

    reply_list = []

    for reply in replies:

        user = User.query.get(reply.user_id)

        reply_list.append({
            'id': reply.id,
            'user_id': reply.user_id,
            'nickname': (
                user.nickname
                if user and user.nickname
                else '사용자'
            ),
            'content': reply.content,
            'created_at': reply.created_at.isoformat(),
            'updated_at': reply.updated_at.isoformat() if reply.updated_at else None,
            'is_owner': (
                g.user is not None
                and reply.user_id == g.user.id
            ),
            'is_place_author': reply.user_id == place.user_id
        })

    return jsonify({
        'success': True,
        'replies': reply_list,
        'reply_count': len(reply_list)
    })

# ==========================================
# 여행톡 댓글 개수 조회
# ==========================================
@bp.route('/travel-talk/comment/count/<int:talk_id>', methods=['GET'])
def travel_talk_comment_count(talk_id):

    TravelTalk.query.get_or_404(talk_id)

    count = TravelTalkComment.query.filter_by(
        travel_talk_id=talk_id,
        parent_id=None
    ).count()

    return jsonify({
        'success': True,
        'count': count
    })

# ==========================================
# 여행톡 일반 댓글 목록 조회
# 대댓글 제외
# ==========================================
@bp.route('/travel-talk/comment/main/<int:talk_id>', methods=['GET'])
def travel_talk_main_comment_list(talk_id):

    talk = TravelTalk.query.get_or_404(talk_id)
    place = TripLocationmd.query.get_or_404(talk.place_id)

    comments = TravelTalkComment.query.filter_by(
        travel_talk_id=talk_id,
        parent_id=None
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
            'profile_image': user.profile_image if user else None,
            'content': comment.content,
            'created_at': comment.created_at.isoformat(),
            'updated_at': comment.updated_at.isoformat() if comment.updated_at else None,
            'is_owner': (
                g.user is not None
                and comment.user_id == g.user.id
            ),
            'is_place_author': comment.user_id == place.user_id
        })

    return jsonify({
        'success': True,
        'comments': comment_list
    })