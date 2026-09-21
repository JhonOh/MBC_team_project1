from flask import Flask, render_template


def create_app():
    app = Flask(__name__)

    @app.route('/')
    def index():
        return "flask team project!!"

    @app.route('/ojh')
    def ojh():
        return render_template('ojh.html')

    @app.route('./sjw')
    def sjw():
        return render_template('sjw.html')

    return app