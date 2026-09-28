from uuid import uuid4
from pathlib import Path
from odysay.services.geocoding import find_location, valid_coords
from flask import Blueprint, render_template, request, redirect, url_for, current_app, jsonify, session
from werkzeug.utils import secure_filename
from odysay.models import db, TravelPlace
from odysay.forms import LoginForm
from flask import g
from sqlalchemy.exc import IntegrityError
from odysay.forms import ProfileEditForm
from odysay.models import User

bp = Blueprint('homepage', __name__, url_prefix='/homepage')


@bp.route('/main')
def main():
    return render_template('map.html', login_form=LoginForm())


@bp.route('/sjw')
def homepage():
    return render_template('shin2ryu/sjw.html')


# 1. 여행지 등록 (GET / POST)
@bp.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        country = request.form.get('country', '').strip()
        region = request.form.get('region', '').strip()
        place = request.form.get('place', '').strip()

        fields = {key: request.form.get(key, '').strip() for key in
                  ('country', 'region', 'place', 'intro', 'reason', 'restaurant', 'nearby')}
        limits = {'country': 100, 'region': 100, 'place': 150, 'intro': 100,
                  'reason': 500, 'restaurant': 300, 'nearby': 300}
        if any(not fields[k] for k in ('country', 'region', 'place', 'intro', 'reason')):
            return jsonify(error='필수 항목을 모두 입력해 주세요.'), 400
        if any(len(fields[k]) > limit for k, limit in limits.items()):
            return jsonify(error='입력 가능한 글자 수를 초과했습니다.'), 400
        if request.form.get('agree') != 'yes':
            return jsonify(error='등록 가이드라인에 동의해 주세요.'), 400

        # 나라 + 지역 + 여행지명으로 좌표 자동 검색
        selected_location = find_location(country, region, place)

        if selected_location is None:
            return jsonify(
                error='여행지 위치를 찾지 못했습니다. 나라, 지역, 세부 여행지명을 확인해 주세요.'
            ), 400

        # 카테고리 처리
        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)
        category_str = ', '.join(c.strip() for c in categories if c.strip())
        if not category_str or len(category_str) > 100:
            return jsonify(error='카테고리를 선택하고 100자 이내로 입력해 주세요.'), 400

        intro = request.form.get('intro')
        reason = request.form.get('reason')
        restaurant = request.form.get('restaurant')
        nearby = request.form.get('nearby')

        # Validate the extension and signature before saving any files.
        files = [f for f in request.files.getlist('photos') if f.filename]
        if len(files) > 10:
            return jsonify(error='사진은 최대 10장까지 등록할 수 있습니다.'), 400
        validated = []
        for file in files:
            extension = Path(secure_filename(file.filename)).suffix.lower()
            header = file.stream.read(12)
            file.stream.seek(0)
            is_image = ((extension in ('.jpg', '.jpeg') and header.startswith(b'\xff\xd8\xff'))
                        or (extension == '.png' and header.startswith(b'\x89PNG\r\n\x1a\n'))
                        or (extension == '.webp' and header[:4] == b'RIFF' and header[8:12] == b'WEBP'))
            if not is_image:
                return jsonify(error='JPG, PNG, WEBP 이미지 파일만 첨부해 주세요.'), 400
            validated.append((file, uuid4().hex + extension))
        upload_folder = Path(current_app.config.get('UPLOAD_FOLDER') or
                             Path(current_app.root_path) / 'static' / 'uploads')
        saved_photos = []
        try:
            if validated:
                upload_folder.mkdir(parents=True, exist_ok=True)
            for file, name in validated:
                saved_photos.append(name)
                file.save(upload_folder / name)
        except OSError:
            for name in saved_photos:
                (upload_folder / name).unlink(missing_ok=True)
            return jsonify(error='사진을 저장하지 못했습니다. 다시 시도해 주세요.'), 500

        new_place = TravelPlace(
            country=country,
            region=region,
            place=place,
            category=category_str,
            intro=intro,
            reason=reason,
            restaurant=restaurant,
            nearby=nearby,
            photos=','.join(saved_photos) if saved_photos else None
        )
        db.session.add(new_place)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            for name in saved_photos:
                (upload_folder / name).unlink(missing_ok=True)
            current_app.logger.error('Travel place commit failed')
            return jsonify(error='등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'), 500

        session.pop('geocode_result', None)

        return redirect(
            url_for(
                'homepage.trip_location_detail',
                place_id=new_place.id
            )
        )

    return render_template('upload.html')


# -----------------------------------------------------------
# 지도 페이지 라우트 및 API
# -----------------------------------------------------------

@bp.route('/trip_location/<int:place_id>')
def trip_location_detail(place_id):
    if g.user is None:
        return redirect(
            url_for('homepage.main', signup_required=1)
        )

    place_data = TravelPlace.query.get_or_404(place_id)

    photos = (
        [p.strip() for p in place_data.photos.split(',') if p.strip()]
        if place_data.photos else []
    )

    return render_template(
        'trip_location.html',
        place=place_data,
        photos=photos
    )


@bp.route('/trip_location')
def trip_location():
    if g.user is None:
        return redirect(
            url_for('homepage.main', signup_required=1)
        )

    # 이 아래 기존 코드는 그대로 유지
    place_data = TravelPlace.query.order_by(
        TravelPlace.id.desc()
    ).first()

    if not place_data:
        return "<script>alert('등록된 여행지가 없습니다. 먼저 여행지를 등록해주세요!'); location.href='/homepage/upload';</script>"

    photos = [p.strip() for p in place_data.photos.split(',') if p.strip()] if place_data.photos else []
    return render_template('trip_location.html', place=place_data, photos=photos)


@bp.route('/trip_list')
def trip_list():
    return render_template('trip_list.html')


@bp.route('/mypage')
def mypage():
    if g.user is None:
        return redirect(url_for('homepage.main'))

    return render_template('mypage.html')


@bp.route('/mypage/profile', methods=['GET', 'POST'])
def profile_edit():
    if g.user is None:
        return redirect(url_for('homepage.main'))

    form = ProfileEditForm(obj=g.user)

    if form.validate_on_submit():
        nickname = form.nickname.data

        # 자신의 닉네임은 허용하고 다른 회원과의 중복만 검사
        duplicate = User.query.filter(
            User.nickname == nickname,
            User.id != g.user.id
        ).first()

        if duplicate:
            form.nickname.errors.append(
                '이미 사용 중인 닉네임입니다.'
            )
        else:
            g.user.nickname = nickname

            try:
                db.session.commit()
            except IntegrityError:
                db.session.rollback()
                form.nickname.errors.append(
                    '이미 사용 중인 닉네임입니다.'
                )
            else:
                return redirect(url_for('homepage.mypage'))

    return render_template('profile_edit.html', form=form)


@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')


@bp.route('/geocode', methods=['GET'])
def geocode():
    query = [request.args.get(k, '').strip() for k in ('country', 'region', 'place')]
    session.pop('geocode_result', None)
    if not all(query) or any(len(v) > limit for v, limit in zip(query, (100, 100, 150))):
        return jsonify(error='국가·지역·세부 여행지명을 올바르게 입력해 주세요.'), 400
    candidate = find_location(*query)
    if candidate is None:
        return jsonify(error='위치를 찾지 못했습니다. 장소명을 확인하거나 잠시 후 다시 검색해 주세요.'), 404
    candidates = [candidate]
    session['geocode_result'] = {'query': query, 'candidates': candidates}
    response = jsonify(candidates=candidates)
    response.headers['Cache-Control'] = 'no-store'
    return response


@bp.route('/map')
def map_page():
    return redirect(url_for('homepage.main'))


@bp.route('/api/places')
def get_places():
    places = TravelPlace.query.order_by(TravelPlace.id.asc()).all()
    return jsonify([{
        'id': p.id, 'title': p.place, 'country': p.country,
        'region': p.region, 'intro': p.intro,
        'lat': p.latitude, 'lng': p.longitude,
        'detail_url': url_for('homepage.trip_location_detail', place_id=p.id)
    } for p in places if valid_coords(p.latitude, p.longitude)])
