document.addEventListener("DOMContentLoaded", function () {

    /* =========================
       왼쪽 마이페이지 메뉴
    ========================== */

    const menuItems = document.querySelectorAll(".side-list a");

    menuItems.forEach(function (item) {

        item.addEventListener("click", function (event) {

            // 기존 active 제거
            menuItems.forEach(function (menu) {
                menu.classList.remove("active");
            });

            // 클릭한 메뉴 active
            this.classList.add("active");

        });

    });


    /* =========================
       프로필 수정 버튼
    ========================== */

    const profileButton =
        document.querySelector(".profile-btn");

    if (profileButton) {

        profileButton.addEventListener("click", function () {

            alert("프로필 수정 페이지로 이동합니다.");

        });

    }


    /* =========================
       검색 버튼
    ========================== */

    const searchButton =
        document.querySelector(".search-btn");

    if (searchButton) {

        searchButton.addEventListener("click", function () {

            alert("검색 기능을 준비 중입니다.");

        });

    }

});