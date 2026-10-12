document.addEventListener("DOMContentLoaded", function () {
    const uiText = (key, values) => window.OdysayLanguage?.t?.(key, values) || key;

    // 수정 모드인지 확인
    const editMode =
        document.getElementById("editMode")?.value === "true";

    // 등록 가이드 확인 여부
    let guideChecked = editMode;

    // 메뉴 요소
    const uploadMenu = document.getElementById("uploadMenu");
    const guideMenu = document.getElementById("guideMenu");

    const uploadContent = document.getElementById("uploadContent");
    const guideContent = document.getElementById("guideContent");

    // 1. 국가 검색: shared picker keeps the submitted value canonical Korean.
    const countrySearch = document.getElementById("countrySearch");
    const countryInput = document.getElementById("country");
    const countryResults = document.getElementById("countryResults");

    // Gemini/표준 명칭 보정 헬퍼 함수
    function applyGeminiCanonicalization(inputValue, source = "input") {
        if (!inputValue || !inputValue.trim()) return "";

        const rawValue = inputValue.trim();
        let canonicalValue = rawValue;

        if (window.OdysayCountries && typeof window.OdysayCountries.canonicalize === "function") {
            canonicalValue = window.OdysayCountries.canonicalize(rawValue) || rawValue;
            console.log(`[Gemini AI Name Corrector] (${source}) Raw: "${rawValue}" -> Canonical: "${canonicalValue}"`);
        } else {
            console.warn(`[Gemini AI Name Corrector] OdysayCountries module not found. Using raw input: "${rawValue}"`);
        }

        return canonicalValue;
    }

    if (countrySearch && countryInput && countryResults && window.OdysayCountrySearch) {
        console.log("[Gemini AI] Initializing Country Search Component...");

        window.OdysayCountrySearch.create({
            input: countrySearch,
            results: countryResults,
            hiddenInput: countryInput,
            wrapper: ".country-search-wrapper",
            itemClass: "country-result-item",
            activeClass: "active",
            onSelect(country) {
                console.log(`[Gemini AI] Country selected from list: "${country}"`);
                const canonical = applyGeminiCanonicalization(country, "Select");
                countryInput.value = canonical;
                countrySearch.value = canonical;
            },
            onInput(country) {
                console.log(`[Gemini AI] User typing country: "${country}"`);
                const canonical = applyGeminiCanonicalization(country, "Type");
                countryInput.value = canonical || "";
            }
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


                // DB에 저장되어 있는 기존 메인 사진 개수
                const existingPhotoCount =
                    document.querySelectorAll("#existingPhotos .existing-photo").length;

                // 기존 DB 사진 + 이미 새로 선택한 사진 + 이번에 선택한 사진
                if (existingPhotoCount + selectedPhotos.length + newFiles.length > 10) {

                    alert(uiText('upload.photoLimit'));

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

        // 기존 DB 사진 삭제
        document.querySelectorAll(".remove-existing-photo").forEach(function(button) {

            button.addEventListener("click", function() {

                const previewItem = button.closest(".existing-photo");

                if (previewItem) {
                    previewItem.remove();
                }

            });

        });

        // 4-1. 주변 정보 사진 선택 / 추가 / 삭제
        function setupNearbyPhotos(inputId, previewId, existingContainerId) {

            const input = document.getElementById(inputId);
            const preview = document.getElementById(previewId);

            if (!input || !preview) {
                return;
            }

            let selectedFiles = [];

            // 실제 input의 파일 목록 업데이트
            function updateInput() {

                const dataTransfer = new DataTransfer();

                selectedFiles.forEach(function(file) {
                    dataTransfer.items.add(file);
                });

                input.files = dataTransfer.files;
            }


            // 미리보기 표시
            function renderPreview() {

                preview.innerHTML = "";

                selectedFiles.forEach(function(file, index) {

                    const reader = new FileReader();

                    reader.onload = function(event) {

                        const previewItem = document.createElement("div");
                        previewItem.classList.add("preview-item");

                        const image = document.createElement("img");
                        image.src = event.target.result;
                        image.alt = file.name;

                        const removeButton = document.createElement("button");

                        removeButton.type = "button";
                        removeButton.classList.add("remove-photo");
                        removeButton.textContent = "×";

                        // 사진 삭제
                        removeButton.addEventListener("click", function() {

                            selectedFiles.splice(index, 1);

                            updateInput();
                            renderPreview();
                        });

                        previewItem.appendChild(image);
                        previewItem.appendChild(removeButton);

                        preview.appendChild(previewItem);
                    };

                    reader.readAsDataURL(file);
                });
            }


            // 사진 선택
            input.addEventListener("change", function() {

                const newFiles = Array.from(input.files);

                // 기존 DB 사진 개수
                const existingPhotoCount =
                    document.querySelectorAll(
                        "#" + existingContainerId + " .existing-photo"
                    ).length;

                // 기존 DB 사진 + 새로 선택한 사진 = 최대 3장
                if (existingPhotoCount + selectedFiles.length + newFiles.length > 3) {

                    alert(uiText('upload.nearbyPhotoLimit'));

                    updateInput();

                    return;
                }

                newFiles.forEach(function(file) {
                    selectedFiles.push(file);
                });

                updateInput();
                renderPreview();
            });
        }


        // 주변 맛집 사진
        setupNearbyPhotos(
            "restaurantPhotos",
            "restaurantPreview",
            "existingRestaurantPhotos"
        );


        // 주변 볼거리 사진
        setupNearbyPhotos(
            "nearbyPhotos",
            "nearbyPreview",
            "existingNearbyPhotos"
        );

    // 5. 폼 전송 및 지도 검색 로딩 모달
    const travelForm = document.getElementById("travelForm");
    const loadingModal = document.getElementById("searchLoadingModal");

    if (travelForm) {

        travelForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const agree = document.getElementById("agree");

             // 1. 등록 가이드를 아직 확인하지 않았을 때
            if (!guideChecked) {

                alert(uiText('upload.readGuide'));

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
            if (!editMode && (!agree || !agree.checked)) {

                alert(uiText('upload.agree'));

                agree.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                return;
            }

            // 3. 메인 사진 필수 확인
            const existingPhotoCount =
                document.querySelectorAll("#existingPhotos .existing-photo").length;

            const newPhotoCount =
                photosInput ? photosInput.files.length : 0;

            if (existingPhotoCount + newPhotoCount === 0) {
                alert(uiText('upload.addPhoto'));

                if (photosInput) {
                    photosInput.closest(".form-section")?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

                return;
            }

            // CountryPicker stores the canonical Korean value. Retain the old
            // free-text fallback only when a legacy/non-catalog value is used.
            if (countrySearch && countryInput) {
                const searchVal = countrySearch.value.trim();
                const currentVal = countryInput.value.trim() || searchVal;

                console.log(`[Gemini AI Pre-Submit Check] Input Value: "${searchVal}", Target Value: "${currentVal}"`);

                const finalCanonical = applyGeminiCanonicalization(currentVal, "Final Submit");
                countryInput.value = finalCanonical || searchVal;

                console.log(`[Gemini AI Pre-Submit Final Result] Submission Country Name set to: "${countryInput.value}"`);
            }

            const formData = new FormData(travelForm);

            const submitButton = travelForm.querySelector('[type="submit"]');
            submitButton.disabled = true;

            // 지도 검색 및 폼 제출 중 로딩 창 노출
            if (loadingModal) {
                loadingModal.style.display = "flex";
            }

            console.log("[Gemini AI] Submitting location data to backend service...");

            fetch(travelForm.action, { method: 'POST', body: formData })
                .then(async response => {
                    if (!response.ok) {
                        let data = {};
                        try { data = await response.json(); } catch (_) {}
                        throw new Error(data.error || uiText('upload.submitError'));
                    }
                    console.log("[Gemini AI] Submission successful.");
                    if (response.redirected) window.location.href = response.url;
                })
                .catch(error => {
                    console.error("[Gemini AI Submit Error]", error);
                    alert(error.message);
                    if (loadingModal) {
                        loadingModal.style.display = "none";
                    }
                    submitButton.disabled = false;
                });
        });
    }

    const mobileUploadMenu = document.getElementById("mobileUploadMenu");
    const mobileGuideMenu = document.getElementById("mobileGuideMenu");

    mobileUploadMenu?.addEventListener("click", function () {
        uploadContent.style.display = "block";
        guideContent.style.display = "none";

        mobileUploadMenu.classList.add("selected");
        mobileGuideMenu.classList.remove("selected");
    });

    mobileGuideMenu?.addEventListener("click", function () {
        guideChecked = true;
        uploadContent.style.display = "none";
        guideContent.style.display = "block";

        mobileGuideMenu.classList.add("selected");
        mobileUploadMenu.classList.remove("selected");
    });

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

        guideChecked = true;

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
            document.getElementById("agree")?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    }
});