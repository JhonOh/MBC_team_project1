from flask import Blueprint, redirect, url_for, flash, session, g, render_template ,request ,jsonify ,current_app
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError , SQLAlchemyError
from odysay import db
from odysay.models import User
from odysay.forms import UserCreateForm, LoginForm ,ProfileEditForm


bp = Blueprint('auth', __name__, url_prefix='/auth')
profile_bp = Blueprint(
    'profile',
    __name__,
    url_prefix='/homepage'
)


@bp.before_app_request #26.09.29 수정 박기흠 회원탈퇴기능 구현을 위해 수정
def load_logged_in_user():
    user_id = session.get('user_id')
    g.user = None

    if user_id is not None:
        user = User.query.filter_by(id=user_id).first()

        if user is None or not user.is_active:
            session.clear()
        else:
            g.user = user

    # 로그인한 회원만 접근할 수 있는 화면
    member_pages = {
        'homepage.mypage',
        'homepage.mypage_settings',
        'profile.profile_edit',
    }

    if g.user is None and request.endpoint in member_pages:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.main'))

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
        return redirect(url_for('homepage.main'))

    return render_template('signup.html', form=form)

@bp.route('/login/', methods=['GET', 'POST'])#26.09.29 수정 박기흠 회원탈퇴기능 구현을 위해 수정
def login():
    if request.method == 'GET':
        return redirect(url_for('homepage.main'))
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

        # 추가: 탈퇴한 회원의 로그인 차단
        elif not user.is_active:
            flash('탈퇴한 계정입니다. 로그인할 수 없습니다.')

        else:
            session.clear()
            session['user_id'] = user.id

            return redirect(url_for('homepage.main'))

@bp.route('/logout/')
def logout():
    session.clear()

    return redirect(url_for('homepage.main'))

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

@bp.route('/withdraw/', methods=['POST']) #회원 탈퇴관련 함수추가 박기흠 26.09.29
def withdraw():
    # 로그인 여부 확인
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.main'))

    # 현재 비밀번호 확인
    password = request.form.get('password', '')

    if not password or not check_password_hash(
        g.user.password_hash,
        password
    ):
        flash('비밀번호가 일치하지 않습니다.')
        return redirect(url_for('homepage.mypage_settings'))

    # 회원정보는 보존하고 계정만 비활성화
    g.user.is_active = False

    try:
        db.session.commit()

    except SQLAlchemyError:
        db.session.rollback()
        flash('회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return redirect(url_for('homepage.mypage_settings'))

    # 저장 성공 후 로그아웃
    session.clear()

    flash('회원 탈퇴가 완료되었습니다.')
    return redirect(url_for('homepage.main'))

@profile_bp.route('/profile_edit', methods=['GET', 'POST'])
def profile_edit():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.main'))

    form = ProfileEditForm(obj=g.user)
    save_error = None

    if form.validate_on_submit():
        nickname = form.nickname.data

        current_password = form.current_password.data or ''
        new_password = form.new_password.data or ''
        confirm_password = form.confirm_password.data or ''

        changing_password = any((
            current_password,
            new_password,
            confirm_password
        ))

        # 다른 회원의 닉네임과 중복되는지 확인
        existing_user = User.query.filter(
            User.nickname == nickname,
            User.id != g.user.id
        ).first()

        if existing_user:
            form.nickname.errors.append(
                '이미 사용 중인 닉네임입니다.'
            )

        # 비밀번호 입력란 중 하나라도 입력하면 모두 검사
        if changing_password:
            if not current_password:
                form.current_password.errors.append(
                    '현재 비밀번호를 입력해 주세요.'
                )
            elif not check_password_hash(
                g.user.password_hash,
                current_password
            ):
                form.current_password.errors.append(
                    '현재 비밀번호가 일치하지 않습니다.'
                )

            if not new_password:
                form.new_password.errors.append(
                    '새 비밀번호를 입력해 주세요.'
                )
            elif check_password_hash(
                g.user.password_hash,
                new_password
            ):
                form.new_password.errors.append(
                    '현재 비밀번호와 다른 비밀번호를 입력해 주세요.'
                )

            if not confirm_password:
                form.confirm_password.errors.append(
                    '새 비밀번호를 다시 입력해 주세요.'
                )
            elif new_password != confirm_password:
                form.confirm_password.errors.append(
                    '새 비밀번호가 일치하지 않습니다.'
                )

        # 검증 실패 시 닉네임과 비밀번호 모두 변경하지 않음
        if form.errors:
            return render_template(
                'profile_edit.html',
                form=form,
                save_error=None
            )

        g.user.nickname = nickname

        if changing_password:
            g.user.password_hash = generate_password_hash(
                new_password
            )

        try:
            db.session.commit()

        except IntegrityError:
            db.session.rollback()
            form.nickname.errors.append(
                '이미 사용 중인 닉네임입니다.'
            )

        except SQLAlchemyError:
            db.session.rollback()
            current_app.logger.exception('프로필 수정 실패')
            save_error = (
                '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
            )

        else:
            if changing_password:
                session.clear()
                flash(
                    '비밀번호가 변경되었습니다. '
                    '새 비밀번호로 다시 로그인해 주세요.'
                )
                return redirect(url_for('homepage.main'))

            flash('닉네임이 변경되었습니다.')
            return redirect(url_for('homepage.mypage'))

    return render_template(
        'profile_edit.html',
        form=form,
        save_error=save_error
    )