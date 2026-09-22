document.addEventListener("DOMContentLoaded", function () {

    // 1. 국가 목록 동적 생성
    const topCountries = ['대한민국', '일본', '베트남', '태국', '미국', '프랑스', '이탈리아', '대만', '중국', '스페인', '영국'];
    const allCountries = [
        '가나', '가봉', '가이아나', '감비아', '과테말라', '그레나다', '그리스', '기니', '기니비사우',
        '나미비아', '나우루', '나이지리아', '남수단', '남아프리카공화국', '네덜란드', '네팔', '노르웨이',
        '뉴질랜드', '니제르', '니카라과', '대한민국', '덴마크', '도미니카공화국', '도미니카연방', '독일',
        '동티모르', '라오스', '라이베리아', '라트비아', '러시아', '레바논', '레소토', '루마니아', '룩셈부르크',
        '르완다', '리비아', '리투아니아', '리히텐슈타인', '마다가스카르', '마셜제도', '말라위', '말레이시아',
        '말리', '멕시코', '모나코', '모로코', '모리셔스', '모리타니', '모잠비크', '몬테네그로', '몰도바',
        '몰디브', '몰타', '몽골', '미국', '미얀마', '미크로네시아연방', '바누아투', '바레인', '바베이도스',
        '바하마', '바티칸 시국', '방글라데시', '베냉', '베네수엘라', '베트남', '벨기에', '벨라루스', '벨리즈',
        '보스니아 헤르체고비나', '보츠와나', '볼리비아', '부룬디', '부르키나파소', '부탄', '북마케도니아',
        '불가리아', '브라질', '브루나이', '사모아', '사우디아라비아', '산마리노', '상투메 프린시페',
        '세네갈', '세르비아', '세이셸', '세인트루시아', '세인트빈센트 그레나딘', '세인트키츠 네비스',
        '소말리아', '솔로몬제도', '수단', '수리남', '스리랑카', '스웨덴', '스위스', '스페인', '슬로바키아',
        '슬로베니아', '시리아', '시에라리온', '싱가포르', '아랍에미리트', '아르메니아', '아르헨티나',
        '아이슬란드', '아이티', '아일랜드', '아제르바이잔', '아프가니스탄', '안도라', '알바니아', '알제리',
        '앙골라', '앤티가 바부다', '에리트레아', '에스토니아', '에콰도르', '에스와티니', '에티오피아',
        '엘살바도르', '영국', '예멘', '오만', '오스트레일리아(호주)', '오스트리아', '온두라스', '요르단', '우간다',
        '우루과이', '우즈베키스탄', '우크라이나', '이라크', '이란', '이스라엘', '이집트', '이탈리아', '인도',
        '인도네시아', '일본', '자메이카', '잠비아', '적도 기니', '조지아', '중앙아프리카공화국', '중국',
        '지부티', '짐바브웨', '차드', '체코', '칠레', '카메룬', '카보베르데', '카자흐스탄', '카타르',
        '캄보디아', '캐나다', '케냐', '코모로', '코스타리카', '코트디부아르', '콜롬비아', '콩고공화국',
        '콩고민주공화국', '쿠바', '쿠웨이트', '크로아티아', '키르기스스탄', '키리바시', '키프로스',
        '타이완(대만)', '타지키스탄', '탄자니아', '태국', '토고', '통가', '투르크메니스탄', '투발루', '튀니지', '튀르키예',
        '트리니다드 토바고', '파나마', '파라과이', '파키스탄', '파푸아뉴기니', '팔라우', '팔레스타인',
        '페루', '포르투갈', '폴란드', '프랑스', '피지', '핀란드', '필리핀', '헝가리'
    ];

    function initCountrySelect() {
        const countrySelect = document.getElementById("country");
        if (!countrySelect) return;

        const topGroup = document.createElement("optgroup");
        topGroup.label = "🔥 주요 여행 국가";
        topCountries.forEach(country => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            topGroup.appendChild(option);
        });
        countrySelect.appendChild(topGroup);

        const allGroup = document.createElement("optgroup");
        allGroup.label = "🌐 전체 국가 목록";
        allCountries.forEach(country => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            allGroup.appendChild(option);
        });
        countrySelect.appendChild(allGroup);
    }
    initCountrySelect();

    // 2. 글자 수 카운터
    const intro = document.getElementById("intro");
    const introCount = document.getElementById("introCount");
    const reason = document.getElementById("reason");
    const reasonCount = document.getElementById("reasonCount");

    if (intro && introCount) {
        intro.addEventListener("input", () => introCount.textContent = intro.value.length);
    }
    if (reason && reasonCount) {
        reason.addEventListener("input", () => reasonCount.textContent = reason.value.length);
    }

    // 3. 사진 미리보기
    const photosInput = document.getElementById("photos");
    const previewContainer = document.getElementById("previewContainer");

    if (photosInput && previewContainer) {
        photosInput.addEventListener("change", function () {
            previewContainer.innerHTML = "";
            const files = Array.from(photosInput.files);

            if (files.length > 10) {
                alert("사진은 최대 10장까지 등록할 수 있습니다.");
                photosInput.value = "";
                return;
            }

            files.forEach((file) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const previewItem = document.createElement("div");
                    previewItem.classList.add("preview-item");
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" style="width:100px; height:100px; object-fit:cover; border-radius:6px; margin-right:8px;">
                    `;
                    previewContainer.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // 4. 폼 전송 이벤트
    const travelForm = document.getElementById("travelForm");
    if (travelForm) {
        travelForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const agree = document.getElementById("agree");
            if (!agree || !agree.checked) {
                alert("등록 가이드라인에 동의해주세요.");
                return;
            }

            const formData = new FormData(travelForm);

            fetch(travelForm.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    return response.text().then(html => {
                        document.open();
                        document.write(html);
                        document.close();
                    });
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("서버 전송 중 오류가 발생했습니다.");
            });
        });
    }
});