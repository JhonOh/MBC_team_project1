from flask import Blueprint, jsonify
from odysay.models import TripLocationmd


bp = Blueprint(
    'trip_list',
    __name__,
    url_prefix='/trip-list'
)


# ==========================================
# 여행지 목록 페이지 전용 API
# ==========================================

@bp.route('/places', methods=['GET'])
def places():

    # 위도/경도 여부와 관계없이
    # 등록된 모든 여행지를 가져온다.
    travel_places = (
        TripLocationmd.query
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

            # 좌표가 없어도 목록에는 표시 가능
            'latitude': travel_place.latitude,
            'longitude': travel_place.longitude
        })

    return jsonify(result)