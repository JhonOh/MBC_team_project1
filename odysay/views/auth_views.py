from flask import Blueprint, render_template ,redirect,url_for ,flash ,session
from odysay.forms import UserCreateForm, LoginForm
from werkzeug.security import generate_password_hash,check_password_hash
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
        return redirect(url_for('main.index'))

    return render_template('signup.html', form=form)
@bp.route('/login/',methods=['GET','POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():

        user = User.query.filter_by(username=form.username.data).first()



        if user is None:
            flash("존재하지 않는 사용자입니다.")

        elif not check_password_hash(user.password_hash, form.password1.data):
            flash("비밀번호가 일치하지 않습니다.")


        else:

            session['user_id'] = user.id

            return redirect(url_for("main.index"))

    return render_template('login.html', form=form)