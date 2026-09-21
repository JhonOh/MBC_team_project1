from flask import Blueprint, render_template
from odysay.forms import UserCreateForm
from werkzeug.security import generate_password_hash
from odysay import db
from odysay.models import User

bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.route('/signup/',methods=['GET','POST'])
def signup():
    form = UserCreateForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(form.password1.data)
        )

        db.session.add(user)
        db.session.commit()

    return render_template('signup.html', form=form)