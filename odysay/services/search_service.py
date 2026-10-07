from datetime import datetime
import re

from flask import url_for
from markupsafe import Markup, escape
from sqlalchemy import and_, case, func, or_

from odysay.models import TripLocationmd, Post


def normalize_query(value):
    return ' '.join((value or '').split())[:100]


def contains(column, text):
    # %, _를 검색 와일드카드가 아닌 일반 문자로 처리
    return func.lower(column).contains(
        text.lower(),
        autoescape=True,
    )


def snippet(text, words):
    text = ' '.join((text or '').split())
    lowered = text.lower()

    positions = [
        lowered.find(word.lower())
        for word in words
        if word.lower() in lowered
    ]

    start = max(0, min(positions) - 35) if positions else 0
    end = start + 140

    return (
        ('…' if start else '')
        + text[start:end]
        + ('…' if end < len(text) else '')
    )


def highlight(text, query):
    """HTML을 이스케이프한 후 일치하는 부분만 mark로 감쌉니다."""
    text = str(text or '')
    words = sorted(set(query.split()), key=len, reverse=True)

    if not words:
        return escape(text)

    pattern = re.compile(
        '|'.join(re.escape(word) for word in words),
        re.IGNORECASE,
    )

    result = []
    previous = 0

    for match in pattern.finditer(text):
        result.append(escape(text[previous:match.start()]))
        result.append(
            Markup('<mark>') + escape(match.group()) + Markup('</mark>')
        )
        previous = match.end()

    result.append(escape(text[previous:]))
    return Markup('').join(result)


def search_content(query, kind='all', sort='relevance',
                   page=1, per_page=10, suggest=False):
    query = normalize_query(query)

    empty = {
        'items': [],
        'total': 0,
        'page': 1,
        'pages': 0,
    }

    if len(query) < 2:
        return empty

    words = query.split()
    sources = []

    if kind in ('all', 'place'):
        sources.append((
            'place',
            TripLocationmd,
            TripLocationmd.place,
            [TripLocationmd.country, TripLocationmd.region],
            [TripLocationmd.intro, TripLocationmd.reason],
        ))

    if kind in ('all', 'post'):
        sources.append((
            'post',
            Post,
            Post.title,
            [],
            [Post.content],
        ))

    queries = []
    total = 0

    for source_kind, model, title, location_fields, body_fields in sources:
        fields = [title] + location_fields

        if not suggest:
            fields += body_fields

        # 각 검색어가 검색 대상 필드 중 하나 이상에 포함되는 조건
        condition = and_(*[
            or_(*[contains(field, word) for field in fields])
            for word in words
        ])

        title_has_all = and_(*[
            contains(title, word) for word in words
        ])

        score_rules = [
            (func.lower(title) == query.lower(), 100),
            (
                func.lower(title).startswith(
                    query.lower(),
                    autoescape=True,
                ),
                80,
            ),
            (title_has_all, 60),
        ]

        if location_fields:
            location_has_all = and_(*[
                or_(*[
                    contains(field, word)
                    for field in location_fields
                ])
                for word in words
            ])
            score_rules.append((location_has_all, 40))

        score = case(*score_rules, else_=20)

        # 기존 ORM 조회를 사용하므로 공개 콘텐츠 숨김 정책이 적용됩니다.
        filtered = model.query.filter(condition)

        if not suggest:
            total += filtered.count()

        if sort == 'latest':
            ordering = (
                model.created_at.desc(),
                score.desc(),
                model.id.desc(),
            )
        else:
            ordering = (
                score.desc(),
                model.created_at.desc(),
                model.id.desc(),
            )

        queries.append((
            source_kind,
            filtered.add_columns(score).order_by(*ordering),
        ))

    pages = (total + per_page - 1) // per_page if not suggest else 0
    page = max(1, min(page, pages or 1))
    offset = (page - 1) * per_page

    # 각 종류의 상위 N개만 가져와 전체 순서를 결정합니다.
    fetch_limit = per_page if suggest else offset + per_page
    items = []

    for source_kind, filtered in queries:
        for item, score_value in filtered.limit(fetch_limit).all():
            if source_kind == 'place':
                title = item.place
                label = '여행지'
                description = (
                    f'{item.country} · {item.region}'
                    if suggest
                    else ' '.join(filter(None, [
                        item.country,
                        item.region,
                        item.intro,
                        item.reason,
                    ]))
                )
                detail_url = url_for(
                    'trip_location.trip_location_detail',
                    place_id=item.id,
                )
            else:
                title = item.title
                label = f'커뮤니티 · {item.category}'
                description = item.category if suggest else item.content
                detail_url = url_for(
                    'detail.detail',
                    post_type='post',
                    item_id=item.id,
                )

            items.append({
                'key': f'{source_kind}_{item.id}',
                'type': source_kind,
                'label': label,
                'title': title,
                'subtitle': snippet(description, words),
                'url': detail_url,
                'created_at': (
                    item.created_at.strftime('%Y.%m.%d')
                    if item.created_at else ''
                ),
                '_score': int(score_value),
                '_date': item.created_at or datetime.min,
                '_id': item.id,
            })

    def order_key(item):
        if sort == 'latest':
            return (
                item['_date'], item['_score'],
                item['_id'], item['type'],
            )
        return (
            item['_score'], item['_date'],
            item['_id'], item['type'],
        )

    items.sort(key=order_key, reverse=True)

    selected = (
        items[:per_page]
        if suggest
        else items[offset:offset + per_page]
    )

    for item in selected:
        item.pop('_score')
        item.pop('_date')
        item.pop('_id')

    return {
        'items': selected,
        'total': total,
        'page': page,
        'pages': pages,
    }