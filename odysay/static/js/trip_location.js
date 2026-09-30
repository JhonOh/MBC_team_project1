document.addEventListener('DOMContentLoaded', () => {

    // 1. 사용자 접속 기준 로컬 시간 변환 기능
    const timeElements = document.querySelectorAll('.created-time, .updated-time');
    timeElements.forEach(el => {
        const rawTime = el.getAttribute('data-utc');
        if (!rawTime) return;

        // 브라우저가 접속한 사용자의 Local Timezone으로 자동 계산
        const date = new Date(rawTime);

        // 사용자의 디바이스 설정에 맞춰 일시 포맷팅 (예: 2026. 09. 23. 오전 10:41)
        const localFormatted = date.toLocaleString(navigator.language, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        el.textContent = localFormatted;
    });

    // 2. 이미지 슬라이더 기능
    const mainImage = document.getElementById('mainImage');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const mainThumbnails = document.getElementById('mainThumbnails');

    let currentIndex = 0;

    // 메인사진 하단 썸네일 만들기
    function renderMainThumbnails() {

        if (!mainThumbnails || !photoList || photoList.length <= 1) {
            return;
        }

        // 기존 썸네일 비우기
        mainThumbnails.innerHTML = '';

        // 현재 메인사진 기준 앞 2장 + 뒤 2장 선택
        let startIndex = currentIndex - 2;
        let endIndex = currentIndex + 2;

        // 처음 부분이면 뒤쪽 사진으로 부족한 자리 채우기
        if (startIndex < 0) {
            endIndex += Math.abs(startIndex);
            startIndex = 0;
        }

        // 마지막 부분이면 앞쪽 사진으로 부족한 자리 채우기
        if (endIndex >= photoList.length) {
            const overflow = endIndex - photoList.length + 1;
            startIndex = Math.max(0, startIndex - overflow);
            endIndex = photoList.length - 1;
        }

        // 현재 메인사진을 제외하고 썸네일 목록 만들기
        const visiblePhotos = [];


        for (let index = startIndex; index <= endIndex; index++) {

            if (index === currentIndex) {
                continue;
            }

            visiblePhotos.push({
                photo: photoList[index],
                originalIndex: index
            });

        }

        // 현재 메인사진 + 화면에 보이는 썸네일을 제외한 사진 개수
        const hiddenPhotoCount =
            photoList.length - 1 - visiblePhotos.length;

        visiblePhotos.forEach((item) => {

            const thumbnailWrapper = document.createElement('div');
            thumbnailWrapper.classList.add('main-thumbnail-wrapper');

            const thumbnail = document.createElement('img');

            thumbnail.src = uploadPath + item.photo;
            thumbnail.alt = '여행지 썸네일';
            thumbnail.classList.add('main-thumbnail');

            thumbnailWrapper.appendChild(thumbnail);

            // 마지막 썸네일 위에 숨겨진 사진 개수 표시
            if (
                hiddenPhotoCount > 0 &&
                item === visiblePhotos[visiblePhotos.length - 1]
            ) {
                const moreCount = document.createElement('span');

                moreCount.classList.add('thumbnail-more-count');
                moreCount.textContent = `+${hiddenPhotoCount}`;

                thumbnailWrapper.appendChild(moreCount);
            }

            mainThumbnails.appendChild(thumbnailWrapper);

            thumbnailWrapper.addEventListener('click', () => {

                const direction =
                    item.originalIndex > currentIndex
                        ? 'right'
                        : 'left';

                currentIndex = item.originalIndex;

                updateSlider(currentIndex, direction);

            });

        });

    }

    function updateSlider(index, direction = 'right') {
        if (!photoList || photoList.length === 0 || !mainImage) return;

        // 현재 사진이 화살표 방향으로 살짝 빠져나가기
        mainImage.style.opacity = '0';

        mainImage.style.transform =
            direction === 'right'
                ? 'translateX(-25px)'
                : 'translateX(25px)';

        // 썸네일도 같이 살짝 흐려지게
        if (mainThumbnails) {
            mainThumbnails.style.opacity = '0';
        }

        setTimeout(() => {

            // 메인사진 교체
            mainImage.src = uploadPath + photoList[index];

            // 새 사진은 반대편에서 시작
            mainImage.style.transition = 'none';

            mainImage.style.transform =
                direction === 'right'
                    ? 'translateX(25px)'
                    : 'translateX(-25px)';

            // 썸네일 새로 생성
            renderMainThumbnails();

            // 브라우저가 시작 위치를 먼저 인식하게 함
            requestAnimationFrame(() => {

                requestAnimationFrame(() => {

                    mainImage.style.transition =
                        'opacity 0.2s ease, transform 0.2s ease';

                    mainImage.style.opacity = '1';
                    mainImage.style.transform = 'translateX(0)';

                    if (mainThumbnails) {
                        mainThumbnails.style.opacity = '1';
                    }

                });

            });

        }, 200);

}

    if (rightArrow && leftArrow && photoList && photoList.length > 0) {
        rightArrow.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % photoList.length;
            updateSlider(currentIndex, 'right');
        });

        leftArrow.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + photoList.length) % photoList.length;
            updateSlider(currentIndex, 'left');
        });
    }

    // 처음 페이지가 열렸을 때 썸네일 생성
    renderMainThumbnails();

    // 사진이 1장뿐이면 좌우 화살표 숨기기
    if (!photoList || photoList.length <= 1) {

        if (leftArrow) {
            leftArrow.style.display = 'none';
        }

        if (rightArrow) {
            rightArrow.style.display = 'none';
        }

    }

    // 3. 탭 전환
    const tabs = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(function(tab) {

        tab.addEventListener('click', function() {

            // 모든 탭 active 제거
            tabs.forEach(function(item) {
                item.classList.remove('active');
            });

            // 모든 내용 active 제거
            tabContents.forEach(function(content) {
                content.classList.remove('active');
            });

            // 클릭한 탭 활성화
            tab.classList.add('active');

            // 클릭한 탭의 data-tab 값 가져오기
            const targetId = tab.dataset.tab;

            // 해당 내용 찾기
            const targetContent = document.getElementById(targetId);

            if (targetContent) {
                targetContent.classList.add('active');
            }

        });

    });


    // 4. 리뷰 글자 수

    const reviewInput = document.getElementById('reviewInput');
    const reviewTextCount = document.getElementById('reviewTextCount');

    reviewInput.addEventListener('input', function() {

        reviewTextCount.textContent = reviewInput.value.length;

    });


    // 5. 리뷰 등록

    const reviewSubmit = document.getElementById('reviewSubmit');
    const reviewList = document.getElementById('reviewList');
    const reviewCount = document.getElementById('reviewCount');
    const noReviewMessage = document.getElementById('noReviewMessage');

    let reviewTotal = 0;


    reviewSubmit.addEventListener('click', function() {

        // 입력한 리뷰
        const reviewText = reviewInput.value.trim();


        // 아무것도 입력하지 않았을 때
        if (reviewText === '') {

            alert('리뷰 내용을 입력해주세요.');

            reviewInput.focus();

            return;
        }


        // 기존 "리뷰가 없습니다" 문구 삭제
        if (noReviewMessage) {
            noReviewMessage.style.display = 'none';
        }


        // 현재 날짜
        const today = new Date();

        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');

        const reviewDate = `${month}.${day}`;


        // 리뷰 하나 생성
        const reviewItem = document.createElement('div');

        reviewItem.classList.add('review-item');


        // 리뷰 HTML
        reviewItem.innerHTML = `
            <div class="review-header">
    
                <span class="review-user">
                    사용자
                </span>
    
                <span class="review-date">
                    ${reviewDate}
                </span>
    
            </div>
    
    
            <div class="review-text"></div>
    
    
            <div class="review-actions">
    
                <button
                    type="button"
                    class="review-action-button recommend-button">
    
                    ♡ 추천
                    <span class="recommend-count">0</span>
    
                </button>
    
    
                <button
                    type="button"
                    class="review-action-button report-button">
    
                    🚨 신고
    
                </button>
    
            </div>
        `;


        // 리뷰 내용 넣기
        reviewItem.querySelector('.review-text').textContent = reviewText;


        // 리뷰 목록에 추가
        reviewList.appendChild(reviewItem);


        // 리뷰 개수 증가
        reviewTotal++;

        reviewCount.textContent = reviewTotal;


        // 입력창 초기화
        reviewInput.value = '';

        reviewTextCount.textContent = '0';

    });


    // 6. 추천 / 추천 취소
    reviewList.addEventListener('click', function(event) {

        const recommendButton =
            event.target.closest('.recommend-button');


        if (recommendButton) {

            const count =
                recommendButton.querySelector('.recommend-count');


            // 이미 추천한 경우 → 추천 취소
            if (recommendButton.classList.contains('recommended')) {

                recommendButton.classList.remove('recommended');

                recommendButton.firstChild.textContent = '♡ 추천 ';

                count.textContent = '0';

            }

            // 추천하지 않은 경우 → 추천
            else {

                recommendButton.classList.add('recommended');

                recommendButton.firstChild.textContent = '♥ 추천 ';

                count.textContent = '1';

            }

        }

    });


    // 7. 신고
    reviewList.addEventListener('click', function(event) {

        const reportButton =
            event.target.closest('.report-button');


        if (reportButton) {

            const result = confirm(
                '이 리뷰를 신고하시겠습니까?'
            );


            if (result) {

                alert('신고가 접수되었습니다.');

                reportButton.textContent = '🚨 신고 완료';

                reportButton.disabled = true;

            }

        }

    });

    // 8. 찜하기 / 찜 취소
    const jjimButton = document.querySelector('.btn-jjim');
    const likesCount = document.querySelector('.likes-count');

    let isJjim = false;

    if (jjimButton && likesCount) {

        // DB에서 화면에 출력된 기존 찜 개수 가져오기
        let currentLikes =
            parseInt(likesCount.textContent.replace(/[^0-9]/g, '')) || 0;


        jjimButton.addEventListener('click', function() {

            // 아직 찜하지 않은 상태
            if (!isJjim) {

                currentLikes++;

                likesCount.textContent = `❤️ ${currentLikes}`;

                jjimButton.textContent = '♥ 찜 취소';

                jjimButton.classList.add('active');

                isJjim = true;

            }

            // 이미 찜한 상태 → 취소
            else {

                currentLikes--;

                likesCount.textContent = `❤️ ${currentLikes}`;

                jjimButton.textContent = '♥ 찜하기';

                jjimButton.classList.remove('active');

                isJjim = false;

            }

        });

    }

    // 9. 공유하기
    const shareButton = document.querySelector('.btn-share');

    const sharePopup = document.getElementById('sharePopup');

    const shareLink = document.getElementById('shareLink');

    const copyLinkButton = document.getElementById('copyLinkButton');

    const copyMessage = document.getElementById('copyMessage');

    // 현재 페이지 주소
    const currentUrl = window.location.href;

    // 링크 입력칸에 현재 주소 넣기
    if (shareLink) {
        shareLink.value = currentUrl;
    }

    // 공유 버튼
    if (shareButton && sharePopup) {

        shareButton.addEventListener('click', function(event) {

            event.stopPropagation();

            sharePopup.classList.toggle('active');

            copyMessage.style.display = 'none';

        });

    }

    // 팝업 안을 눌렀을 때 닫히지 않게
    if (sharePopup) {

        sharePopup.addEventListener('click', function(event) {

            event.stopPropagation();

        });

    }

    // 팝업 바깥을 누르면 닫기
    document.addEventListener('click', function() {

        if (sharePopup) {

            sharePopup.classList.remove('active');

        }

    });

    // 10. 링크 복사
    if (copyLinkButton) {

        copyLinkButton.addEventListener('click', async function() {

            try {

                await navigator.clipboard.writeText(currentUrl);

                copyMessage.style.display = 'block';

            }

            catch (error) {

                // clipboard 기능이 지원되지 않을 경우
                shareLink.select();

                document.execCommand('copy');

                copyMessage.style.display = 'block';

            }

        });

    }

        // 11. SNS 공유
        const kakaoShareButton =
            document.getElementById('kakaoShareButton');

        const instagramShareButton =
            document.getElementById('instagramShareButton');

        const xShareButton =
            document.getElementById('xShareButton');

        const facebookShareButton =
            document.getElementById('facebookShareButton');


        // 카카오톡
        if (kakaoShareButton) {

            kakaoShareButton.addEventListener('click', async function() {

                if (navigator.share) {

                    try {

                        await navigator.share({
                            title: document.title,
                            text: '이 여행지를 확인해보세요!',
                            url: currentUrl
                        });

                    } catch (error) {
                        // 공유창을 닫으면 아무것도 하지 않음
                    }

                } else {

                    try {

                        await navigator.clipboard.writeText(currentUrl);

                        alert(
                            '링크가 복사되었습니다.\n카카오톡에 붙여넣어 주세요.'
                        );

                    } catch (error) {

                        alert('아래 링크 복사 버튼을 이용해주세요.');

                    }

                }

            });

        }


        // 인스타그램
        if (instagramShareButton) {

            instagramShareButton.addEventListener('click', async function() {

                if (navigator.share) {

                    try {

                        await navigator.share({
                            title: document.title,
                            text: '이 여행지를 확인해보세요!',
                            url: currentUrl
                        });

                    } catch (error) {
                        // 공유창을 닫으면 아무것도 하지 않음
                    }

                } else {

                    try {

                        await navigator.clipboard.writeText(currentUrl);

                        alert(
                            '링크가 복사되었습니다.\n인스타그램에 붙여넣어 주세요.'
                        );

                    } catch (error) {

                        alert('아래 링크 복사 버튼을 이용해주세요.');

                    }

                }

            });

        }


        // X
        if (xShareButton) {

            xShareButton.addEventListener('click', function() {

                const xUrl =
                    'https://twitter.com/intent/tweet'
                    + '?text='
                    + encodeURIComponent('이 여행지를 확인해보세요!')
                    + '&url='
                    + encodeURIComponent(currentUrl);

                window.open(
                    xUrl,
                    '_blank',
                    'width=600,height=500'
                );

            });

        }


        // 페이스북
        if (facebookShareButton) {

            facebookShareButton.addEventListener('click', function() {

                const facebookUrl =
                    'https://www.facebook.com/sharer/sharer.php'
                    + '?u='
                    + encodeURIComponent(currentUrl);

                window.open(
                    facebookUrl,
                    '_blank',
                    'width=600,height=500'
                );

            });

        }
                // 12. 여행지 사진 크게보기

                const galleryImages =
                    document.querySelectorAll('.gallery-image');

                const restaurantImages =
                    document.querySelectorAll(
                        '.gallery-image[alt="주변 맛집 사진"]'
                    );

                const nearbyImages =
                    document.querySelectorAll(
                        '.gallery-image[alt="주변 볼거리 사진"]'
                    );

                const imageModal =
                    document.getElementById('imageModal');

                const imageModalPhoto =
                    document.getElementById('imageModalPhoto');

                const imageModalClose =
                    document.getElementById('imageModalClose');

                const imageModalPrev =
                    document.getElementById('imageModalPrev');

                const imageModalNext =
                    document.getElementById('imageModalNext');

                const imageModalThumbnails =
                    document.getElementById('imageModalThumbnails');


                let modalIndex = 0;
                let currentModalImages = [];


                // ================================
                // 상단 메인 여행지 사진
                // ================================

                const mainModalImages =
                    (photoList || []).map(function(photo) {

                        return {
                            src: uploadPath + photo,
                            alt: '여행지 사진'
                        };

                    });


                // ================================
                // 같은 사진 중복 제거
                // ================================

                function removeDuplicateImages(images) {

                    return Array.from(images).filter(
                        (item, index, array) =>

                            index === array.findIndex(
                                other => other.src === item.src
                            )
                    );

                }


                // ================================
                // 모달 화살표 표시 여부
                // ================================

                function updateModalArrows() {

                    const shouldShow =
                        currentModalImages &&
                        currentModalImages.length > 1;

                    if (imageModalPrev) {
                        imageModalPrev.style.display =
                            shouldShow ? 'flex' : 'none';
                    }

                    if (imageModalNext) {
                        imageModalNext.style.display =
                            shouldShow ? 'flex' : 'none';
                    }

                }


                // ================================
                // 현재 사진 표시
                // ================================

                function showModalImage(index) {

                    if (
                        !currentModalImages ||
                        currentModalImages.length === 0 ||
                        !imageModalPhoto
                    ) {
                        return;
                    }

                    modalIndex = index;

                    imageModalPhoto.src =
                        currentModalImages[modalIndex].src;

                    imageModalPhoto.alt =
                        currentModalImages[modalIndex].alt || '여행지 사진 크게보기';


                    // 아래 썸네일 active 변경
                    if (imageModalThumbnails) {

                        const thumbnails =
                            imageModalThumbnails.querySelectorAll('img');

                        thumbnails.forEach(function(thumbnail, thumbIndex) {

                            thumbnail.classList.toggle(
                                'active',
                                thumbIndex === modalIndex
                            );

                        });

                    }

                }


                // ================================
                // 현재 사진 그룹 썸네일 만들기
                // ================================

                function renderModalThumbnails() {

                    if (!imageModalThumbnails) {
                        return;
                    }

                    imageModalThumbnails.innerHTML = '';


                    currentModalImages.forEach(function(image, index) {

                        const thumbnail =
                            document.createElement('img');

                        thumbnail.src = image.src;
                        thumbnail.alt = image.alt || '여행지 사진';


                        if (index === modalIndex) {
                            thumbnail.classList.add('active');
                        }


                        thumbnail.addEventListener(
                            'click',
                            function(event) {

                                event.stopPropagation();

                                showModalImage(index);

                            }
                        );


                        imageModalThumbnails.appendChild(thumbnail);

                    });

                }


                // ================================
                // 모달 열기 공통 함수
                // ================================

                function openImageModal(images, startIndex = 0) {

                    if (
                        !imageModal ||
                        !images ||
                        images.length === 0
                    ) {
                        return;
                    }


                    currentModalImages =
                        removeDuplicateImages(images);


                    if (startIndex < 0) {
                        startIndex = 0;
                    }

                    if (startIndex >= currentModalImages.length) {
                        startIndex = currentModalImages.length - 1;
                    }


                    modalIndex = startIndex;


                    renderModalThumbnails();

                    showModalImage(modalIndex);

                    updateModalArrows();


                    imageModal.classList.add('active');

                    document.body.style.overflow = 'hidden';

                }


                // ================================
                // 상단 메인 이미지 클릭
                // ================================

                if (mainImage) {

                    mainImage.style.cursor = 'pointer';


                    mainImage.addEventListener('click', function() {

                        openImageModal(
                            mainModalImages,
                            currentIndex
                        );

                    });

                }


                // ================================
                // 맛집 / 볼거리 사진 클릭
                // ================================

                galleryImages.forEach(function(image) {

                    image.addEventListener('click', function() {

                        let selectedGroup = [];


                        // 맛집 사진
                        if (image.alt === '주변 맛집 사진') {

                            selectedGroup =
                                removeDuplicateImages(restaurantImages);

                        }


                        // 볼거리 사진
                        else if (image.alt === '주변 볼거리 사진') {

                            selectedGroup =
                                removeDuplicateImages(nearbyImages);

                        }


                        // 클릭한 사진 위치 찾기
                        const groupIndex =
                            selectedGroup.findIndex(
                                item => item.src === image.src
                            );


                        openImageModal(
                            selectedGroup,
                            groupIndex
                        );

                    });

                });


                // ================================
                // 이전 사진
                // ================================

                if (imageModalPrev) {

                    imageModalPrev.addEventListener(
                        'click',
                        function(event) {

                            event.stopPropagation();


                            if (
                                !currentModalImages ||
                                currentModalImages.length <= 1
                            ) {
                                return;
                            }


                            modalIndex =
                                (
                                    modalIndex - 1 +
                                    currentModalImages.length
                                )
                                % currentModalImages.length;


                            showModalImage(modalIndex);

                        }
                    );

                }


                // ================================
                // 다음 사진
                // ================================

                if (imageModalNext) {

                    imageModalNext.addEventListener(
                        'click',
                        function(event) {

                            event.stopPropagation();


                            if (
                                !currentModalImages ||
                                currentModalImages.length <= 1
                            ) {
                                return;
                            }


                            modalIndex =
                                (modalIndex + 1)
                                % currentModalImages.length;


                            showModalImage(modalIndex);

                        }
                    );

                }


                // ================================
                // 마우스 휠 이전 / 다음
                // ================================

                if (imageModal) {

                    imageModal.addEventListener(
                        'wheel',
                        function(event) {

                            if (
                                !imageModal.classList.contains('active')
                            ) {
                                return;
                            }


                            if (
                                !currentModalImages ||
                                currentModalImages.length <= 1
                            ) {
                                return;
                            }


                            event.preventDefault();


                            const wheelAmount =

                                Math.abs(event.deltaY) >=
                                Math.abs(event.deltaX)

                                    ? event.deltaY
                                    : event.deltaX;


                            // 아래 / 오른쪽 → 다음
                            if (wheelAmount > 0) {

                                modalIndex =
                                    (modalIndex + 1)
                                    % currentModalImages.length;

                            }

                            // 위 / 왼쪽 → 이전
                            else if (wheelAmount < 0) {

                                modalIndex =
                                    (
                                        modalIndex - 1 +
                                        currentModalImages.length
                                    )
                                    % currentModalImages.length;

                            }


                            showModalImage(modalIndex);

                        },
                        {
                            passive: false
                        }
                    );

                }


                // ================================
                // 모달 닫기
                // ================================

                function closeImageModal() {

                    if (!imageModal) {
                        return;
                    }

                    imageModal.classList.remove('active');

                    document.body.style.overflow = '';

                }


                // X 버튼
                if (imageModalClose) {

                    imageModalClose.addEventListener(
                        'click',
                        closeImageModal
                    );

                }


                // 검은 배경 클릭
                if (imageModal) {

                    imageModal.addEventListener(
                        'click',
                        function(event) {

                            if (event.target === imageModal) {

                                closeImageModal();

                            }

                        }
                    );

                }


                // ================================
                // ESC 키로 모달 닫기
                // ================================

                document.addEventListener(
                    'keydown',
                    function(event) {

                        if (
                            event.key === 'Escape' &&
                            imageModal &&
                            imageModal.classList.contains('active')
                        ) {

                            closeImageModal();

                        }

                    }
                );

    });  // ← DOMContentLoaded 끝
