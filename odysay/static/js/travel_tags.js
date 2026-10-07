document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".travel-tag-fields").forEach(function (group) {
        const checkboxes = group.querySelectorAll(
            'input[name="travel_tags"]'
        );
        const message = group.querySelector(".travel-tag-message");

        checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener("change", function () {
                const selectedCount = group.querySelectorAll(
                    'input[name="travel_tags"]:checked'
                ).length;

                if (selectedCount > 3) {
                    checkbox.checked = false;
                    message.textContent =
                        "여행 스타일은 최대 3개까지 선택할 수 있습니다.";
                    return;
                }

                message.textContent = "";
            });
        });
    });
});