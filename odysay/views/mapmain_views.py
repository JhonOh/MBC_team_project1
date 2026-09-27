from flask import Blueprint, render_template, jsonify
from odysay.forms import LoginForm
from odysay.models import TravelPlace


bp = Blueprint('first', __name__, url_prefix='/first')


# 지도 화면
@bp.route('/map')
def _map():
    login_form = LoginForm()

    return render_template(
        'map.html',
        login_form=login_form
    )


# 지도에 표시할 여행지 정보
@bp.route('/places', methods=['GET'])
def places():
    # 위도와 경도가 모두 저장된 여행지만 조회
    travel_places = (
        TravelPlace.query
        .filter(
            TravelPlace.latitude.isnot(None),
            TravelPlace.longitude.isnot(None)
        )
        .order_by(TravelPlace.id.asc())
        .all()
    )

    result = []

    for travel_place in travel_places:
        result.append({
            'id': travel_place.id,
            'country': travel_place.country,
            'region': travel_place.region,
            'place': travel_place.place,
            'latitude': travel_place.latitude,
            'longitude': travel_place.longitude
        })

    return jsonify(result)