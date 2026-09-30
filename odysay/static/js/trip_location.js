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
        // 4. 리뷰 / 커뮤니티 공통 기능
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


        // 리뷰 등록
        if (reviewSubmit) {

            reviewSubmit.addEventListener('click', function() {

                if (!checkLogin()) {
                    return;
                }


                const reviewText =
                    reviewInput.value.trim();


                if (selectedReviewScore === 0) {

                    alert('별점을 선택해주세요.');

                    return;
                }


                if (reviewText === '') {

                    alert('리뷰 내용을 입력해주세요.');

                    reviewInput.focus();

                    return;
                }


                if (noReviewMessage) {
                    noReviewMessage.style.display = 'none';
                }


                const reviewItem =
                    document.createElement('div');

                reviewItem.classList.add('review-item');


                reviewItem.innerHTML = `
                    <div class="review-header">
    
                        <div class="review-user-area">
    
                            <span class="review-avatar">
                                👤
                            </span>
    
                            <span class="review-user"></span>
    
                            ${getAuthorBadge()}
    
                            <span class="review-rating">
                                ★ ${selectedReviewScore.toFixed(1)}
                            </span>
    
                        </div>
    
                        <span class="review-date">
                            ${formatPostDate(new Date())}
                        </span>
    
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
                ).textContent =
                    currentUser.nickname;


                reviewItem.querySelector(
                    '.review-text'
                ).textContent =
                    reviewText;


                reviewList.appendChild(reviewItem);


                reviewTotal++;

                reviewScoreCounts[
                    selectedReviewScore
                ]++;


                updateReviewSummary();


                // 입력 초기화
                reviewInput.value = '';

                reviewTextCount.textContent = '0';

                selectedReviewScore = 0;

                selectedScoreText.textContent = '0.0';


                reviewStars.forEach(function(star) {

                    star.classList.remove('active');

                });


                reviewWrite.classList.remove('active');

            });

        }


        // 리뷰 추천 / 신고
        if (reviewList) {

            reviewList.addEventListener('click', function(event) {

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


        updateReviewSummary();



        // ==================================================
        // 6. 커뮤니티
        // ==================================================

        const communityOpenButton =
            document.getElementById(
                'communityOpenButton'
            );

        const communityWrite =
            document.getElementById(
                'communityWrite'
            );

        const communityTitle =
            document.getElementById(
                'communityTitle'
            );

        const communityInput =
            document.getElementById(
                'communityInput'
            );

        const communityTextCount =
            document.getElementById(
                'communityTextCount'
            );

        const communitySubmit =
            document.getElementById(
                'communitySubmit'
            );

        const communityList =
            document.getElementById(
                'communityList'
            );

        const communityCount =
            document.getElementById(
                'communityCount'
            );

        const noCommunityMessage =
            document.getElementById(
                'noCommunityMessage'
            );


        let communityTotal = 0;


        // 글 작성창 열기
        if (communityOpenButton &&
            communityWrite) {

            communityOpenButton.addEventListener(
                'click',
                function() {

                    if (!checkLogin()) {
                        return;
                    }

                    communityWrite.classList.toggle(
                        'active'
                    );

                }
            );

        }


        // 커뮤니티 글자 수
        if (communityInput &&
            communityTextCount) {

            communityInput.addEventListener(
                'input',
                function() {

                    communityTextCount.textContent =
                        communityInput.value.length;

                }
            );

        }


        // 커뮤니티 글 등록
        if (communitySubmit) {

            communitySubmit.addEventListener(
                'click',
                function() {

                    if (!checkLogin()) {
                        return;
                    }


                    const title =
                        communityTitle.value.trim();

                    const text =
                        communityInput.value.trim();


                    if (title === '') {

                        alert('제목을 입력해주세요.');

                        communityTitle.focus();

                        return;
                    }


                    if (text === '') {

                        alert('내용을 입력해주세요.');

                        communityInput.focus();

                        return;
                    }


                    if (noCommunityMessage) {

                        noCommunityMessage.style.display =
                            'none';

                    }

                    const communityItem =
                        document.createElement('article');

                    communityItem.classList.add(
                        'community-item'
                    );


                    communityItem.innerHTML = `
                        <div class="community-header">
    
                            <div class="community-user-area">
    
                                <span class="community-avatar">
                                    👤
                                </span>
    
                                <span class="community-user"></span>
    
                                ${getAuthorBadge()}
    
                            </div>
    
                            <span class="community-date">
                                ${formatPostDate(new Date())}
                            </span>
    
                        </div>
    
    
                        <h3 class="community-post-title"></h3>
    
    
                        <p class="community-text"></p>
    
    
                        <div class="community-actions">
    
                            <button
                                type="button"
                                class="community-action-button community-like">
    
                                ♡
                                <span class="community-like-count">
                                    0
                                </span>
    
                            </button>
    
                            <button
                                type="button"
                                class="community-action-button community-comment">
    
                                💬
                                <span class="community-comment-count">
                                    0
                                </span>
    
                            </button>
    
                            <button
                                type="button"
                                class="community-action-button community-report">
    
                                🚨 신고
    
                            </button>
    
                            <div class="community-owner-menu">

                            <button
                                type="button"
                                class="community-more"
                                aria-label="더보기">
                                ⋯
                            </button>
                        
                            <div class="community-more-menu">
                        
                                <button
                                    type="button"
                                    class="community-edit-button">
                                    수정
                                </button>
                        
                                <button
                                    type="button"
                                    class="community-delete-button">
                                    삭제
                                </button>
                        
                            </div>
                        
                        </div>
                            
                                                    </div>


                        <!-- 댓글 영역 : 처음에는 숨김 -->
                        <div class="community-comment-section">

                            <div class="community-comment-list">

                                <p class="community-no-comment">
                                    아직 등록된 댓글이 없습니다.
                                </p>

                            </div>


                            <div class="community-comment-write">

                                <textarea
                                    class="community-comment-input"
                                    maxlength="200"
                                    placeholder="댓글을 입력해주세요."></textarea>

                                <div class="community-comment-write-bottom">

                                    <span class="community-comment-counter">
                                        <span class="community-comment-text-count">0</span>/200
                                    </span>

                                    <button
                                        type="button"
                                        class="community-comment-submit">
                                        등록
                                    </button>

                                </div>

                            </div>

                        </div>
                    `;


                    communityItem.querySelector(
                        '.community-user'
                    ).textContent =
                        currentUser.nickname;


                    communityItem.querySelector(
                        '.community-post-title'
                    ).textContent =
                        title;


                    communityItem.querySelector(
                        '.community-text'
                    ).textContent =
                        text;


                    communityList.appendChild(
                        communityItem
                    );


                    communityTotal++;

                    communityCount.textContent =
                        communityTotal;


                    // 입력 초기화
                    communityTitle.value = '';

                    communityInput.value = '';

                    communityTextCount.textContent =
                        '0';

                    communityWrite.classList.remove(
                        'active'
                    );

                }
            );

        }


        // 커뮤니티 좋아요 / 신고
        if (communityList) {

            communityList.addEventListener(
                'click',
                function(event) {

                    const likeButton =
                        event.target.closest(
                            '.community-like'
                        );


                    if (likeButton) {

                        if (!checkLogin()) {
                            return;
                        }


                        const count =
                            likeButton.querySelector(
                                '.community-like-count'
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
                            '.community-report'
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
    // 7. 커뮤니티 댓글
    // ==================================================

    if (communityList) {

        communityList.addEventListener('click', function(event) {

            // ------------------------------------------
            // 댓글 버튼 클릭 → 댓글 영역 열기 / 닫기
            // ------------------------------------------

            const commentButton =
                event.target.closest('.community-comment');


            if (commentButton) {

                const communityItem =
                    commentButton.closest('.community-item');

                if (!communityItem) {
                    return;
                }


                const commentSection =
                    communityItem.querySelector(
                        '.community-comment-section'
                    );


                if (!commentSection) {
                    return;
                }


                commentSection.classList.toggle('active');


                // 열렸을 때 입력창에 바로 커서
                if (commentSection.classList.contains('active')) {

                    const commentInput =
                        commentSection.querySelector(
                            '.community-comment-input'
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
                    '.community-comment-submit'
                );


            if (commentSubmit) {

                if (!checkLogin()) {
                    return;
                }


                const communityItem =
                    commentSubmit.closest('.community-item');


                if (!communityItem) {
                    return;
                }


                const commentInput =
                    communityItem.querySelector(
                        '.community-comment-input'
                    );

                const commentList =
                    communityItem.querySelector(
                        '.community-comment-list'
                    );

                const noComment =
                    communityItem.querySelector(
                        '.community-no-comment'
                    );

                const commentCount =
                    communityItem.querySelector(
                        '.community-comment-count'
                    );

                const textCount =
                    communityItem.querySelector(
                        '.community-comment-text-count'
                    );


                const commentText =
                    commentInput.value.trim();


                if (commentText === '') {

                    alert('댓글 내용을 입력해주세요.');

                    commentInput.focus();

                    return;
                }


                // 첫 댓글이면 빈 문구 숨기기
                if (noComment) {
                    noComment.style.display = 'none';
                }


                const commentItem =
                    document.createElement('div');


                commentItem.classList.add(
                    'community-comment-item'
                );


                commentItem.innerHTML = `
                    <div class="community-comment-header">

                        <div class="community-comment-user-area">

                            <span class="community-comment-avatar">
                                👤
                            </span>

                            <span class="community-comment-user"></span>

                            ${getAuthorBadge()}

                        </div>


                        <span class="community-comment-date">
                            ${formatPostDate(new Date())}
                        </span>

                    </div>


                    <div class="community-comment-body">

                        <p class="community-comment-text"></p>

                        <button
                            type="button"
                            class="community-comment-report">

                            🚨 신고

                        </button>
                        
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

                    </div>
                `;


                commentItem.querySelector(
                    '.community-comment-user'
                ).textContent =
                    currentUser.nickname;


                commentItem.querySelector(
                    '.community-comment-text'
                ).textContent =
                    commentText;


                commentList.appendChild(
                    commentItem
                );


                // 댓글 개수 증가
                if (commentCount) {

                    const currentCount =
                        Number(commentCount.textContent) || 0;

                    commentCount.textContent =
                        currentCount + 1;

                }


                // 입력창 초기화
                commentInput.value = '';


                if (textCount) {
                    textCount.textContent = '0';
                }


                return;
            }



            // ------------------------------------------
            // 댓글 신고
            // ------------------------------------------

            const commentReport =
                event.target.closest(
                    '.community-comment-report'
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

        });



        // ------------------------------------------
        // 댓글 글자 수
        // ------------------------------------------

        communityList.addEventListener('input', function(event) {

            if (!event.target.classList.contains(
                'community-comment-input'
            )) {
                return;
            }


            const commentSection =
                event.target.closest(
                    '.community-comment-section'
                );


            if (!commentSection) {
                return;
            }


            const count =
                commentSection.querySelector(
                    '.community-comment-text-count'
                );


            if (count) {

                count.textContent =
                    event.target.value.length;

            }

        });

    }

        // ==========================================
        // 커뮤니티 글 / 댓글 수정·삭제
        // ==========================================

        if (communityList) {

            communityList.addEventListener(
                'click',
                function(event) {

                // ==========================================
                // 커뮤니티 글 ⋯ 메뉴 열기 / 닫기
                // ==========================================

                const communityMore =
                    event.target.closest('.community-more');

                if (communityMore) {

                    const ownerMenu =
                        communityMore.closest(
                            '.community-owner-menu'
                        );

                    const menu =
                        ownerMenu.querySelector(
                            '.community-more-menu'
                        );

                    menu.classList.toggle('active');

                    return;
                }


        // ==========================================
        // 커뮤니티 글 수정
        // 선택한 게시글 자리에서 바로 수정
        // ==========================================

        const communityEdit =
            event.target.closest(
                '.community-edit-button'
            );

        if (communityEdit) {

            const communityItem =
                communityEdit.closest(
                    '.community-item'
                );

            const titleElement =
                communityItem.querySelector(
                    '.community-post-title'
                );

            const textElement =
                communityItem.querySelector(
                    '.community-text'
                );

            // 이미 수정 중이면 중복 생성하지 않기
            if (
                communityItem.querySelector(
                    '.community-post-edit'
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
                'community-post-edit';

            editBox.innerHTML = `
                <input
                    type="text"
                    class="community-post-edit-title"
                    maxlength="100"
                    placeholder="제목을 입력해주세요."
                >
        
                <textarea
                    class="community-post-edit-text"
                    maxlength="500"
                    placeholder="내용을 입력해주세요."
                ></textarea>
        
                <div class="community-post-edit-bottom">
        
                    <span class="community-post-edit-counter">
                        <span class="community-post-edit-count">
                            ${oldText.length}
                        </span>/500
                    </span>
        
                    <button
                        type="button"
                        class="community-post-edit-cancel">
                        취소
                    </button>
        
                    <button
                        type="button"
                        class="community-post-edit-save">
                        수정 완료
                    </button>
        
                </div>
            `;


            const editTitle =
                editBox.querySelector(
                    '.community-post-edit-title'
                );

            const editText =
                editBox.querySelector(
                    '.community-post-edit-text'
                );


            // 기존 글 내용 넣기
            editTitle.value = oldTitle;
            editText.value = oldText;


            // 제목 자리에 수정폼 넣기
            titleElement.before(editBox);


            // ⋯ 메뉴 닫기
            const menu =
                communityItem.querySelector(
                    '.community-more-menu'
                );

            if (menu) {
                menu.classList.remove('active');
            }


            editTitle.focus();

            return;
        }

        // ==========================================
        // 커뮤니티 글 수정 취소
        // ==========================================

        const communityEditCancel =
            event.target.closest(
                '.community-post-edit-cancel'
            );

        if (communityEditCancel) {

            const communityItem =
                communityEditCancel.closest(
                    '.community-item'
                );

            communityItem.querySelector(
                '.community-post-title'
            ).style.display = '';

            communityItem.querySelector(
                '.community-text'
            ).style.display = '';

            communityEditCancel
                .closest('.community-post-edit')
                .remove();

            return;
        }


        // ==========================================
        // 커뮤니티 글 수정 완료
        // ==========================================

        const communityEditSave =
            event.target.closest(
                '.community-post-edit-save'
            );

        if (communityEditSave) {

            const communityItem =
                communityEditSave.closest(
                    '.community-item'
                );

            const editBox =
                communityEditSave.closest(
                    '.community-post-edit'
                );

            const newTitle =
                editBox.querySelector(
                    '.community-post-edit-title'
                ).value.trim();

            const newText =
                editBox.querySelector(
                    '.community-post-edit-text'
                ).value.trim();


            if (newTitle === '') {

                alert('제목을 입력해주세요.');

                editBox.querySelector(
                    '.community-post-edit-title'
                ).focus();

                return;
            }


            if (newText === '') {

                alert('내용을 입력해주세요.');

                editBox.querySelector(
                    '.community-post-edit-text'
                ).focus();

                return;
            }


            const titleElement =
                communityItem.querySelector(
                    '.community-post-title'
                );

            const textElement =
                communityItem.querySelector(
                    '.community-text'
                );


            titleElement.textContent = newTitle;
            textElement.textContent = newText;

            titleElement.style.display = '';
            textElement.style.display = '';


            // 수정 시간으로 변경
            const dateElement =
                communityItem.querySelector(
                    '.community-date'
                );

            if (dateElement) {

                dateElement.textContent =
                    formatPostDate(new Date());

            }


            editBox.remove();

            return;
        }

            // ==========================================
            // 커뮤니티 글 삭제
            // ==========================================

            const communityDelete =
                event.target.closest(
                    '.community-delete-button'
                );


            if (communityDelete) {

                const result =
                    confirm('이 게시글을 삭제하시겠습니까?');


                if (!result) {
                    return;
                }


                const communityItem =
                    communityDelete.closest(
                        '.community-item'
                    );


                communityItem.remove();


                communityTotal =
                    Math.max(0, communityTotal - 1);


                if (communityCount) {

                    communityCount.textContent =
                        communityTotal;

                }


                if (
                    communityTotal === 0 &&
                    noCommunityMessage
                ) {

                    noCommunityMessage.style.display =
                        '';

                }


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
            // 커뮤니티 게시글 수정 글자 수 실시간 표시
            // ==========================================

            if (communityList) {

                communityList.addEventListener(
                    'input',
                    function(event) {

                        if (
                            !event.target.classList.contains(
                                'community-post-edit-text'
                            )
                        ) {
                            return;
                        }

                        const editBox =
                            event.target.closest(
                                '.community-post-edit'
                            );

                        const count =
                            editBox.querySelector(
                                '.community-post-edit-count'
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
            // ==========================================

            const commentEdit =
                event.target.closest('.comment-edit-button');


            if (commentEdit) {

                const commentItem =
                    commentEdit.closest(
                        '.community-comment-item'
                    );


                const textElement =
                    commentItem.querySelector(
                        '.community-comment-text'
                    );


                if (
                    commentItem.querySelector(
                        '.comment-inline-edit'
                    )
                ) {
                    return;
                }


                const oldText =
                    textElement.textContent.trim();


                textElement.style.display = 'none';


                const editBox =
                    document.createElement('div');


                editBox.className =
                    'comment-inline-edit';


                editBox.innerHTML = `
                    <textarea
                        class="comment-edit-text"
                        maxlength="200"></textarea>

                    <div class="comment-edit-actions">

                        <button
                            type="button"
                            class="comment-edit-cancel">
                            취소
                        </button>

                        <button
                            type="button"
                            class="comment-edit-save">
                            수정 완료
                        </button>

                    </div>
                `;


                editBox.querySelector(
                    '.comment-edit-text'
                ).value = oldText;


                textElement.after(editBox);


                const menu =
                    commentItem.querySelector(
                        '.comment-more-menu'
                    );

                if (menu) {
                    menu.classList.remove('active');
                }


                return;
            }



            // ==========================================
            // 댓글 수정 취소
            // ==========================================

            const commentCancel =
                event.target.closest('.comment-edit-cancel');


            if (commentCancel) {

                const commentItem =
                    commentCancel.closest(
                        '.community-comment-item'
                    );


                commentItem.querySelector(
                    '.community-comment-text'
                ).style.display = '';


                commentCancel
                    .closest('.comment-inline-edit')
                    .remove();


                return;
            }



            // ==========================================
            // 댓글 수정 완료
            // ==========================================

            const commentSave =
                event.target.closest('.comment-edit-save');


            if (commentSave) {

                const commentItem =
                    commentSave.closest(
                        '.community-comment-item'
                    );


                const editBox =
                    commentSave.closest(
                        '.comment-inline-edit'
                    );


                const newText =
                    editBox.querySelector(
                        '.comment-edit-text'
                    ).value.trim();


                if (newText === '') {

                    alert('댓글 내용을 입력해주세요.');

                    return;
                }


                const textElement =
                    commentItem.querySelector(
                        '.community-comment-text'
                    );


                textElement.textContent = newText;
                textElement.style.display = '';


                editBox.remove();


                return;
            }



            // ==========================================
            // 댓글 삭제
            // ==========================================

            const commentDelete =
                event.target.closest('.comment-delete-button');


            if (commentDelete) {

                const result =
                    confirm('이 댓글을 삭제하시겠습니까?');


                if (!result) {
                    return;
                }


                const commentItem =
                    commentDelete.closest(
                        '.community-comment-item'
                    );


                const communityItem =
                    commentDelete.closest(
                        '.community-item'
                    );


                const commentCount =
                    communityItem.querySelector(
                        '.community-comment-count'
                    );


                commentItem.remove();


                if (commentCount) {

                    const current =
                        Number(commentCount.textContent) || 0;

                    commentCount.textContent =
                        Math.max(0, current - 1);

                }


                const commentList =
                    communityItem.querySelector(
                        '.community-comment-list'
                    );


                const remaining =
                    commentList.querySelectorAll(
                        '.community-comment-item'
                    ).length;


                if (remaining === 0) {

                    const noComment =
                        communityItem.querySelector(
                            '.community-no-comment'
                        );


                    if (noComment) {

                        noComment.style.display = '';

                    }

                }


                                    return;
            }

        }
    );

}

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
