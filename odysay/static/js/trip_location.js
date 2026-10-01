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

        // ==================================================
        // 찜하기 DB 연동
        // ==================================================

        const bookmarkButton = document.querySelector('.btn-jjim');
        const bookmarkCount = document.getElementById('bookmarkCount');

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
                        bookmarkButton.textContent = '♥ 찜 취소';
                        bookmarkButton.classList.add('active');
                    } else {
                        bookmarkButton.textContent = '♥ 찜하기';
                        bookmarkButton.classList.remove('active');
                    }
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
                        bookmarkButton.textContent = '♥ 찜 취소';
                        bookmarkButton.classList.add('active');
                    } else {
                        bookmarkButton.textContent = '♥ 찜하기';
                        bookmarkButton.classList.remove('active');
                    }

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

            return date.toLocaleString('ko-KR', {
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



        // ==================================================
        // 5. 리뷰
        // ==================================================

        const reviewOpenButton =
            document.getElementById('reviewOpenButton');

        const reviewWrite =
            document.getElementById('reviewWrite');

        const reviewInput =
            document.getElementById('reviewInput');

        const reviewTextCount =
            document.getElementById('reviewTextCount');

        const reviewSubmit =
            document.getElementById('reviewSubmit');

        const reviewList =
            document.getElementById('reviewList');

        const reviewCount =
            document.getElementById('reviewCount');

        const reviewSummaryCount =
            document.getElementById('reviewSummaryCount');

        const reviewAverage =
            document.getElementById('reviewAverage');

        const noReviewMessage =
            document.getElementById('noReviewMessage');

        const reviewStars =
            document.querySelectorAll('#reviewStars button');

        const selectedScoreText =
            document.getElementById('selectedScore');


        let selectedReviewScore = 0;

        // 현재 수정 중인 리뷰
        let editingReviewItem = null;
        let editingReviewOldScore = 0;

        let reviewTotal = 0;

        const reviewScoreCounts = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
        };


        // 리뷰 작성창 열기
        if (reviewOpenButton && reviewWrite) {

            reviewOpenButton.addEventListener('click', function() {

                if (!checkLogin()) {
                    return;
                }

                reviewWrite.classList.toggle('active');

            });

        }


        // 리뷰 글자 수
        if (reviewInput && reviewTextCount) {

            reviewInput.addEventListener('input', function() {

                reviewTextCount.textContent =
                    reviewInput.value.length;

            });

        }


        // 별점 선택
        reviewStars.forEach(function(star) {

            star.addEventListener('click', function() {

                selectedReviewScore =
                    Number(star.dataset.score);

                selectedScoreText.textContent =
                    selectedReviewScore.toFixed(1);


                reviewStars.forEach(function(item) {

                    const score =
                        Number(item.dataset.score);

                    item.classList.toggle(
                        'active',
                        score <= selectedReviewScore
                    );

                });

            });

        });


        // 리뷰 평균 / 분포 업데이트
        function updateReviewSummary() {

            if (!reviewCount ||
                !reviewSummaryCount ||
                !reviewAverage) {
                return;
            }


            reviewCount.textContent =
                reviewTotal;

            reviewSummaryCount.textContent =
                reviewTotal;


            let totalScore = 0;


            for (let score = 1; score <= 5; score++) {

                totalScore +=
                    score * reviewScoreCounts[score];

            }


            const average =
                reviewTotal === 0
                    ? 0
                    : totalScore / reviewTotal;


            reviewAverage.textContent =
                average.toFixed(1);


            for (let score = 1; score <= 5; score++) {

                const percentage =
                    reviewTotal === 0
                        ? 0
                        : Math.round(
                            reviewScoreCounts[score]
                            / reviewTotal
                            * 100
                        );


                const bar =
                    document.getElementById(
                        `scoreBar${score}`
                    );

                const percentText =
                    document.getElementById(
                        `scorePercent${score}`
                    );


                if (bar) {
                    bar.style.width =
                        `${percentage}%`;
                }

                if (percentText) {
                    percentText.textContent =
                        `${percentage}%`;
                }

            }

        }

        // ==================================================
        // DB 리뷰 목록 불러오기
        // ==================================================
        async function loadReviews() {

            if (!reviewList) {
                return;
            }

            try {

                const response = await fetch(
                    `/homepage/trip_location/feature/review/${placeId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('리뷰 조회 실패:', data);
                    return;
                }

                // 기존 리뷰 목록 초기화
                reviewList.innerHTML = '';

                reviewTotal = 0;

                for (let score = 1; score <= 5; score++) {
                    reviewScoreCounts[score] = 0;
                }


                data.reviews.forEach(function(review) {

                    const reviewItem =
                        document.createElement('article');

                    reviewItem.classList.add('review-item');

                    reviewItem.dataset.reviewId = review.id;


                    reviewItem.innerHTML = `
                    <div class="review-header">
                
                        <div class="review-user-area">
                            <span class="review-avatar">👤</span>
                
                            <div class="review-user-info">

                                <div class="review-user-name-row">
                                    <span class="review-user"></span>
                            
                                    <span class="review-rating">
                                        <span class="review-rating-star">★</span>
                            
                                        <span class="review-rating-number">
                                            ${Number(review.rating).toFixed(1)}
                                        </span>
                                    </span>
                                </div>
                            
                                <span class="review-date"></span>
                            
                            </div>
                        </div>
                
                        ${
                            review.is_owner
                                ? `
                                    <div class="review-owner-menu">
                
                                        <button
                                            type="button"
                                            class="review-more-button"
                                            aria-label="리뷰 메뉴">
                                            ⋯
                                        </button>
                
                                        <div class="review-more-menu">
                
                                            <button
                                                type="button"
                                                class="review-edit-button">
                                                수정
                                            </button>
                
                                            <button
                                                type="button"
                                                class="review-delete-button">
                                                삭제
                                            </button>
                
                                        </div>
                
                                    </div>
                                `
                                : ''
                        }
                
                    </div>
                
                
                    <p class="review-text"></p>
                
                
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


                    reviewItem.querySelector(
                        '.review-user'
                    ).textContent = review.nickname;


                    reviewItem.querySelector(
                        '.review-text'
                    ).textContent = review.content;


                    reviewItem.querySelector(
                        '.review-date'
                    ).textContent =
                        formatPostDate(
                            new Date(review.created_at)
                        );


                    reviewList.appendChild(reviewItem);


                    reviewTotal++;

                    if (reviewScoreCounts[review.rating] !== undefined) {
                        reviewScoreCounts[review.rating]++;
                    }

                });


                // 리뷰가 하나도 없을 때
                if (noReviewMessage) {

                    noReviewMessage.style.display =
                        reviewTotal === 0
                            ? ''
                            : 'none';

                }


                // 평균 / 개수 / 별점 분포 다시 계산
                updateReviewSummary();


            } catch (error) {

                console.error(
                    '리뷰 목록 불러오기 실패:',
                    error
                );

            }

        }

        // ==================================================
        // 리뷰 등록 - DB 저장
        // ==================================================
        if (reviewSubmit) {

            reviewSubmit.addEventListener('click', async function() {

                if (!checkLogin()) {
                    return;
                }

                const reviewText = reviewInput.value.trim();

                if (selectedReviewScore === 0) {
                    alert('별점을 선택해주세요.');
                    return;
                }

                if (reviewText === '') {
                    alert('리뷰 내용을 입력해주세요.');
                    reviewInput.focus();
                    return;
                }

                try {

                    let reviewUrl =
                        `/homepage/trip_location/feature/review/${placeId}`;

                    if (editingReviewItem) {

                        const reviewId =
                            editingReviewItem.dataset.reviewId;

                        reviewUrl =
                            `/homepage/trip_location/feature/review/edit/${reviewId}`;
                    }

                    const response = await fetch(
                        reviewUrl,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },

                            body: JSON.stringify({
                                rating: selectedReviewScore,
                                content: reviewText
                            })
                        }
                    );

                    const data = await response.json();

                    if (!response.ok) {
                        alert(data.message || '리뷰 등록 중 오류가 발생했습니다.');
                        return;
                    }

                    // 입력창 초기화
                    reviewInput.value = '';
                    reviewTextCount.textContent = '0';

                    selectedReviewScore = 0;
                    selectedScoreText.textContent = '0.0';

                    reviewStars.forEach(function(star) {
                        star.classList.remove('active');
                    });

                    editingReviewItem = null;
                    reviewSubmit.textContent = '등록';

                    reviewWrite.classList.remove('active');

                    // DB에서 리뷰 목록 다시 불러오기
                    await loadReviews();

                } catch (error) {

                    console.error('리뷰 등록 실패:', error);
                    alert('리뷰 등록 중 오류가 발생했습니다.');

                }

            });

        }


        // 리뷰 추천 / 신고
        if (reviewList) {

            reviewList.addEventListener('click', function(event) {

                const moreButton =
                    event.target.closest('.review-more-button');

                if (moreButton) {

                    const ownerMenu =
                        moreButton.closest('.review-owner-menu');

                    const moreMenu =
                        ownerMenu.querySelector('.review-more-menu');

                    moreMenu.classList.toggle('active');

                    return;
                }

                // ==================================================
                // 리뷰 수정 시작
                // ==================================================
                const editButton =
                    event.target.closest('.review-edit-button');

                if (editButton) {

                    if (!checkLogin()) {
                        return;
                    }

                    const reviewItem =
                        editButton.closest('.review-item');

                    const reviewId =
                        reviewItem.dataset.reviewId;

                    const reviewText =
                        reviewItem.querySelector('.review-text')
                            .textContent.trim();

                    const reviewScore =
                        Number(
                            reviewItem.querySelector(
                                '.review-rating-number'
                            ).textContent
                        );


                    // 수정 중인 리뷰 정보 저장
                    editingReviewItem = reviewItem;
                    editingReviewItem.dataset.reviewId = reviewId;

                    selectedReviewScore = reviewScore;


                    // 작성창에 기존 내용 넣기
                    reviewInput.value = reviewText;

                    reviewTextCount.textContent =
                        reviewText.length;


                    // 기존 별점 표시
                    selectedScoreText.textContent =
                        reviewScore.toFixed(1);

                    reviewStars.forEach(function(star) {

                        const score =
                            Number(star.dataset.score);

                        star.classList.toggle(
                            'active',
                            score <= reviewScore
                        );

                    });


                    // 작성창 열기
                    reviewWrite.classList.add('active');

                    // 버튼 이름 변경
                    reviewSubmit.textContent = '수정 완료';


                    // ⋯ 메뉴 닫기
                    const menu =
                        reviewItem.querySelector(
                            '.review-more-menu'
                        );

                    if (menu) {
                        menu.classList.remove('active');
                    }


                    reviewInput.focus();

                    return;
                }

                // ==================================================
                // 리뷰 삭제 - DB 삭제
                // ==================================================
                const deleteButton =
                    event.target.closest('.review-delete-button');

                if (deleteButton) {

                    if (!checkLogin()) {
                        return;
                    }

                    const reviewItem =
                        deleteButton.closest('.review-item');

                    const reviewId =
                        reviewItem.dataset.reviewId;

                    const result =
                        confirm('리뷰를 삭제하시겠습니까?');

                    if (!result) {
                        return;
                    }

                    fetch(
                        `/homepage/trip_location/feature/review/delete/${reviewId}`,
                        {
                            method: 'POST',

                            headers: {
                                'X-CSRFToken': csrfToken
                            }
                        }
                    )
                        .then(function(response) {
                            return response.json().then(function(data) {
                                return {
                                    ok: response.ok,
                                    data: data
                                };
                            });
                        })

                        .then(function(result) {

                            if (!result.ok) {
                                alert(
                                    result.data.message ||
                                    '리뷰 삭제 중 오류가 발생했습니다.'
                                );

                                return;
                            }

                            // DB에서 다시 불러오기
                            loadReviews();

                        })

                        .catch(function(error) {

                            console.error(
                                '리뷰 삭제 실패:',
                                error
                            );

                            alert(
                                '리뷰 삭제 중 오류가 발생했습니다.'
                            );

                        });

                    return;
                }

                const recommendButton =
                    event.target.closest(
                        '.recommend-button'
                    );


                if (recommendButton) {

                    if (!checkLogin()) {
                        return;
                    }


                    const count =
                        recommendButton.querySelector(
                            '.recommend-count'
                        );


                    const isRecommended =
                        recommendButton.classList.toggle(
                            'recommended'
                        );


                    recommendButton.firstChild.textContent =
                        isRecommended
                            ? '♥ 추천 '
                            : '♡ 추천 ';


                    count.textContent =
                        isRecommended ? '1' : '0';

                    return;
                }


                const reportButton =
                    event.target.closest(
                        '.report-button'
                    );


                if (reportButton) {

                    if (!checkLogin()) {
                        return;
                    }


                    const result =
                        confirm(
                            '이 리뷰를 신고하시겠습니까?'
                        );


                    if (result) {

                        alert(
                            '신고가 접수되었습니다.'
                        );

                        reportButton.textContent =
                            '🚨 신고 완료';

                        reportButton.disabled = true;

                    }

                }

            });

        }


        loadReviews();



        // ==================================================
        // 6. 여행톡
        // ==================================================

        const travelTalkOpenButton =
            document.getElementById(
                'travelTalkOpenButton'
            );

        const travelTalkWrite =
            document.getElementById(
                'travelTalkWrite'
            );

        const travelTalkTitle =
            document.getElementById(
                'travelTalkTitle'
            );

        const travelTalkInput =
            document.getElementById(
                'travelTalkInput'
            );

        const travelTalkTextCount =
            document.getElementById(
                'travelTalkTextCount'
            );

        const travelTalkSubmit =
            document.getElementById(
                'travelTalkSubmit'
            );

        const travelTalkList =
            document.getElementById(
                'travelTalkList'
            );

        const travelTalkCount =
            document.getElementById(
                'travelTalkCount'
            );

        const noTravelTalkMessage =
            document.getElementById(
                'noTravelTalkMessage'
            );

        const travelTalkWriteCancel =
            document.querySelector(
                '#travelTalkWriteCancel'
            );

        let travelTalkTotal = 0;

        let editingCommentItem = null;

        // 댓글 수정 전 원래 위치 기억
        let editingCommentOriginalParent = null;
        let editingCommentOriginalNext = null;
        let editingCommentTravelTalkItem = null;

        // 글 작성창 열기
        if (travelTalkOpenButton &&
            travelTalkWrite) {

            travelTalkOpenButton.addEventListener(
                'click',
                function() {

                    if (!checkLogin()) {
                        return;
                    }

                    travelTalkWrite.classList.toggle(
                        'active'
                    );
                    if (travelTalkWrite.classList.contains('active')) {
                        travelTalkWriteCancel.classList.add('active');
                    } else {
                        travelTalkWriteCancel.classList.remove('active');
                    }

                }
            );
            // ==========================================
            // 여행톡 새 글 작성 취소
            // ==========================================

            if (travelTalkWriteCancel) {

                travelTalkWriteCancel.addEventListener(
                    'click',
                    function() {

                        travelTalkTitle.value = '';
                        travelTalkInput.value = '';

                        travelTalkTextCount.textContent = '0';

                        travelTalkWrite.classList.remove(
                            'active'
                        );

                        travelTalkWriteCancel.classList.remove(
                            'active'
                        );
                    }
                );

            }

        }


        // 여행톡 글자 수
        if (travelTalkInput &&
            travelTalkTextCount) {

            travelTalkInput.addEventListener(
                'input',
                function() {

                    travelTalkTextCount.textContent =
                        travelTalkInput.value.length;

                }
            );

        }

        // ==================================================
        // DB 여행톡 목록 불러오기
        // ==================================================
        async function loadTravelTalks() {

            if (!travelTalkList) {
                return;
            }

            try {

                const response = await fetch(
                    `/homepage/trip_location/feature/travel-talk/${placeId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    console.error('여행톡 조회 실패:', data);
                    return;
                }

                // 기존 목록 비우기
                travelTalkList
                    .querySelectorAll('.travel-talk-item')
                    .forEach(function(item) {
                        item.remove();
                    });

                travelTalkTotal = data.travel_talks.length;

                if (travelTalkCount) {
                    travelTalkCount.textContent = travelTalkTotal;
                }

                // 여행톡이 없을 때
                if (noTravelTalkMessage) {
                    noTravelTalkMessage.style.display =
                        travelTalkTotal === 0 ? '' : 'none';
                }

                data.travel_talks.forEach(function(talk) {

                    const travelTalkItem =
                        document.createElement('article');

                    travelTalkItem.classList.add(
                        'travel-talk-item'
                    );

                    travelTalkItem.dataset.travelTalkId =
                        talk.id;

                    travelTalkItem.innerHTML = `
                        <div class="travel-talk-header">
        
                            <div class="travel-talk-user-area">
        
                                <span class="travel-talk-avatar">
                                    👤
                                </span>
        
                                <div class="travel-talk-user-info">
        
                                    <span class="travel-talk-user"></span>
        
                                    <span class="travel-talk-date"></span>
        
                                </div>
        
                            </div>
        
                            ${
                                talk.is_owner
                                    ? `
                                        <div class="travel-talk-owner-menu">
        
                                            <button
                                                type="button"
                                                class="travel-talk-more">
                                                ⋯
                                            </button>
        
                                            <div class="travel-talk-more-menu">
        
                                                <button
                                                    type="button"
                                                    class="travel-talk-edit-button">
                                                    수정
                                                </button>
        
                                                <button
                                                    type="button"
                                                    class="travel-talk-delete-button">
                                                    삭제
                                                </button>
        
                                            </div>
        
                                        </div>
                                    `
                                    : ''
                            }
        
                        </div>
        
                        <h4 class="travel-talk-post-title"></h4>
        
                        <p class="travel-talk-text"></p>
        
                        <div class="travel-talk-actions">
        
                            <button
                                type="button"
                                class="travel-talk-like">
                                ♡
                                <span class="travel-talk-like-count">
                                    0
                                </span>
                            </button>
        
                            <button
                                type="button"
                                class="travel-talk-comment">
                                💬 댓글
                                <span class="travel-talk-comment-count">
                                    0
                                </span>
                            </button>
        
                            <button
                                type="button"
                                class="travel-talk-report">
                                🚨 신고
                            </button>
        
                        </div>
        
                        <div class="travel-talk-comment-section">
        
                            <div class="travel-talk-comment-list">
        
                                <p class="travel-talk-no-comment">
                                    아직 댓글이 없습니다.
                                </p>
        
                            </div>
        
                            <div class="travel-talk-comment-write">
        
                                <textarea
                                    class="travel-talk-comment-input"
                                    maxlength="500"
                                    placeholder="댓글을 입력해주세요."
                                ></textarea>
        
                                <div class="travel-talk-comment-write-bottom">
        
                                    <span>
                                        <span class="travel-talk-comment-text-count">
                                            0
                                        </span>/500
                                    </span>
        
                                    <button
                                        type="button"
                                        class="travel-talk-comment-submit">
                                        등록
                                    </button>
        
                                </div>
        
                            </div>
        
                        </div>
                    `;

                    travelTalkItem.querySelector(
                        '.travel-talk-user'
                    ).textContent = talk.nickname;

                    travelTalkItem.querySelector(
                        '.travel-talk-post-title'
                    ).textContent = talk.title;

                    travelTalkItem.querySelector(
                        '.travel-talk-text'
                    ).textContent = talk.content;

                    travelTalkItem.querySelector(
                        '.travel-talk-date'
                    ).textContent =
                        formatPostDate(
                            new Date(talk.created_at)
                        );

                    travelTalkList.appendChild(
                        travelTalkItem
                    );

                });

            } catch (error) {

                console.error(
                    '여행톡 목록 불러오기 실패:',
                    error
                );
            }
        }
        loadTravelTalks();

        // ==================================================
        // 여행톡 글 등록 - DB 저장
        // ==================================================
        if (travelTalkSubmit) {

            travelTalkSubmit.addEventListener(
                'click',
                async function() {

                    if (!checkLogin()) {
                        return;
                    }

                    const title =
                        travelTalkTitle.value.trim();

                    const text =
                        travelTalkInput.value.trim();


                    if (title === '') {

                        alert('제목을 입력해주세요.');

                        travelTalkTitle.focus();

                        return;
                    }


                    if (text === '') {

                        alert('내용을 입력해주세요.');

                        travelTalkInput.focus();

                        return;
                    }


                    try {

                        const response = await fetch(
                            `/homepage/trip_location/feature/travel-talk/${placeId}`,
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrfToken
                                },

                                body: JSON.stringify({
                                    title: title,
                                    content: text
                                })
                            }
                        );


                        const data =
                            await response.json();


                        if (!response.ok) {

                            alert(
                                data.message ||
                                '여행톡 등록 중 오류가 발생했습니다.'
                            );

                            return;
                        }


                        // 입력창 초기화
                        travelTalkTitle.value = '';

                        travelTalkInput.value = '';

                        travelTalkTextCount.textContent = '0';


                        // 작성창 닫기
                        travelTalkWrite.classList.remove(
                            'active'
                        );


                        if (travelTalkWriteCancel) {

                            travelTalkWriteCancel.classList.remove(
                                'active'
                            );
                        }


                        // DB에서 여행톡 목록 다시 불러오기
                        await loadTravelTalks();


                    } catch (error) {

                        console.error(
                            '여행톡 등록 실패:',
                            error
                        );

                        alert(
                            '여행톡 등록 중 오류가 발생했습니다.'
                        );
                    }
                }
            );
        }


        // 여행톡 좋아요 / 신고
        if (travelTalkList) {

            travelTalkList.addEventListener(
                'click',
                function(event) {

                    const likeButton =
                        event.target.closest(
                            '.travel-talk-like'
                        );


                    if (likeButton) {

                        if (!checkLogin()) {
                            return;
                        }


                        const count =
                            likeButton.querySelector(
                                '.travel-talk-like-count'
                            );


                        const liked =
                            likeButton.classList.toggle(
                                'liked'
                            );


                        likeButton.firstChild.textContent =
                            liked ? '♥ ' : '♡ ';


                        count.textContent =
                            liked ? '1' : '0';

                        return;
                    }


                    const reportButton =
                        event.target.closest(
                            '.travel-talk-report'
                        );


                    if (reportButton) {

                        if (!checkLogin()) {
                            return;
                        }


                        const result =
                            confirm(
                                '이 게시글을 신고하시겠습니까?'
                            );


                        if (result) {

                            alert(
                                '신고가 접수되었습니다.'
                            );

                            reportButton.textContent =
                                '🚨 신고 완료';

                            reportButton.disabled = true;

                        }

                    }

                }
            );

        }

    // ==================================================
    // DB 여행톡 댓글 불러오기
    // ==================================================
    async function loadTravelTalkComments(
        travelTalkItem
    ) {

        if (!travelTalkItem) {
            return;
        }

        const talkId =
            travelTalkItem.dataset.travelTalkId;

        const commentList =
            travelTalkItem.querySelector(
                '.travel-talk-comment-list'
            );

        const commentCount =
            travelTalkItem.querySelector(
                '.travel-talk-comment-count'
            );

        const noComment =
            travelTalkItem.querySelector(
                '.travel-talk-no-comment'
            );

        if (!commentList) {
            return;
        }

        try {

            const response = await fetch(
                `/homepage/trip_location/feature/travel-talk/comment/${talkId}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    '댓글 조회 실패:',
                    data
                );
                return;
            }

            // 기존 댓글만 제거
            commentList
                .querySelectorAll(
                    '.travel-talk-comment-item'
                )
                .forEach(function(item) {
                    item.remove();
                });

            data.comments.forEach(
                function(comment) {

                    const commentItem =
                        document.createElement('div');

                    commentItem.classList.add(
                        'travel-talk-comment-item'
                    );

                    commentItem.dataset.commentId =
                        comment.id;

                    commentItem.innerHTML = `
                        <div class="travel-talk-comment-header">
    
                            <div class="travel-talk-comment-user-area">
    
                                <span class="travel-talk-comment-avatar">
                                    👤
                                </span>
    
                                <span class="travel-talk-comment-user"></span>
    
                            </div>
    
                            <span class="travel-talk-comment-date"></span>
    
                        </div>
    
                        <div class="travel-talk-comment-body">
    
                            <p class="travel-talk-comment-text"></p>
    
                            <button
                                type="button"
                                class="travel-talk-comment-report">
                                🚨 신고
                            </button>
    
                            ${
                                comment.is_owner
                                    ? `
                                        <div class="comment-owner-menu">
    
                                            <button
                                                type="button"
                                                class="comment-more-button">
                                                ⋯
                                            </button>
    
                                            <div class="comment-more-menu">
    
                                                <button
                                                    type="button"
                                                    class="comment-edit-button">
                                                    수정
                                                </button>
    
                                                <button
                                                    type="button"
                                                    class="comment-delete-button">
                                                    삭제
                                                </button>
    
                                            </div>
    
                                        </div>
                                    `
                                    : ''
                            }
    
                        </div>
                    `;

                    commentItem.querySelector(
                        '.travel-talk-comment-user'
                    ).textContent =
                        comment.nickname;

                    commentItem.querySelector(
                        '.travel-talk-comment-text'
                    ).textContent =
                        comment.content;

                    commentItem.querySelector(
                        '.travel-talk-comment-date'
                    ).textContent =
                        formatPostDate(
                            new Date(
                                comment.created_at
                            )
                        );

                    commentList.appendChild(
                        commentItem
                    );
                }
            );

            if (commentCount) {
                commentCount.textContent =
                    data.comments.length;
            }

            if (noComment) {
                noComment.style.display =
                    data.comments.length === 0
                        ? ''
                        : 'none';
            }

        } catch (error) {

            console.error(
                '댓글 목록 불러오기 실패:',
                error
            );
        }
    }

    // ==================================================
    // 7. 여행톡 댓글
    // ==================================================

    if (travelTalkList) {

        travelTalkList.addEventListener('click', function(event) {

            // ------------------------------------------
            // 댓글 버튼 클릭 → 댓글 영역 열기 / 닫기
            // ------------------------------------------

            const commentButton =
                event.target.closest('.travel-talk-comment');


            if (commentButton) {

                const travelTalkItem =
                    commentButton.closest('.travel-talk-item');

                if (!travelTalkItem) {
                    return;
                }


                const commentSection =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-section'
                    );


                if (!commentSection) {
                    return;
                }


                commentSection.classList.toggle('active');


                // 열렸을 때 DB 댓글 불러오기 + 입력창에 바로 커서
                if (commentSection.classList.contains('active')) {

                    loadTravelTalkComments(
                        travelTalkItem
                    );

                    const commentInput =
                        commentSection.querySelector(
                            '.travel-talk-comment-input'
                        );

                    if (commentInput) {
                        commentInput.focus();
                    }
                }
                return;
            }



            // ------------------------------------------
            // 댓글 등록
            // ------------------------------------------

            const commentSubmit =
                event.target.closest(
                    '.travel-talk-comment-submit'
                );


            if (commentSubmit) {

                if (!checkLogin()) {
                    return;
                }


                const travelTalkItem =
                    commentSubmit.closest('.travel-talk-item');


                if (!travelTalkItem) {
                    return;
                }


                const commentInput =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-input'
                    );

                const commentList =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-list'
                    );

                const noComment =
                    travelTalkItem.querySelector(
                        '.travel-talk-no-comment'
                    );

                const commentCount =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-count'
                    );

                const textCount =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-text-count'
                    );


                const commentText =
                    commentInput.value.trim();


                if (commentText === '') {

                    alert('댓글 내용을 입력해주세요.');

                    commentInput.focus();

                    return;
                }

                // ==========================================
                // 댓글 수정 완료 - DB 수정
                // ==========================================
                if (editingCommentItem) {

                    const commentId =
                        editingCommentItem.dataset.commentId;

                    fetch(
                        `/homepage/trip_location/feature/travel-talk/comment/edit/${commentId}`,
                        {
                            method: 'POST',

                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrfToken
                            },

                            body: JSON.stringify({
                                content: commentText
                            })
                        }
                    )
                        .then(function (response) {

                            return response.json().then(
                                function (data) {

                                    return {
                                        ok: response.ok,
                                        data: data
                                    };
                                }
                            );

                        })

                        .then(function (result) {

                            if (!result.ok) {

                                alert(
                                    result.data.message ||
                                    '댓글 수정 중 오류가 발생했습니다.'
                                );

                                return;
                            }

                            // 입력창 초기화
                            commentInput.value = '';

                            if (textCount) {
                                textCount.textContent = '0';
                            }

                            commentSubmit.textContent = '등록';


                            // 취소 버튼 제거
                            const cancelButton =
                                travelTalkItem.querySelector(
                                    '.travel-talk-comment-edit-cancel'
                                );

                            if (cancelButton) {
                                cancelButton.remove();
                            }


                            // 수정 상태 초기화
                            editingCommentItem = null;
                            editingCommentOriginalParent = null;
                            editingCommentOriginalNext = null;
                            editingCommentTravelTalkItem = null;


                            // DB 댓글 다시 불러오기
                            loadTravelTalkComments(
                                travelTalkItem
                            );

                        })

                        .catch(function (error) {

                            console.error(
                                '댓글 수정 실패:',
                                error
                            );

                            alert(
                                '댓글 수정 중 오류가 발생했습니다.'
                            );

                        });

                    return;
                }
                            // ==========================================
                            // 새 댓글 등록 - DB 저장
                            // ==========================================

                            const talkId =
                                travelTalkItem.dataset.travelTalkId;

                            fetch(
                                `/homepage/trip_location/feature/travel-talk/comment/${talkId}`,
                                {
                                    method: 'POST',

                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrfToken
                                    },

                                    body: JSON.stringify({
                                        content: commentText
                                    })
                                }
                            )
                                .then(function(response) {

                                    return response.json().then(
                                        function(data) {

                                            return {
                                                ok: response.ok,
                                                data: data
                                            };
                                        }
                                    );

                                })

                                .then(function(result) {

                                    if (!result.ok) {

                                        alert(
                                            result.data.message ||
                                            '댓글 등록 중 오류가 발생했습니다.'
                                        );

                                        return;
                                    }

                                    // 입력창 초기화
                                    commentInput.value = '';

                                    if (textCount) {
                                        textCount.textContent = '0';
                                    }

                                    // DB에서 댓글 다시 불러오기
                                    loadTravelTalkComments(
                                        travelTalkItem
                                    );

                                })

                                .catch(function(error) {

                                    console.error(
                                        '댓글 등록 실패:',
                                        error
                                    );

                                    alert(
                                        '댓글 등록 중 오류가 발생했습니다.'
                                    );

                                });

                            return;

            }
            // ------------------------------------------
            // 댓글 신고
            // ------------------------------------------

            const commentReport =
                event.target.closest(
                    '.travel-talk-comment-report'
                );


            if (commentReport) {

                if (!checkLogin()) {
                    return;
                }


                const result =
                    confirm('이 댓글을 신고하시겠습니까?');


                if (result) {

                    alert('신고가 접수되었습니다.');

                    commentReport.textContent =
                        '🚨 신고 완료';

                    commentReport.disabled = true;

                }

            }


        // ------------------------------------------
        // 댓글 글자 수
        // ------------------------------------------

        travelTalkList.addEventListener('input', function(event) {

            if (!event.target.classList.contains(
                'travel-talk-comment-input'
            )) {
                return;
            }


            const commentSection =
                event.target.closest(
                    '.travel-talk-comment-section'
                );


            if (!commentSection) {
                return;
            }


            const count =
                commentSection.querySelector(
                    '.travel-talk-comment-text-count'
                );


            if (count) {

                count.textContent =
                    event.target.value.length;

            }

        });
            });

    }

        // ==========================================
        // 여행톡 글 / 댓글 수정·삭제
        // ==========================================

        if (travelTalkList) {

            travelTalkList.addEventListener(
                'click',
                function(event) {

                // ==========================================
                // 여행톡 글 ⋯ 메뉴 열기 / 닫기
                // ==========================================

                const travelTalkMore =
                    event.target.closest('.travel-talk-more');

                if (travelTalkMore) {

                    const ownerMenu =
                        travelTalkMore.closest(
                            '.travel-talk-owner-menu'
                        );

                    const menu =
                        ownerMenu.querySelector(
                            '.travel-talk-more-menu'
                        );

                    menu.classList.toggle('active');

                    return;
                }


        // ==========================================
        // 여행톡 글 수정
        // 선택한 게시글 자리에서 바로 수정
        // ==========================================

        const travelTalkEdit =
            event.target.closest(
                '.travel-talk-edit-button'
            );

        if (travelTalkEdit) {

            const travelTalkItem =
                travelTalkEdit.closest(
                    '.travel-talk-item'
                );

            const titleElement =
                travelTalkItem.querySelector(
                    '.travel-talk-post-title'
                );

            const textElement =
                travelTalkItem.querySelector(
                    '.travel-talk-text'
                );

            // 이미 수정 중이면 중복 생성하지 않기
            if (
                travelTalkItem.querySelector(
                    '.travel-talk-post-edit'
                )
            ) {
                return;
            }

            const oldTitle =
                titleElement.textContent.trim();

            const oldText =
                textElement.textContent.trim();


            // 원래 제목 / 본문 숨기기
            titleElement.style.display = 'none';
            textElement.style.display = 'none';


            // 수정폼 생성
            const editBox =
                document.createElement('div');

            editBox.className =
                'travel-talk-post-edit';

            editBox.innerHTML = `
                <input
                    type="text"
                    class="travel-talk-post-edit-title"
                    maxlength="100"
                    placeholder="제목을 입력해주세요."
                >
        
                <textarea
                    class="travel-talk-post-edit-text"
                    maxlength="500"
                    placeholder="내용을 입력해주세요."
                ></textarea>
        
                <div class="travel-talk-post-edit-bottom">
        
                    <span class="travel-talk-post-edit-counter">
                        <span class="travel-talk-post-edit-count">
                            ${oldText.length}
                        </span>/500
                    </span>
        
                    <button
                        type="button"
                        class="travel-talk-post-edit-cancel">
                        취소
                    </button>
        
                    <button
                        type="button"
                        class="travel-talk-post-edit-save">
                        수정 완료
                    </button>
        
                </div>
            `;


            const editTitle =
                editBox.querySelector(
                    '.travel-talk-post-edit-title'
                );

            const editText =
                editBox.querySelector(
                    '.travel-talk-post-edit-text'
                );


            // 기존 글 내용 넣기
            editTitle.value = oldTitle;
            editText.value = oldText;


            // 제목 자리에 수정폼 넣기
            titleElement.before(editBox);


            // ⋯ 메뉴 닫기
            const menu =
                travelTalkItem.querySelector(
                    '.travel-talk-more-menu'
                );

            if (menu) {
                menu.classList.remove('active');
            }


            editTitle.focus();

            return;
        }

        // ==========================================
        // 여행톡 글 수정 취소
        // ==========================================

        const travelTalkEditCancel =
            event.target.closest(
                '.travel-talk-post-edit-cancel'
            );

        if (travelTalkEditCancel) {

            const travelTalkItem =
                travelTalkEditCancel.closest(
                    '.travel-talk-item'
                );

            travelTalkItem.querySelector(
                '.travel-talk-post-title'
            ).style.display = '';

            travelTalkItem.querySelector(
                '.travel-talk-text'
            ).style.display = '';

            travelTalkEditCancel
                .closest('.travel-talk-post-edit')
                .remove();

            return;
        }


        // ==========================================
        // 여행톡 글 수정 완료
        // ==========================================

        const travelTalkEditSave =
            event.target.closest(
                '.travel-talk-post-edit-save'
            );

        if (travelTalkEditSave) {

        const travelTalkItem =
            travelTalkEditSave.closest(
                '.travel-talk-item'
            );

        const talkId =
            travelTalkItem.dataset.travelTalkId;

        const editBox =
            travelTalkEditSave.closest(
                '.travel-talk-post-edit'
            );

        const newTitle =
            editBox.querySelector(
                '.travel-talk-post-edit-title'
            ).value.trim();

        const newText =
            editBox.querySelector(
                '.travel-talk-post-edit-text'
            ).value.trim();


        if (newTitle === '') {

            alert('제목을 입력해주세요.');

            editBox.querySelector(
                '.travel-talk-post-edit-title'
            ).focus();

            return;
        }


        if (newText === '') {

            alert('내용을 입력해주세요.');

            editBox.querySelector(
                '.travel-talk-post-edit-text'
            ).focus();

            return;
        }


        fetch(
            `/homepage/trip_location/feature/travel-talk/edit/${talkId}`,
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },

                body: JSON.stringify({
                    title: newTitle,
                    content: newText
                })
            }
        )
            .then(function(response) {

                return response.json().then(
                    function(data) {

                        return {
                            ok: response.ok,
                            data: data
                        };
                    }
                );

            })

            .then(function(result) {

                if (!result.ok) {

                    alert(
                        result.data.message ||
                        '여행톡 수정 중 오류가 발생했습니다.'
                    );

                    return;
                }

                // 수정된 DB 내용 다시 불러오기
                loadTravelTalks();

            })

            .catch(function(error) {

                console.error(
                    '여행톡 수정 실패:',
                    error
                );

                alert(
                    '여행톡 수정 중 오류가 발생했습니다.'
                );

            });

        return;
    }


            // ==========================================
            // 여행톡 글 삭제 - DB 삭제
            // ==========================================

            const travelTalkDelete =
                event.target.closest(
                    '.travel-talk-delete-button'
                );

            if (travelTalkDelete) {

                if (!checkLogin()) {
                    return;
                }

                const travelTalkItem =
                    travelTalkDelete.closest(
                        '.travel-talk-item'
                    );

                const talkId =
                    travelTalkItem.dataset.travelTalkId;

                const result =
                    confirm('이 게시글을 삭제하시겠습니까?');

                if (!result) {
                    return;
                }

                fetch(
                    `/homepage/trip_location/feature/travel-talk/delete/${talkId}`,
                    {
                        method: 'POST',

                        headers: {
                            'X-CSRFToken': csrfToken
                        }
                    }
                )
                    .then(function(response) {

                        return response.json().then(
                            function(data) {

                                return {
                                    ok: response.ok,
                                    data: data
                                };
                            }
                        );

                    })

                    .then(function(result) {

                        if (!result.ok) {

                            alert(
                                result.data.message ||
                                '여행톡 삭제 중 오류가 발생했습니다.'
                            );

                            return;
                        }

                        // DB에서 여행톡 목록 다시 불러오기
                        loadTravelTalks();

                    })

                    .catch(function(error) {

                        console.error(
                            '여행톡 삭제 실패:',
                            error
                        );

                        alert(
                            '여행톡 삭제 중 오류가 발생했습니다.'
                        );

                    });

                return;
            }



            // ==========================================
            // 댓글 ⋯ 메뉴
            // ==========================================

            const commentMore =
                event.target.closest('.comment-more-button');


            if (commentMore) {

                const menu =
                    commentMore
                        .closest('.comment-owner-menu')
                        .querySelector('.comment-more-menu');


                menu.classList.toggle('active');

                return;
            }


            // ==========================================
            // 여행톡 게시글 수정 글자 수 실시간 표시
            // ==========================================

            if (travelTalkList) {

                travelTalkList.addEventListener(
                    'input',
                    function(event) {

                        if (
                            !event.target.classList.contains(
                                'travel-talk-post-edit-text'
                            )
                        ) {
                            return;
                        }

                        const editBox =
                            event.target.closest(
                                '.travel-talk-post-edit'
                            );

                        const count =
                            editBox.querySelector(
                                '.travel-talk-post-edit-count'
                            );

                        if (count) {

                            count.textContent =
                                event.target.value.length;

                        }

                    }
                );

            }


            // ==========================================
            // 댓글 수정
            // 원래 댓글 등록폼 재사용
            // ==========================================

            const commentEdit =
                event.target.closest('.comment-edit-button');


            if (commentEdit) {

                const commentItem =
                    commentEdit.closest(
                        '.travel-talk-comment-item'
                    );

                const travelTalkItem =
                    commentEdit.closest(
                        '.travel-talk-item'
                    );


                if (!commentItem || !travelTalkItem) {
                    return;
                }


                const textElement =
                    commentItem.querySelector(
                        '.travel-talk-comment-text'
                    );


                const commentSection =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-section'
                    );


                const commentList =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-list'
                    );


                const commentWrite =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-write'
                    );


                const commentInput =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-input'
                    );


                const commentSubmit =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-submit'
                    );


                const textCount =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-text-count'
                    );


                if (
                    !textElement ||
                    !commentList ||
                    !commentWrite ||
                    !commentInput ||
                    !commentSubmit
                ) {
                    return;
                }


                // ==========================================
                // 이미 다른 댓글 수정 중이면
                // 먼저 원래 자리로 돌려놓기
                // ==========================================

                if (
                    editingCommentItem &&
                    editingCommentItem !== commentItem &&
                    editingCommentOriginalParent
                ) {

                    if (
                        editingCommentOriginalNext &&
                        editingCommentOriginalNext.parentNode ===
                            editingCommentOriginalParent
                    ) {

                        editingCommentOriginalParent.insertBefore(
                            editingCommentItem,
                            editingCommentOriginalNext
                        );

                    } else {

                        editingCommentOriginalParent.appendChild(
                            editingCommentItem
                        );
                    }
                }


                // ==========================================
                // 원래 댓글 위치 기억
                // ==========================================

                editingCommentItem = commentItem;

                editingCommentOriginalParent =
                    commentItem.parentNode;

                editingCommentOriginalNext =
                    commentItem.nextElementSibling;

                editingCommentTravelTalkItem =
                    travelTalkItem;


                // 기존 댓글 내용
                const oldText =
                    textElement.textContent.trim();


                // ==========================================
                // 수정할 댓글을 등록폼 바로 위로 이동
                // ==========================================

                commentList.appendChild(
                    commentItem
                );


                // 댓글 영역 열기
                if (commentSection) {
                    commentSection.classList.add('active');
                }


                // 원래 댓글 입력창에 내용 넣기
                commentInput.value = oldText;


                if (textCount) {
                    textCount.textContent =
                        oldText.length;
                }


                // 등록 → 수정 완료
                commentSubmit.textContent =
                    '수정 완료';


                // 기존 취소 버튼 제거
                const oldCancel =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-edit-cancel'
                    );

                if (oldCancel) {
                    oldCancel.remove();
                }


                // ==========================================
                // 취소 버튼 생성
                // ==========================================

                const cancelButton =
                    document.createElement('button');

                cancelButton.type = 'button';

                cancelButton.className =
                    'travel-talk-comment-edit-cancel';

                cancelButton.textContent =
                    '취소';


                commentSubmit.before(
                    cancelButton
                );


                // ==========================================
                // 수정 취소
                // ==========================================

                cancelButton.addEventListener(
                    'click',
                    function() {

                        // 댓글 원래 위치 복귀
                        if (editingCommentOriginalParent) {

                            if (
                                editingCommentOriginalNext &&
                                editingCommentOriginalNext.parentNode ===
                                    editingCommentOriginalParent
                            ) {

                                editingCommentOriginalParent.insertBefore(
                                    commentItem,
                                    editingCommentOriginalNext
                                );

                            } else {

                                editingCommentOriginalParent.appendChild(
                                    commentItem
                                );
                            }
                        }


                        // 입력창 초기화
                        commentInput.value = '';

                        if (textCount) {
                            textCount.textContent = '0';
                        }

                        commentSubmit.textContent =
                            '등록';


                        cancelButton.remove();


                        // 수정 상태 초기화
                        editingCommentItem = null;
                        editingCommentOriginalParent = null;
                        editingCommentOriginalNext = null;
                        editingCommentTravelTalkItem = null;


                        commentInput.focus();
                    }
                );


                // ⋯ 메뉴 닫기
                const menu =
                    commentItem.querySelector(
                        '.comment-more-menu'
                    );

                if (menu) {
                    menu.classList.remove('active');
                }


                commentInput.focus();

                return;
            }



            // ==========================================
            // 댓글 삭제 - DB 삭제
            // ==========================================

            const commentDelete =
                event.target.closest(
                    '.comment-delete-button'
                );


            if (commentDelete) {

                if (!checkLogin()) {
                    return;
                }


                const commentItem =
                    commentDelete.closest(
                        '.travel-talk-comment-item'
                    );


                const travelTalkItem =
                    commentDelete.closest(
                        '.travel-talk-item'
                    );


                if (!commentItem || !travelTalkItem) {
                    return;
                }


                const commentId =
                    commentItem.dataset.commentId;


                const result =
                    confirm(
                        '이 댓글을 삭제하시겠습니까?'
                    );


                if (!result) {
                    return;
                }


                fetch(
                    `/homepage/trip_location/feature/travel-talk/comment/delete/${commentId}`,
                    {
                        method: 'POST',

                        headers: {
                            'X-CSRFToken': csrfToken
                        }
                    }
                )
                    .then(function(response) {

                        return response.json().then(
                            function(data) {

                                return {
                                    ok: response.ok,
                                    data: data
                                };
                            }
                        );

                    })

                    .then(function(result) {

                        if (!result.ok) {

                            alert(
                                result.data.message ||
                                '댓글 삭제 중 오류가 발생했습니다.'
                            );

                            return;
                        }


                        // DB 댓글 다시 불러오기
                        loadTravelTalkComments(
                            travelTalkItem
                        );

                    })

                    .catch(function(error) {

                        console.error(
                            '댓글 삭제 실패:',
                            error
                        );

                        alert(
                            '댓글 삭제 중 오류가 발생했습니다.'
                        );

                    });


                return;
            }
                }
            );

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

                // ================================
                // 13. 상세페이지 기본정보 지도
                // ================================

                const detailMapElement =
                    document.querySelector('.detail-map');

                if (detailMapElement && typeof L !== 'undefined') {

                    const latitude =
                        parseFloat(detailMapElement.dataset.lat);

                    const longitude =
                        parseFloat(detailMapElement.dataset.lng);

                    const placeTitle =
                        detailMapElement.dataset.title || '여행지';

                    if (
                        Number.isFinite(latitude) &&
                        Number.isFinite(longitude)
                    ) {

                        const detailMap =
                            L.map(detailMapElement, {
                                zoomControl: true,
                                scrollWheelZoom: true,
                                dragging: true,
                                attributionControl: false
                            }).setView(
                                [latitude, longitude],
                                15
                            );

                        L.tileLayer(
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            {
                                maxZoom: 19
                            }
                        ).addTo(detailMap);

                        L.marker(
                            [latitude, longitude]
                        )
                            .addTo(detailMap)
                            .bindPopup(placeTitle)
                            .openPopup();
                    }
                }

    });  // ← DOMContentLoaded 끝
