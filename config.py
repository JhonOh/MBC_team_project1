import os

BASE_DIR = os.path.dirname(__file__)

# DB 환경변수
SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "odysay.db")}'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# 폼모듈 환경변수
SECRET_KEY = 'dev'