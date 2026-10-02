
from flask import Blueprint, render_template, abort, request, jsonify, session, g
# [수정] PostLike 모델 추가 import
from odysay.models import db, Post, User, Comment, PostLike ,TripLocationmd
from odysay import csrf
from datetime import datetime

bp = Blueprint('detail', __name__, url_prefix='/homepage/community/detail')


def get_current_user_id():
    """세션 및 g 객체에서 유저 ID를 안전하게 가져오기"""
    uid = None
    if hasattr(g, 'user') and g.user:
        uid = getattr(g.user, 'id', None)
    elif 'user_id' in session:
        uid = session['user_id']
    elif 'user' in session and isinstance(session['user'], dict):
        uid = session['user'].get('id')
    elif '_user_id' in session:
        uid = session['_user_id']

    if uid is not None:
        try:
            return int(uid)
        except (ValueError, TypeError):
            return uid
    return None


@bp.route('/<string:post_type>/<int:item_id>')
def detail(post_type, item_id):
    current_user_id = get_current_user_id()

    # 여행 팁 및 자유게시판 (Post 모델)
    if post_type == 'post':
        item = Post.query.get_or_404(item_id)
        author_name = "익명 작성자"
        if item.user_id:
            user = User.query.get(item.user_id)
            if user:
                author_name = user.nickname or user.username

        photo_list = [p.strip() for p in item.photos.split(',') if p.strip()] if item.photos else []
        comments = getattr(item, 'comments', [])

        return render_template(
            'community_detail.html',
            item=item,
            author_name=author_name,
            photo_list=photo_list,
            comments=comments,
            post_type=post_type,
            item_id=item_id,
            is_post=True,
            current_user_id=current_user_id
        )


    # 2. 여행 후기 (TripLocationmd)

    elif post_type == 'place':
        item = TripLocationmd.query.get_or_404(item_id)
        author_name = "지구여행자"
        if item.user_id:
            user = User.query.get(item.user_id)
            if user:
                author_name = user.nickname or user.username

        photo_list = [p.strip() for p in item.photos.split(',') if p.strip()] if item.photos else []
        comments = getattr(item, 'comments', [])

        return render_template(
            'community_detail.html',
            item=item,
            author_name=author_name,
            photo_list=photo_list,
            comments=comments,
            post_type=post_type,
            item_id=item_id,
            is_post=False,
            current_user_id=current_user_id
        )

    else:
        abort(404)


# -----------------------------------------------------------
# 1. 좋아요 토글 API (자유게시판/여행팁 전용 DB 기반 1회 제한)
# -----------------------------------------------------------
@bp.route('/api/like/<string:post_type>/<int:item_id>', methods=['POST'])
@csrf.exempt
def toggle_like(post_type, item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'message': '로그인 후 좋아요를 누를 수 있습니다.'}), 401

    # 자유게시판/여행팁만 이 API에서 처리
    if post_type != 'post':
        return jsonify({'success': False, 'message': '올바르지 않은 요청입니다.'}), 400

    try:
        item = Post.query.get_or_404(item_id)

        # DB에서 해당 유저가 이미 좋아요를 눌렀는지 확인
        existing_like = PostLike.query.filter_by(user_id=user_id, post_id=item_id).first()
        if existing_like:
            return jsonify({'success': False, 'message': '이미 좋아요를 누르셨습니다.'}), 400

        # DB에 좋아요 이력 추가
        new_like = PostLike(user_id=user_id, post_id=item_id)
        db.session.add(new_like)

        # Post 테이블의 likes 카운트 1 증가
        current_likes = item.likes if item.likes is not None else 0
        item.likes = current_likes + 1

        db.session.commit()

        return jsonify({'success': True, 'likes': item.likes, 'message': '좋아요를 눌렀습니다.'})

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'DB 오류 발생: {str(e)}'}), 500


# -----------------------------------------------------------
# 2. 댓글 등록 API
# -----------------------------------------------------------
@bp.route('/api/comment/<string:post_type>/<int:item_id>', methods=['POST'])
@csrf.exempt
def add_comment(post_type, item_id):
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'success': False, 'message': '로그인 후 댓글을 작성할 수 있습니다.'}), 401

        data = request.get_json() or {}
        content = data.get('content', '').strip()

        if not content:
            return jsonify({'success': False, 'message': '댓글 내용을 입력해주세요.'}), 400

        user = User.query.get(user_id)
        author_name = (user.nickname or user.username) if user else "회원"

        new_comment = Comment(
            content=content,
            author=author_name,
            user_id=user_id,
            created_at=datetime.now()
        )

        if post_type == 'post':
            new_comment.post_id = item_id
        elif post_type == 'place':
            new_comment.travel_place_id = item_id
        else:
            return jsonify({'success': False, 'message': '유효하지 않은 post_type입니다.'}), 400

        db.session.add(new_comment)
        db.session.commit()

        return jsonify({
            'success': True,
            'comment': {
                'id': new_comment.id,
                'author': new_comment.author,
                'content': new_comment.content,
                'user_id': new_comment.user_id,
                'created_at': new_comment.created_at.strftime('%Y.%m.%d %H:%M')
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'댓글 저장 중 DB 오류: {str(e)}'}), 500


# -----------------------------------------------------------
# 3. 댓글 수정 API (PUT, POST 및 delete 다중 경로 지원)
# -----------------------------------------------------------
@bp.route('/api/comment/<int:comment_id>', methods=['PUT', 'POST'])
@csrf.exempt
def update_comment(comment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    comment = Comment.query.get_or_404(comment_id)

    if str(comment.user_id) != str(user_id):
        return jsonify({'success': False, 'message': '수정 권한이 없습니다.'}), 403

    data = request.get_json() or {}
    content = data.get('content', '').strip()

    if not content:
        return jsonify({'success': False, 'message': '수정할 내용을 입력해주세요.'}), 400

    try:
        comment.content = content
        db.session.commit()
        return jsonify({'success': True, 'comment': {'id': comment.id, 'content': comment.content}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'댓글 수정 실패: {str(e)}'}), 500


# -----------------------------------------------------------
# 4. 댓글 삭제 API (DELETE, POST 모두 지원 및 /delete/ 주소 호환)
# -----------------------------------------------------------
@bp.route('/api/comment/<int:comment_id>', methods=['DELETE'])
@bp.route('/api/comment/delete/<int:comment_id>', methods=['POST', 'DELETE'])
@csrf.exempt
def delete_comment(comment_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    comment = Comment.query.get_or_404(comment_id)

    if str(comment.user_id) != str(user_id):
        return jsonify({'success': False, 'message': '삭제 권한이 없습니다.'}), 403

    try:
        db.session.delete(comment)
        db.session.commit()
        return jsonify({'success': True, 'message': '댓글이 삭제되었습니다.'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'댓글 삭제 실패: {str(e)}'}), 500


# -----------------------------------------------------------
# 5. 게시글 삭제 API
# -----------------------------------------------------------
@bp.route('/api/post/delete/<string:post_type>/<int:item_id>', methods=['DELETE', 'POST'])
@csrf.exempt
def delete_post(post_type, item_id):
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'success': False, 'message': '로그인이 필요합니다.'}), 401

    if post_type == 'post':
        item = Post.query.get_or_404(item_id)
    elif post_type == 'place':
        item = TripLocationmd.query.get_or_404(item_id)
    else:
        return jsonify({'success': False, 'message': '올바르지 않은 게시글 유형입니다.'}), 400

    if str(item.user_id) != str(user_id):
        return jsonify({'success': False, 'message': '작성자만 게시글을 삭제할 수 있습니다.'}), 403

    try:
        Comment.query.filter(
            (Comment.post_id == item_id) if post_type == 'post' else (Comment.travel_place_id == item_id)
        ).delete()

        db.session.delete(item)
        db.session.commit()
        return jsonify({'success': True, 'redirect_url': '/homepage/community'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'게시글 삭제 실패: {str(e)}'}), 500