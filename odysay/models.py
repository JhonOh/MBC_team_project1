from datetime import datetime
from . import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # True: 정상 회원 / False: 탈퇴 회원 작업 작업자 박기흠 26.09.29 회원탈퇴 기능 구현
    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        server_default=db.true()
    )

    # 회원가입 추가 정보
    nickname = db.Column(db.String(20), unique=True, nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    gender = db.Column(db.String(10), nullable=True)


class TravelPlace(db.Model):
    __tablename__ = 'travel_places'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    # 마이페이지 내가 만든 여행지 확인 기능을 사용하기 위하여 여행지 db. 정보에 등록 id 추가 기능 추가 26.09.29 박기흠
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=True
    )

    # 기본 정보
    country = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    place = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    # 여행지 소개
    intro = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)

    # 주변 정보
    restaurant = db.Column(db.Text, nullable=True)
    nearby = db.Column(db.Text, nullable=True)

    # 사진
    photos = db.Column(db.Text, nullable=True)

    # 좋아요 수
    likes = db.Column(db.Integer, default=0)

    # 생성 일시
    created_at = db.Column(db.DateTime, default=datetime.now)

    # 지도 좌표
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)


    # 수정 일시
    updated_at = db.Column(
        db.DateTime,
        nullable=True
    )

    # 주변 맛집 사진
    restaurant_photos = db.Column(
        db.Text,
        nullable=True
    )

    # 주변 볼거리 / 즐길거리 사진
    nearby_photos = db.Column(
        db.Text,
        nullable=True
    )