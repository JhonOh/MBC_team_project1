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
    if app.testing:
        # Tests never inherit live generation from the developer's .env.
        app.config['GEMINI_TRANSLATION_ENABLED'] = (test_config or {}).get('GEMINI_TRANSLATION_ENABLED', False)
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

    from .views import (main_views, a0_mapmain_views, a3_community_views, a3_z1_community_postwrite_views, a3_z2_community_detail_views, a4_upload_views, a4_z1_trip_location_views, a5_mypage_views, a1_homepage_views, auth_views , a2_trip_list_views,
        a4_z1_z1_trip_location_feature_views ,admin_views , a6_inquiry_veiws)
    from .moderation import is_admin
    from .admin_commands import register_commands

    app.register_blueprint(main_views.bp)
    app.register_blueprint(a0_mapmain_views.bp)
    app.register_blueprint(a3_community_views.bp)
    app.register_blueprint(a3_z1_community_postwrite_views.bp)
    app.register_blueprint(a3_z2_community_detail_views.bp)
    app.register_blueprint(a4_upload_views.bp)
    app.register_blueprint(a4_z1_trip_location_views.bp)
    app.register_blueprint(a5_mypage_views.bp)
    app.register_blueprint(a1_homepage_views.bp)
    app.register_blueprint(auth_views.bp)
    app.register_blueprint(auth_views.profile_bp)
    app.register_blueprint(a2_trip_list_views.bp)
    app.register_blueprint(a4_z1_z1_trip_location_feature_views.bp)

    #문의 기능 등록
    app.register_blueprint(a6_inquiry_veiws.bp)

    app.register_blueprint(admin_views.bp)
    from .views import report_views
    app.register_blueprint(report_views.bp)
    app.context_processor(lambda: {'is_admin': is_admin})
    register_commands(app)

    from .services.translation import init_translation
    init_translation(app)

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
    #     return render_template('shin2ryu/homepage.html')
    #
    # @app.route('/map.html')
    # def map():
    #     return render_template('map.html')

    return app
