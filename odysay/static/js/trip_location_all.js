document.addEventListener('DOMContentLoaded', () => {
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

                const mainImage = document.getElementById('mainImage');
                let currentIndex = 0;

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

                    const originalPlaceTitle =
                        detailMapElement.dataset.title || '여행지';

                    const placeCountry =
                        window.OdysayCountries?.canonicalize?.(
                            detailMapElement.dataset.country
                        ) || detailMapElement.dataset.country;

                    const placeTitle =
                        window.OdysayLanguage?.getLanguage?.() === 'en' &&
                        placeCountry === '대한민국'
                            ? window.OdysayLanguage?.englishKoreanPlaceName?.(originalPlaceTitle) || originalPlaceTitle
                            : originalPlaceTitle;

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
                // ================================
                // 14. 주변정보 사진 슬라이더
                // ================================

                const registeredPhotoSliders =
                    document.querySelectorAll(
                        '[data-photo-slider]'
                    );

                registeredPhotoSliders.forEach(
                    function(slider) {

                        const photos =
                            slider.querySelectorAll(
                                '.registered-slide-photo'
                            );

                        const prevButton =
                            slider.querySelector(
                                '.registered-photo-prev'
                            );

                        const nextButton =
                            slider.querySelector(
                                '.registered-photo-next'
                            );

                        const currentCount =
                            slider.querySelector(
                                '.registered-photo-current'
                            );

                        let currentPhotoIndex = 0;


                        function showRegisteredPhoto(index) {

                            photos.forEach(
                                function(photo, photoIndex) {

                                    photo.classList.toggle(
                                        'active',
                                        photoIndex === index
                                    );

                                }
                            );

                            if (currentCount) {
                                currentCount.textContent =
                                    index + 1;
                            }
                        }


                        if (photos.length <= 1) {

                            if (prevButton) {
                                prevButton.style.display =
                                    'none';
                            }

                            if (nextButton) {
                                nextButton.style.display =
                                    'none';
                            }

                            return;
                        }


                        prevButton.addEventListener(
                            'click',
                            function(event) {

                                event.stopPropagation();

                                currentPhotoIndex =
                                    (
                                        currentPhotoIndex - 1 +
                                        photos.length
                                    )
                                    % photos.length;

                                showRegisteredPhoto(
                                    currentPhotoIndex
                                );
                            }
                        );


                        nextButton.addEventListener(
                            'click',
                            function(event) {

                                event.stopPropagation();

                                currentPhotoIndex =
                                    (
                                        currentPhotoIndex + 1
                                    )
                                    % photos.length;

                                showRegisteredPhoto(
                                    currentPhotoIndex
                                );
                            }
                        );

                    }
                );

    });  // ← DOMContentLoaded 끝
