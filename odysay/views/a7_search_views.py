from flask import Blueprint, jsonify, render_template, request, url_for

from odysay.services.search_service import (
    highlight,
    normalize_query,
    search_content,
)


bp = Blueprint(
    'search',
    __name__,
    url_prefix='/homepage/search',
)

bp.add_app_template_filter(highlight, 'search_highlight')


@bp.route('')
def results():
    query = normalize_query(request.args.get('q'))

    kind = request.args.get('type', 'all')
    if kind not in ('all', 'place', 'post'):
        kind = 'all'

    sort = request.args.get('sort', 'relevance')
    if sort not in ('relevance', 'latest'):
        sort = 'relevance'

    page = request.args.get('page', 1, type=int) or 1

    result = search_content(
        query,
        kind=kind,
        sort=sort,
        page=page,
    )

    return render_template(
        'search_results.html',
        query=query,
        kind=kind,
        sort=sort,
        result=result,
    )


@bp.route('/suggest')
def suggest():
    query = normalize_query(request.args.get('q'))

    result = search_content(
        query,
        per_page=8,
        suggest=True,
    )

    response = jsonify({
        'items': result['items'],
        'results_url': url_for('search.results', q=query),
    })

    # 숨김 처리된 콘텐츠가 오래된 캐시에 남지 않도록 함
    response.headers['Cache-Control'] = 'no-store'
    return response