// static/js/homepage.js

function handleSearch() {
    const input = document.getElementById('mainSearchInput');
    const keyword = input ? input.value.trim() : '';
    const targetUrl = window.APP_CONFIG?.tripListUrl || '/homepage/trip_list';

    if (keyword) {
        window.location.href = `${targetUrl}?keyword=${encodeURIComponent(keyword)}`;
    } else {
        window.location.href = targetUrl;
    }
}

// 헬퍼: 사진 유무에 따른 HTML 반환 (업로드 이미지 or 대체 로고 이미지)
function renderImageOrPlaceholder(photos, altText, customClass = '') {
    if (photos && photos.trim() !== '') {
        const firstPhoto = photos.split(',')[0].trim();
        if (firstPhoto) {
            return `<img src="/static/uploads/${firstPhoto}" alt="${altText}">`;
        }
    }
    // 사진이 없을 때 logo-img 대신 no-photo-img 클래스 적용
    return `<img src="/static/images/logo.png" alt="어딧세이 로고" class="no-photo-img ${customClass}">`;
}

(async function () {
    // 1. 지도 초기화
    const mapElement = document.getElementById('home-map');
    if (mapElement) {
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

        // 지도 마커 조회 API 호출
        try {
            const placesApiUrl = window.APP_CONFIG?.getPlacesUrl;
            if (placesApiUrl) {
                const response = await fetch(placesApiUrl);
                if (response.ok) {
                    const places = await response.json();
                    if (Array.isArray(places)) {
                        for (const place of places) {
                            if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng) || Math.abs(place.lat) > 90 || Math.abs(place.lng) > 180) continue;

                            const popup = createMapPlacePopup(place);
                            markers.addLayer(L.marker([place.lat, place.lng]).bindPopup(popup, {
                                className: 'map-place-popup',
                                maxWidth: 288,
                                minWidth: 0,
                                maxHeight: Math.max(120, map.getSize().y - 100),
                                autoPanPadding: [24, 24]
                            }));
                        }

                        if (markers.getLayers().length > 0) {
                            map.fitBounds(markers.getBounds(), { padding: [40, 40], maxZoom: 12 });
                        }
                    }
                }
            }
        } catch (error) {
            const message = document.getElementById('home-map-error');
            if (message) {
                message.textContent = '여행지 목록을 불러오지 못했습니다. 새로고침해 주세요.';
                message.hidden = false;
            }
        }
    }

    // 2. 인기 여행지 비동기 로드
    fetch('/homepage/api/recommended')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('recommendedList');
            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="padding: 20px 0; color: var(--odysay-muted, #888);">등록된 추천 여행지가 없습니다.</p>';
                return;
            }

            container.innerHTML = data.map(place => {
                const imgHtml = renderImageOrPlaceholder(place.photos, place.place);
                const count = place.like_count || 0;
                const heartSymbol = count > 0 ? '♥' : '♡';
                const heartStyle = count > 0 ? 'color: var(--odysay-danger, #ff5a5f); font-weight: bold;' : 'color: var(--odysay-muted, #aaa);';

                return `
                    <a href="${place.detail_url}" class="recommend-card">
                        <div class="recommend-image">
                            ${imgHtml}
                        </div>
                        <div class="recommend-info">
                            <span>[${place.country}]</span>
                            <strong>${place.place}</strong>
                            <p class="recommend-like" style="${heartStyle}">
                                ${heartSymbol} ${count}
                            </p>
                        </div>
                    </a>
                `;
            }).join('');
        })
        .catch(err => console.error('인기 여행지 불러오기 실패:', err));

    // 3. 최근 등록된 여행지 비동기 로드
    fetch('/homepage/api/recent')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('recentList');
            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = '<p style="padding: 20px 0; color: var(--odysay-muted, #888);">최근 등록된 여행지가 없습니다.</p>';
                return;
            }

            container.innerHTML = data.map(place => {
                const imgHtml = renderImageOrPlaceholder(place.photos, place.place);
                const count = place.like_count || 0;
                const heartSymbol = count > 0 ? '♥' : '♡';
                const heartStyle = count > 0 ? 'color: var(--odysay-danger, #ff5a5f); font-weight: bold;' : 'color: var(--odysay-muted, #aaa);';

                return `
                    <a href="${place.detail_url}" class="recent-item">
                        ${imgHtml}
                        <div class="recent-info">
                            <strong>[${place.country}/${place.region}] ${place.place}</strong>
                            <div class="recent-meta-box">
                                <div class="recent-like-count" style="${heartStyle}">
                                    ${heartSymbol} ${count}
                                </div>
                                <div class="recent-bottom">
                                    <span>${place.author}</span>
                                    <span>${place.created_at}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
        })
        .catch(err => console.error('최근 등록된 여행지 불러오기 실패:', err));

    // 4. 커뮤니티 인기글 비동기 로드
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
                communityList.innerHTML = '<p style="padding: 20px 0; color: var(--odysay-muted, #888);">게시글이 없습니다.</p>';
                return;
            }

            communityList.innerHTML = sorted.map(item => {
                const imgHtml = renderImageOrPlaceholder(item.photos, item.title);
                const likeCount = item.likes || 0;
                const commentCount = item.comment_count ?? item.comments_count ?? 0;
                const createdDate = item.created_at || '';

                const heartSymbol = likeCount > 0 ? '♥' : '♡';
                const heartStyle = likeCount > 0 ? 'color: var(--odysay-danger, #ff5a5f); font-weight: bold;' : 'color: var(--odysay-muted, #aaa);';
                const commentStyle = commentCount > 0 ? 'color: var(--odysay-accent, #007bff); font-weight: bold;' : 'color: var(--odysay-muted, #aaa);';

                return `
                    <a href="${item.detail_url}" class="community-item">
                        <div class="community-thumb">
                            ${imgHtml}
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
            }).join('');
        })
        .catch(err => console.error('커뮤니티 인기글 불러오기 실패:', err));
})();
