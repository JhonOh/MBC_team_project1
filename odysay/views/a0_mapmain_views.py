from flask import Blueprint, render_template, jsonify
from odysay.models import TripLocationmd
from odysay.forms import LoginForm


bp = Blueprint('first', __name__, url_prefix='/first')


# 지도 화면
@bp.route('/map')
def map():
    return render_template('map.html', login_form=LoginForm())


# 지도에 표시할 여행지 정보
@bp.route('/places', methods=['GET'])
def places():
    # 위도와 경도가 모두 저장된 여행지만 조회
    travel_places = (
        TripLocationmd.query
        .filter(
            TripLocationmd.latitude.isnot(None),
            TripLocationmd.longitude.isnot(None)
        )
        .order_by(TripLocationmd.id.asc())
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
