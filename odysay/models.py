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




# ==========================================
# 등록페이지 (upload)
# ==========================================
class Uploadmd(db.Model):
    __tablename__ = 'uploadmd'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    country = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    place = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    intro = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)

    restaurant = db.Column(db.Text, nullable=True)
    nearby = db.Column(db.Text, nullable=True)

    photos = db.Column(db.Text, nullable=True)
    restaurant_photos = db.Column(db.Text, nullable=True)
    nearby_photos = db.Column(db.Text, nullable=True)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)


# ==========================================
# 상세페이지 (trip_location)
# ==========================================
class TripLocationmd(db.Model):
    __tablename__ = 'trip_locationmd'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # 등록페이지의 여행지와 연결
    place_id = db.Column(
        db.Integer,
        db.ForeignKey('uploadmd.id'),
        nullable=False
    )

    # 상세페이지에서 사용하는 여행지 정보
    country = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    place = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    intro = db.Column(db.String(100), nullable=False)
    reason = db.Column(db.Text, nullable=False)

    restaurant = db.Column(db.Text, nullable=True)
    nearby = db.Column(db.Text, nullable=True)

    photos = db.Column(db.Text, nullable=True)
    restaurant_photos = db.Column(db.Text, nullable=True)
    nearby_photos = db.Column(db.Text, nullable=True)

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    # 상세페이지 정보
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    likes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, nullable=True)


# ==========================================
# 상세페이지 찜
# ==========================================
class Bookmark(db.Model):
    __tablename__ = 'bookmarks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('trip_locationmd.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'place_id', name='uq_bookmark_user_place'),
    )


# ==========================================
# 상세페이지 리뷰
# ==========================================

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('trip_locationmd.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


# ==========================================
# 상세페이지 여행톡
# ==========================================
class TravelTalk(db.Model):
    __tablename__ = 'travel_talks'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('trip_locationmd.id'), nullable=False)
    title = db.Column(db.String(60), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


# ==========================================
# 여행톡 댓글
# ==========================================
class TravelTalkComment(db.Model):
    __tablename__ = 'travel_talk_comments'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    travel_talk_id = db.Column(db.Integer, db.ForeignKey('travel_talks.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)


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
    updated_at = db.Column(db.DateTime, nullable=True)  # [수정] 수정일자 컬럼 추가
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
    updated_at = db.Column(db.DateTime, nullable=True)  # [수정] 수정일자 컬럼 추가

    # 작성자 회원 아이디 (로그인 및 수정/삭제 권한 확인용)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=True)
    user = db.relationship('User', backref=db.backref('comments', cascade='all, delete-orphan'))

    # 연결 게시글 (Post 또는 TripLocationmd)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=True)
    post = db.relationship('Post', backref=db.backref('comments', cascade='all, delete-orphan'))

    travel_place_id = db.Column(db.Integer, db.ForeignKey('trip_locationmd.id', ondelete='CASCADE'), nullable=True)
    travel_place = db.relationship('TripLocationmd', backref=db.backref('comments', cascade='all, delete-orphan'))