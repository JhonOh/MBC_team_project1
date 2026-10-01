from flask import Blueprint, render_template, redirect, url_for, jsonify ,g
from odysay.models import TravelPlace, User
from odysay.forms import LoginForm

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


@bp.route('/main')
def main():
    return render_template('map.html', login_form=LoginForm())


@bp.route('/sjw')
def homepage():
    # DB에서 id 기준 내림차순(최신 등록순)으로 3개 조회
    recent_places = TravelPlace.query.order_by(TravelPlace.id.desc()).limit(3).all()

    # ★ a3처럼 각 place마다 작성자(author) 조회해서 author 속성 붙여주기
    for p in recent_places:
        author_name = "익명"
        if p.user_id:
            user = User.query.get(p.user_id)
            if user:
                author_name = user.nickname or user.username
        p.author = author_name  # 객체에 author 값 전달

    # 템플릿으로 recent_places 변수 전달
    return render_template('shin2ryu/sjw.html', recent_places=recent_places)


@bp.route('/map')
def map_page():
    return redirect(url_for('homepage.main'))


@bp.route('/api/places')
def get_places():
    places = TravelPlace.query.all()
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

@bp.route('/mypage')
def mypage():
    if g.user is None:
        return redirect(url_for('homepage.main'))

    my_places_count = TravelPlace.query.filter_by(
        user_id=g.user.id
    ).count()

    return render_template(
        'mypage.html',
        my_places_count=my_places_count
    )


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')

@bp.route('/profile_edit', methods=['GET', 'POST'])
def profile_edit():
    return render_template('profile_edit.html')