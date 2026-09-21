from flask import Flask, render_template
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy


import config

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(config)

    #ORM
    db.init_app(app)
    migrate.init_app(app, db)


    #블루프린트
    from .views import main_views ,auth_views
    app.register_blueprint(main_views.bp)
    app.register_blueprint(auth_views.bp)


    @app.route('/')
    def index():
        return "flask team project!!"

    @app.route('/ojh')
    def ojh():
        return render_template('ojh.html')

    @app.route('/sjw')
    def sjw():
        return render_template('sjw.html')

    @app.route('/map.html')
    def map():
        return render_template('map.html')

    return app