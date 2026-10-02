"""Central public visibility rules, including hidden parents.

All HTTP ORM SELECTs are filtered, except authenticated administrator requests
inside the admin blueprint. Keeping this rule here covers lists, counts, lazy
relationships and direct-ID lookups without relying on hidden UI buttons.
"""
from functools import wraps

from flask import abort, current_app, g, has_request_context, request
from sqlalchemy import and_, event, exists, or_, select
from sqlalchemy.orm import Session, with_loader_criteria

from .models import (
    Comment, ContentModeration, Post, Review, TravelTalk, TravelTalkComment,
    TripLocationmd,
)

CONTENT_TYPES = {
    'place': (TripLocationmd, '여행지'),
    'post': (Post, '커뮤니티 게시글'),
    'review': (Review, '리뷰'),
    'comment': (Comment, '커뮤니티 댓글'),
    'talk': (TravelTalk, '여행톡'),
    'talk_comment': (TravelTalkComment, '여행톡 댓글'),
}


def is_admin(user=None):
    if user is None:
        user = getattr(g, 'user', None)
    try:
        admin_id = int(current_app.config.get('ADMIN_USER_ID') or 0)
    except (TypeError, ValueError):
        return False
    return bool(user and user.is_active and admin_id > 0 and user.id == admin_id
                and current_app.config.get('SECRET_KEY') not in ('dev', '', None))


def admin_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not is_admin():
            abort(403)
        # Request-local authorization only; never loaded from a cookie or form.
        g.admin_access_granted = True
        return fn(*args, **kwargs)
    return wrapped


def own_visible(kind, id_column):
    state = ContentModeration.__table__.alias()
    return ~exists(select(1).where(
        state.c.content_type == kind,
        state.c.content_id == id_column,
        state.c.is_hidden.is_(True),
    ))


def parent_visible(model, kind, id_column):
    # Core aliases avoid recursively applying the ORM criteria inside subqueries.
    parent = model.__table__.alias()
    condition = own_visible(kind, parent.c.id)
    if kind == 'talk':
        condition = and_(condition, parent_visible(TripLocationmd, 'place', parent.c.place_id))
    return exists(select(1).where(parent.c.id == id_column, condition))


def visibility(kind, model):
    condition = own_visible(kind, model.id)
    if kind in ('review', 'talk'):
        condition = and_(condition, parent_visible(TripLocationmd, 'place', model.place_id))
    elif kind == 'talk_comment':
        condition = and_(condition, parent_visible(TravelTalk, 'talk', model.travel_talk_id))
    elif kind == 'comment':
        condition = and_(condition, or_(
            and_(model.post_id.isnot(None), parent_visible(Post, 'post', model.post_id)),
            and_(model.travel_place_id.isnot(None), parent_visible(TripLocationmd, 'place', model.travel_place_id)),
        ))
    return condition


def protect_hidden_descendants(kind, item_id):
    """An author's permanent deletion must not destroy moderated children."""
    from . import db
    targets = []
    if kind == 'post':
        table = Comment.__table__
        targets.append(('comment', table, table.c.post_id == item_id))
    elif kind == 'place':
        for child_kind, model, field in (
            ('comment', Comment, 'travel_place_id'), ('review', Review, 'place_id'),
            ('talk', TravelTalk, 'place_id'),
        ):
            table = model.__table__
            targets.append((child_kind, table, table.c[field] == item_id))
        table = TravelTalkComment.__table__
        talk_ids = select(TravelTalk.__table__.c.id).where(TravelTalk.__table__.c.place_id == item_id)
        targets.append(('talk_comment', table, table.c.travel_talk_id.in_(talk_ids)))
    elif kind == 'talk':
        table = TravelTalkComment.__table__
        targets.append(('talk_comment', table, table.c.travel_talk_id == item_id))
    for child_kind, table, matches in targets:
        if db.session.scalar(select(exists(select(1).select_from(table).where(
                matches, ~own_visible(child_kind, table.c.id))))):
            abort(409, description='관리자가 중단한 하위 콘텐츠가 있어 영구 삭제할 수 없습니다.')


@event.listens_for(Session, 'do_orm_execute')
def filter_public_content(execute_state):
    if not execute_state.is_select or not has_request_context():
        return
    if request.blueprint == 'admin' and getattr(g, 'admin_access_granted', False):
        return
    statement = execute_state.statement
    for kind, (model, _) in CONTENT_TYPES.items():
        statement = statement.options(with_loader_criteria(
            model, visibility(kind, model), include_aliases=True,
            propagate_to_loaders=False,
        ))
    execute_state.statement = statement
