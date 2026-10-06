import json
import math
from datetime import datetime

from flask import Blueprint, abort, flash, g, redirect, render_template, request, url_for
from sqlalchemy import or_
from sqlalchemy.exc import SQLAlchemyError

from odysay import db
from odysay.models import ContentModeration, ModerationLog, Uploadmd, User
from odysay.moderation import CONTENT_TYPES, admin_required, own_visible, parent_visible

bp = Blueprint('admin', __name__, url_prefix='/admin')

# Only actual content is editable. IDs, authors, counters and role fields never
# come from the form. Photos can be removed/reordered, never arbitrary file paths.
FIELDS = {
    'place': [('place', '여행지명'), ('country', '국가'), ('region', '지역'),
              ('category', '분류'), ('intro', '소개'), ('reason', '추천 이유'),
              ('restaurant', '맛집'), ('nearby', '주변 명소'),
              ('latitude', '위도'), ('longitude', '경도'), ('photos', '사진 파일명'),
              ('restaurant_photos', '맛집 사진 파일명'), ('nearby_photos', '주변 사진 파일명')],
    'post': [('title', '제목'), ('category', '분류'), ('content', '내용'), ('photos', '사진 파일명')],
    'review': [('rating', '별점 (1~5)'), ('content', '내용')],
    'comment': [('content', '내용')],
    'talk': [('title', '제목'), ('content', '내용')],
    'talk_comment': [('content', '내용')],
}


def get_content(kind, content_id):
    if kind not in CONTENT_TYPES:
        abort(404)
    return CONTENT_TYPES[kind][0].query.get_or_404(content_id)


def snapshot(item):
    return {column.name: getattr(item, column.name) for column in item.__table__.columns}


def write_log(kind, item, action, reason, before, after):
    db.session.add(ModerationLog(
        content_type=kind, content_id=item.id, actor_id=g.user.id,
        action=action, reason=reason,
        before_data=json.dumps(before, ensure_ascii=False, default=str),
        after_data=json.dumps(after, ensure_ascii=False, default=str),
    ))


def reason_from_form():
    reason = request.form.get('moderation_reason', '').strip()
    if not reason or len(reason) > 500:
        raise ValueError('처리 사유를 1~500자로 입력해 주세요.')
    return reason


def state_for(kind, item):
    return ContentModeration.query.filter_by(content_type=kind, content_id=item.id).first()


def parent_is_hidden(kind, item):
    if kind in ('review', 'talk'):
        from odysay.models import TripLocationmd
        predicate = parent_visible(TripLocationmd, 'place', item.place_id)
    elif kind == 'talk_comment':
        from odysay.models import TravelTalk
        predicate = parent_visible(TravelTalk, 'talk', item.travel_talk_id)
    elif kind == 'comment':
        from odysay.models import Post, TripLocationmd
        predicate = (parent_visible(Post, 'post', item.post_id) if item.post_id is not None
                     else parent_visible(TripLocationmd, 'place', item.travel_place_id))
    else:
        return False
    return not db.session.scalar(db.select(predicate))


@bp.route('/')
@admin_required
def index():
    kind = request.args.get('kind', 'place')
    if kind not in CONTENT_TYPES:
        abort(404)
    model, label = CONTENT_TYPES[kind]
    query = model.query
    search = request.args.get('q', '').strip()[:100]
    status = request.args.get('status', 'all')
    if search:
        columns = [getattr(model, name) for name in ('place', 'title', 'content', 'intro') if hasattr(model, name)]
        query = query.filter(or_(*(column.contains(search, autoescape=True) for column in columns)))
    if status == 'hidden':
        query = query.filter(~own_visible(kind, model.id))
    elif status == 'visible':
        query = query.filter(own_visible(kind, model.id))
    page = query.order_by(model.id.desc()).paginate(page=max(1, request.args.get('page', 1, type=int)), per_page=20, error_out=False)
    rows = []
    for item in page.items:
        author = db.session.get(User, item.user_id) if item.user_id else None
        rows.append((item, state_for(kind, item), author, parent_is_hidden(kind, item)))
    return render_template('admin/index.html', kinds=CONTENT_TYPES, kind=kind, label=label,
                           rows=rows, page=page, search=search, status=status)


@bp.route('/<kind>/<int:content_id>/edit', methods=['GET', 'POST'])
@admin_required
def edit(kind, content_id):
    item = get_content(kind, content_id)
    error = None
    if request.method == 'POST':
        try:
            reason = reason_from_form()
            values = {}
            for name, label in FIELDS[kind]:
                raw = request.form.get(name, '').strip()
                column = item.__table__.columns[name]
                if name in ('latitude', 'longitude'):
                    value = float(raw) if raw else None
                    bound = 90 if name == 'latitude' else 180
                    if value is not None and (not math.isfinite(value) or not -bound <= value <= bound):
                        raise ValueError(f'{label} 범위를 확인해 주세요.')
                elif name == 'rating':
                    value = int(raw)
                    if not 1 <= value <= 5:
                        raise ValueError('별점은 1~5여야 합니다.')
                else:
                    value = raw or (None if column.nullable else '')
                    if not column.nullable and not raw:
                        raise ValueError(f'{label}을 입력해 주세요.')
                    limit = getattr(column.type, 'length', None) or 20000
                    if len(raw) > limit:
                        raise ValueError(f'{label}은 {limit}자 이내로 입력해 주세요.')
                    if 'photos' in name:
                        original = {p.strip() for p in (getattr(item, name) or '').split(',') if p.strip()}
                        selected = [p.strip() for p in raw.split(',') if p.strip()]
                        if not set(selected).issubset(original):
                            raise ValueError('사진은 기존 파일의 순서 변경 또는 제외만 가능합니다.')
                        value = ','.join(dict.fromkeys(selected)) or None
                values[name] = value
            before = snapshot(item)
            upload = db.session.get(Uploadmd, item.place_id) if kind == 'place' else None
            if kind == 'place' and upload is None:
                raise ValueError('연결된 등록 정보가 없어 수정할 수 없습니다.')
            if upload:
                before['upload'] = snapshot(upload)
            for name, value in values.items():
                setattr(item, name, value)
                if upload and hasattr(upload, name):
                    setattr(upload, name, value)
            if hasattr(item, 'updated_at'):
                item.updated_at = datetime.now()
            after = snapshot(item)
            if upload:
                after['upload'] = snapshot(upload)
            write_log(kind, item, 'edit', reason, before, after)
            db.session.commit()
            flash('수정 내용을 저장했습니다. 원래 작성자는 유지됩니다.')
            return redirect(url_for('admin.edit', kind=kind, content_id=item.id))
        except (ValueError, TypeError) as exc:
            db.session.rollback()
            error = str(exc) if isinstance(exc, ValueError) else '입력값을 확인해 주세요.'
        except SQLAlchemyError:
            db.session.rollback()
            error = '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    return render_template('admin/edit.html', kind=kind, label=CONTENT_TYPES[kind][1],
                           item=item, fields=FIELDS[kind], state=state_for(kind, item),
                           parent_hidden=parent_is_hidden(kind, item), error=error), (400 if error else 200)


@bp.route('/<kind>/<int:content_id>/<action>', methods=['POST'])
@admin_required
def change_state(kind, content_id, action):
    if action not in ('hide', 'restore'):
        abort(404)
    item = get_content(kind, content_id)
    try:
        reason = reason_from_form()
        state = state_for(kind, item)
        before = {'is_hidden': bool(state and state.is_hidden)}
        desired = action == 'hide'
        if before['is_hidden'] == desired:
            flash('이미 요청한 상태입니다.')
        else:
            if state is None:
                state = ContentModeration(content_type=kind, content_id=item.id)
                db.session.add(state)
            state.is_hidden = desired
            state.changed_by = g.user.id
            state.changed_at = datetime.utcnow()
            state.reason = reason
            write_log(kind, item, action, reason, before, {'is_hidden': desired})
            db.session.commit()
            flash('게시를 중단했습니다.' if desired else '중단을 해제했습니다. 상위 콘텐츠가 중단되어 있다면 먼저 복원해 주세요.')
    except ValueError as exc:
        db.session.rollback()
        abort(400, description=str(exc))
    except SQLAlchemyError:
        db.session.rollback()
        abort(409, description='처리 중 상태가 변경되었거나 저장에 실패했습니다. 새로고침 후 다시 시도해 주세요.')
    return redirect(url_for('admin.edit', kind=kind, content_id=item.id))


@bp.route('/logs')
@admin_required
def logs():
    page = ModerationLog.query.order_by(ModerationLog.id.desc()).paginate(
        page=max(1, request.args.get('page', 1, type=int)), per_page=20, error_out=False)
    return render_template('admin/logs.html', page=page, kinds=CONTENT_TYPES)
