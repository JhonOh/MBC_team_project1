document.querySelectorAll('[data-site-search]').forEach(root => {

    const panel = root.querySelector('.site-search-panel');
    const form = root.querySelector('form');
    const input = root.querySelector('input');
    const status = root.querySelector('.site-search-status');
    const suggestions = root.querySelector('.site-search-suggestions');
    const allLink = root.querySelector('.site-search-all');

    let timer;
    let controller;
    let requestVersion = 0;
    let composing = false;

    function cancelPending() {
        clearTimeout(timer);
        controller?.abort();
        requestVersion++;
    }

    function clearResults() {
        suggestions.replaceChildren();
        allLink.hidden = true;
        allLink.removeAttribute('href');
    }

    function closePanel() {
        cancelPending();
        panel.hidden = true;
    }

    function openPanel() {
        panel.hidden = false;
    }


// HTML 문자열을 삽입하지 않고 텍스트와 mark 요소로 강조
function appendHighlighted(element, text, query) {
    text = String(text || '');

    const terms = [...new Set(query.toLowerCase().split(/\s+/))]
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

    const lowered = text.toLowerCase();
    let position = 0;

    while (position < text.length) {
        let next = -1;
        let matched = '';

        for (const term of terms) {
            const index = lowered.indexOf(term, position);

            if (index !== -1 && (next === -1 || index < next)) {
                next = index;
                matched = term;
            }
        }

        if (next === -1) {
            element.append(document.createTextNode(text.slice(position)));
            break;
        }

        element.append(
            document.createTextNode(text.slice(position, next))
        );

        const mark = document.createElement('mark');
        mark.textContent = text.slice(next, next + matched.length);
        element.append(mark);

        position = next + matched.length;
    }
}

async function fetchSuggestions(query, version) {
    controller = new AbortController();

    const url = new URL(root.dataset.suggestUrl, location.origin);
    url.searchParams.set('q', query);

    status.textContent = '검색 중입니다.';

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {Accept: 'application/json'}
        });

        if (!response.ok) {
            throw new Error('검색 요청 실패');
        }

        const data = await response.json();

        // 더 오래된 응답은 화면에 적용하지 않음
        if (version !== requestVersion || panel.hidden) return;

        clearResults();

        for (const item of data.items) {
            const link = document.createElement('a');
            link.className = 'site-search-item';
            link.href = item.url;

            const label = document.createElement('small');
            label.textContent = item.label;

            const title = document.createElement('strong');
            appendHighlighted(title, item.title, query);

            const subtitle = document.createElement('p');
            appendHighlighted(subtitle, item.subtitle, query);

            link.append(label, title, subtitle);
            suggestions.append(link);
        }

        status.textContent = data.items.length
            ? `추천 결과 ${data.items.length}개입니다.`
            : '추천 결과가 없습니다. 전체 검색에서 본문도 검색할 수 있습니다.';

        allLink.href = data.results_url;
        allLink.textContent = `‘${query}’ 검색 결과 전체보기 →`;
        allLink.hidden = false;
    } catch (error) {
        if (
            error.name === 'AbortError' ||
            version !== requestVersion
        ) return;

        clearResults();
        status.textContent =
            '자동완성을 불러오지 못했습니다. 검색 버튼을 이용해 주세요.';
    }
}

function scheduleSearch() {
    cancelPending();
    clearResults();

    const query = input.value.trim();

    if (composing || query.length < 2) {
        panel.hidden = true;
        status.textContent = '';
        return;
    }

    openPanel();
    status.textContent = '검색 중입니다.';

    const version = requestVersion;

    timer = setTimeout(() => {
        fetchSuggestions(query, version);
    }, 250);
}

// 입력창으로 다시 돌아오면 현재 검색어로 자동완성 표시
input.addEventListener('focus', () => {
    scheduleSearch();
});

// Esc로 닫은 뒤 입력창을 다시 클릭한 경우
input.addEventListener('click', () => {
    if (panel.hidden && !composing) {
        scheduleSearch();
    }
});

// Tab으로 검색 영역을 완전히 벗어나면 자동완성 닫기
root.addEventListener('focusout', () => {
    setTimeout(() => {
        if (!root.contains(document.activeElement)) {
            closePanel();
        }
    }, 0);
});

input.addEventListener('compositionstart', () => {
    composing = true;
    cancelPending();
    clearResults();
    panel.hidden = true;
});

input.addEventListener('compositionend', () => {
    composing = false;
    scheduleSearch();
});

input.addEventListener('input', () => {
    if (!composing) scheduleSearch();
});

form.addEventListener('submit', event => {
    if (composing) {
        event.preventDefault();
        return;
    }

    input.value = input.value.trim();

    if (input.value.length < 2) {
        event.preventDefault();
        status.textContent = '두 글자 이상 입력하세요.';
        input.focus();
    }
});

root.addEventListener('keydown', event => {
    if (event.isComposing || composing || event.keyCode === 229) {
        if (event.key === 'Enter') event.preventDefault();
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();

        // 링크에서 입력창으로 포커스를 옮긴 뒤 패널을 닫음
        input.focus();
        closePanel();
        return;
    }

    if (panel.hidden) return;

    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;

    const links = [
        ...suggestions.querySelectorAll('a'),
        ...(!allLink.hidden ? [allLink] : [])
    ];

    if (!links.length) return;

    const current = links.indexOf(document.activeElement);

    if (document.activeElement === input) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            links[0].focus();
        }
        return;
    }

    if (current < 0) return;

    event.preventDefault();

    if (event.key === 'ArrowUp') {
        if (current === 0) input.focus();
        else links[current - 1].focus();
    } else {
        links[Math.min(current + 1, links.length - 1)].focus();
    }
});

document.addEventListener('click', event => {
    if (!root.contains(event.target)) closePanel();
});
});
