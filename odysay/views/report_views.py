from datetime import datetime

from flask import Blueprint, abort, flash, g, jsonify, redirect, render_template, request, url_for
from sqlalchemy.exc import IntegrityError

from odysay import db
from odysay.models import ContentReport
from odysay.moderation import CONTENT_TYPES, admin_required

bp = Blueprint('reports', __name__)


@bp.route('/api/reports/<kind>/<int:content_id>', methods=['POST'])
def create(kind, content_id):
    if g.user is None:
        return jsonify(message='로그인 후 신고해 주세요.'), 401
    if kind not in CONTENT_TYPES:
        abort(404)
    item = CONTENT_TYPES[kind][0].query.get_or_404(content_id)
    data = request.get_json(silent=True)
    reason = data.get('reason') if isinstance(data, dict) else None
    if not isinstance(reason, str) or not 1 <= len(reason.strip()) <= 500:
        return jsonify(message='신고 사유를 1~500자로 입력해 주세요.'), 400
    existing = ContentReport.query.filter_by(reporter_id=g.user.id, content_type=kind, content_id=content_id).first()
    if existing:
        return jsonify(success=True, message='이미 접수한 신고입니다.'), 200
    snapshot = '\n'.join(str(getattr(item, field, '') or '') for field in ('title', 'place', 'intro', 'reason', 'content'))
    db.session.add(ContentReport(reporter_id=g.user.id, content_type=kind, content_id=content_id,
                                 reason=reason.strip(), snapshot=snapshot))
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        if ContentReport.query.filter_by(reporter_id=g.user.id, content_type=kind, content_id=content_id).first():
            return jsonify(success=True, message='이미 접수한 신고입니다.'), 200
        raise
    return jsonify(success=True, message='신고가 접수되었습니다.'), 201


@bp.route('/admin/reports')
@admin_required
def index():
    status = request.args.get('status', 'pending')
    if status not in ('pending', 'resolved', 'dismissed', 'all'):
        status = 'pending'
    query = ContentReport.query
    if status != 'all':
        query = query.filter_by(status=status)
    page = query.order_by(ContentReport.created_at.desc(), ContentReport.id.desc()).paginate(
        page=max(1, request.args.get('page', 1, type=int)), per_page=20, error_out=False)
    return render_template('admin/reports.html', page=page, status=status, kinds=CONTENT_TYPES)


@bp.route('/admin/reports/<int:report_id>/resolve', methods=['POST'])
@admin_required
def resolve(report_id):
    report = ContentReport.query.get_or_404(report_id)
    status = request.form.get('status')
    note = request.form.get('resolution', '').strip()
    if status not in ('resolved', 'dismissed') or not 1 <= len(note) <= 500:
        abort(400, description='처리 결과와 사유(1~500자)를 입력해 주세요.')
    if report.status == 'pending':
        report.status = status
        report.resolution = note
        report.resolved_by = g.user.id
        report.resolved_at = datetime.utcnow()
        db.session.commit()
        flash('신고 처리 결과를 저장했습니다.')
    return redirect(url_for('reports.index'))
