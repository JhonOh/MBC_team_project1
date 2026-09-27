from flask import Flask, jsonify
from flask_wtf.csrf import CSRFProtect, CSRFError
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
import config

naming_convention = {
    'ix': 'ix_%(column_0_label)s',
    'uq': 'uq_%(table_name)s_%(column_0_name)s',
    'ck': 'ck_%(table_name)s_%(column_0_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s',
    'pk': 'pk_%(table_name)s',
}

db = SQLAlchemy(metadata=MetaData(naming_convention=naming_convention))
migrate = Migrate()
csrf = CSRFProtect()

def create_app(test_config=None):
    app = Flask(__name__)
    app.config.from_object(config)
    if test_config:
        app.config.update(test_config)
    if not app.config.get('SECRET_KEY'):
        raise RuntimeError('먼저 python setup_env.py를 실행해 로컬 .env를 생성하세요.')
    csrf.init_app(app)

    @app.errorhandler(CSRFError)
    def csrf_error(error):
        return jsonify(error='요청이 만료되었습니다. 페이지를 새로고침하고 다시 시도해 주세요.'), 400

    @app.errorhandler(413)
    def upload_too_large(error):
        return jsonify(error='전체 업로드 크기는 20MB 이하여야 합니다.'), 413

    # ORM 초기 설정
    db.init_app(app)
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite'):
        migrate.init_app(app, db, render_as_batch=True)
    else:
        migrate.init_app(app, db)

    # 모델 불러오기 및 DB 테이블 생성[cite: 11]
    from . import models

    # 블루프린트 등록[cite: 11]
    from .views import main_views, mapmain_views, sub_views, auth_views

    app.register_blueprint(main_views.bp)
    app.register_blueprint(mapmain_views.bp)
    app.register_blueprint(sub_views.bp)
    app.register_blueprint(auth_views.bp)

    # # 라우트 설정[cite: 11]
    # @app.route('/')
    # def index():
    #     return "flask team project!!"
    #
    # @app.route('/ojh')
    # def ojh():
    #     return render_template('ojh.html')
    #
    # @app.route('/sjw')
    # def sjw():
    #     return render_template('shin2ryu/sjw.html')
    #
    # @app.route('/map.html')
    # def map():
    #     return render_template('map.html')

    return app