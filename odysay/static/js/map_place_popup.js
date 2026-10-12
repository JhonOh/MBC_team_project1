// Build with DOM nodes so user-entered titles and descriptions stay plain text.
function createMapPlacePopup(place) {
    const card = document.createElement('article');
    card.className = 'map-place-card';
    card.dataset.databasePopup = 'true';

    const media = document.createElement('div');
    media.className = 'map-place-card__media';
    const placeholder = document.createElement('div');
    placeholder.className = 'map-place-card__placeholder';
    placeholder.textContent = '사진을 준비 중이에요';
    media.append(placeholder);

    if (place.photo_url) {
        const photo = document.createElement('img');
        photo.className = 'map-place-card__photo';
        photo.alt = (place.title || '여행지') + ' 대표 사진';
        photo.decoding = 'async';
        photo.loading = 'lazy';
        photo.addEventListener('load', () => { placeholder.hidden = true; });
        photo.addEventListener('error', () => { photo.remove(); placeholder.hidden = false; }, { once: true });
        photo.src = place.photo_url;
        media.append(photo);
    }

    const content = document.createElement('div');
    content.className = 'map-place-card__content';
    const title = document.createElement('h3');
    title.className = 'map-place-card__title';
    title.textContent = place.title || '이름 없는 여행지';
    window.OdysayLanguage?.bindContent(title, 'place', place.id, 'place', title.textContent);
    const location = document.createElement('p');
    location.className = 'map-place-card__location';
    location.textContent = [place.country, place.region].filter(Boolean).join(' · ');
    const intro = document.createElement('p');
    intro.className = 'map-place-card__intro';
    intro.textContent = place.intro || '이 장소의 이야기를 상세페이지에서 만나보세요.';
    if (place.intro) window.OdysayLanguage?.bindContent(intro, 'place', place.id, 'intro', place.intro);
    const likes = document.createElement('p');
    const count = Number.isSafeInteger(place.like_count) && place.like_count > 0 ? place.like_count : 0;
    likes.className = 'map-place-card__likes' + (count > 0 ? ' has-like' : '');
    likes.textContent = (count > 0 ? '♥ ' : '♡ ') + count;
    likes.setAttribute('aria-label', '찜 ' + count + '개');
    const link = document.createElement('a');
    link.className = 'map-place-card__link';
    link.href = place.detail_url;
    link.textContent = '여행지 자세히 보기 →';
    content.append(title, location, intro, likes, link);
    card.append(media, content);
    return card;
}
