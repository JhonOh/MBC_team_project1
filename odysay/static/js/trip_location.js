// trip_location.js 수정
document.addEventListener('DOMContentLoaded', () => {
    const mainImage = document.getElementById('mainImage');
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const dots = document.querySelectorAll('.slider-dots .dot');

    let currentIndex = 0;

    function updateSlider(index) {
        if (!photoList || photoList.length === 0 || !mainImage) return;

        // 정확한 경로 조합
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

    // 2. 중간 상단 탭 활성화 변경 기능
    const tabs = document.querySelectorAll('.tab-bar .tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // 3. 좋아요 / 싫어요 기능
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');

    if(likeBtn && dislikeBtn) {
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