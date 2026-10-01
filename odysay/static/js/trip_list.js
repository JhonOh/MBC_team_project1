/* =========================================================
   어딧세이 여행지 페이지
   trip_list.js
========================================================= */


/* =========================================================
   1. 국가 기본 데이터
========================================================= */

    const countries = [
    // =========================
    // 아시아
    // =========================
    { name: "대한민국", flag: "🇰🇷", continent: "asia" },
    { name: "네팔", flag: "🇳🇵", continent: "asia" },
    { name: "동티모르", flag: "🇹🇱", continent: "asia" },
    { name: "라오스", flag: "🇱🇦", continent: "asia" },
    { name: "레바논", flag: "🇱🇧", continent: "asia" },
    { name: "말레이시아", flag: "🇲🇾", continent: "asia" },
    { name: "몰디브", flag: "🇲🇻", continent: "asia" },
    { name: "몽골", flag: "🇲🇳", continent: "asia" },
    { name: "미얀마", flag: "🇲🇲", continent: "asia" },
    { name: "바레인", flag: "🇧🇭", continent: "asia" },
    { name: "방글라데시", flag: "🇧🇩", continent: "asia" },
    { name: "베트남", flag: "🇻🇳", continent: "asia" },
    { name: "부탄", flag: "🇧🇹", continent: "asia" },
    { name: "브루나이", flag: "🇧🇳", continent: "asia" },
    { name: "사우디아라비아", flag: "🇸🇦", continent: "asia" },
    { name: "스리랑카", flag: "🇱🇰", continent: "asia" },
    { name: "싱가포르", flag: "🇸🇬", continent: "asia" },
    { name: "아랍에미리트", flag: "🇦🇪", continent: "asia" },
    { name: "아르메니아", flag: "🇦🇲", continent: "asia" },
    { name: "아제르바이잔", flag: "🇦🇿", continent: "asia" },
    { name: "아프가니스탄", flag: "🇦🇫", continent: "asia" },
    { name: "예멘", flag: "🇾🇪", continent: "asia" },
    { name: "오만", flag: "🇴🇲", continent: "asia" },
    { name: "요르단", flag: "🇯🇴", continent: "asia" },
    { name: "우즈베키스탄", flag: "🇺🇿", continent: "asia" },
    { name: "이라크", flag: "🇮🇶", continent: "asia" },
    { name: "이란", flag: "🇮🇷", continent: "asia" },
    { name: "이스라엘", flag: "🇮🇱", continent: "asia" },
    { name: "인도", flag: "🇮🇳", continent: "asia" },
    { name: "인도네시아", flag: "🇮🇩", continent: "asia" },
    { name: "일본", flag: "🇯🇵", continent: "asia" },
    { name: "조지아", flag: "🇬🇪", continent: "asia" },
    { name: "중국", flag: "🇨🇳", continent: "asia" },
    { name: "카자흐스탄", flag: "🇰🇿", continent: "asia" },
    { name: "카타르", flag: "🇶🇦", continent: "asia" },
    { name: "캄보디아", flag: "🇰🇭", continent: "asia" },
    { name: "쿠웨이트", flag: "🇰🇼", continent: "asia" },
    { name: "키르기스스탄", flag: "🇰🇬", continent: "asia" },
    { name: "타지키스탄", flag: "🇹🇯", continent: "asia" },
    { name: "태국", flag: "🇹🇭", continent: "asia" },
    { name: "튀르키예", flag: "🇹🇷", continent: "asia" },
    { name: "투르크메니스탄", flag: "🇹🇲", continent: "asia" },
    { name: "파키스탄", flag: "🇵🇰", continent: "asia" },
    { name: "필리핀", flag: "🇵🇭", continent: "asia" },

    // =========================
    // 유럽
    // =========================
    { name: "그리스", flag: "🇬🇷", continent: "europe" },
    { name: "네덜란드", flag: "🇳🇱", continent: "europe" },
    { name: "노르웨이", flag: "🇳🇴", continent: "europe" },
    { name: "덴마크", flag: "🇩🇰", continent: "europe" },
    { name: "독일", flag: "🇩🇪", continent: "europe" },
    { name: "라트비아", flag: "🇱🇻", continent: "europe" },
    { name: "러시아", flag: "🇷🇺", continent: "europe" },
    { name: "루마니아", flag: "🇷🇴", continent: "europe" },
    { name: "룩셈부르크", flag: "🇱🇺", continent: "europe" },
    { name: "리투아니아", flag: "🇱🇹", continent: "europe" },
    { name: "리히텐슈타인", flag: "🇱🇮", continent: "europe" },
    { name: "모나코", flag: "🇲🇨", continent: "europe" },
    { name: "몬테네그로", flag: "🇲🇪", continent: "europe" },
    { name: "몰도바", flag: "🇲🇩", continent: "europe" },
    { name: "몰타", flag: "🇲🇹", continent: "europe" },
    { name: "바티칸 시국", flag: "🇻🇦", continent: "europe" },
    { name: "벨기에", flag: "🇧🇪", continent: "europe" },
    { name: "벨라루스", flag: "🇧🇾", continent: "europe" },
    { name: "보스니아 헤르체고비나", flag: "🇧🇦", continent: "europe" },
    { name: "북마케도니아", flag: "🇲🇰", continent: "europe" },
    { name: "불가리아", flag: "🇧🇬", continent: "europe" },
    { name: "산마리노", flag: "🇸🇲", continent: "europe" },
    { name: "세르비아", flag: "🇷🇸", continent: "europe" },
    { name: "스웨덴", flag: "🇸🇪", continent: "europe" },
    { name: "스위스", flag: "🇨🇭", continent: "europe" },
    { name: "스페인", flag: "🇪🇸", continent: "europe" },
    { name: "슬로바키아", flag: "🇸🇰", continent: "europe" },
    { name: "슬로베니아", flag: "🇸🇮", continent: "europe" },
    { name: "아이슬란드", flag: "🇮🇸", continent: "europe" },
    { name: "아일랜드", flag: "🇮🇪", continent: "europe" },
    { name: "알바니아", flag: "🇦🇱", continent: "europe" },
    { name: "에스토니아", flag: "🇪🇪", continent: "europe" },
    { name: "영국", flag: "🇬🇧", continent: "europe" },
    { name: "오스트리아", flag: "🇦🇹", continent: "europe" },
    { name: "우크라이나", flag: "🇺🇦", continent: "europe" },
    { name: "이탈리아", flag: "🇮🇹", continent: "europe" },
    { name: "체코", flag: "🇨🇿", continent: "europe" },
    { name: "크로아티아", flag: "🇭🇷", continent: "europe" },
    { name: "키프로스", flag: "🇨🇾", continent: "europe" },
    { name: "포르투갈", flag: "🇵🇹", continent: "europe" },
    { name: "폴란드", flag: "🇵🇱", continent: "europe" },
    { name: "프랑스", flag: "🇫🇷", continent: "europe" },
    { name: "핀란드", flag: "🇫🇮", continent: "europe" },
    { name: "헝가리", flag: "🇭🇺", continent: "europe" },

    // =========================
    // 아메리카
    // =========================
    { name: "가이아나", flag: "🇬🇾", continent: "america" },
    { name: "과테말라", flag: "🇬🇹", continent: "america" },
    { name: "그레나다", flag: "🇬🇩", continent: "america" },
    { name: "니카라과", flag: "🇳🇮", continent: "america" },
    { name: "도미니카 공화국", flag: "🇩🇴", continent: "america" },
    { name: "도미니카 연방", flag: "🇩🇲", continent: "america" },
    { name: "멕시코", flag: "🇲🇽", continent: "america" },
    { name: "미국", flag: "🇺🇸", continent: "america" },
    { name: "바베이도스", flag: "🇧🇧", continent: "america" },
    { name: "바하마", flag: "🇧🇸", continent: "america" },
    { name: "베네수엘라", flag: "🇻🇪", continent: "america" },
    { name: "벨리즈", flag: "🇧🇿", continent: "america" },
    { name: "볼리비아", flag: "🇧🇴", continent: "america" },
    { name: "브라질", flag: "🇧🇷", continent: "america" },
    { name: "세인트루시아", flag: "🇱🇨", continent: "america" },
    { name: "세인트빈센트 그레나딘", flag: "🇻🇨", continent: "america" },
    { name: "세인트키츠 네비스", flag: "🇰🇳", continent: "america" },
    { name: "수리남", flag: "🇸🇷", continent: "america" },
    { name: "아르헨티나", flag: "🇦🇷", continent: "america" },
    { name: "아이티", flag: "🇭🇹", continent: "america" },
    { name: "앤티가 바부다", flag: "🇦🇬", continent: "america" },
    { name: "에콰도르", flag: "🇪🇨", continent: "america" },
    { name: "엘살바도르", flag: "🇸🇻", continent: "america" },
    { name: "온두라스", flag: "🇭🇳", continent: "america" },
    { name: "우루과이", flag: "🇺🇾", continent: "america" },
    { name: "자메이카", flag: "🇯🇲", continent: "america" },
    { name: "캐나다", flag: "🇨🇦", continent: "america" },
    { name: "코스타리카", flag: "🇨🇷", continent: "america" },
    { name: "콜롬비아", flag: "🇨🇴", continent: "america" },
    { name: "쿠바", flag: "🇨🇺", continent: "america" },
    { name: "트리니다드 토바고", flag: "🇹🇹", continent: "america" },
    { name: "파나마", flag: "🇵🇦", continent: "america" },
    { name: "파라과이", flag: "🇵🇾", continent: "america" },
    { name: "페루", flag: "🇵🇪", continent: "america" },
    { name: "칠레", flag: "🇨🇱", continent: "america" },

    // =========================
    // 오세아니아
    // =========================
    { name: "나우루", flag: "🇳🇷", continent: "oceania" },
    { name: "뉴질랜드", flag: "🇳🇿", continent: "oceania" },
    { name: "마셜 제도", flag: "🇲🇭", continent: "oceania" },
    { name: "미크로네시아", flag: "🇫🇲", continent: "oceania" },
    { name: "바누아투", flag: "🇻🇺", continent: "oceania" },
    { name: "사모아", flag: "🇼🇸", continent: "oceania" },
    { name: "솔로몬 제도", flag: "🇸🇧", continent: "oceania" },
    { name: "키리바시", flag: "🇰🇮", continent: "oceania" },
    { name: "통가", flag: "🇹🇴", continent: "oceania" },
    { name: "투발루", flag: "🇹🇻", continent: "oceania" },
    { name: "파푸아뉴기니", flag: "🇵🇬", continent: "oceania" },
    { name: "팔라우", flag: "🇵🇼", continent: "oceania" },
    { name: "피지", flag: "🇫🇯", continent: "oceania" },
    { name: "호주", flag: "🇦🇺", continent: "oceania" },

    // =========================
    // 아프리카
    // =========================
    { name: "가나", flag: "🇬🇭", continent: "africa" },
    { name: "가봉", flag: "🇬🇦", continent: "africa" },
    { name: "감비아", flag: "🇬🇲", continent: "africa" },
    { name: "기니", flag: "🇬🇳", continent: "africa" },
    { name: "기니비사우", flag: "🇬🇼", continent: "africa" },
    { name: "나미비아", flag: "🇳🇦", continent: "africa" },
    { name: "나이지리아", flag: "🇳🇬", continent: "africa" },
    { name: "남수단", flag: "🇸🇸", continent: "africa" },
    { name: "남아프리카공화국", flag: "🇿🇦", continent: "africa" },
    { name: "니제르", flag: "🇳🇪", continent: "africa" },
    { name: "라이베리아", flag: "🇱🇷", continent: "africa" },
    { name: "레소토", flag: "🇱🇸", continent: "africa" },
    { name: "르완다", flag: "🇷🇼", continent: "africa" },
    { name: "리비아", flag: "🇱🇾", continent: "africa" },
    { name: "마다가스카르", flag: "🇲🇬", continent: "africa" },
    { name: "말라위", flag: "🇲🇼", continent: "africa" },
    { name: "말리", flag: "🇲🇱", continent: "africa" },
    { name: "모로코", flag: "🇲🇦", continent: "africa" },
    { name: "모리셔스", flag: "🇲🇺", continent: "africa" },
    { name: "모리타니", flag: "🇲🇷", continent: "africa" },
    { name: "모잠비크", flag: "🇲🇿", continent: "africa" },
    { name: "베냉", flag: "🇧🇯", continent: "africa" },
    { name: "보츠와나", flag: "🇧🇼", continent: "africa" },
    { name: "부룬디", flag: "🇧🇮", continent: "africa" },
    { name: "부르키나파소", flag: "🇧🇫", continent: "africa" },
    { name: "상투메 프린시페", flag: "🇸🇹", continent: "africa" },
    { name: "세네갈", flag: "🇸🇳", continent: "africa" },
    { name: "세이셸", flag: "🇸🇨", continent: "africa" },
    { name: "소말리아", flag: "🇸🇴", continent: "africa" },
    { name: "수단", flag: "🇸🇩", continent: "africa" },
    { name: "시에라리온", flag: "🇸🇱", continent: "africa" },
    { name: "알제리", flag: "🇩🇿", continent: "africa" },
    { name: "앙골라", flag: "🇦🇴", continent: "africa" },
    { name: "에스와티니", flag: "🇸🇿", continent: "africa" },
    { name: "에티오피아", flag: "🇪🇹", continent: "africa" },
    { name: "에리트레아", flag: "🇪🇷", continent: "africa" },
    { name: "우간다", flag: "🇺🇬", continent: "africa" },
    { name: "이집트", flag: "🇪🇬", continent: "africa" },
    { name: "잠비아", flag: "🇿🇲", continent: "africa" },
    { name: "적도 기니", flag: "🇬🇶", continent: "africa" },
    { name: "중앙아프리카공화국", flag: "🇨🇫", continent: "africa" },
    { name: "지부티", flag: "🇩🇯", continent: "africa" },
    { name: "짐바브웨", flag: "🇿🇼", continent: "africa" },
    { name: "차드", flag: "🇹🇩", continent: "africa" },
    { name: "카메룬", flag: "🇨🇲", continent: "africa" },
    { name: "카보베르데", flag: "🇨🇻", continent: "africa" },
    { name: "케냐", flag: "🇰🇪", continent: "africa" },
    { name: "코모로", flag: "🇰🇲", continent: "africa" },
    { name: "코트디부아르", flag: "🇨🇮", continent: "africa" },
    { name: "콩고 공화국", flag: "🇨🇬", continent: "africa" },
    { name: "콩고민주공화국", flag: "🇨🇩", continent: "africa" },
    { name: "탄자니아", flag: "🇹🇿", continent: "africa" },
    { name: "토고", flag: "🇹🇬", continent: "africa" },
    { name: "튀니지", flag: "🇹🇳", continent: "africa" }
];

    /* =========================================================
   국기 이모지 → ISO 국가코드 변환
   예: 🇰🇷 → kr / 🇯🇵 → jp / 🇺🇸 → us
========================================================= */

function flagToCountryCode(flag) {

    if (!flag) {
        return "";
    }

    const codePoints = [...flag]
        .map(char => char.codePointAt(0));

    if (codePoints.length !== 2) {
        return "";
    }

    return codePoints
        .map(code => String.fromCharCode(code - 127397))
        .join("")
        .toLowerCase();
}


/* =========================================================
   2. 상태값
========================================================= */

let travelPlaces = [];

let selectedCountry = null;

let selectedContinent = "all";

let searchKeyword = "";


/* =========================================================
   3. DOM
========================================================= */

const countryList =
    document.getElementById("countryList");

const countrySearch =
    document.getElementById("countrySearch");

const destinationGrid =
    document.getElementById("destinationGrid");

const destinationCount =
    document.getElementById("destinationCount");

const selectedCountryFlag =
    document.getElementById("selectedCountryFlag");

const selectedCountryName =
    document.getElementById("selectedCountryName");

const selectedCountryDescription =
    document.getElementById("selectedCountryDescription");

const emptyState =
    document.getElementById("emptyState");

const continentButtons =
    document.querySelectorAll(".continent-btn");


/* =========================================================
   4. 서버에서 여행지 가져오기
========================================================= */

async function loadTravelPlaces() {

    try {

        /*
            팀에서 만든 TravelPlace API.

            a1_mapmain_views.py에 있는:

            @bp.route('/places')

            때문에 주소는 /first/places
        */

        const response =
            await fetch("/first/places");


        if (!response.ok) {

            throw new Error(
                `여행지 데이터를 불러오지 못했습니다. (${response.status})`
            );

        }


        travelPlaces =
            await response.json();


        console.log(
            "여행지 DB 데이터:",
            travelPlaces
        );


        renderCountryList();

        renderDestinations();


    } catch (error) {

        console.error(
            "여행지 불러오기 실패:",
            error
        );


        /*
            API 오류가 나더라도
            국가 선택 UI 자체는 표시
        */

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

        normalizeCountry(place.country) ===
        normalizeCountry(countryName)

    ).length;

}


/* =========================================================
   6. 국가명 통일
========================================================= */

function normalizeCountry(country) {

    if (!country) {
        return "";
    }


    const value =
        String(country).trim();


    const countryAliases = {

        "한국": "대한민국",
        "대한민국": "대한민국",
        "Korea": "대한민국",
        "South Korea": "대한민국",
        "Republic of Korea": "대한민국",

        "일본": "일본",
        "Japan": "일본",

        "베트남": "베트남",
        "Vietnam": "베트남",

        "태국": "태국",
        "Thailand": "태국",

        "미국": "미국",
        "USA": "미국",
        "United States": "미국",
        "United States of America": "미국",

        "캐나다": "캐나다",
        "Canada": "캐나다",

        "호주": "호주",
        "Australia": "호주",

        "프랑스": "프랑스",
        "France": "프랑스",

        "이탈리아": "이탈리아",
        "Italy": "이탈리아",

        "스위스": "스위스",
        "Switzerland": "스위스",

        "싱가포르": "싱가포르",
        "Singapore": "싱가포르"

    };


    return countryAliases[value] || value;

}


/* =========================================================
   7. 국가 목록 출력
========================================================= */

/* =========================================================
   7. 국가 목록 출력
========================================================= */

function renderCountryList() {

    if (!countryList) {
        return;
    }

    countryList.innerHTML = "";

    // 대륙 + 검색어로 국가 필터링
    const filteredCountries = countries
        .filter(country => {

            const continentMatch =
                selectedContinent === "all" ||
                country.continent === selectedContinent;

            const searchMatch =
                country.name
                    .toLowerCase()
                    .includes(searchKeyword.toLowerCase());

            return continentMatch && searchMatch;
        })
        .sort((a, b) =>
            a.name.localeCompare(b.name, "ko")
        );

    console.log("국가 개수:", filteredCountries.length);

    // 국가 버튼 생성
    filteredCountries.forEach(country => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.className = "country-item";


        // 현재 선택된 국가
        if (selectedCountry === country.name) {
            button.classList.add("active");
        }


        // 해당 국가에 등록된 여행지 개수
        const count =
            getCountryCount(country.name);


        button.innerHTML = `

            <span class="country-flag">
                <img
                src="https://flagcdn.com/w40/${flagToCountryCode(country.flag)}.png"
                alt="${country.name} 국기"
                loading="lazy"
                >
            </span>

            <span class="country-name">
                ${country.name}
            </span>

            <span class="country-count">
                ${count}
            </span>

        `;


        // 국가 선택
        button.addEventListener(
            "click",
            () => {
                selectCountry(country.name);
            }
        );


        countryList.appendChild(button);

    });


    // 검색 결과 없음
    if (filteredCountries.length === 0) {

        countryList.innerHTML = `

            <div style="
                padding: 40px 15px;
                text-align: center;
                color: #9aa4b1;
                font-size: 12px;
            ">
                검색 결과가 없습니다.
            </div>

        `;

    }

}


/* =========================================================
   8. 국가 선택
========================================================= */

function selectCountry(countryName) {

    selectedCountry =
        countryName;


    renderCountryList();

    renderDestinations();

}


/* =========================================================
   9. 여행지 출력
========================================================= */

function renderDestinations() {

    if (!destinationGrid) {
        return;
    }


    destinationGrid.innerHTML = "";


    let filteredPlaces =
        travelPlaces;


    /*
        국가를 선택했다면 해당 국가만
    */

    if (selectedCountry) {

        filteredPlaces =
            travelPlaces.filter(place =>

                normalizeCountry(
                    place.country
                ) ===
                normalizeCountry(
                    selectedCountry
                )

            );

    }


    updateSelectedCountryHeader(
        filteredPlaces.length
    );


    /*
        여행지가 없는 경우
    */

    if (
        filteredPlaces.length === 0
    ) {

        destinationGrid.style.display =
            "none";


        if (emptyState) {

            emptyState.style.display =
                "block";

        }


        return;

    }


    destinationGrid.style.display =
        "grid";


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    filteredPlaces.forEach(place => {

        const card =
            createDestinationCard(
                place
            );


        destinationGrid.appendChild(
            card
        );

    });

}


/* =========================================================
   10. 여행지 카드 생성
========================================================= */

function createDestinationCard(place) {

    const card =
        document.createElement("article");


    card.className =
        "destination-card";


    /*
        DB에서 image 필드가 아직 없다면
        기존에 저장했던 이미지 이름을
        여행지 이름으로 연결
    */

    const imagePath =
        getPlaceImage(place);


    const countryName =
        normalizeCountry(
            place.country
        );


    const region =
        place.region || "";


    const placeName =
        place.place ||
        "여행지";


    card.innerHTML = `

        <div class="card-image">

            <img
                src="${imagePath}"
                alt="${placeName}"
                onerror="
                    this.onerror=null;
                    this.src='/static/images/trip/default.png';
                "
            >

            <span class="country-badge">
                ${countryName}
            </span>

        </div>


        <div class="card-content">

            <div class="card-location">
                ${region}
            </div>


            <h3 class="card-title">
                ${placeName}
            </h3>


            <p class="card-description">
                ${getPlaceDescription(place)}
            </p>


            <div class="card-bottom">

                <span class="like">
                    ♡ ${getPlaceLikes(place)}
                </span>


                <span class="detail-text">
                    자세히 보기 →
                </span>

            </div>

        </div>

    `;


    return card;

}


/* =========================================================
   11. 여행지 이미지 연결
========================================================= */

function getPlaceImage(place) {

    const name =
        String(
            place.place || ""
        )
        .replace(/\s/g, "")
        .toLowerCase();


    /*
        지금까지 우리가 저장한 이미지와 연결.

        실제 파일명과 다르면
        여기 파일명만 수정하면 됨.
    */

    const imageMap = {

        /* 대한민국 */

        "경복궁":
            "/static/images/trip/gyeongbokgung.png",

        "남산서울타워":
            "/static/images/trip/namsan.png",

        "수원화성":
            "/static/images/trip/suwon.png",

        "두물머리":
            "/static/images/trip/dumulmeori.png",

        "강릉경포해변":
            "/static/images/trip/gangneung.png",

        "설악산":
            "/static/images/trip/seoraksan.png",

        "단양도담삼봉":
            "/static/images/trip/dodamsambong.png",

        "공주공산성":
            "/static/images/trip/gongsanseong.png",

        "전주한옥마을":
            "/static/images/trip/jeonju.png",

        "제주도":
            "/static/images/trip/jeju.png",


        /* 일본 */

        "후지산":
            "/static/images/trip/fuji.png",

        "도쿄":
            "/static/images/trip/tokyo.png",

        "오사카":
            "/static/images/trip/osaka.png",


        /* 베트남 */

        "다낭":
            "/static/images/trip/danang.png",


        /* 싱가포르 */

        "마리나베이":
            "/static/images/trip/singapore.png",

        "마리나베이샌즈":
            "/static/images/trip/singapore.png",


        /* 미국 */

        "뉴욕":
            "/static/images/trip/newyork.png",


        /* 호주 */

        "시드니":
            "/static/images/trip/sydney.png",


        /* 스위스 */

        "인터라켄":
            "/static/images/trip/interlaken.png"

    };


    /*
        매칭되는 이미지가 있으면 사용
    */

    if (imageMap[name]) {

        return imageMap[name];

    }


    /*
        이미지가 없으면 기본 이미지
    */

    return "/static/images/trip/default.png";

}


/* =========================================================
   12. 설명
========================================================= */

function getPlaceDescription(place) {

    /*
        API에서 description을 보내주게 되면
        자동으로 DB 설명 사용
    */

    if (place.description) {

        return place.description;

    }


    /*
        현재 API에 설명이 없다면 임시 문구
    */

    const region =
        place.region || "";


    if (region) {

        return `${region}에서 만나볼 수 있는 특별한 여행지입니다.`;

    }


    return "어딧세이에서 추천하는 특별한 여행지입니다.";

}


/* =========================================================
   13. 좋아요
========================================================= */

function getPlaceLikes(place) {

    /*
        나중에 DB likes 필드가 들어오면 사용
    */

    if (
        place.likes !== undefined &&
        place.likes !== null
    ) {

        return place.likes;

    }


    return 0;

}


/* =========================================================
   14. 선택 국가 HEADER
========================================================= */

function updateSelectedCountryHeader(
    count
) {

    if (destinationCount) {

        destinationCount.textContent =
            count;

    }


    /*
        전체 여행지
    */

    if (!selectedCountry) {

        if (selectedCountryFlag) {

            selectedCountryFlag.textContent =
                "🌏";

        }


        if (selectedCountryName) {

            selectedCountryName.textContent =
                "전체 여행지";

        }


        if (selectedCountryDescription) {

            selectedCountryDescription.textContent =
                "다양한 나라의 여행지를 둘러보세요.";

        }


        return;

    }


    /*
        선택한 국가 찾기
    */

    const country =
        countries.find(item =>

            item.name ===
            selectedCountry

        );


    if (selectedCountryFlag) {

    if (country) {

        const countryCode =
            flagToCountryCode(country.flag);

        selectedCountryFlag.innerHTML = `
            <img
                src="https://flagcdn.com/w80/${countryCode}.png"
                alt="${country.name} 국기"
            >
        `;

    } else {

        selectedCountryFlag.textContent = "🌏";

    }

}


    if (selectedCountryName) {

        selectedCountryName.textContent =
            selectedCountry;

    }


    if (selectedCountryDescription) {

        selectedCountryDescription.textContent =
            `${selectedCountry}에서 등록된 여행지를 둘러보세요.`;

    }

}


/* =========================================================
   15. 국가 검색
========================================================= */

if (countrySearch) {

    countrySearch.addEventListener(
        "input",
        event => {

            searchKeyword =
                event.target.value.trim();


            renderCountryList();

        }
    );

}


/* =========================================================
   16. 대륙 필터
========================================================= */

continentButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {


                selectedContinent =
                    button.dataset.continent;


                /*
                    active 제거
                */

                continentButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                /*
                    클릭한 버튼 active
                */

                button.classList.add(
                    "active"
                );


                renderCountryList();

            }
        );

    }
);


/* =========================================================
   17. 페이지 시작
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "어딧세이 trip_list.js 연결 성공!"
        );


        /*
            국가 목록 먼저 표시
        */

        renderCountryList();


        /*
            DB 여행지 불러오기
        */

        loadTravelPlaces();

    }
);