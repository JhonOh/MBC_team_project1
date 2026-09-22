from flask import Blueprint, redirect, url_for, flash, session, g
from werkzeug.security import generate_password_hash, check_password_hash

from odysay import db
from odysay.models import User
from odysay.forms import UserCreateForm, LoginForm


bp = Blueprint('auth', __name__, url_prefix='/auth')


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')

    if user_id is None:
        g.user = None
    else:
        g.user = User.query.filter_by(id=user_id).first()


@bp.route('/signup/', methods=['POST'])
def signup():
    form = UserCreateForm()

    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            password_hash=generate_password_hash(
                form.password1.data
            )
        )

        db.session.add(user)
        db.session.commit()

        flash('회원가입이 완료되었습니다.')

    else:
        for errors in form.errors.values():
            for error in errors:
                flash(error)

    return redirect(url_for('first._map'))


@bp.route('/login/', methods=['POST'])
def login():
    form = LoginForm()

    if form.validate_on_submit():

        user = User.query.filter_by(
            username=form.username.data
        ).first()

        if user is None:
            flash('존재하지 않는 사용자입니다.')

        elif not check_password_hash(
            user.password_hash,
            form.password1.data
        ):
            flash('비밀번호가 일치하지 않습니다.')

        else:
            session.clear()
            session['user_id'] = user.id

            return redirect(url_for('first._map'))

    return redirect(url_for('first._map'))


@bp.route('/logout/')
def logout():
    session.clear()

    return redirect(url_for('first._map'))