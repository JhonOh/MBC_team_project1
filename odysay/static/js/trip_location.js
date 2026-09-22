document.addEventListener('DOMContentLoaded', () => {

    // 1. 중간 상단 탭 활성화 변경 기능 구현
    const tabs = document.querySelectorAll('.tab-bar .tab-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 기존 active 클래스 제거
            tabs.forEach(t => t.classList.remove('active'));
            // 선택된 탭에 active 추가
            tab.classList.add('active');
        });
    });

    // 2. 좋아요 / 싫어요 인터랙티브 카운트 기능 구현
    const likeBtn = document.getElementById('likeBtn');
    const dislikeBtn = document.getElementById('dislikeBtn');

    let likeCount = 6904;
    let dislikeCount = 321;
    let isLiked = false;
    let isDisliked = false;

    likeBtn.addEventListener('click', () => {
        if (!isLiked) {
            likeCount++;
            isLiked = true;
            likeBtn.style.background = '#e3f2fd'; // 활성화 시 하늘색 강조 배경
            if (isDisliked) { // 싫어요가 눌려있었다면 취소
                dislikeCount--;
                isDisliked = false;
                dislikeBtn.style.background = '#f8f9fa';
                dislikeBtn.querySelector('span').textContent = dislikeCount;
            }
        } else {
            likeCount--;
            isLiked = false;
            likeBtn.style.background = '#f8f9fa';
        }
        likeBtn.querySelector('span').textContent = likeCount.toLocaleString();
    });

    dislikeBtn.addEventListener('click', () => {
        if (!isDisliked) {
            dislikeCount++;
            isDisliked = true;
            dislikeBtn.style.background = '#ffebee'; // 활성화 시 붉은색 강조 배경
            if (isLiked) { // 좋아요가 눌려있었다면 취소
                likeCount--;
                isLiked = false;
                likeBtn.style.background = '#f8f9fa';
                likeBtn.querySelector('span').textContent = likeCount.toLocaleString();
            }
        } else {
            dislikeCount--;
            isDisliked = false;
            dislikeBtn.style.background = '#f8f9fa';
        }
        dislikeBtn.querySelector('span').textContent = dislikeCount.toLocaleString();
    });

    // 3. 메인 이미지 슬라이더 화살표 클릭 효과 (콘솔 로그 확인용)
    const leftArrow = document.querySelector('.left-arrow');
    const rightArrow = document.querySelector('.right-arrow');
    const dots = document.querySelectorAll('.slider-dots .dot');

    rightArrow.addEventListener('click', () => {
        dots[0].classList.remove('active');
        dots[1].classList.add('active');
    });

    leftArrow.addEventListener('click', () => {
        dots[1].classList.remove('active');
        dots[0].classList.add('active');
    });
});
