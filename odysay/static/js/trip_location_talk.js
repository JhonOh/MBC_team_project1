document.addEventListener('DOMContentLoaded', () => {
    // 리뷰 / 여행톡 공통 기능
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

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
                                    ${talk.profile_image
                                        ? `<img src="/static/${talk.profile_image}" alt="${talk.nickname} 프로필">`
                                        : '👤'
                                    }
                                </span>
        
                                <div class="travel-talk-user-info">
        
                                    <span class="travel-talk-user"></span>
                                    
                                    ${talk.is_place_author ? '<span class="author-badge">작성자</span>' : ''}
                                    
                                    ${talk.is_best ? '<span class="best-badge">BEST</span>' : ''}
                                    
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
                                class="travel-talk-like ${talk.is_recommended ? 'liked' : ''}">
                                ${talk.is_recommended ? '♥' : '♡'}
                                <span class="travel-talk-like-count">
                                    ${talk.recommend_count}
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
                            new Date(talk.updated_at || talk.created_at)
                        ) +
                        (talk.updated_at ? ' (수정)' : '');

                    travelTalkList.appendChild(
                        travelTalkItem
                    );

                    fetch(
                        `/homepage/trip_location/feature/travel-talk/comment/main/${talk.id}`
                    )
                        .then(function(response) {
                            return response.json();
                        })
                        .then(function(data) {

                            if (!data.success) {
                                return;
                            }

                            const commentCount =
                                travelTalkItem.querySelector(
                                    '.travel-talk-comment-count'
                                );

                            if (commentCount) {
                                commentCount.textContent =
                                    data.comments.length;
                            }
                        })
                        .catch(function(error) {
                            console.error(
                                '댓글 개수 조회 실패:',
                                error
                            );
                        });

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

                        const travelTalkItem =
                            likeButton.closest('.travel-talk-item');

                        const talkId =
                            travelTalkItem.dataset.travelTalkId;

                        const count =
                            likeButton.querySelector('.travel-talk-like-count');

                        fetch(
                            `/homepage/trip_location/feature/travel-talk/recommend/${talkId}`,
                            {
                                method: 'POST',
                                headers: {
                                    'X-CSRFToken': csrfToken
                                }
                            }
                        )
                            .then(response => response.json())
                            .then(data => {

                                if (!data.success) {
                                    alert(data.message || '추천 처리 중 오류가 발생했습니다.');
                                    return;
                                }

                                likeButton.classList.toggle(
                                    'liked',
                                    data.recommended
                                );

                                likeButton.firstChild.textContent =
                                    data.recommended ? '♥ ' : '♡ ';

                                count.textContent = data.count;

                                loadTravelTalks();
                            });

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
                `/homepage/trip_location/feature/travel-talk/comment/main/${talkId}`
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
                                    ${comment.profile_image
                                        ? `<img src="/static/${comment.profile_image}" alt="${comment.nickname} 프로필">`
                                        : '👤'
                                    }
                                </span>
    
                                <span class="travel-talk-comment-user"></span>
                                
                                ${comment.is_place_author ? '<span class="author-badge">작성자</span>' : ''}
    
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
                                comment.updated_at || comment.created_at
                            )
                        ) +
                        (comment.updated_at ? ' (수정)' : '');

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
                    commentSubmit.closest(
                        '.travel-talk-item'
                    );

                if (!travelTalkItem) {
                    return;
                }

                const commentInput =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-input'
                    );

                const textCount =
                    travelTalkItem.querySelector(
                        '.travel-talk-comment-text-count'
                    );

                const commentText =
                    commentInput.value.trim();

                if (commentText === '') {

                    alert(
                        '댓글 내용을 입력해주세요.'
                    );

                    commentInput.focus();

                    return;
                }

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
            // 선택한 댓글 자리에서 바로 수정
            // ==========================================

            const commentEdit =
                event.target.closest(
                    '.comment-edit-button'
                );

            if (commentEdit) {

                const commentItem =
                    commentEdit.closest(
                        '.travel-talk-comment-item'
                    );

                if (!commentItem) {
                    return;
                }

                // 이미 이 댓글을 수정 중이면 중복 생성 방지
                if (
                    commentItem.querySelector(
                        '.comment-inline-edit'
                    )
                ) {
                    return;
                }

                const textElement =
                    commentItem.querySelector(
                        '.travel-talk-comment-text'
                    );

                if (!textElement) {
                    return;
                }

                const oldText =
                    textElement.textContent.trim();

                // 기존 댓글 내용 숨기기
                textElement.style.display = 'none';


                // 수정폼 생성
                const editBox =
                    document.createElement('div');

                editBox.className =
                    'comment-inline-edit';

                editBox.innerHTML = `
                    <textarea
                        class="comment-edit-text"
                        maxlength="500"
                        placeholder="댓글을 입력해주세요."
                    ></textarea>
            
                    <div class="comment-edit-actions">
            
                        <span class="comment-edit-counter">
                            <span class="comment-edit-count">
                                ${oldText.length}
                            </span>/500
                        </span>
            
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

                const editText =
                    editBox.querySelector(
                        '.comment-edit-text'
                    );

                editText.value = oldText;

                // 원래 댓글 내용 바로 아래에 수정창 표시
                textElement.after(
                    editBox
                );


                // ⋯ 메뉴 닫기
                const menu =
                    commentItem.querySelector(
                        '.comment-more-menu'
                    );

                if (menu) {
                    menu.classList.remove('active');
                }

                editText.focus();

                return;
            }


            // ==========================================
            // 댓글 수정 취소
            // ==========================================

            const commentEditCancel =
                event.target.closest(
                    '.comment-edit-cancel'
                );

            if (commentEditCancel) {

                const commentItem =
                    commentEditCancel.closest(
                        '.travel-talk-comment-item'
                    );

                const editBox =
                    commentEditCancel.closest(
                        '.comment-inline-edit'
                    );

                if (!commentItem || !editBox) {
                    return;
                }

                const textElement =
                    commentItem.querySelector(
                        '.travel-talk-comment-text'
                    );

                if (textElement) {
                    textElement.style.display = '';
                }

                editBox.remove();

                return;
            }


            // ==========================================
            // 댓글 수정 완료
            // ==========================================

            const commentEditSave =
                event.target.closest(
                    '.comment-edit-save'
                );

            if (commentEditSave) {

                if (!checkLogin()) {
                    return;
                }

                const commentItem =
                    commentEditSave.closest(
                        '.travel-talk-comment-item'
                    );

                const travelTalkItem =
                    commentEditSave.closest(
                        '.travel-talk-item'
                    );

                const editBox =
                    commentEditSave.closest(
                        '.comment-inline-edit'
                    );

                if (
                    !commentItem ||
                    !travelTalkItem ||
                    !editBox
                ) {
                    return;
                }

                const editText =
                    editBox.querySelector(
                        '.comment-edit-text'
                    );

                const newText =
                    editText.value.trim();

                if (newText === '') {

                    alert(
                        '댓글 내용을 입력해주세요.'
                    );

                    editText.focus();

                    return;
                }

                const commentId =
                    commentItem.dataset.commentId;


                fetch(
                    `/homepage/trip_location/feature/travel-talk/comment/edit/${commentId}`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrfToken
                        },

                        body: JSON.stringify({
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
                                '댓글 수정 중 오류가 발생했습니다.'
                            );

                            return;
                        }

                        // 수정된 댓글 다시 불러오기
                        loadTravelTalkComments(
                            travelTalkItem
                        );
                    })

                    .catch(function(error) {

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

});
