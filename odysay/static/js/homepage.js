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
                container.innerHTML = '<p style="padding: 20px 0; color: #888;">등록된 추천 여행지가 없습니다.</p>';
                return;
            }

            container.innerHTML = data.map(place => {
                const imgHtml = renderImageOrPlaceholder(place.photos, place.place);
                const count = place.like_count || 0;
                const heartSymbol = count > 0 ? '♥' : '♡';
                const heartStyle = count > 0 ? 'color: #ff5a5f; font-weight: bold;' : 'color: #aaa;';

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
                container.innerHTML = '<p style="padding: 20px 0; color: #888;">최근 등록된 여행지가 없습니다.</p>';
                return;
            }

            container.innerHTML = data.map(place => {
                const imgHtml = renderImageOrPlaceholder(place.photos, place.place);
                const count = place.like_count || 0;
                const heartSymbol = count > 0 ? '♥' : '♡';
                const heartStyle = count > 0 ? 'color: #ff5a5f; font-weight: bold;' : 'color: #aaa;';

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
                communityList.innerHTML = '<p style="padding: 20px 0; color: #888;">게시글이 없습니다.</p>';
                return;
            }

            communityList.innerHTML = sorted.map(item => {
                const imgHtml = renderImageOrPlaceholder(item.photos, item.title);
                const likeCount = item.likes || 0;
                const commentCount = item.comment_count ?? item.comments_count ?? 0;
                const createdDate = item.created_at || '';

                const heartSymbol = likeCount > 0 ? '♥' : '♡';
                const heartStyle = likeCount > 0 ? 'color: #ff5a5f; font-weight: bold;' : 'color: #aaa;';
                const commentStyle = commentCount > 0 ? 'color: #007bff; font-weight: bold;' : 'color: #aaa;';

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

/* ================= 여행 도구 ================= */

const $ = id => document.getElementById(id);
const openModal = (id, e) => {
    e?.preventDefault();
    $(id)?.classList.add('active');
};
const closeModal = id => $(id)?.classList.remove('active');

function openExchangeModal(e) { openModal('exchangeModal', e); }
function closeExchangeModal() { closeModal('exchangeModal'); }
function openTimeModal(e) { openModal('timeModal', e); }
function closeTimeModal() { closeModal('timeModal'); }
function openRouteModal(e) { openModal('routeModal', e); }
function closeRouteModal() { closeModal('routeModal'); }
function openWeatherModal(e) { openModal('weatherModal', e); }
function closeWeatherModal() { closeModal('weatherModal'); }


/* ===== 국가 검색 ===== */

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';

const chosung = str => [...str].map(c => {
    const n = c.charCodeAt(0) - 44032;
    return n >= 0 && n <= 11171 ? CHO[Math.floor(n / 588)] : c;
}).join('');

function countrySearch(inputId, listId, cityBoxId, cityId) {
    const input = $(inputId);
    const list = $(listId);
    if (!input || !list) return;

    let result = [], index = -1;

    const select = country => {
        input.value = country;
        list.classList.remove('active');
        index = -1;

        if (!cityBoxId || !cityId) return;

        const cities = countryCityTimeZones[country];
        $(cityBoxId).hidden = !cities;
        $(cityId).innerHTML = cities
            ? Object.keys(cities).map(city => `<option>${city}</option>`).join('')
            : '';
    };

    const show = () => {
        const q = input.value.trim();

        result = countries.filter(c =>
            !q || c.includes(q) || chosung(c).startsWith(q)
        );

        list.innerHTML = result
            .map(c => `<div class="country-option">${c}</div>`)
            .join('');

        list.classList.toggle('active', !!result.length);

        [...list.children].forEach((item, i) =>
            item.onmousedown = () => select(result[i])
        );

        index = -1;
    };

    input.onclick = () =>
        list.classList.contains('active')
            ? list.classList.remove('active')
            : show();

    input.oninput = show;

    input.onkeydown = e => {
        const items = [...list.children];

        if (e.key === 'Enter') {
            e.preventDefault();
            if (result.length) select(result[index >= 0 ? index : 0]);
            return;
        }

        if (!items.length || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;

        e.preventDefault();
        index += e.key === 'ArrowDown' ? 1 : -1;
        index = (index + items.length) % items.length;

        items.forEach(item => item.classList.remove('selected'));
        items[index].classList.add('selected');
        items[index].scrollIntoView({ block: 'nearest' });
    };
}

countrySearch('exchangeCountry1', 'exchangeCountryList1');
countrySearch('exchangeCountry2', 'exchangeCountryList2');
countrySearch('country1', 'countryList1', 'cityBox1', 'city1');
countrySearch('country2', 'countryList2', 'cityBox2', 'city2');
countrySearch('weatherCountry', 'weatherCountryList');


/* ===== 환율 ===== */

$('exchangeAmount')?.addEventListener('input', e => {
    const n = e.target.value.replace(/\D/g, '');
    e.target.value = n ? Number(n).toLocaleString() : '';
});

async function checkExchange() {
    const c1 = $('exchangeCountry1').value.trim();
    const c2 = $('exchangeCountry2').value.trim();
    const amount = Number($('exchangeAmount').value.replace(/,/g, ''));
    const from = countryCurrencies[c1];
    const to = countryCurrencies[c2];

    if (!from || !to) return alert('국가를 선택해주세요.');
    if (!amount) return alert('금액을 입력해주세요.');

    if (from === to) return showExchange(amount, amount, from, to, 1);

    try {
        const res = await fetch(`https://api.frankfurter.dev/v2/rate/${from}/${to}`);
        if (!res.ok) throw new Error();

        const data = await res.json();
        showExchange(amount, amount * data.rate, from, to, data.rate, data.date);
    } catch {
        alert('선택한 국가의 환율 정보는 현재 제공되지 않습니다.');
    }
}

function showExchange(amount, result, from, to, rate, date = '') {
    $('exchangeResult').innerHTML = `
        <div class="exchange-result">
            <small>환전 예상 금액</small>
            <strong>${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}</strong>
            <span>${amount.toLocaleString()} ${from} → ${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}</span>
            <p>1 ${from} = ${rate.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${to}${date ? ` · 기준일 ${date}` : ''}</p>
            <p class="exchange-notice">※ 최근 환율 기준이며, 실제 환전 시 차이가 있을 수 있습니다.</p>
        </div>`;
}


/* ===== 시차 ===== */

function getZone(n) {
    const country = $(`country${n}`).value.trim();
    const city = $(`city${n}`).value;
    return city ? countryCityTimeZones[country]?.[city] : countryTimeZones[country];
}

function checkTime() {
    const c1 = $('country1').value.trim();
    const c2 = $('country2').value.trim();
    const z1 = getZone(1), z2 = getZone(2);

    if (!z1 || !z2) return alert('국가를 선택해주세요.');

    const now = new Date();

    const time = z => new Intl.DateTimeFormat('en-US', {
        timeZone: z, hour: '2-digit', minute: '2-digit', hour12: true
    }).format(now);

    const offset = z =>
        Math.round((new Date(now.toLocaleString('en-US', { timeZone: z })) - now) / 60000);

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
    const gap = `${h}시간${m ? ` ${m}분` : ''}`;

    $('timeResult').innerHTML = `
        <div class="time-result-row">
            <div class="time-card"><span>${c1}</span><b>${time(z1)}</b><small>${gmt(z1)}</small></div>
            <div class="time-card"><span>${c2}</span><b>${time(z2)}</b><small>${gmt(z2)}</small></div>
        </div>
        <div class="time-gap">
            <span>⇄</span>
            <div>
                <small>TIME DIFFERENCE</small>
                <strong>${diff === 0 ? '시차가 없습니다.' : `${c2}이(가) ${gap} ${diff > 0 ? '빠릅니다.' : '느립니다.'}`}</strong>
            </div>
        </div>`;
}


/* ===== 길찾기 ===== */

function searchRoute() {
    const start = $('routeStart').value.trim();
    const end = $('routeEnd').value.trim();

    if (!start || !end) return alert('출발지와 도착지를 입력해주세요.');

    window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(start)}&destination=${encodeURIComponent(end)}`,
        '_blank'
    );
}


/* ===== 날씨 ===== */

const weatherInfo = code => {
    if (code === 0) return ['☀️', '맑음'];
    if (code <= 2) return ['🌤️', '구름 조금'];
    if (code === 3) return ['☁️', '흐림'];
    if ([45, 48].includes(code)) return ['🌫️', '안개'];
    if (code <= 57) return ['🌦️', '이슬비'];
    if (code <= 67) return ['🌧️', '비'];
    if (code <= 77) return ['🌨️', '눈'];
    if (code <= 82) return ['🌦️', '소나기'];
    if (code >= 95) return ['⛈️', '뇌우'];
    return ['🌤️', '날씨'];
};

async function checkWeather() {
    const country = $('weatherCountry').value.trim();
    const city = $('weatherCity').value.trim();

    if (!country || !city) return alert('국가와 도시를 선택해주세요.');

    try {
        const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=ko&format=json`
        ).then(r => r.json());

        const location = (geo.results || [])
            .find(p => p.country_code === countryCodes[country]);

        if (!location) return alert('입력한 도시 또는 지역을 찾을 수 없습니다.');

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
                <span>${country} · ${location.name}</span>
                <div class="weather-current">
                    <strong>${icon} ${Math.round(current.temperature_2m)}°C</strong>
                    <b>${text}</b>
                </div>
                <p>체감 ${Math.round(current.apparent_temperature)}°C · 습도 ${current.relative_humidity_2m}%</p>
                <div class="weather-hour-title">시간대별 날씨</div>
                <div class="weather-hourly">${hourly}</div>
                <p class="weather-notice">
                    ※ 날씨 및 강수확률은 Open-Meteo 예보 기준이며, 기상 기관에 따라 실제 예보와 차이가 있을 수 있습니다.
                </p>
            </div>`;

    } catch {
        alert('날씨 정보를 불러오지 못했습니다.');
    }
}


/* 날씨 마우스휠 가로 스크롤 */

document.addEventListener('wheel', e => {
    const box = e.target.closest('.weather-hourly');
    if (!box) return;

    e.preventDefault();
    box.scrollLeft += e.deltaY;
}, { passive: false });