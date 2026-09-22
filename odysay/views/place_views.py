from flask import Blueprint, render_template
from odysay.countries import countries

bp = Blueprint('place', __name__)


@bp.route('/upload')
def upload():
    return render_template(
        'upload.html',
        countries=countries
    )