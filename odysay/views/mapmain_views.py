from flask import Blueprint, render_template

# Blueprint: 라우팅 함수를 체계적으로 관리
bp = Blueprint('first', __name__, url_prefix='/first')

@bp.route('/map')
def _map():
    return render_template('map.html')
