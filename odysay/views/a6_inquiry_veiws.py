from datetime import datetime
from functools import wraps

from flask import (
    Blueprint, abort, flash, g,
    redirect, render_template, request, url_for,
)

from odysay import db
from odysay.models import Inquiry
from odysay.moderation import is_admin, admin_required


bp = Blueprint(
    'inquiry',
    __name__,
    url_prefix='/homepage/inquiries',
)


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if g.user is None:
            flash('로그인이 필요합니다.')
            return redirect(url_for('homepage.homepage'))

        return view(*args, **kwargs)

    return wrapped


def accessible_inquiry(inquiry_id):
    query = Inquiry.query

    # 일반 사용자는 본인 문의만 조회
    if not is_admin():
        query = query.filter_by(user_id=g.user.id)

    return query.filter_by(id=inquiry_id).first_or_404()


@bp.route('/')
@login_required
def index():
    query = Inquiry.query

    # 관리자는 전체, 일반 사용자는 본인 문의
    if not is_admin():
        query = query.filter_by(user_id=g.user.id)

    pagination = (
        query
        .order_by(Inquiry.created_at.desc(), Inquiry.id.desc())
        .paginate(
            page=request.args.get('page', 1, type=int),
            per_page=10,
            error_out=False,
        )
    )

    return render_template(
        'inquiry_list.html',
        pagination=pagination,
    )


@bp.route('/new', methods=['GET', 'POST'])
@login_required
def create():
    title = ''
    content = ''

    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()

        if not 1 <= len(title) <= 200:
            flash('제목은 1~200자로 입력해 주세요.')
        elif not 1 <= len(content) <= 5000:
            flash('내용은 1~5,000자로 입력해 주세요.')
        else:
            inquiry = Inquiry(
                user_id=g.user.id,
                title=title,
                content=content,
            )

            db.session.add(inquiry)
            db.session.commit()

            flash('문의가 접수되었습니다.')
            return redirect(url_for(
                'inquiry.detail',
                inquiry_id=inquiry.id,
            ))

    return render_template(
        'inquiry_form.html',
        title=title,
        content=content,
    )


@bp.route('/<int:inquiry_id>')
@login_required
def detail(inquiry_id):
    inquiry = accessible_inquiry(inquiry_id)

    return render_template(
        'inquiry_detail.html',
        inquiry=inquiry,
    )


@bp.route('/<int:inquiry_id>/answer', methods=['POST'])
@admin_required
def answer(inquiry_id):
    inquiry = Inquiry.query.get_or_404(inquiry_id)
    answer_text = request.form.get('answer', '').strip()

    if not 1 <= len(answer_text) <= 5000:
        flash('답변은 1~5,000자로 입력해 주세요.')
        return render_template(
            'inquiry_detail.html',
            inquiry=inquiry,
            answer_draft=answer_text,
        ), 400

    inquiry.answer = answer_text
    inquiry.answered_by = g.user.id
    inquiry.answered_at = datetime.now()

    db.session.commit()

    flash('답변이 저장되었습니다.')
    return redirect(url_for(
        'inquiry.detail',
        inquiry_id=inquiry.id,
    ))