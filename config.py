import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, '.env'))

# DB 환경변수
SQLALCHEMY_DATABASE_URI = f'sqlite:///{os.path.join(BASE_DIR, "odysay.db")}'
SQLALCHEMY_TRACK_MODIFICATIONS = False

# 폼모듈 환경변수
SECRET_KEY = os.getenv('SECRET_KEY', 'dev')

# Server-controlled single administrator. Never accept this value from a form.
ADMIN_USER_ID = os.getenv('ADMIN_USER_ID', '')

# 로컬 개발용: 서버를 다시 실행하면 이전 로그인 세션 무효화
RESET_LOGIN_ON_RESTART = True