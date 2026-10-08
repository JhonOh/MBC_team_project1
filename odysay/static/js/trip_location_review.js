document.addEventListener('DOMContentLoaded', () => {
    // 리뷰 / 여행톡 공통 기능
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

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
                            <span class="review-avatar">
                                ${review.profile_image
                                    ? `<img src="/static/${review.profile_image}" alt="${review.nickname} 프로필">`
                                    : '👤'
                                }
                            </span>
                
                            <div class="review-user-info">

                                <div class="review-user-name-row">
                                    <span class="review-user"></span>
                                
                                    ${review.is_place_author ? '<span class="author-badge">작성자</span>' : ''}
                                
                                    ${review.is_best ? '<span class="best-badge">BEST</span>' : ''}
                                
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
                            class="review-action-button recommend-button ${review.is_recommended ? 'recommended' : ''}">
                            ${review.is_recommended ? '♥ 추천' : '♡ 추천'}
                            <span class="recommend-count">${review.recommend_count}</span>
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


                    window.OdysayLanguage.bindContent(reviewItem.querySelector('.review-text'),
                        'review', review.id, 'content', review.content);


                    reviewItem.querySelector(
                        '.review-date'
                    ).textContent =
                        formatPostDate(
                            new Date(review.updated_at || review.created_at)
                        ) +
                        (review.updated_at ? ' (수정)' : '');


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
                        window.OdysayLanguage.originalContent(reviewItem.querySelector('.review-text')).trim();

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


                    const reviewItem =
                        recommendButton.closest('.review-item');

                    const reviewId =
                        reviewItem.dataset.reviewId;


                    fetch(
                        `/homepage/trip_location/feature/review/recommend/${reviewId}`,
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
                                    '추천 처리 중 오류가 발생했습니다.'
                                );

                                return;
                            }


                            const count =
                                recommendButton.querySelector(
                                    '.recommend-count'
                                );


                            recommendButton.classList.toggle(
                                'recommended',
                                result.data.recommended
                            );


                            recommendButton.firstChild.textContent =
                                result.data.recommended
                                    ? '♥ 추천 '
                                    : '♡ 추천 ';


                            count.textContent =
                                result.data.count;

                            loadReviews();

                        })

                        .catch(function(error) {

                            console.error(
                                '리뷰 추천 처리 실패:',
                                error
                            );

                            alert(
                                '추천 처리 중 오류가 발생했습니다.'
                            );

                        });


                    return;
                }

                const reportButton =
                    event.target.closest(
                        '.report-button'
                    );


                if (reportButton) {
                        if (!checkLogin()) return;
                        window.submitContentReport(reportButton, 'review',
                            reportButton.closest('.review-item').dataset.reviewId);
                    }

            });

        }


        loadReviews();




});
