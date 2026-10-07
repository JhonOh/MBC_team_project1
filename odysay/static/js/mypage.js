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

    /* =========================
       검색 버튼
    ========================== */



});