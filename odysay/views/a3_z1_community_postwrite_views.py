import os
from flask import Blueprint, render_template, request, redirect, url_for, current_app
from werkzeug.utils import secure_filename
from datetime import datetime
from odysay import db
from odysay.models import Post

bp = Blueprint('postwrite', __name__, url_prefix='/homepage/community/postwrite')


@bp.route('/', methods=['GET', 'POST'])
def write_post():
    if request.method == 'POST':
        selected_category = request.form.get('category')
        title = request.form.get('title')
        content = request.form.get('content')

        # 1. 파일 업로드 처리
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

        # 2. DB 저장
        new_post = Post(
            category=selected_category,
            title=title,
            content=content,
            photos=photos_str,  # 👈 파일명 저장
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