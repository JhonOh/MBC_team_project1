from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

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


    return app