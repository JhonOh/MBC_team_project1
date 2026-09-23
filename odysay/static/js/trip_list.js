document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       요소
    ========================== */

    const cards = Array.from(
        document.querySelectorAll(".travel-card")
    );

    const searchInput =
        document.querySelector("#travelSearch");

    const searchBtn =
        document.querySelector("#searchBtn");

    const sortSelect =
        document.querySelector("#sortSelect");

    const noResult =
        document.querySelector("#noResult");

    const areaTabs =
        document.querySelectorAll(".area-tab");

    const countryButtons =
        document.querySelectorAll(".country-btn");

    const pageButtons =
        document.querySelectorAll(
            ".page-number"
        );

    const prevButton =
        document.querySelector(
            '.page-arrow[data-page="prev"]'
        );

    const nextButton =
        document.querySelector(
            '.page-arrow[data-page="next"]'
        );


    /* =========================
       상태
    ========================== */

    let currentArea = "all";
    let currentCountry = "all";
    let currentPage = 1;

    const cardsPerPage = 6;


    /* =========================
       카드 필터링
    ========================== */

    function getFilteredCards() {

        const keyword =
            searchInput.value
                .trim()
                .toLowerCase();


        return cards.filter(function (card) {

            const name =
                card.dataset.name.toLowerCase();

            const country =
                card.dataset.country.toLowerCase();

            const area =
                card.dataset.area;


            /* 검색 */

            const matchSearch =
                keyword === "" ||
                name.includes(keyword) ||
                country.includes(keyword);


            /* 국내 / 해외 */

            let matchArea = true;

            if (currentArea === "overseas") {
                matchArea =
                    area === "overseas";
            }


            /* 국가 */

            let matchCountry = true;

            if (currentCountry !== "all") {

                matchCountry =
                    country.includes(
                        currentCountry.toLowerCase()
                    );
            }


            return (
                matchSearch &&
                matchArea &&
                matchCountry
            );

        });

    }


    /* =========================
       정렬
    ========================== */

    function sortCards(cardList) {

        const sortType =
            sortSelect.value;

        const sorted =
            [...cardList];


        if (sortType === "popular") {

            sorted.sort(function (a, b) {

                return (
                    Number(b.dataset.likes) -
                    Number(a.dataset.likes)
                );

            });

        }


        else if (sortType === "name") {

            sorted.sort(function (a, b) {

                return a.dataset.name.localeCompare(
                    b.dataset.name,
                    "ko"
                );

            });

        }


        else if (sortType === "latest") {

            /*
                실제 DB를 사용할 경우
                data-date 값을 추가해서
                여기서 날짜순으로 정렬하면 됨.
            */

            sorted.reverse();

        }


        return sorted;

    }


    /* =========================
       화면 갱신
    ========================== */

    function renderCards() {

        let filteredCards =
            getFilteredCards();

        filteredCards =
            sortCards(filteredCards);


        /* 기존 카드 숨기기 */

        cards.forEach(function (card) {

            card.style.display = "none";

        });


        /* 결과 없음 */

        if (filteredCards.length === 0) {

            noResult.style.display = "block";

            updatePagination(0);

            return;

        }

        noResult.style.display = "none";


        /* 페이지 계산 */

        const start =
            (currentPage - 1) *
            cardsPerPage;

        const end =
            start + cardsPerPage;


        const pageCards =
            filteredCards.slice(
                start,
                end
            );


        /* 카드 표시 */

        pageCards.forEach(function (card) {

            card.style.display = "block";

        });


        updatePagination(
            filteredCards.length
        );

    }


    /* =========================
       페이지네이션
    ========================== */

    function updatePagination(totalCount) {

        const totalPages =
            Math.max(
                1,
                Math.ceil(
                    totalCount /
                    cardsPerPage
                )
            );


        pageButtons.forEach(function (button) {

            const page =
                Number(
                    button.dataset.page
                );


            button.style.display =
                page <= totalPages
                    ? "inline-block"
                    : "none";


            button.classList.toggle(
                "active",
                page === currentPage
            );

        });


        prevButton.style.visibility =
            currentPage > 1
                ? "visible"
                : "hidden";


        nextButton.style.visibility =
            currentPage < totalPages
                ? "visible"
                : "hidden";

    }


    /* =========================
       검색
    ========================== */

    function search() {

        currentPage = 1;

        renderCards();

    }


    searchBtn.addEventListener(
        "click",
        search
    );


    searchInput.addEventListener(
        "keyup",
        function (event) {

            if (event.key === "Enter") {

                search();

            }

        }
    );


    /* =========================
       정렬
    ========================== */

    sortSelect.addEventListener(
        "change",
        function () {

            currentPage = 1;

            renderCards();

        }
    );


    /* =========================
       국내 / 해외
    ========================== */

    areaTabs.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                areaTabs.forEach(
                    function (tab) {

                        tab.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentArea =
                    button.dataset.area;


                currentPage = 1;

                renderCards();

            }
        );

    });


    /* =========================
       국가 필터
    ========================== */

    countryButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    countryButtons.forEach(
                        function (btn) {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentCountry =
                        button.dataset.country;


                    currentPage = 1;

                    renderCards();

                }
            );

        }
    );


    /* =========================
       페이지 버튼
    ========================== */

    pageButtons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    currentPage =
                        Number(
                            button.dataset.page
                        );

                    renderCards();

                }
            );

        }
    );


    /* =========================
       이전
    ========================== */

    prevButton.addEventListener(
        "click",
        function () {

            if (currentPage > 1) {

                currentPage--;

                renderCards();

            }

        }
    );


    /* =========================
       다음
    ========================== */

    nextButton.addEventListener(
        "click",
        function () {

            const filteredCards =
                getFilteredCards();

            const totalPages =
                Math.ceil(
                    filteredCards.length /
                    cardsPerPage
                );


            if (currentPage < totalPages) {

                currentPage++;

                renderCards();

            }

        }
    );


    /* =========================
       카드 클릭
    ========================== */

    cards.forEach(function (card) {

        card.addEventListener(
            "click",
            function () {

                const name =
                    card.dataset.name;

                console.log(
                    "선택한 여행지:",
                    name
                );

                /*
                 * 나중에 Flask 연결 시
                 *
                 * location.href =
                 * "/travel/detail/" + id;
                 *
                 * 형태로 변경하면 됨.
                 */

            }
        );

    });


    /* =========================
       최초 실행
    ========================== */

    renderCards();

});