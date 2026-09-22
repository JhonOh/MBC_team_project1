from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData

import config

def create_app():
    app = Flask(__name__)
    from .views import place_views
    app.register_blueprint(place_views.bp)

    @app.route('/')
    def index():
        return "flask team project!!"

    @app.route('/ojh')
    def ojh():
        return render_template('ojh.html')

    @app.route('/sjw')
    def sjw():
        return render_template('shin2ryu/sjw.html')

    @app.route('/map.html')
    def map():
        return render_template('map.html')

naming_convention = {
    'ix': 'ix_%(column_0_label)s',
    'uq': 'uq_%(table_name)s_%(column_0_name)s',
    'ck': 'ck_%(table_name)s_%(column_0_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s',
    'pk': 'pk_%(table_name)s',
}

db = SQLAlchemy(metadata=MetaData(naming_convention=naming_convention))
migrate = Migrate()

# 애플리케이션 팩토리
def create_app():
    app = Flask(__name__)
    app.config.from_object(config)

    # ORM 초기 설정
    db.init_app(app)
    if app.config['SQLALCHEMY_DATABASE_URI'].startswith('sqlite'):
        migrate.init_app(app, db, render_as_batch=True)
    else:
        migrate.init_app(app, db)
    from . import models

    # 블루프린트 등록
    from .views import main_views, mapmain_views, sub_views
    app.register_blueprint(main_views.bp)
    app.register_blueprint(mapmain_views.bp)
    app.register_blueprint(sub_views.bp)
    # app.register_blueprint(auth_views.bp)

    # # 필터 등록
    # from .filter import format_datetime
    # app.jinja_env.filters['datetime'] = format_datetime
    return app