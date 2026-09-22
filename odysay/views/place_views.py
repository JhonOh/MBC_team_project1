from flask import Blueprint, render_template

bp = Blueprint('place', __name__)


@bp.route('/upload')
def upload():
    return render_template('upload.html')