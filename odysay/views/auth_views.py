from flask import Blueprint, redirect, url_for, flash, session, g, render_template, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from odysay import db
from odysay.models import User
from odysay.forms import UserCreateForm, LoginForm, ProfileEditForm
from io import BytesIO
from pathlib import Path
from uuid import uuid4
import warnings

from PIL import Image, ImageOps, UnidentifiedImageError

bp = Blueprint('auth', __name__, url_prefix='/auth')
profile_bp = Blueprint('profile', __name__, url_prefix='/homepage')


@bp.before_app_request
def load_logged_in_user():
    user_id = session.get('user_id')

    # 기본값은 로그인하지 않은 상태
    g.user = None

    if user_id is not None:
        user = User.query.filter_by(id=user_id).first()

        # 없는 계정 또는 탈퇴한 계정의 로그인 해제
        if user is None or not user.is_active:
            session.clear()
        else:
            g.user = user

    # 로그인한 회원만 접근 가능한 화면
    member_pages = {
        'homepage.mypage',
        'homepage.mypage_settings',
        'profile.profile_edit',

    }

    if g.user is None and request.endpoint in member_pages:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))


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
        return redirect(url_for('first.map'))

    return render_template('signup.html', form=form)


@bp.route('/login/', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return redirect(url_for('homepage.homepage'))

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

        elif not user.is_active:
            flash('탈퇴한 계정입니다. 로그인할 수 없습니다.')

        else:
            session.clear()
            session['user_id'] = user.id

            return redirect(url_for('first.map'))

    # 기존 입력 오류 안내 유지
    if form.errors:
        for errors in form.errors.values():
            for error in errors:
                flash(error)

    return redirect(url_for('homepage.homepage'))


@bp.route('/logout/')
def logout():
    session.clear()

    return redirect(url_for('first.map'))


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


@bp.route('/withdraw/', methods=['POST'])
def withdraw():
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('first.map'))

    withdraw_url = url_for(
        'homepage.mypage_settings',
        _anchor='withdraw',
    )

    # 설정에 지정된 관리자 계정은 탈퇴 차단
    try:
        admin_user_id = int(
            current_app.config.get('ADMIN_USER_ID') or 0
        )
    except (TypeError, ValueError):
        admin_user_id = 0

    if admin_user_id > 0 and g.user.id == admin_user_id:
        flash(
            '관리자 계정은 탈퇴할 수 없습니다. '
            '관리자 권한을 다른 계정으로 이전한 뒤 진행해 주세요.'
        )
        return redirect(withdraw_url)

    password = request.form.get('password', '')

    if not password or not check_password_hash(
            g.user.password_hash,
            password,
    ):
        flash('비밀번호가 일치하지 않습니다.')
        return redirect(withdraw_url)

    # 기존 방식 유지: 데이터 보존, 계정 비활성화
    g.user.is_active = False

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        flash('회원 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return redirect(withdraw_url)

    session.clear()

    flash('회원 탈퇴가 완료되었습니다.')
    return redirect(url_for('first.map'))


def save_profile_image(upload):
    max_size = 5 * 1024 * 1024
    data = upload.read(max_size + 1)

    if len(data) > max_size:
        raise ValueError('사진은 5MB 이하로 선택해 주세요.')

    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', Image.DecompressionBombWarning)

            with Image.open(BytesIO(data)) as original:
                if original.format not in {'JPEG', 'PNG', 'WEBP'}:
                    raise ValueError('JPG, PNG, WEBP 사진만 가능합니다.')

                if original.width * original.height > 25_000_000:
                    raise ValueError('사진 크기가 너무 큽니다. 줄여서 등록해 주세요.')

                # 휴대폰 사진의 회전 방향 반영
                corrected = ImageOps.exif_transpose(original)
                corrected.thumbnail((512, 512))

                # 투명한 부분은 흰색으로 처리
                rgba = corrected.convert('RGBA')
                photo = Image.new('RGB', rgba.size, 'white')
                photo.paste(rgba, mask=rgba.getchannel('A'))

    except (
            UnidentifiedImageError,
            OSError,
            Image.DecompressionBombError,
            Image.DecompressionBombWarning,
    ) as error:
        raise ValueError('정상적인 이미지 파일을 선택해 주세요.') from error

    folder = Path(current_app.static_folder) / 'uploads' / 'profiles'
    folder.mkdir(parents=True, exist_ok=True)

    filename = f'{uuid4().hex}.jpg'
    destination = folder / filename

    try:
        photo.save(destination, format='JPEG', quality=85)
    except OSError:
        destination.unlink(missing_ok=True)
        raise

    return f'uploads/profiles/{filename}'


@profile_bp.route('/profile_edit', methods=['GET', 'POST'])
def profile_edit():
    # 로그인 여부 확인
    if g.user is None:
        flash('로그인이 필요합니다.')
        return redirect(url_for('homepage.homepage'))

    # 현재 회원의 닉네임을 기본값으로 표시
    form = ProfileEditForm(obj=g.user)
    save_error = None

    if form.validate_on_submit():
        nickname = form.nickname.data
        current_password = form.current_password.data or ''
        new_password = form.new_password.data or ''
        confirm_password = form.confirm_password.data or ''

        # 비밀번호 항목 중 하나라도 입력했는지 확인
        changing_password = any([
            current_password,
            new_password,
            confirm_password
        ])

        # 본인을 제외한 다른 회원의 닉네임과 중복 확인
        duplicate_user = User.query.filter(
            User.nickname == nickname,
            User.id != g.user.id
        ).first()

        if duplicate_user:
            form.nickname.errors.append(
                '이미 사용 중인 닉네임입니다.'
            )

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

            if not new_password.strip():
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
                    '새 비밀번호 확인을 입력해 주세요.'
                )
            elif new_password != confirm_password:
                form.confirm_password.errors.append(
                    '새 비밀번호가 일치하지 않습니다.'
                )

        # 오류가 있으면 변경 내용을 저장하지 않음
        if form.errors:
            return render_template(
                'mypage_profile_edit.html',
                form=form,
                save_error=save_error
            )
        new_image_path = None

        if form.avatar.data:
            try:
                new_image_path = save_profile_image(form.avatar.data)

            except ValueError as error:
                form.avatar.errors.append(str(error))
                return render_template(
                    'mypage_profile_edit.html',
                    form=form,
                    save_error=None
                )

            except OSError:
                current_app.logger.exception('대표 이미지 저장 실패')
                return render_template(
                    'mypage_profile_edit.html',
                    form=form,
                    save_error='사진을 저장하지 못했습니다. 다시 시도해 주세요.'
                )

        if new_image_path:
            g.user.profile_image = new_image_path

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
            if new_image_path:
                try:
                    image_path = (
                            Path(current_app.static_folder) / new_image_path
                    )
                    image_path.unlink(missing_ok=True)
                except OSError:
                    current_app.logger.exception('실패한 업로드 파일 정리 오류')

        except SQLAlchemyError:
            db.session.rollback()
            current_app.logger.exception('프로필 수정 저장 실패')
            save_error = (
                '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
            )
            if new_image_path:
                try:
                    image_path = (
                            Path(current_app.static_folder) / new_image_path
                    )
                    image_path.unlink(missing_ok=True)
                except OSError:
                    current_app.logger.exception('실패한 업로드 파일 정리 오류')

        else:
            if changing_password:
                session.clear()
                flash(
                    '비밀번호가 변경되었습니다. 다시 로그인해 주세요.'
                )
                return redirect(url_for('homepage.homepage'))

            flash('프로필이 수정되었습니다.')
            return redirect(url_for('homepage.mypage'))

    return render_template(
        'mypage_profile_edit.html',
        form=form,
        save_error=save_error
    )


def start_login_session(user):
    session.clear()
    session.permanent = False
    session['user_id'] = user.id
