from flask import Blueprint, redirect, url_for, flash, session, g, render_template ,request ,jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
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


@bp.route('/signup/', methods=['GET', 'POST'])
def signup():
    form = UserCreateForm()

    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            nickname=form.nickname.data,
            birth_date=form.birth_date.data,
            gender=form.gender.data,
            password_hash=generate_password_hash(
                form.password1.data
            )
        )

        db.session.add(user)

        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            flash('사용자 이름, 이메일 또는 닉네임이 이미 사용 중입니다.')
            return render_template('signup.html', form=form)

        session.clear()
        session['user_id'] = user.id

        flash('회원가입이 완료되었습니다.')
        return redirect(url_for('first._map'))

    return render_template('signup.html', form=form)

@bp.route('/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return redirect(url_for('first._map'))
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

    if form.errors:
        for errors in form.errors.values():
            for error in errors:
                flash(error)
    return redirect(url_for('first._map'))


@bp.route('/logout/')
def logout():
    session.clear()

    return redirect(url_for('first._map'))

@bp.route('/check-nickname/', methods=['GET'])
def check_nickname():
    nickname = request.args.get('nickname', '').strip()

    if not 2 <= len(nickname) <= 20:
        available = False
        message = '닉네임은 2~20자로 입력해 주세요.'

    elif User.query.filter_by(nickname=nickname).first():
        available = False
        message = '이미 사용 중인 닉네임입니다.'

    else:
        available = True
        message = '사용 가능한 닉네임입니다.'

    response = jsonify(
        available=available,
        message=message
    )

    # 예전 조회 결과를 재사용하지 않도록 설정
    response.headers['Cache-Control'] = 'no-store'

    return response