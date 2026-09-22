from flask import Blueprint, render_template
from odysay.forms import UserCreateForm, LoginForm


bp = Blueprint('first', __name__, url_prefix='/first')


@bp.route('/map')
def _map():
    signup_form = UserCreateForm()
    login_form = LoginForm()

    return render_template(
        'map.html',
        signup_form=signup_form,
        login_form=login_form
    )