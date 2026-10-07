document.addEventListener('DOMContentLoaded', () => {
    // 1. 사용자 접속 기준 로컬 시간 변환 기능
    const timeElements = document.querySelectorAll('.created-time, .updated-time');
    function renderLocalTimes() {
        timeElements.forEach(el => {
            const rawTime = el.getAttribute('data-utc');
            if (!rawTime) return;

            // 브라우저가 접속한 사용자의 Local Timezone으로 자동 계산
            const date = new Date(rawTime);

            // 선택 언어의 형식으로 표시하고, 언어 전환 시에도 갱신한다.
            const localFormatted = date.toLocaleString(
                window.OdysayLanguage?.getLocale?.() || navigator.language,
                {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }
            );

            el.textContent = localFormatted;
        });
    }
    renderLocalTimes();
    window.addEventListener('odysay:languagechange', renderLocalTimes);

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

        // ==================================================
        // 찜하기 DB 연동
        // ==================================================

        const bookmarkButton = document.querySelector('.btn-jjim');
        const bookmarkCount = document.getElementById('bookmarkCount');

        function renderBookmarkLabel() {
            if (!bookmarkButton) return;
            const saved = bookmarkButton.classList.contains('active');
            bookmarkButton.dataset.i18n = saved ? 'detail.unsave' : 'detail.save';
            bookmarkButton.textContent = window.OdysayLanguage?.t(bookmarkButton.dataset.i18n)
                || (saved ? '♥ 찜 취소' : '♥ 찜하기');
        }

        renderBookmarkLabel();
        window.addEventListener('odysay:languagechange', renderBookmarkLabel);

        const csrfToken = document.querySelector(
            'meta[name="csrf-token"]'
        ).content;


        // 페이지 접속 시 찜 상태 불러오기
        async function loadBookmarkStatus() {

            try {

                const response = await fetch(
                    `/homepage/trip_location/feature/bookmark/${placeId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    return;
                }

                // 전체 찜 개수
                if (bookmarkCount) {
                    bookmarkCount.textContent = data.count;
                }

                // 현재 사용자의 찜 상태
                if (bookmarkButton) {

                    if (data.bookmarked) {
                        bookmarkButton.classList.add('active');
                    } else {
                        bookmarkButton.classList.remove('active');
                    }
                    renderBookmarkLabel();
                }

            } catch (error) {
                console.error('찜 상태 불러오기 실패:', error);
            }
        }


        // 찜하기 / 찜 취소
        if (bookmarkButton) {

            bookmarkButton.addEventListener('click', async function () {

                if (!currentUser || !currentUser.isLoggedIn) {
                    alert('로그인 후 이용할 수 있습니다.');
                    return;
                }

                try {

                    const response = await fetch(
                        `/homepage/trip_location/feature/bookmark/${placeId}`,
                        {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': csrfToken
                            }
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        alert(data.message || '찜 처리 중 오류가 발생했습니다.');
                        return;
                    }

                    // 찜 개수 변경
                    if (bookmarkCount) {
                        bookmarkCount.textContent = data.count;
                    }

                    // 버튼 변경
                    if (data.bookmarked) {
                        bookmarkButton.classList.add('active');
                    } else {
                        bookmarkButton.classList.remove('active');
                    }
                    renderBookmarkLabel();

                } catch (error) {
                    console.error(error);
                    alert('찜 처리 중 오류가 발생했습니다.');
                }

            });

        }


        // 페이지가 열리면 DB에서 상태 조회
        loadBookmarkStatus();

        // ==================================================
        // 4. 리뷰 / 여행톡 공통 기능
        // ==================================================

        function formatPostDate(date) {

            return date.toLocaleString(window.OdysayLanguage?.getLocale?.() || 'ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

        }


        function checkLogin() {

            if (!currentUser || !currentUser.isLoggedIn) {

                alert('로그인 후 이용할 수 있습니다.');

                return false;
            }

            return true;
        }


        function getAuthorBadge() {

            if (currentUser.isPlaceAuthor) {

                return `
                    <span class="author-badge">
                        작성자
                    </span>
                `;
            }

            return '';
        }




    // 9. 공유하기
    const shareButton = document.querySelector('.btn-share');

    const sharePopup = document.getElementById('sharePopup');

    const shareLink = document.getElementById('shareLink');

    const copyLinkButton = document.getElementById('copyLinkButton');

    const copyMessage = document.getElementById('copyMessage');

    // 현재 페이지 주소
    let currentUrl = window.location.href;

    // 링크 입력칸에 현재 주소 넣기
    if (shareLink) {
        shareLink.value = currentUrl;
    }

    window.addEventListener('odysay:languagechange', () => {
        currentUrl = window.location.href;
        if (shareLink) shareLink.value = currentUrl;
    });

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

});
