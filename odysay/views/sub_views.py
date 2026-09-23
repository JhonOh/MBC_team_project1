import os
import time
import json
import requests
from flask import Blueprint, render_template, request, redirect, url_for, current_app, jsonify
from werkzeug.utils import secure_filename
from odysay.models import db, TravelPlace
from geopy.geocoders import Nominatim
from google import genai
from google.genai import types

bp = Blueprint('homepage', __name__, url_prefix='/homepage')

# Nominatim 지오코더 설정 (해외 장소용)
geolocator = Nominatim(user_agent="odysay_travel_app_v8")




# -----------------------------------------------------------
# 1. Gemini AI: 오타/한글발음 ➔ 정식 명칭 추출 (503 재시도 포함)
# -----------------------------------------------------------
def get_corrected_place_from_ai(country, region, place):
    max_retries = 3
    retry_delay = 1

    for attempt in range(max_retries):
        try:
            api_key = os.environ.get("GEMINI_API_KEY") or GEMINI_API_KEY
            client = genai.Client(api_key=api_key)

            prompt = f"""
            사용자가 입력한 여행지 정보의 오타, 한글 발음 표기, 약어를 교정해서 
            지도 검색에 입력했을 때 정확한 건물이 검색될 수 있는 '정식 현지/영문 장소명'을 만들어주세요.

            [입력 데이터]
            - 국가: {country if country else ''}
            - 지역: {region if region else ''}
            - 장소: {place if place else ''}

            부연설명 없이 반드시 오직 지정된 JSON 포맷으로만 응답하세요.
            {{
                "corrected_country": "정식 국가명",
                "corrected_region": "정식 지역명",
                "corrected_place": "정식 장소/건물명"
            }}
            """

            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )

            raw_text = response.text.strip()
            data = json.loads(raw_text)

            c = data.get('corrected_country', country)
            r = data.get('corrected_region', region)
            p = data.get('corrected_place', place)

            print(f"[Gemini AI 명칭 보정 성공] 입력: ({country} {region} {place}) -> 교정: ({c} / {r} / {p})")
            return c, r, p

        except Exception as e:
            print(f"[Gemini AI 시도 {attempt + 1}/{max_retries} 실패]: {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)

    return country, region, place


# -----------------------------------------------------------
# 2. 국내 장소 전용: 카카오 지도 REST API 좌표 검색
# -----------------------------------------------------------
def get_coords_from_kakao(region, place):
    """
    카카오 로컬 REST API를 이용해 국내 장소의 정확한 위/경도를 추출합니다.
    """
    try:
        headers = {"Authorization": f"KakaoAK {KAKAO_REST_API_KEY}"}

        # 1) 키워드 검색 시도 (예: "수원 MBC아카데미뷰티학원 수원인계점")
        query = f"{region} {place}".strip()
        url = f"https://dapi.kakao.com/v2/local/search/keyword.json?query={query}"

        res = requests.get(url, headers=headers)
        if res.status_code == 200:
            documents = res.json().get('documents')
            if documents:
                lat = float(documents[0]['y'])
                lng = float(documents[0]['x'])
                print(f"[카카오 지도 검색 성공] 쿼리: '{query}' -> 좌표: ({lat}, {lng})")
                return lat, lng

        # 2) 건물명 단독 검색 시도
        url_place_only = f"https://dapi.kakao.com/v2/local/search/keyword.json?query={place}"
        res_place = requests.get(url_place_only, headers=headers)
        if res_place.status_code == 200:
            documents = res_place.json().get('documents')
            if documents:
                lat = float(documents[0]['y'])
                lng = float(documents[0]['x'])
                print(f"[카카오 지도 단독검색 성공] 쿼리: '{place}' -> 좌표: ({lat}, {lng})")
                return lat, lng

    except Exception as e:
        print(f"[카카오 지도 API 에러]: {e}")

    return None, None


@bp.route('/sjw')
def homepage():
    return render_template('shin2ryu/sjw.html')


# 1. 여행지 등록 (GET / POST)
@bp.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        country = request.form.get('country', '')
        region = request.form.get('region', '')
        place = request.form.get('place', '')

        # -----------------------------------------------------------
        # STEP 1: Gemini AI로 오타 보정 및 정식 명칭 교정받기
        # -----------------------------------------------------------
        c_country, c_region, c_place = get_corrected_place_from_ai(country, region, place)

        # -----------------------------------------------------------
        # STEP 2: 한국/해외 판별 후 좌표 검색 (카카오 vs OpenStreetMap)
        # -----------------------------------------------------------
        lat, lng = None, None

        # 한국 국가 판별 조건
        is_korea = any(k in c_country.lower() or k in country.lower() for k in ['한국', '대한민국', 'korea', 'south korea'])

        if is_korea:
            print("[국내 장소 감지] 카카오 지도 API로 정밀 검색을 진행합니다...")
            lat, lng = get_coords_from_kakao(c_region, c_place)

        # 해외이거나 카카오 검색 실패 시 OpenStreetMap 사용 (Fallback)
        if lat is None or lng is None:
            print("[해외 장소 또는 카카오 검색 실패] OpenStreetMap 검색을 진행합니다...")
            search_queries = [
                f"{c_place}, {c_region}, {c_country}",
                f"{c_place}, {c_country}",
                f"{c_place}"
            ]

            for query in search_queries:
                try:
                    location = geolocator.geocode(query)
                    if location:
                        lat, lng = location.latitude, location.longitude
                        print(f"[OpenStreetMap 좌표 취득 성공] 쿼리: '{query}' -> 좌표: ({lat}, {lng})")
                        break
                except Exception as geo_e:
                    print(f"[OpenStreetMap 검색 중 예외]: {geo_e}")

        # 최후의 수단: 지역/국가 단위 위치 설정
        if lat is None or lng is None:
            print("[Fallback] 특정 건물 검색 실패. 지역 단위 검색 진행...")
            fallback_location = geolocator.geocode(f"{c_region}, {c_country}") or geolocator.geocode(f"{c_country}")
            if fallback_location:
                lat, lng = fallback_location.latitude, fallback_location.longitude
                print(f"[Fallback 성공] 좌표: ({lat}, {lng})")
            else:
                print("[Fallback 실패] 좌표를 찾을 수 없음")
        # -----------------------------------------------------------

        # 카테고리 처리
        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)
        category_str = ', '.join(categories)

        intro = request.form.get('intro')
        reason = request.form.get('reason')
        restaurant = request.form.get('restaurant')
        nearby = request.form.get('nearby')

        # 이미지 업로드 저장 처리
        saved_photos = []
        if 'photos' in request.files:
            files = request.files.getlist('photos')
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)

            for file in files:
                if file and file.filename.strip() != '':
                    filename = secure_filename(file.filename)
                    unique_filename = f"{int(time.time())}_{filename}"
                    file.save(os.path.join(upload_folder, unique_filename))
                    saved_photos.append(unique_filename)

        # -----------------------------------------------------------
        # DB 저장 처리
        # -----------------------------------------------------------
        try:
            new_place = TravelPlace(
                country=country,
                region=region,
                place=place,
                category=category_str,
                intro=intro,
                reason=reason,
                restaurant=restaurant,
                nearby=nearby,
                photos=','.join(saved_photos) if saved_photos else None,
                latitude=lat,
                longitude=lng
            )

            db.session.add(new_place)
            db.session.commit()
            print(f"[DB 저장 성공] {place} ({lat}, {lng})")
            return redirect(url_for('homepage.map_page'))

        except Exception as e:
            db.session.rollback()
            print(f"[DB 저장 실패 및 롤백]: {e}")
            return f"DB 저장 중 오류가 발생했습니다. (잠시 후 다시 시도해 주세요): {e}", 500

    return render_template('upload.html')


# -----------------------------------------------------------
# 지도 페이지 라우트 및 API
# -----------------------------------------------------------
@bp.route('/map')
def map_page():
    return render_template('map.html')


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
                'region': p.region,
                'intro': p.intro,
                'lat': p.latitude,
                'lng': p.longitude
            })
    return jsonify(results)


@bp.route('/trip_location/<int:place_id>')
def trip_location_detail(place_id):
    place_data = TravelPlace.query.get_or_404(place_id)
    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    return render_template('trip_location.html', place=place_data, photos=photos)


@bp.route('/trip_location')
def trip_location():
    place_data = TravelPlace.query.order_by(TravelPlace.id.desc()).first()

    if not place_data:
        return "<script>alert('등록된 여행지가 없습니다. 먼저 여행지를 등록해주세요!'); location.href='/homepage/upload';</script>"

    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    return render_template('trip_location.html', place=place_data, photos=photos)


@bp.route('/trip_list')
def trip_list():
    return render_template('trip_list.html')


@bp.route('/mypage')
def mypage():
    return render_template('mypage.html')


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')