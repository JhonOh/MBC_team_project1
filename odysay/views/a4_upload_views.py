import os
import time
import requests
import json
from datetime import datetime
from dotenv import load_dotenv
from flask import Blueprint, render_template, request, redirect, url_for, current_app, g
from werkzeug.utils import secure_filename
from geopy.geocoders import Nominatim
from google import genai
from google.genai import types

from odysay.models import db, TravelPlace

bp = Blueprint('upload', __name__, url_prefix='/homepage/upload')

# .env 환경 변수 불러오기
load_dotenv()

# API Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TMAP_API_KEY = os.getenv("TMAP_API_KEY")

# Nominatim 지오코더 설정 (해외 장소용)
geolocator = Nominatim(user_agent="odysay_travel_app_v8")


# -----------------------------------------------------------
# 1. Gemini AI: 오타/한글발음 ➔ 정식 명칭 추출
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
# 2. 국내 장소 전용: TMAP POI 검색 API 좌표 추출
# -----------------------------------------------------------
def get_coords_from_tmap(region, place, raw_place=""):
    api_key = os.getenv("TMAP_API_KEY") or TMAP_API_KEY
    if not api_key:
        print("[TMAP 지도 에러] TMAP_API_KEY가 설정되지 않았습니다.")
        return None, None

    headers = {
        "appKey": api_key.strip(),
        "Accept": "application/json"
    }
    url = "https://apis.openapi.sk.com/tmap/pois"

    search_steps = []
    q1 = f"{region} {place}".strip()
    if q1:
        search_steps.append((1, "보정 지역+장소", q1))

    q2 = place.strip()
    if q2 and q2 != q1:
        search_steps.append((2, "보정 장소 단독", q2))

    q3 = raw_place.strip()
    if q3 and q3 not in [q1, q2]:
        search_steps.append((3, "원본 입력 장소", q3))

    for step_num, step_name, q in search_steps:
        print(f"[TMAP 지도 {step_num}차 시도 ({step_name})] 쿼리: '{q}'")
        params = {
            "version": 1,
            "searchKeyword": q,
            "count": 1
        }
        try:
            res = requests.get(url, headers=headers, params=params)
            if res.status_code == 200:
                search_poi_info = res.json().get('searchPoiInfo', {})
                pois = search_poi_info.get('pois', {}).get('poi', [])
                if pois:
                    lat = float(pois[0].get('frontLat') or pois[0].get('noorLat'))
                    lng = float(pois[0].get('frontLon') or pois[0].get('noorLon'))
                    print(f"[TMAP 지도 검색 성공 ({step_num}차)] 쿼리: '{q}' -> 좌표: ({lat}, {lng})")
                    return lat, lng
                else:
                    print(f"[TMAP 지도 {step_num}차 실패] 결과 0건")
            else:
                print(f"[TMAP 지도 API 오류 ({step_num}차)] Status: {res.status_code} | 응답: {res.text}")
        except Exception as e:
            print(f"[TMAP 지도 API 예외 발생 ({step_num}차)]: {e}")

    return None, None


# -----------------------------------------------------------
# 여행지 등록 라우트 (/homepage/upload)
# -----------------------------------------------------------
@bp.route('/', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        country = request.form.get('country', '')
        region = request.form.get('region', '')
        place = request.form.get('place', '')

        # STEP 1: Gemini AI 오타 보정 및 정식 명칭 교정
        c_country, c_region, c_place = get_corrected_place_from_ai(country, region, place)

        # STEP 2: 좌표 검색 (TMAP vs OpenStreetMap)
        lat, lng = None, None
        is_korea = any(k in c_country.lower() or k in country.lower() for k in ['한국', '대한민국', 'korea', 'south korea'])

        if is_korea:
            print("[국내 장소 감지] TMAP 지도 API로 정밀 검색을 진행합니다...")
            lat, lng = get_coords_from_tmap(c_region, c_place, raw_place=place)

        if lat is None or lng is None:
            print("[해외 장소 또는 TMAP 검색 실패] OpenStreetMap 검색을 진행합니다...")
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

        if lat is None or lng is None:
            print("[Fallback] 특정 건물 검색 실패. 지역 단위 검색 진행...")
            fallback_location = geolocator.geocode(f"{c_region}, {c_country}") or geolocator.geocode(f"{c_country}")
            if fallback_location:
                lat, lng = fallback_location.latitude, fallback_location.longitude
                print(f"[Fallback 성공] 좌표: ({lat}, {lng})")
            else:
                print("[Fallback 실패] 좌표를 찾을 수 없음")

        # 카테고리
        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)
        category_str = ', '.join(categories)

        intro = request.form.get('intro')
        reason = request.form.get('reason')
        restaurant = request.form.get('restaurant')
        nearby = request.form.get('nearby')

        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        # 이미지 저장 함수
        def save_files(file_field_name):
            saved = []
            if file_field_name in request.files:
                files = request.files.getlist(file_field_name)
                for file in files:
                    if file and file.filename.strip() != '':
                        filename = secure_filename(file.filename)
                        unique_filename = f"{int(time.time())}_{filename}"
                        file.save(os.path.join(upload_folder, unique_filename))
                        saved.append(unique_filename)
            return saved

        saved_photos = save_files('photos')
        saved_restaurant_photos = save_files('restaurant_photos')
        saved_nearby_photos = save_files('nearby_photos')

        # DB 저장
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
                restaurant_photos=','.join(saved_restaurant_photos) if saved_restaurant_photos else None,
                nearby_photos=','.join(saved_nearby_photos) if saved_nearby_photos else None,
                user_id=g.user.id if g.user else None,
                latitude=lat,
                longitude=lng
            )

            db.session.add(new_place)
            db.session.commit()
            print(f"[DB 저장 성공] {place} ({lat}, {lng})")

            return redirect(
                url_for('trip_location.trip_location_detail', place_id=new_place.id)
            )

        except Exception as e:
            db.session.rollback()
            print(f"[DB 저장 실패 및 롤백]: {e}")
            return f"DB 저장 중 오류가 발생했습니다. (잠시 후 다시 시도해 주세요): {e}", 500

    return render_template('upload.html')