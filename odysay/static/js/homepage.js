// static/js/main.js

function handleSearch() {
    const input = document.getElementById('mainSearchInput');
    const keyword = input ? input.value.trim() : '';
    // HTML에서 설정한 글로벌 변수 사용
    const targetUrl = window.APP_CONFIG?.tripListUrl || '/homepage/trip_list';

    if (keyword) {
        window.location.href = `${targetUrl}?keyword=${encodeURIComponent(keyword)}`;
    } else {
        window.location.href = targetUrl;
    }
}

(async function () {
    const mapElement = document.getElementById('home-map');
    if (!mapElement) return;

    // 1. 지도 초기화
    const map = L.map('home-map', {
        minZoom: 2,
        maxZoom: 19,
        scrollWheelZoom: true
    }).setView([20, 0], 2);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const markers = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true
    });

    map.addLayer(markers);

    // 2. 여행지 목록 API 호출
    try {
        const placesApiUrl = window.APP_CONFIG?.getPlacesUrl;
        if (!placesApiUrl) throw new Error('API URL 미설정');

        const response = await fetch(placesApiUrl);
        if (!response.ok) throw new Error('여행지 조회 실패');
        const places = await response.json();

        if (Array.isArray(places)) {
            for (const place of places) {
                if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng) || Math.abs(place.lat) > 90 || Math.abs(place.lng) > 180) continue;

                const popup = document.createElement('div');
                const title = document.createElement('strong');
                title.textContent = place.title;
                const location = document.createElement('p');
                location.textContent = [place.country, place.region].filter(Boolean).join(' ');
                const intro = document.createElement('p');
                intro.textContent = place.intro || '';
                const link = document.createElement('a');
                link.href = place.detail_url;
                link.textContent = '상세보기';

                popup.append(title, location, intro, link);
                markers.addLayer(L.marker([place.lat, place.lng]).bindPopup(popup));
            }

            if (markers.getLayers().length > 0) {
                map.fitBounds(markers.getBounds(), { padding: [40, 40], maxZoom: 12 });
            }
        }
    } catch (error) {
        const message = document.getElementById('home-map-error');
        if (message) {
            message.textContent = '여행지 목록을 불러오지 못했습니다. 새로고침해 주세요.';
            message.hidden = false;
        }
    }

    // 3. 커뮤니티 인기글 동적 연동
    fetch('/homepage/community/api/places')
        .then(res => res.json())
        .then(data => {
            const communityList = document.getElementById('mainCommunityList');
            if (!communityList) return;

            const sorted = data.sort((a, b) => {
                const likesA = a.likes || 0;
                const likesB = b.likes || 0;
                const commentA = a.comment_count ?? a.comments_count ?? 0;
                const commentB = b.comment_count ?? b.comments_count ?? 0;

                const totalA = likesA + commentA;
                const totalB = likesB + commentB;

                if (totalB !== totalA) return totalB - totalA;
                if (likesB !== likesA) return likesB - likesA;
                const timeA = a.raw_date ? new Date(a.raw_date).getTime() : 0;
                const timeB = b.raw_date ? new Date(b.raw_date).getTime() : 0;
                return timeB - timeA;
            }).slice(0, 3);

            if (sorted.length === 0) {
                communityList.innerHTML = '<p style="padding: 20px 0; color: #888;">게시글이 없습니다.</p>';
                return;
            }

            communityList.innerHTML = '';
            sorted.forEach(item => {
                let thumbImg = '/static/images/community/europe.png';
                if (item.photos && item.photos.trim() !== '') {
                    const firstPhoto = item.photos.split(',')[0].trim();
                    if (firstPhoto) thumbImg = `/static/uploads/${firstPhoto}`;
                }

                const likeCount = item.likes || 0;
                const commentCount = item.comment_count ?? item.comments_count ?? 0;
                const createdDate = item.created_at || '';

                const heartSymbol = likeCount > 0 ? '♥' : '♡';
                const heartStyle = likeCount > 0 ? 'color: #ff5a5f; font-weight: bold;' : 'color: #aaa;';
                const commentStyle = commentCount > 0 ? 'color: #007bff; font-weight: bold;' : 'color: #aaa;';

                const html = `
                    <a href="${item.detail_url}" class="community-item">
                        <div class="community-thumb">
                            <img src="${thumbImg}" alt="${item.title}" onerror="this.src='/static/images/community/europe.png'">
                        </div>
                        <div class="community-info">
                            <div class="community-top">
                                <span class="community-category">${item.category || '커뮤니티'}</span>
                                <strong>${item.title}</strong>
                            </div>
                            <div class="community-meta">
                                <span>
                                    <span style="${heartStyle}">${heartSymbol} ${likeCount}</span> &nbsp;
                                    <span style="${commentStyle}"><i class="fa-regular fa-comment"></i> ${commentCount}</span>
                                </span>
                                <span>${createdDate}</span>
                            </div>
                        </div>
                    </a>
                `;
                communityList.insertAdjacentHTML('beforeend', html);
            });
        })
        .catch(err => console.error('커뮤니티 인기글 불러오기 실패:', err));
})();