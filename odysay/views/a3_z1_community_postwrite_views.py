import os
from flask import Blueprint, render_template, request, redirect, url_for, current_app, session, g, flash
from werkzeug.utils import secure_filename
from datetime import datetime
from odysay import db
from odysay.models import Post

bp = Blueprint('postwrite', __name__, url_prefix='/homepage/community/postwrite')


def get_current_user_id():
    """현재 로그인한 유저 ID를 안전하게 조회하는 헬퍼 함수"""
    if hasattr(g, 'user') and g.user:
        return getattr(g.user, 'id', None)

    # 세션 구조 다각도 확인
    if 'user_id' in session:
        return session['user_id']
    if 'user' in session and isinstance(session['user'], dict):
        return session['user'].get('id')
    if '_user_id' in session:  # Flask-Login 호환
        return session['_user_id']

    return None


@bp.route('/', methods=['GET', 'POST'])
def write_post():
    # 1. 로그인 여부 확인
    user_id = get_current_user_id()
    if not user_id:
        # 로그인되어 있지 않으면 로그인 페이지로 이동시키거나 안내
        # (프로젝트 로그인 라우트 이름에 맞춰 수정 가능)
        return redirect('/homepage/login')

    if request.method == 'POST':
        selected_category = request.form.get('category')
        title = request.form.get('title')
        content = request.form.get('content')

        # 2. 파일 업로드 처리
        saved_filenames = []
        uploaded_files = request.files.getlist('photos')

        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads')
        os.makedirs(upload_folder, exist_ok=True)

        for file in uploaded_files:
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                # 파일명 중복 방지를 위한 타임스탬프 결합
                unique_filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file.save(os.path.join(upload_folder, unique_filename))
                saved_filenames.append(unique_filename)

        photos_str = ",".join(saved_filenames) if saved_filenames else None

        # 3. DB 저장 (user_id 추가)
        new_post = Post(
            category=selected_category,
            title=title,
            content=content,
            photos=photos_str,
            user_id=user_id,  # 👈 로그인 사용자 ID 연동!
            created_at=datetime.now()
        )
        db.session.add(new_post)
        db.session.commit()

        if selected_category == '여행 팁':
            return redirect(url_for('community.community_tip'))
        elif selected_category == '자유 게시판':
            return redirect(url_for('community.community_free'))
        else:
            return redirect(url_for('community.community_all'))

    default_category = request.args.get('category', '')
    return render_template('community_postwrite.html', default_category=default_category)