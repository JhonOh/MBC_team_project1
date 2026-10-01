from datetime import datetime
from . import db


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # 정상 회원: True / 탈퇴 회원: False
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

    # 작성자
    user_id = db.Column(
        db.Integer,
        db.ForeignKey('user.id'),
        nullable=True
    )

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


# ==========================================
# 커뮤니티(여행 팁 / 자유 게시판)용 모델 (들여쓰기 제거)
# ==========================================
class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category = db.Column(db.String(50), nullable=False)  # '여행 팁', '자유 게시판'
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    photos = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    likes = db.Column(db.Integer, default=0)

    # 작성자 (로그인 연동 시 사용)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)


# ==========================================
# [추가] 자유게시판 / 여행팁 (Post) 좋아요 기록 모델
# ==========================================
class PostLike(db.Model):
    __tablename__ = 'post_like'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 좋아요를 누른 유저 ID (회원 탈퇴 시 삭제)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=False)

    # 좋아요를 누른 게시글 ID (게시글 삭제 시 삭제)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)

    # 좋아요 누른 시간
    created_at = db.Column(db.DateTime, default=datetime.now)

    # 한 유저(user_id)가 하나의 게시글(post_id)에 1회만 좋아요 가능하도록 유니크 제약
    __table_args__ = (
        db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),
    )


# ==========================================
# 커뮤니티(여행 팁 / 자유 게시판) 밑에 댓글
# ==========================================
class Comment(db.Model):
    __tablename__ = 'comment'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    content = db.Column(db.Text, nullable=False)
    author = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    # 작성자 회원 아이디 (로그인 및 수정/삭제 권한 확인용)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=True)
    user = db.relationship('User', backref=db.backref('comments', cascade='all, delete-orphan'))

    # 연결 게시글 (Post 또는 TravelPlace)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True)
    post = db.relationship('Post', backref=db.backref('comments', cascade='all, delete-orphan'))

    travel_place_id = db.Column(db.Integer, db.ForeignKey('travel_places.id', ondelete='CASCADE'), nullable=True)
    travel_place = db.relationship('TravelPlace', backref=db.backref('comments', cascade='all, delete-orphan'))