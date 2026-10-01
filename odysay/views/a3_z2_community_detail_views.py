from flask import Blueprint, render_template, abort
from odysay.models import Post, TripLocationmd, User

bp = Blueprint('detail', __name__, url_prefix='/homepage/community/detail')


@bp.route('/<string:post_type>/<int:item_id>')
def detail(post_type, item_id):
    # 1. 일반 자유게시글/여행팁 (Post)
    if post_type == 'post':
        item = Post.query.get_or_404(item_id)
        author_name = "익명 작성자"
        if item.user_id:
            user = User.query.get(item.user_id)
            if user:
                author_name = user.nickname or user.username

        # photos 분리
        photo_list = item.photos.split(',') if item.photos else []

        return render_template('community_detail.html', item=item, author_name=author_name, photo_list=photo_list, is_post=True)

    # 2. 여행 후기 (TripLocationmd)
    elif post_type == 'place':
        item = TripLocationmd.query.get_or_404(item_id)
        author_name = "지구여행자"
        if item.user_id:
            user = User.query.get(item.user_id)
            if user:
                author_name = user.nickname or user.username

        photo_list = item.photos.split(',') if item.photos else []

        return render_template('community_detail.html', item=item, author_name=author_name, photo_list=photo_list, is_post=False)

    else:
        abort(404)