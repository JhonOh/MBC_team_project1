from flask import Blueprint, render_template

# Blueprint: 라우팅 함수를 체계적으로 관리
bp = Blueprint('homepage', __name__, url_prefix='/homepage')

@bp.route('/sjw')
def homepage():
    return render_template('shin2ryu/sjw.html')

@bp.route('/trip_list')
def trip_list():
    return render_template('trip_list.html')

@bp.route('/trip_location')
def trip_location():
    return render_template('trip_location.html')

@bp.route('/mypage')
def mypage():
    return render_template('mypage.html')

@bp.route('/mypage/settings')
def mypage_settings():
    return render_template('settings.html')






# @app.route('/')
#     def index():
#         return "flask team project!!"
#
#     @app.route('/ojh')
#     def ojh():
#         return render_template('mypage.html')
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