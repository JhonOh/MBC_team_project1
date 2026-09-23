document.addEventListener("DOMContentLoaded", function () {

    // 1. 국가 목록 생성
    const countrySelect = document.getElementById("country");

    if (countrySelect && typeof countries !== "undefined") {
        countries.forEach(function (country) {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }


    // 2. 기타 카테고리 선택
    const etcCheckbox = document.getElementById("etc");
    const etcInputBox = document.getElementById("etc-input-box");

    if (etcCheckbox && etcInputBox) {
        etcCheckbox.addEventListener("change", function () {
            if (this.checked) {
                etcInputBox.style.display = "block";
            } else {
                etcInputBox.style.display = "none";
            }
        });
    }


    // 3. 글자 수 카운터
    const intro = document.getElementById("intro");
    const introCount = document.getElementById("introCount");

    const reason = document.getElementById("reason");
    const reasonCount = document.getElementById("reasonCount");

    if (intro && introCount) {
        intro.addEventListener("input", function () {
            introCount.textContent = intro.value.length;
        });
    }

    if (reason && reasonCount) {
        reason.addEventListener("input", function () {
            reasonCount.textContent = reason.value.length;
        });
    }


    // 4. 사진 미리보기
    const photosInput = document.getElementById("photos");
    const previewContainer = document.getElementById("previewContainer");

    if (photosInput && previewContainer) {

        photosInput.addEventListener("change", function () {

            previewContainer.innerHTML = "";

            const files = Array.from(photosInput.files);

            // 최대 10장 제한
            if (files.length > 10) {
                alert("사진은 최대 10장까지 등록할 수 있습니다.");
                photosInput.value = "";
                return;
            }

            files.forEach(function (file) {

                const reader = new FileReader();

                reader.onload = function (event) {

                    const previewItem = document.createElement("div");
                    previewItem.classList.add("preview-item");

                    const image = document.createElement("img");

                    image.src = event.target.result;
                    image.style.width = "100px";
                    image.style.height = "100px";
                    image.style.objectFit = "cover";
                    image.style.borderRadius = "6px";
                    image.style.marginRight = "8px";

                    previewItem.appendChild(image);
                    previewContainer.appendChild(previewItem);
                };

                reader.readAsDataURL(file);
            });
        });
    }


    // 5. 폼 전송
    const travelForm = document.getElementById("travelForm");

    if (travelForm) {

        travelForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const agree = document.getElementById("agree");

            // 가이드라인 동의 여부 확인
            if (!agree || !agree.checked) {
                alert("등록 가이드라인에 동의해주세요.");
                return;
            }

            const formData = new FormData(travelForm);

            fetch(travelForm.action, {
                method: "POST",
                body: formData
            })
            .then(function (response) {

                if (response.redirected) {

                    window.location.href = response.url;

                } else {

                    return response.text().then(function (html) {
                        document.open();
                        document.write(html);
                        document.close();
                    });
                }
            })
            .catch(function (error) {

                console.error("Error:", error);
                alert("서버 전송 중 오류가 발생했습니다.");
            });
        });
    }

});