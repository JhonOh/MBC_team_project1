// static/js/homepage.js

function handleSearch() {
    if (window.APP_CONFIG?.isGuest) {
        showSignupNotice();
        return;
    }

    const input = document.getElementById('mainSearchInput');
    const keyword = input ? input.value.trim() : '';
    const targetUrl =
        window.APP_CONFIG?.tripListUrl || '/homepage/trip_list';

    window.location.href = keyword
        ? `${targetUrl}?keyword=${encodeURIComponent(keyword)}`
        : targetUrl;
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
    return `<img src="/static/images/logo-transparent.png" alt="어딧세이 로고" class="no-photo-img ${customClass}">`;
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    })[character]);
}

function renderCountryLabel(country) {
    const canonical = String(country || '');
    const label = window.OdysayLanguage?.countryName?.(canonical) || canonical;
    return `<span data-country-name="${escapeHtml(canonical)}">${escapeHtml(label)}</span>`;
}

(async function () {
    // 1. 지도 초기화
    const mapElement = document.getElementById('home-map');
    if (mapElement) {
        // 스크린샷과 비슷한 범위.
// 경도 180도 동쪽의 아메리카 지역을 180~335도로 표현합니다.
        const allowedBounds = L.latLngBounds(
            [-60, -25],  // 남서쪽: 위도, 경도
            [80, 335]    // 북동쪽: 위도, 경도
        );

        const map = L.map('home-map', {
            minZoom: 0,
            maxZoom: 19,

            maxBounds: allowedBounds,
            maxBoundsViscosity: 1.0,

            zoomSnap: 0.25,
            zoomDelta: 0.5,

            scrollWheelZoom: true,
            bounceAtZoomLimits: false,
            inertia: false,

            // 경계 부근에서 애니메이션 도중 빈 영역이 보이는 것을 줄임
            zoomAnimation: false,
            fadeAnimation: false
        }).setView([25, 155], 2);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,

            // 날짜변경선 동쪽까지 이어서 표시해야 하므로
            // noWrap: true는 사용하지 않습니다.
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);


// 현재 지도 크기에서 경계 바깥이 보이지 않는 최소 줌 계산
        function updateMapLimits(resetView = false) {
            map.invalidateSize({pan: false, animate: false});

            const size = map.getSize();

            if (!size.x || !size.y) {
                return;
            }

            const northWest = map.project(allowedBounds.getNorthWest(), 0);
            const southEast = map.project(allowedBounds.getSouthEast(), 0);

            const boundsWidth = Math.abs(southEast.x - northWest.x);
            const boundsHeight = Math.abs(southEast.y - northWest.y);

            const scale = Math.max(
                size.x / boundsWidth,
                size.y / boundsHeight
            );

            // 0.25 단위로 올림하여 지도 영역이 경계 안에 들어오도록 함
            const minimumZoom = Math.max(
                0,
                Math.ceil(Math.log2(scale) * 4) / 4
            );

            map.setMinZoom(minimumZoom);

            if (resetView) {
                // 화면에 투영되는 좌표 기준으로 가운데 계산
                const center = map.unproject(
                    northWest.add(southEast).divideBy(2),
                    0
                );

                map.setView(center, minimumZoom, {animate: false});
            } else if (map.getZoom() < minimumZoom) {
                map.setZoom(minimumZoom, {animate: false});
            }

            map.panInsideBounds(allowedBounds, {animate: false});
        }

        updateMapLimits(true);

// 창 크기나 반응형 레이아웃이 바뀌어도 최소 줌을 다시 계산
        const mapResizeObserver = new ResizeObserver(() => {
            updateMapLimits();
        });

        mapResizeObserver.observe(document.getElementById('home-map'));

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
                            const isEnglish = window.OdysayLanguage?.getLanguage?.() === 'en';
                            const canonicalCountry =
                                window.OdysayCountries?.canonicalize?.(place.country) || place.country;

                            const title = popup.querySelector('.map-place-card__title');
                            title.textContent =
                                isEnglish && canonicalCountry === '대한민국'
                                    ? window.OdysayLanguage?.englishKoreanPlaceName?.(place.title) || place.title
                                    : place.title;

                            const location = popup.querySelector('.map-place-card__location');

                            const displayCountry =
                                window.OdysayLanguage?.countryName?.(place.country) || place.country;

                            const displayRegion =
                                isEnglish && canonicalCountry === '대한민국'
                                    ? window.OdysayLanguage?.englishKoreanRegion?.(place.region) || place.region
                                    : place.region;

                            location.textContent = [displayCountry, displayRegion]
                                .filter(Boolean)
                                .join(' ');


                            const intro = document.createElement('p');
                            intro.textContent = place.intro || '';
                            window.OdysayLanguage.bindContent(title, 'place', place.id, 'place', place.title);
                            if (place.intro) window.OdysayLanguage.bindContent(intro, 'place', place.id, 'intro', place.intro);
                       
                            const link = popup.querySelector('.map-place-card__link');

                            link.dataset.i18n = 'common.details';
                            link.textContent = uiText('common.details');

                            // 같은 장소를 현재 표시하는 세계 지도의 경도 범위로 맞춤
                            let displayLng = place.lng;

                            if (displayLng < allowedBounds.getWest()) {
                                displayLng += 360;
                            }

// 지정한 지도 범위 안의 여행지만 표시
                            if (allowedBounds.contains([place.lat, displayLng])) {
                                markers.addLayer(
                                    L.marker([place.lat, displayLng]).bindPopup(popup, {
                                        className: 'map-place-popup',
                                        maxWidth: 288,
                                        minWidth: 0,
                                        maxHeight: Math.max(120, map.getSize().y - 100),
                                        autoPanPadding: [24, 24]
                                    })
                                );
                            }

                        }


                    }
                }
            }
        } catch (error) {
            const message = document.getElementById('home-map-error');
            if (message) {
                message.textContent = uiText('home.mapLoadError');
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

                container.innerHTML = `<p style="padding: 20px 0; color: var(--odysay-muted, #888);">${uiText('home.recommendedEmpty')}</p>`;

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
                            <span>[${renderCountryLabel(place.country)}]</span>
                            <strong
                                data-translate-place="${Number(place.id)}"
                                data-translate-field="place"
                                data-place-country="${escapeHtml(place.country)}"
                            >${place.place}</strong>
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


                container.innerHTML = `<p style="padding: 20px 0; var(--odysay-muted, #888);">${uiText('home.recentEmpty')}</p>`;

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
                            <strong>
                                [${renderCountryLabel(place.country)}/<span
                                    data-translate-place="${Number(place.id)}"
                                    data-translate-field="region"
                                    data-place-country="${escapeHtml(place.country)}"
                                >${place.region}</span>]
                                <span
                                    data-translate-place="${Number(place.id)}"
                                    data-translate-field="place"
                                    data-place-country="${escapeHtml(place.country)}"
                                >${place.place}</span>
                            </strong>
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

                communityList.innerHTML = `<p style="padding: 20px 0; color: var(--odysay-muted, #888);">${uiText('home.communityEmpty')}</p>`;

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
                                <span class="community-category">${item.category || uiText('home.defaultCommunity')}</span>
                                <strong ${window.OdysayLanguage.contentAttrs(String(item.id).replace(/_\d+$/, ''), item.raw_id, String(item.id).startsWith('place_') ? 'place' : 'title')}>${escapeHtml(item.title)}</strong>
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


/* ================= 여행 도구 ================= */

const $ = id => document.getElementById(id);
const openModal = (id, e) => {
    e?.preventDefault();
    $(id)?.classList.add('active');
};
const closeModal = id => $(id)?.classList.remove('active');

function openExchangeModal(e) {
    openModal('exchangeModal', e);
}

function closeExchangeModal() {
    closeModal('exchangeModal');
}

function openTimeModal(e) {
    openModal('timeModal', e);
}

function closeTimeModal() {
    closeModal('timeModal');
}

function openRouteModal(e) {
    openModal('routeModal', e);
}

function closeRouteModal() {
    closeModal('routeModal');
}

function openWeatherModal(e) {
    openModal('weatherModal', e);
}

function closeWeatherModal() {
    closeModal('weatherModal');
}


/* ===== 국가 검색 ===== */

function updateCityOptions(country, cityBoxId, cityId) {
    if (!cityBoxId || !cityId) return;

    const cityBox = $(cityBoxId);
    const citySelect = $(cityId);
    const cities = country ? countryCityTimeZones[country] : null;
    if (!cityBox || !citySelect) return;

    cityBox.hidden = !cities;
    citySelect.replaceChildren();
    if (!cities) return;

    Object.keys(cities).forEach((city) => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.append(option);
    });
}

function setupCountryPicker(inputId, listId, cityBoxId, cityId) {
    if (!window.OdysayCountrySearch) return null;

    return window.OdysayCountrySearch.create({
        input: $(inputId),
        results: $(listId),
        wrapper: $(inputId)?.closest('.country-search'),
        itemClass: 'country-option',
        activeClass: 'selected',
        onSelect(country) {
            updateCityOptions(country, cityBoxId, cityId);
        },
        onInput(country) {
            updateCityOptions(country, cityBoxId, cityId);
        }
    });
}

const homepageCountryPickers = [
    setupCountryPicker('exchangeCountry1', 'exchangeCountryList1'),
    setupCountryPicker('exchangeCountry2', 'exchangeCountryList2'),
    setupCountryPicker('country1', 'countryList1', 'cityBox1', 'city1'),
    setupCountryPicker('country2', 'countryList2', 'cityBox2', 'city2'),
    setupCountryPicker('weatherCountry', 'weatherCountryList')
].filter(Boolean);

function canonicalCountryFromInput(inputId) {
    return window.OdysayCountries?.canonicalize($(inputId)?.value) || null;
}

function uiText(key, values) {
    return window.OdysayLanguage?.t?.(key, values) || key;
}


function uiLocale() {
    return window.OdysayLanguage?.getLocale?.() || 'ko-KR';

}

function localizedCountry(country) {
    return window.OdysayLanguage?.countryName?.(country) || country;
}


/* ===== 환율 ===== */

$('exchangeAmount')?.addEventListener('input', e => {
    const n = e.target.value.replace(/\D/g, '');
    e.target.value = n ? Number(n).toLocaleString(uiLocale()) : '';
});

async function checkExchange() {
    const c1 = canonicalCountryFromInput('exchangeCountry1');
    const c2 = canonicalCountryFromInput('exchangeCountry2');
    const amount = Number($('exchangeAmount').value.replace(/,/g, ''));
    const from = countryCurrencies[c1];
    const to = countryCurrencies[c2];

    if (!from || !to) return alert(uiText('exchange.selectCountry'));
    if (!amount) return alert(uiText('exchange.enterAmount'));

    if (from === to) return showExchange(amount, amount, from, to, 1);

    try {
        const res = await fetch(`https://api.frankfurter.dev/v2/rate/${from}/${to}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        showExchange(amount, amount * data.rate, from, to, data.rate, data.date);
    } catch {
        alert(uiText('exchange.unavailable'));
    }
}

function showExchange(amount, result, from, to, rate, date = '') {
    const locale = uiLocale();
    $('exchangeResult').innerHTML = `
        <div class="exchange-result">

            <small>${uiText('exchange.estimated')}</small>
            <strong>${result.toLocaleString(locale, {maximumFractionDigits: 2})} ${to}</strong>
            <span>${amount.toLocaleString(locale)} ${from} → ${result.toLocaleString(locale, {maximumFractionDigits: 2})} ${to}</span>
            <p>1 ${from} = ${rate.toLocaleString(locale, {maximumFractionDigits: 6})} ${to}${date ? ` · ${uiText('exchange.asOf', {date})}` : ''}</p>
            <p class="exchange-notice">${uiText('exchange.notice')}</p>`

}


/* ===== 시차 ===== */

function getZone(n) {
    const country = canonicalCountryFromInput(`country${n}`);
    const city = $(`city${n}`).value;
    return city ? countryCityTimeZones[country]?.[city] : countryTimeZones[country];
}

function checkTime() {
    const c1 = canonicalCountryFromInput('country1');
    const c2 = canonicalCountryFromInput('country2');
    const z1 = getZone(1), z2 = getZone(2);

    if (!z1 || !z2) return alert(uiText('time.selectCountry'));

    const now = new Date();

    const time = z => new Intl.DateTimeFormat(uiLocale(), {
        timeZone: z, hour: '2-digit', minute: '2-digit'
    }).format(now);

    const offset = z =>
        Math.round((new Date(now.toLocaleString('en-US', {timeZone: z})) - now) / 60000);

    const gmt = z => {
        const s = new Intl.DateTimeFormat('en-US', {
            timeZone: z, timeZoneName: 'longOffset'
        }).format(now);

        return s.match(/GMT[+-]\d{2}(?::\d{2})?/)?.[0]
            .replace(':00', '')
            .replace(/^GMT([+-])0(\d)$/, 'GMT$1$2') || 'GMT';
    };

    const diff = offset(z2) - offset(z1);
    const h = Math.floor(Math.abs(diff) / 60);
    const m = Math.abs(diff) % 60;
    const gap = m
        ? uiText('time.hoursMinutes', {hours: h, minutes: m})
        : uiText('time.hours', {hours: h});
    const c1Label = localizedCountry(c1);
    const c2Label = localizedCountry(c2);
    const differenceLabel = diff === 0
        ? uiText('time.noDifference')
        : uiText(diff > 0 ? 'time.faster' : 'time.slower', {country: c2Label, gap});

    $('timeResult').innerHTML = `
        <div class="time-result-row">
            <div class="time-card"><span>${c1Label}</span><b>${time(z1)}</b><small>${gmt(z1)}</small></div>
            <div class="time-card"><span>${c2Label}</span><b>${time(z2)}</b><small>${gmt(z2)}</small></div>
        </div>
        <div class="time-gap">
            <span>⇄</span>
            <div>
                <small>${uiText('time.difference')}</small>
                <strong>${differenceLabel}</strong>
            </div>
        </div>`;
}


/* ===== 길찾기 ===== */

function searchRoute() {
    const start = $('routeStart').value.trim();
    const end = $('routeEnd').value.trim();

    if (!start || !end) return alert(uiText('route.enterBoth'));

    window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}`,
        '_blank'
    );
}


/* ===== 날씨 ===== */

const weatherInfo = code => {
    if (code === 0) return ['☀️', uiText('weather.clear')];
    if (code <= 2) return ['🌤️', uiText('weather.partlyCloudy')];
    if (code === 3) return ['☁️', uiText('weather.cloudy')];
    if ([45, 48].includes(code)) return ['🌫️', uiText('weather.fog')];
    if (code <= 57) return ['🌦️', uiText('weather.drizzle')];
    if (code <= 67) return ['🌧️', uiText('weather.rain')];
    if (code <= 77) return ['🌨️', uiText('weather.snow')];
    if (code <= 82) return ['🌦️', uiText('weather.showers')];
    if (code >= 95) return ['⛈️', uiText('weather.thunderstorm')];
    return ['🌤️', uiText('weather.default')];
};

async function checkWeather() {
    const country = canonicalCountryFromInput('weatherCountry');
    const city = $('weatherCity').value.trim();

    if (!country || !city) return alert(uiText('weather.selectCountryCity'));

    try {
        const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=${window.OdysayLanguage?.getApiLanguage?.() || 'ko'}&format=json`
        ).then(r => r.json());

        const location = (geo.results || [])
            .find(p => p.country_code === countryCodes[country]);

        if (!location) return alert(uiText('weather.notFound'));

        const data = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&hourly=temperature_2m,weather_code,precipitation_probability&forecast_days=1&timezone=auto`
        ).then(r => {
            if (!r.ok) throw new Error();
            return r.json();
        });

        const current = data.current;
        const [icon, text] = weatherInfo(current.weather_code);
        const today = current.time.slice(0, 10);

        const hourly = data.hourly.time.map((time, i) => {
            if (!time.startsWith(today)) return '';

            return `
                <div class="weather-hour">
                    <span>${time.slice(11, 16)}</span>
                    <b>${weatherInfo(data.hourly.weather_code[i])[0]}</b>
                    <strong>${Math.round(data.hourly.temperature_2m[i])}°</strong>
                    <small>☔ ${data.hourly.precipitation_probability[i]}%</small>
                </div>`;
        }).join('');

        $('weatherResult').innerHTML = `
            <div class="weather-result">
                <span>${localizedCountry(country)} · ${location.name}</span>
                <div class="weather-current">
                    <strong>${icon} ${Math.round(current.temperature_2m)}°C</strong>
                    <b>${text}</b>
                </div>
                <p>${uiText('weather.feelsLikeHumidity', {
            temperature: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m
        })}</p>
                <div class="weather-hour-title">${uiText('weather.hourly')}</div>
                <div class="weather-hourly">${hourly}</div>
                <p class="weather-notice">
                    ${uiText('weather.notice')}
                </p>
            </div>`;

    } catch {
        alert(uiText('weather.loadError'));
    }
}


/* 날씨 마우스휠 가로 스크롤 */

document.addEventListener('wheel', e => {
    const box = e.target.closest('.weather-hourly');
    if (!box) return;

    e.preventDefault();
    box.scrollLeft += e.delta
}, {passive: false});


/* ===== 키보드 ESC 누를 때 모달 닫기 ===== */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        closeExchangeModal();
        closeTimeModal();
        closeRouteModal();
        closeWeatherModal();
    }
});