from flask import Blueprint, render_template, redirect, url_for, jsonify ,g
from odysay.models import TravelPlace
from odysay.forms import LoginForm

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


@bp.route('/main')
def main():
    return render_template('map.html', login_form=LoginForm())


@bp.route('/sjw')
def homepage():
    return render_template('shin2ryu/sjw.html')


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
    # 새로 분리된 a4_upload 블루프린트의 upload 라우트로 리다이렉트
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

