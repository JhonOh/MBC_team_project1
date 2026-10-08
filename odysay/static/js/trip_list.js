/* =========================================================
   어딧세이 여행지 페이지
   trip_list.js
========================================================= */


/* =========================================================
   1. Shared country catalog
========================================================= */

const tripCountries = (window.OdysayCountries?.all || []).map((country) => ({
    name: country.ko,
    flag: country.flag,
    code: country.code,
    continent: country.continent
}));


/* =========================================================
   2. 상태값
========================================================= */

let travelPlaces = [];
let selectedCountry = null;
let selectedContinent = "all";
let searchKeyword = "";
let keyboardCountryIndex = -1;


/* =========================================================
   3. DOM
========================================================= */

const countryList = document.getElementById("countryList");
const countrySearch = document.getElementById("countrySearch");
const destinationGrid = document.getElementById("destinationGrid");
const destinationCount = document.getElementById("destinationCount");
const selectedCountryFlag = document.getElementById("selectedCountryFlag");
const selectedCountryName = document.getElementById("selectedCountryName");
const selectedCountryDescription = document.getElementById("selectedCountryDescription");
const emptyState = document.getElementById("emptyState");
const continentButtons = document.querySelectorAll(".continent-btn");


/* =========================================================
   4. 서버에서 여행지 가져오기
========================================================= */

async function loadTravelPlaces() {
    try {
        const response = await fetch("/trip-list/places");

        if (!response.ok) {
            throw new Error(uiText('tripList.loadError', { status: response.status }));
        }

        travelPlaces = await response.json();
        console.log("여행지 DB 데이터:", travelPlaces);

        renderCountryList();
        renderDestinations();

    } catch (error) {
        console.error("여행지 불러오기 실패:", error);
        travelPlaces = [];
        renderCountryList();
        renderDestinations();
    }
}


/* =========================================================
   5. 국가별 여행지 개수
========================================================= */

function getCountryCount(countryName) {
    return travelPlaces.filter(place =>
        normalizeCountry(place.country) === normalizeCountry(countryName)
    ).length;
}


/* =========================================================
   6. 국가명 통일
========================================================= */

function normalizeCountry(country) {
    if (!country) return "";
    return window.OdysayCountries?.canonicalize(country) || String(country).trim();
}

function uiText(key, values) {
    return window.OdysayLanguage?.t?.(key, values) || key;
}

function displayCountry(country) {
    return window.OdysayLanguage?.countryName?.(country) || country;
}


/* =========================================================
   7. 국가 목록 출력
========================================================= */

function renderCountryList() {
    if (!countryList) return;

    countryList.innerHTML = "";

    const matchingCountries = new Set(
        (window.OdysayCountrySearch?.search(searchKeyword) || tripCountries)
            .map((country) => country.ko || country.name)
    );

    // 대륙 + 공통 한글/영문/초성 검색으로 국가 필터링
    const filteredCountries = tripCountries
        .filter(country => {
            const continentMatch =
                selectedContinent === "all" ||
                country.continent === selectedContinent;

            const searchMatch = !searchKeyword || matchingCountries.has(country.name);

            return continentMatch && searchMatch;
        })
        .sort((a, b) => displayCountry(a.name).localeCompare(displayCountry(b.name), window.OdysayLanguage?.getLocale?.() || "ko-KR"));

    keyboardCountryIndex = -1;

    // 국가 버튼 생성
    filteredCountries.forEach(country => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "country-item";
        button.setAttribute("data-country", country.name);

        // 현재 선택된 국가
        if (selectedCountry === country.name) {
            button.classList.add("active");
        }

        // 해당 국가에 등록된 여행지 개수
        const count = getCountryCount(country.name);

        button.innerHTML = `
            <span class="country-flag">
                <img
                    src="https://flagcdn.com/w40/${country.code.toLowerCase()}.png"
                    alt="${displayCountry(country.name)}"
                    loading="lazy"
                >
            </span>

            <span class="country-name" data-country-name="${country.name}">
                ${displayCountry(country.name)}
            </span>

            <span class="country-count">
                ${count}
            </span>
        `;

        // 국가 선택 클릭
        button.addEventListener("click", () => {
            selectCountry(country.name);
        });

        countryList.appendChild(button);
    });

    // 검색 결과 없음
    if (filteredCountries.length === 0) {
        countryList.innerHTML = `
            <div style="
                padding: 40px 15px;
                text-align: center;
                color: var(--odysay-muted, #9aa4b1);
                font-size: 12px;
            ">
                ${uiText('tripList.noResults')}
            </div>
        `;
    }
}


/* =========================================================
   8. 국가 선택
========================================================= */

function selectCountry(countryName) {
    selectedCountry = normalizeCountry(countryName);
    renderCountryList();
    renderDestinations();
}

function setKeyboardCountryActive(index) {
    const buttons = [...countryList.querySelectorAll('.country-item')];
    if (!buttons.length) return;

    keyboardCountryIndex = index;
    buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === keyboardCountryIndex;
        button.classList.toggle('keyboard-active', active);
        if (active) button.scrollIntoView({ block: 'nearest' });
    });
}


/* =========================================================
   9. 여행지 출력
========================================================= */

function renderDestinations() {
    if (!destinationGrid) return;

    destinationGrid.innerHTML = "";

    let filteredPlaces = travelPlaces;

    /* 국가를 선택했다면 해당 국가만 */
    if (selectedCountry) {
        filteredPlaces = travelPlaces.filter(place =>
            normalizeCountry(place.country) === normalizeCountry(selectedCountry)
        );
    }

    updateSelectedCountryHeader(filteredPlaces.length);

    /* 여행지가 없는 경우 */
    if (filteredPlaces.length === 0) {
        destinationGrid.style.display = "none";

        if (emptyState) {
            emptyState.style.display = "block";
        }
        return;
    }

    destinationGrid.style.display = "grid";

    if (emptyState) {
        emptyState.style.display = "none";
    }

    filteredPlaces.forEach(place => {
        const card = createDestinationCard(place);
        destinationGrid.appendChild(card);
    });
}


/* =========================================================
   10. 여행지 카드 생성
========================================================= */

function createDestinationCard(place) {
    const card = document.createElement("article");
    card.className = "destination-card";

    const imagePath = getPlaceImage(place);

    const countryName = normalizeCountry(place.country);
    const region = place.region || "";
    const placeName = place.place || uiText('tripList.defaultPlace');

    const displayRegion =
        window.OdysayLanguage?.getLanguage?.() === 'en' &&
        countryName === '대한민국'
            ? window.OdysayLanguage?.englishKoreanRegion?.(region) || region
            : region;

    const likesCount = getPlaceLikes(place);
    const hasLikeClass = likesCount > 0 ? "has-like" : "";
    const heartIcon = likesCount > 0 ? "♥" : "♡";

    card.innerHTML = `
        <div class="card-image">
            <img
                alt="${placeName}"
                loading="lazy"
                decoding="async"
            >
            <span class="country-badge" data-country-name="${countryName}">
                ${displayCountry(countryName)}
            </span>
        </div>

        <div class="card-content">
            <div class="card-location">
                ${displayRegion}
            </div>

            <h3 class="card-title"
                data-translate-place="${Number(place.id)}"
                data-translate-field="place"
                data-place-country="${countryName}">
                ${placeName}
            </h3>


            <p class="card-description" ${place.intro ? `data-translate-place="${Number(place.id)}" data-translate-field="intro"` : ''}>
                ${getPlaceDescription(place)}
            </p>

            <div class="card-bottom">
                <span class="like ${hasLikeClass}">
                    ${heartIcon} ${likesCount}
                </span>

                <span class="detail-text" data-i18n="tripList.detail">
                    ${uiText('tripList.detail')}
                </span>
            </div>
        </div>
    `;

    const photo = card.querySelector('img');
    const showFallback = () => {
        photo.classList.add('destination-photo-fallback');
        photo.src = '/static/images/logo.png';
    };
    photo.addEventListener('error', showFallback, { once: true });
    if (place.photo_url) {
        photo.src = imagePath;
    } else {
        showFallback();
    }
    return card;
}

function escapeCardText(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}


/* =========================================================
   11. 여행지 이미지 연결
========================================================= */

function getPlaceImage(place) {
    return place.photo_url || "/static/images/logo.png";
}


/* =========================================================
   12. 설명
========================================================= */

function getPlaceDescription(place) {
    if (place.description) {
        return place.description;
    }

    const region = place.region || "";
    const displayRegion =
        window.OdysayLanguage?.getLanguage?.() === 'en' &&
        normalizeCountry(place.country) === '대한민국'
            ? window.OdysayLanguage?.englishKoreanRegion?.(region) || region
            : region;
    if (region) {
        return uiText('tripList.descriptionWithRegion', {
    region: displayRegion
});
    }

    return uiText('tripList.description');
}


/* =========================================================
   13. 좋아요 (하트 개수)
========================================================= */

function getPlaceLikes(place) {
    if (place.like_count !== undefined && place.like_count !== null) {
        return place.like_count;
    }
    return 0;
}


/* =========================================================
   14. 선택 국가 HEADER
========================================================= */

function updateSelectedCountryHeader(count) {
    if (destinationCount) {
        destinationCount.textContent = count;
    }

    if (!selectedCountry) {
        if (selectedCountryFlag) selectedCountryFlag.textContent = "🌏";
        if (selectedCountryName) selectedCountryName.textContent = uiText('tripList.allCountries');
        if (selectedCountryDescription) selectedCountryDescription.textContent = uiText('tripList.allCountriesDescription');
        return;
    }

    const country = tripCountries.find(item => item.name === selectedCountry);

    if (selectedCountryFlag) {
        if (country) {
            const countryCode = country.code.toLowerCase();
            selectedCountryFlag.innerHTML = `
                <img
                    src="https://flagcdn.com/w80/${countryCode}.png"
                    alt="${displayCountry(country.name)}"
                >
            `;
        } else {
            selectedCountryFlag.textContent = "🌏";
        }
    }

    if (selectedCountryName) {
        selectedCountryName.textContent = displayCountry(selectedCountry);
    }

    if (selectedCountryDescription) {
        selectedCountryDescription.textContent = uiText('tripList.countryDescription', {
            country: displayCountry(selectedCountry)
        });
    }
}


/* =========================================================
   15. URL 파라미터 자동 선택 처리
========================================================= */

function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get("keyword") || urlParams.get("country");

    if (!query) return;

    const normalizedQuery = normalizeCountry(query.trim());

    if (countrySearch) {
        countrySearch.value = query.trim();
        searchKeyword = query.trim();
    }

    // Common catalog resolves Korean, English and aliases to one Korean key.
    const targetCountry = tripCountries.find(c => c.name === normalizedQuery);

    if (targetCountry) {
        selectCountry(targetCountry.name);
    } else {
        renderCountryList();
    }
}


/* =========================================================
   16. 이벤트 리스너 등록
========================================================= */

if (countrySearch) {
    countrySearch.addEventListener("input", event => {
        searchKeyword = event.target.value.trim();

        // 사용자 직접 검색 시 URL의 쿼리 스트링(?keyword=... 또는 ?country=...) 제거
        if (window.location.search) {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        renderCountryList();
    });

    countrySearch.addEventListener('keydown', (event) => {
        const buttons = [...countryList.querySelectorAll('.country-item')];
        if (!buttons.length || !['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) return;

        if (event.key === 'Enter') {
            event.preventDefault();
            const button = buttons[keyboardCountryIndex >= 0 ? keyboardCountryIndex : 0];
            if (button) selectCountry(button.dataset.country);
            return;
        }

        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const initialIndex = direction === 1 ? 0 : buttons.length - 1;
        const next = keyboardCountryIndex < 0
            ? initialIndex
            : (keyboardCountryIndex + direction + buttons.length) % buttons.length;
        setKeyboardCountryActive(next);
    });
}

continentButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedContinent = button.dataset.continent;

        continentButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        renderCountryList();
    });
});


/* =========================================================
   17. 페이지 시작
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("어딧세이 trip_list.js 연결 성공!");

    // 1. URL 검색어/국가 파라미터 파싱 및 적용
    handleUrlParams();

    // 2. 초기 국가 목록 표시
    renderCountryList();

    // 3. DB 여행지 데이터 불러오기
    loadTravelPlaces();
});

window.addEventListener('odysay:languagechange', () => {
    renderCountryList();
    renderDestinations();
});
