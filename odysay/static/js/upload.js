document.addEventListener("DOMContentLoaded", function () {

    // 등록 가이드 확인 여부
    let guideChecked = false;

    // 메뉴 요소
    const uploadMenu = document.getElementById("uploadMenu");
    const guideMenu = document.getElementById("guideMenu");

    const uploadContent = document.getElementById("uploadContent");
    const guideContent = document.getElementById("guideContent");

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


        // 4. 사진 선택 / 추가 / 삭제
        const photosInput = document.getElementById("photos");
        const previewContainer = document.getElementById("previewContainer");

        // 선택한 사진들을 계속 저장
        let selectedPhotos = [];


        // input의 실제 파일 목록 업데이트
        function updatePhotoInput() {

            const dataTransfer = new DataTransfer();

            selectedPhotos.forEach(function(file) {
                dataTransfer.items.add(file);
            });

            photosInput.files = dataTransfer.files;
        }


        // 사진 미리보기 다시 그리기
        function renderPhotoPreview() {

            previewContainer.innerHTML = "";


            selectedPhotos.forEach(function(file, index) {

                const reader = new FileReader();


                reader.onload = function(event) {

                    const previewItem =
                        document.createElement("div");

                    previewItem.classList.add("preview-item");


                    // 사진
                    const image =
                        document.createElement("img");

                    image.src = event.target.result;
                    image.alt = file.name;


                    // 삭제 버튼
                    const removeButton =
                        document.createElement("button");

                    removeButton.type = "button";
                    removeButton.classList.add("remove-photo");
                    removeButton.textContent = "×";


                    // 사진 한 장 삭제
                    removeButton.addEventListener("click", function() {

                        selectedPhotos.splice(index, 1);

                        updatePhotoInput();

                        renderPhotoPreview();

                    });


                    previewItem.appendChild(image);
                    previewItem.appendChild(removeButton);

                    previewContainer.appendChild(previewItem);

                };


                reader.readAsDataURL(file);

            });
        }


        if (photosInput && previewContainer) {

            photosInput.addEventListener("change", function() {

                // 이번에 새로 선택한 사진
                const newFiles =
                    Array.from(photosInput.files);


                // 기존 사진 + 새 사진이 10장을 넘는지 확인
                if (selectedPhotos.length + newFiles.length > 10) {

                    alert("사진은 최대 10장까지 등록할 수 있습니다.");

                    updatePhotoInput();

                    return;
                }


                // 새로 선택한 사진 추가
                newFiles.forEach(function(file) {

                    selectedPhotos.push(file);

                });


                // 실제 input 파일 목록 업데이트
                updatePhotoInput();


                // 미리보기 다시 표시
                renderPhotoPreview();

            });

        }


    // 5. 폼 전송
    const travelForm = document.getElementById("travelForm");

    if (travelForm) {

        travelForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const agree = document.getElementById("agree");

             // 1. 등록 가이드를 아직 확인하지 않았을 때
            if (!guideChecked) {

                alert("여행지를 등록하기 전에 등록 가이드를 확인해주세요.");

                // 등록 가이드 보여주기
                uploadContent.style.display = "none";
                guideContent.style.display = "block";

                guideMenu.classList.add("selected");
                uploadMenu.classList.remove("selected");

                // 가이드 맨 위로 이동
                guideContent.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

                return;
            }


            // 2. 가이드는 봤지만 동의 체크 안 했을 때
            if (!agree || !agree.checked) {

                alert("등록 가이드라인에 동의해주세요.");

                agree.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                return;
            }

            const formData = new FormData(travelForm);

            const submitButton = travelForm.querySelector('[type="submit"]');
            submitButton.disabled = true;
            fetch(travelForm.action, { method: 'POST', body: formData })
                .then(async response => {
                    if (!response.ok) {
                        let data = {};
                        try { data = await response.json(); } catch (_) {}
                        throw new Error(data.error || '등록에 실패했습니다. 입력값을 확인해 주세요.');
                    }
                    if (response.redirected) window.location.href = response.url;
                })
                .catch(error => alert(error.message))
                .finally(() => { submitButton.disabled = false; });
        });
    }

    // 메뉴 전환
    uploadMenu.addEventListener("click", function(event) {
        event.preventDefault();

        uploadContent.style.display = "block";
        guideContent.style.display = "none";

        uploadMenu.classList.add("selected");
        guideMenu.classList.remove("selected");
    });

    guideMenu.addEventListener("click", function(event) {
        event.preventDefault();

        uploadContent.style.display = "none";
        guideContent.style.display = "block";

        guideMenu.classList.add("selected");
        uploadMenu.classList.remove("selected");
    });
    // 등록 가이드 확인 완료
    const guideConfirmButton =
        document.getElementById("guideConfirmButton");

    if (guideConfirmButton) {

        guideConfirmButton.addEventListener("click", function() {

            guideChecked = true;

            // 등록 화면으로 돌아가기
            guideContent.style.display = "none";
            uploadContent.style.display = "block";

            uploadMenu.classList.add("selected");
            guideMenu.classList.remove("selected");

            // 동의 체크박스로 이동
            document.getElementById("agree").scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    }
});