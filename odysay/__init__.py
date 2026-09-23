from flask import Flask, render_template
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

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)

    # ORM 초기 설정
    db.init_app(app)
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite'):
        migrate.init_app(app, db, render_as_batch=True)
    else:
        migrate.init_app(app, db)

    # 모델 불러오기 및 DB 테이블 생성[cite: 11]
    from . import models
    with app.app_context():
        db.create_all()

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