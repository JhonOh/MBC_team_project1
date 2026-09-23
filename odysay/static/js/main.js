console.log("어딧세이 main.js 연결 성공!");
// ========================================
// 어딧세이 실시간 핫플 데이터
// ========================================

const hotPlaceData = {

    // 오늘
    today: [
        {
            country: "🇯🇵 일본",
            name: "후지산",
            location: "야마나시현",
            score: "9,842",
            image: "/static/images/hot/fuji.png",
        },
        {
            country: "🇹🇭 태국",
            name: "푸껫",
            location: "푸껫주",
            score: "8,736",
            image: "/static/images/hot/phuket.png"
        },
        {
            country: "🇫🇷 프랑스",
            name: "에펠탑",
            location: "파리",
            score: "7,521",
            image: "/static/images/hot/paris.png"
        },
        {
            country: "🇬🇷 그리스",
            name: "산토리니",
            location: "티라",
            score: "6,904",
            image: "/static/images/hot/santorini.png"
        },
        {
            country: "🇺🇸 미국",
            name: "뉴욕 타임스퀘어",
            location: "뉴욕",
            score: "6,321",
            image: "/static/images/hot/newyork.png"
        }
    ],


    // 주간
    week: [
        {
            country: "🇫🇷 프랑스",
            name: "에펠탑",
            location: "파리",
            score: "48,215",
            image: "/static/images/hot/paris.png",
        },
        {
            country: "🇯🇵 일본",
            name: "후지산",
            location: "야마나시현",
            score: "45,782",
            image: "/static/images/hot/fuji.png",
        },
        {
            country: "🇺🇸 미국",
            name: "뉴욕 타임스퀘어",
            location: "뉴욕",
            score: "42,104",
            image: "/static/images/hot/newyork.png"
        },
        {
            country: "🇹🇭 태국",
            name: "푸껫",
            location: "푸껫주",
            score: "39,845",
            image: "/static/images/hot/phuket.png",
        },
        {
            country: "🇬🇷 그리스",
            name: "산토리니",
            location: "티라",
            score: "36,521",
            image: "/static/images/hot/santorini.png"
        }
    ],


    // 월간
    month: [
        {
            country: "🇬🇷 그리스",
            name: "산토리니",
            location: "티라",
            score: "184,210",
            image: "/static/images/hot/santorini.png"
        },
        {
            country: "🇫🇷 프랑스",
            name: "에펠탑",
            location: "파리",
            score: "172,845",
            image: "/static/images/hot/paris.png"
        },
        {
            country: "🇯🇵 일본",
            name: "후지산",
            location: "야마나시현",
            score: "165,742",
            image: "/static/images/hot/fuji.png",
        },
        {
            country: "🇺🇸 미국",
            name: "뉴욕 타임스퀘어",
            location: "뉴욕",
            score: "153,294",
            image: "/static/images/hot/newyork.png"
        },
        {
            country: "🇹🇭 태국",
            name: "푸껫",
            location: "푸껫주",
            score: "148,932",
            image: "/static/images/hot/phuket.png"
        }
    ]
};


// ========================================
// 카드 생성 함수
// ========================================

function renderHotPlaces(period) {

    const hotList = document.getElementById("hotList");

    const places = hotPlaceData[period];

    // 기존 카드 제거
    hotList.innerHTML = "";


    // 새로운 카드 생성
    places.forEach((place, index) => {

        const card = document.createElement("article");

        card.className = "hot-card";


        card.innerHTML = `
            <div class="hot-card-image">

                <span class="hot-rank rank-${index + 1}">
                ${index + 1}
                </span>

                <img
                    src="${place.image}"
                    alt="${place.name}"
                >

            </div>


            <div class="hot-card-content">

                <div class="hot-country">
                    ${place.country}
                </div>

                <h3>
                    ${place.name}
                </h3>

                <p class="hot-location">
                    ${place.location}
                </p>

                <div class="hot-score">

                    <span class="fire">
                        🔥
                    </span>

                    <span>
                        ${place.score}
                    </span>

                </div>

            </div>
        `;


        hotList.appendChild(card);

    });

}


// ========================================
// 오늘 / 주간 / 월간 버튼
// ========================================

const rankingButtons =
    document.querySelectorAll(".ranking-filter button");


rankingButtons.forEach(button => {

    button.addEventListener("click", function () {

        // 모든 버튼에서 active 제거
        rankingButtons.forEach(btn => {
            btn.classList.remove("active");
        });


        // 클릭한 버튼 활성화
        this.classList.add("active");


        // data-period 가져오기
        const period = this.dataset.period;


        // 해당 기간 여행지 출력
        renderHotPlaces(period);

    });

});


// ========================================
// 페이지 최초 실행
// ========================================

renderHotPlaces("today");