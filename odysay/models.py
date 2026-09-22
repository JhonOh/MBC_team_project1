from datetime import datetime, timezone
from . import db  # odysay/__init__.py의 db 객체 참조[cite: 5, 11]

class User(db.Model):
    # 회원가입 유저정보[cite: 5]
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)


class TravelPlace(db.Model):
    __tablename__ = 'travel_places'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 기본 정보[cite: 5]
    country = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    place = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    # 여행지 소개[cite: 5]
    intro = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)

    # 주변 정보 (선택)[cite: 5]
    restaurant = db.Column(db.Text, nullable=True)
    nearby = db.Column(db.Text, nullable=True)

    # 사진 (선택)[cite: 5]
    photos = db.Column(db.Text, nullable=True)

    # 좋아요 수 (기본값 0)[cite: 5]
    likes = db.Column(db.Integer, default=0)

    # 생성 일시[cite: 5]
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))