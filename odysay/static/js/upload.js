document.addEventListener("DOMContentLoaded", function () {

    // 국가 선택
    const countrySelect = document.querySelector('#country');

    countries.forEach(function(country) {
        const option = document.createElement('option');

        option.value = country;
        option.textContent = country;

        countrySelect.appendChild(option);
    });


    // 기타 카테고리
    const etcCheckbox = document.querySelector('#etc');
    const etcInputBox = document.querySelector('#etc-input-box');

    etcCheckbox.addEventListener('change', function() {
        if (this.checked) {
            etcInputBox.style.display = 'block';
        } else {
            etcInputBox.style.display = 'none';
        }
    });

    // 글자 수

    const intro = document.getElementById("intro");
    const introCount = document.getElementById("introCount");

    const reason = document.getElementById("reason");
    const reasonCount = document.getElementById("reasonCount");


    intro.addEventListener("input", function () {
        introCount.textContent = intro.value.length;
    });


    reason.addEventListener("input", function () {
        reasonCount.textContent = reason.value.length;
    });

    // 사진

    const photos = document.getElementById("photos");

    const previewContainer =
        document.getElementById("previewContainer");


    photos.addEventListener("change", function () {

        previewContainer.innerHTML = "";

        const files = Array.from(photos.files);


        if (files.length > 10) {

            alert("사진은 최대 10장까지 등록할 수 있습니다.");

            photos.value = "";

            return;
        }


        files.forEach(function (file) {

            const reader = new FileReader();


            reader.onload = function (event) {

                const previewItem =
                    document.createElement("div");

                previewItem.classList.add("preview-item");


                const image =
                    document.createElement("img");

                image.src = event.target.result;


                const removeButton =
                    document.createElement("button");

                removeButton.type = "button";

                removeButton.classList.add("remove-photo");

                removeButton.textContent = "×";


                removeButton.addEventListener(
                    "click",
                    function () {

                        previewItem.remove();

                    }
                );


                previewItem.appendChild(image);

                previewItem.appendChild(removeButton);

                previewContainer.appendChild(previewItem);

            };


            reader.readAsDataURL(file);

        });

    });

    // 등록 버튼

    const travelForm =
        document.getElementById("travelForm");


    travelForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const agree =
            document.getElementById("agree");


        if (!agree.checked) {

            alert("등록 가이드라인에 동의해주세요.");

            return;

        }


        alert("여행지 등록 정보를 확인했습니다!");

    });

});