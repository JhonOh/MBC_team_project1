from flask import Blueprint, jsonify, url_for
from odysay.models import TripLocationmd, Bookmark


bp = Blueprint('trip_list', __name__, url_prefix='/trip-list')


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
        # 해당 여행지의 전체 찜 개수 조회
        like_count = Bookmark.query.filter_by(place_id=travel_place.id).count()
        cover_photo = next((name.strip() for name in (travel_place.photos or '').split(',') if name.strip()), None)

        result.append({
            'id': travel_place.id,
            'country': travel_place.country,
            'region': travel_place.region,
            'place': travel_place.place,
            'photo_url': url_for('static', filename='uploads/' + cover_photo) if cover_photo else None,
            'description': travel_place.intro or '',

            # 좌표가 없어도 목록에는 표시 가능
            'latitude': travel_place.latitude,
            'longitude': travel_place.longitude,

            # 찜 개수 연동
            'like_count': like_count
        })

    return jsonify(result)
