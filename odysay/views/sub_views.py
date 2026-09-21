from flask import Blueprint, render_template

# Blueprint: 라우팅 함수를 체계적으로 관리
bp = Blueprint('homepage', __name__, url_prefix='/homepage')

@bp.route('/sjw')
def homepage():
    return render_template('sjw.html')






# @app.route('/')
#     def index():
#         return "flask team project!!"
#
#     @app.route('/ojh')
#     def ojh():
#         return render_template('ojh.html')
#
#     @app.route('/sjw')
#     def sjw():
#         return render_template('sjw.html')
#
#     @app.route('/map.html')
#     def map():
#         return render_template('map.html')
#
#     @app.route('/hjs')
#     def hjs():
#         return render_template('hjs.html')
#
#     return app