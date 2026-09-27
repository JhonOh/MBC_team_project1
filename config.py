import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{(BASE_DIR / 'odysay.db').as_posix()}"
SQLALCHEMY_TRACK_MODIFICATIONS = False
SECRET_KEY = os.environ.get('SECRET_KEY', '')
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
KAKAO_REST_API_KEY = os.environ.get('KAKAO_REST_API_KEY', '')
GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.6-flash')
MAX_CONTENT_LENGTH = 20 * 1024 * 1024
