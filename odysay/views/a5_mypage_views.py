from flask import (
    Blueprint,
    render_template,
    redirect,
    url_for,
    g,
    flash,
)

from odysay.models import TripLocationmd


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
        return redirect(url_for('homepage.main'))

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
        'my_places.html',
        places=places
    )