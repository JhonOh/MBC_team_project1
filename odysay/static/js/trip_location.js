document.addEventListener('DOMContentLoaded', () => {

    // 1. 사용자 접속 기준 로컬 시간 변환 기능
    const timeElements = document.querySelectorAll('.created-time');
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
    const dots = document.querySelectorAll('.slider-dots .dot');

    let currentIndex = 0;

    function updateSlider(index) {
        if (!photoList || photoList.length === 0 || !mainImage) return;

        mainImage.src = uploadPath + photoList[index];

        dots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    if (rightArrow && leftArrow && photoList && photoList.length > 0) {
        rightArrow.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % photoList.length;
            updateSlider(currentIndex);
        });

        leftArrow.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + photoList.length) % photoList.length;
            updateSlider(currentIndex);
        });
    }

    // 3. 탭 활성화 변경 기능
    const tabs = document.querySelectorAll('.tab-bar .tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // 4. 좋아요 / 싫어요 기능
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');

    if (likeBtn && dislikeBtn) {
        let likeSpan = likeBtn.querySelector('span');
        let likeCount = parseInt(likeSpan.textContent) || 0;
        let isLiked = false;

        likeBtn.addEventListener('click', () => {
            if (!isLiked) {
                likeCount++;
                isLiked = true;
                likeBtn.style.background = '#e3f2fd';
            } else {
                likeCount--;
                isLiked = false;
                likeBtn.style.background = '#f8f9fa';
            }
            likeSpan.textContent = likeCount.toLocaleString();
        });
    }
});