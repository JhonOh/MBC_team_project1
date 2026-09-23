import os
from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from models import db, TravelPlace

app = Flask(__name__)
app.config['SECRET_KEY'] = 'odyssey-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///odysay.db'  # SQLite 사용[cite: 1]
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# 업로드된 이미지가 저장될 경로[cite: 1]
UPLOAD_FOLDER = os.path.join('static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db.init_app(app)

with app.app_context():
    db.create_all()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# 1. 여행지 등록 페이지 및 등록 처리[cite: 1]
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        country = request.form.get('country')  # 나라[cite: 1]
        region = request.form.get('region')  # 지역[cite: 1]
        place = request.form.get('place')  # 세부 여행지명[cite: 1]

        # 카테고리 조합[cite: 1]
        categories = request.form.getlist('category')
        etc_cat = request.form.get('etc_category')
        if etc_cat:
            categories.append(etc_cat)
        category_str = ', '.join(categories)

        intro = request.form.get('intro')  # 한줄 소개[cite: 1]
        reason = request.form.get('reason')  # 추천 이유[cite: 1]
        restaurant = request.form.get('restaurant')  # 주변 맛집[cite: 1]
        nearby = request.form.get('nearby')  # 주변 볼거리[cite: 1]

        # 이미지 업로드 처리 (최대 10장)[cite: 1]
        saved_photos = []
        if 'photos' in request.files:
            files = request.files.getlist('photos')
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    # 파일명 중복 방지를 원할 경우 uuid 등을 붙일 수 있습니다.
                    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
                    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                    saved_photos.append(filename)

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
        db.session.commit()

        # 등록 후 등록된 상세 페이지로 이동
        return redirect(url_for('trip_detail', place_id=new_place.id))

    return render_template('upload.html')


# 2. 여행지 상세 페이지 (등록된 정보 출력)[cite: 2]
@app.route('/place/<int:place_id>')
def trip_detail(place_id):
    # DB에서 해당 ID의 데이터 조회 (없으면 404 Error)
    place_data = TravelPlace.query.get_or_404(place_id)

    # 저장된 이미지 파싱 (쉼표 구분)[cite: 1]
    photo_list = place_data.photos.split(',') if place_data.photos else []

    return render_template('trip_location.html', place=place_data, photos=photo_list)


if __name__ == '__main__':
    app.run(debug=True)