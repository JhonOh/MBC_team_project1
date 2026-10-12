/*
 * 사이트 전체 한국어 / 영어 UI 언어 전환 기능
 *
 * 고정된 UI 문구는 미리 정의된 영어 문구로 변환합니다.
 * 사용자 글은 원문을 보존하며 DB에 저장된 영어 번역만 조회합니다.
 * 대한민국 여행지명과 지역명은 영어 모드에서 영문 표기로 변환할 수 있습니다.
 */
(function (global) {
    'use strict';

    const STORAGE_KEY = 'odysay.language';
    const LANGUAGE_PARAM = 'lang';
    const SUPPORTED_LANGUAGES = new Set(['ko', 'en']);
    const originalText = new WeakMap();
    const originalAttribute = new WeakMap();
    const originalTitle = document.title;

    const MESSAGES = {
        ko: {
            'language.switchToEnglish': 'English',
            'language.switchToKorean': '한국어',
            'language.toggleLabel': '언어를 영어로 전환',
            'countrySearch.noResults': '검색 결과가 없습니다.',
            'common.details': '상세보기',
            'detail.save': '♥ 찜하기',
            'detail.unsave': '♥ 찜 취소',
            'home.mapLoadError': '여행지 목록을 불러오지 못했습니다. 새로고침해 주세요.',
            'map.loadError': '여행지 목록을 불러오지 못했습니다. 잠시 후 새로고침해 주세요.',
            'home.recommendedEmpty': '등록된 추천 여행지가 없습니다.',
            'home.recentEmpty': '최근 등록된 여행지가 없습니다.',
            'home.communityEmpty': '게시글이 없습니다.',
            'home.defaultCommunity': '커뮤니티',
            'community.loginRequired': '로그인이 필요합니다. 로그인 후 다시 시도해 주세요.',
            'community.loadError': '게시글을 불러오지 못했습니다.',
            'community.noPosts': '등록된 게시글이 없습니다.',
            'community.general': '일반',
            'community.board': '게시판',
            'community.noContent': '등록된 내용이 없습니다.',
            'community.categoryReview': '여행 후기',
            'community.categoryTip': '여행 팁',
            'community.categoryFree': '자유 게시판',
            'community.author': '작성자:',
            'community.updatedDate': '수정일:',
            'community.createdDate': '작성일:',
            'community.edited': '(수정됨)',
            'community.edit': '수정',
            'community.delete': '삭제',
            'community.intro': '소개:',
            'community.reason': '추천 이유:',
            'community.cancel': '취소',
            'community.save': '저장',
            'community.like': '좋아요',
            'community.comments': '댓글',
            'community.commentPlaceholder': '댓글을 입력해 주세요...',
            'community.commentSubmit': '댓글 등록',
            'community.authorBadge': '작성자',
            'inquiry.myList': '내 문의 목록',
            'inquiry.management': '문의 관리',
            'exchange.selectCountry': '국가를 선택해주세요.',
            'exchange.enterAmount': '금액을 입력해주세요.',
            'exchange.unavailable': '선택한 국가의 환율 정보는 현재 제공되지 않습니다.',
            'exchange.estimated': '환전 예상 금액',
            'exchange.asOf': '기준일 {date}',
            'exchange.notice': '※ 최근 환율 기준이며, 실제 환전 시 차이가 있을 수 있습니다.',
            'time.selectCountry': '국가를 선택해주세요.',
            'time.noDifference': '시차가 없습니다.',
            'time.faster': '{country}이(가) {gap} 빠릅니다.',
            'time.slower': '{country}이(가) {gap} 느립니다.',
            'time.difference': '시차',
            'time.hours': '{hours}시간',
            'time.hoursMinutes': '{hours}시간 {minutes}분',
            'weather.selectCountryCity': '국가와 도시를 선택해주세요.',
            'weather.notFound': '입력한 도시 또는 지역을 찾을 수 없습니다.',
            'weather.loadError': '날씨 정보를 불러오지 못했습니다.',
            'weather.clear': '맑음',
            'weather.partlyCloudy': '구름 조금',
            'weather.cloudy': '흐림',
            'weather.fog': '안개',
            'weather.drizzle': '이슬비',
            'weather.rain': '비',
            'weather.snow': '눈',
            'weather.showers': '소나기',
            'weather.thunderstorm': '뇌우',
            'weather.default': '날씨',
            'weather.feelsLikeHumidity': '체감 {temperature}°C · 습도 {humidity}%',
            'weather.hourly': '시간대별 날씨',
            'weather.notice': '※ 날씨 및 강수확률은 Open-Meteo 예보 기준이며, 기상 기관에 따라 실제 예보와 차이가 있을 수 있습니다.',
            'route.enterBoth': '출발지와 도착지를 입력해주세요.',
            'tripList.loadError': '여행지 데이터를 불러오지 못했습니다. ({status})',
            'tripList.noResults': '검색 결과가 없습니다.',
            'tripList.defaultPlace': '여행지',
            'tripList.detail': '자세히 보기 →',
            'tripList.descriptionWithRegion': '{region}에서 만나볼 수 있는 특별한 여행지입니다.',
            'tripList.description': '어딧세이에서 추천하는 특별한 여행지입니다.',
            'tripList.allCountries': '전체 여행지',
            'tripList.countrySearch': '나라 이름 검색',
            'tripList.allCountriesDescription': '다양한 나라의 여행지를 둘러보세요.',
            'tripList.countryDescription': '{country}에서 등록된 여행지를 둘러보세요.',
            'upload.submitError': '등록에 실패했습니다. 입력값을 확인해 주세요.',
            'upload.photoLimit': '메인 사진은 최대 10장까지 등록할 수 있습니다.',
            'upload.nearbyPhotoLimit': '주변정보 사진은 최대 3장까지 등록할 수 있습니다.',
            'upload.readGuide': '여행지를 등록하기 전에 등록 가이드를 확인해주세요.',
            'upload.agree': '등록 가이드라인에 동의해주세요.',
            'upload.addPhoto': '메인 사진을 1장 이상 등록해주세요.',
            'upload.photoDescription': '여행지의 매력을 보여주는 사진을 추가해주세요. (*필수 1장, 1~10장)',
            'tags.maxSelected': '여행 스타일은 최대 3개까지 선택할 수 있습니다.',
            'community.likeError': '좋아요 처리에 실패하였습니다.',
            'community.networkError': '통신 중 오류가 발생했습니다.',
            'community.serverError': '서버와 통신 중 오류가 발생했습니다.',
            'community.postRequired': '제목과 내용을 모두 입력해 주세요.',
            'community.placeRequired': '소개와 추천 이유를 모두 입력해 주세요.',
            'community.postUpdated': '게시글이 수정되었습니다.',
            'community.postUpdateError': '게시글 수정 실패',
            'community.deleteConfirm': '정말 이 게시글을 삭제하시겠습니까?',
            'community.postDeleted': '게시글이 삭제되었습니다.',
            'community.deleteError': '삭제 권한이 없거나 처리 중 오류가 발생했습니다.',
            'community.commentRequired': '댓글 내용을 입력해 주세요.',
            'community.commentSubmitError': '댓글 등록 실패',
            'community.commentEditRequired': '수정할 내용을 입력해주세요.',
            'community.commentEditError': '댓글 수정 실패',
            'community.commentDeleteConfirm': '댓글을 삭제하시겠습니까?',
            'community.commentDeleteError': '댓글 삭제 실패',
            'community.report': '신고',
            'community.submit': '등록',
            'community.saveChanges': '수정 완료',
            'report.reasonPrompt': '신고 사유를 입력해 주세요. (1~500자)',
            'report.reasonRequired': '신고 사유를 1~500자로 입력해 주세요.',
            'report.submitError': '신고 접수에 실패했습니다. 다시 시도해 주세요.',
            'report.completed': '🚨 신고 완료',
            'report.success': '신고가 접수되었습니다.',
            'talk.description': '이 여행지에 대해 궁금한 점이나 정보를 자유롭게 이야기해보세요.',
            'talk.writeCancel': '작성 취소',
            'talk.write': '글 작성하기',
            'talk.titlePlaceholder': '제목을 입력해주세요.',
            'talk.contentPlaceholder': '내용을 입력해주세요.',
            'talk.empty': '아직 등록된 여행톡이 없습니다.',
            'talk.noComments': '아직 댓글이 없습니다.',
            'talk.commentPlaceholder': '댓글을 입력해주세요.',
            'talk.loginRequired': '로그인 후 이용할 수 있습니다.',
            'talk.titleRequired': '제목을 입력해주세요.',
            'talk.contentRequired': '내용을 입력해주세요.',
            'talk.commentRequired': '댓글 내용을 입력해주세요.',
            'talk.postError': '여행톡 등록 중 오류가 발생했습니다.',
            'talk.editError': '여행톡 수정 중 오류가 발생했습니다.',
            'talk.deleteError': '여행톡 삭제 중 오류가 발생했습니다.',
            'talk.commentPostError': '댓글 등록 중 오류가 발생했습니다.',
            'talk.commentEditError': '댓글 수정 중 오류가 발생했습니다.',
            'talk.commentDeleteError': '댓글 삭제 중 오류가 발생했습니다.',
            'talk.recommendError': '추천 처리 중 오류가 발생했습니다.',
            'talk.deleteConfirm': '이 게시글을 삭제하시겠습니까?',
            'talk.commentDeleteConfirm': '이 댓글을 삭제하시겠습니까?',
            'talk.edited': ' (수정)',
            'detail.viewFullMap': '전체 지도에서 보기 →',
            'detail.edit': '수정',
            'detail.delete': '삭제',
            'detail.deleteConfirm': '정말 이 여행지를 삭제하시겠습니까?',

        },
        en: {
            'language.switchToEnglish': 'English',
            'language.switchToKorean': '한국어',
            'language.toggleLabel': 'Switch language to Korean',
            'countrySearch.noResults': 'No matching countries.',
            'common.details': 'View details',
            'detail.save': '♥ Save',
            'detail.unsave': '♥ Saved',
            'home.mapLoadError': 'We could not load the destinations. Please refresh the page.',
            'map.loadError': 'We could not load the destinations. Please refresh the page shortly.',
            'home.recommendedEmpty': 'No recommended destinations have been registered yet.',
            'home.recentEmpty': 'No destinations have been registered recently.',
            'home.communityEmpty': 'There are no posts yet.',
            'home.defaultCommunity': 'Community',
            'community.loginRequired': 'Please log in and try again.',
            'community.loadError': 'We could not load the posts.',
            'community.noPosts': 'There are no posts yet.',
            'community.general': 'General',
            'community.board': 'Board',
            'community.noContent': 'No content has been added.',
            'community.categoryReview': 'Travel reviews',
            'community.categoryTip': 'Travel tips',
            'community.categoryFree': 'Free board',
            'community.author': 'Author:',
            'community.updatedDate': 'Updated:',
            'community.createdDate': 'Posted:',
            'community.edited': '(Edited)',
            'community.edit': 'Edit',
            'community.delete': 'Delete',
            'community.intro': 'Introduction:',
            'community.reason': 'Why recommended:',
            'community.cancel': 'Cancel',
            'community.save': 'Save',
            'community.like': 'Like',
            'community.comments': 'Comments',
            'community.commentPlaceholder': 'Write a comment...',
            'community.commentSubmit': 'Post comment',
            'community.authorBadge': 'Author',
            'community.likeError': 'Failed to update the like.',
            'community.networkError': 'A communication error occurred.',
            'community.serverError': 'Could not communicate with the server.',
            'community.postRequired': 'Please enter both a title and content.',
            'community.placeRequired': 'Please enter both an introduction and a reason for recommending this destination.',
            'community.postUpdated': 'The post has been updated.',
            'community.postUpdateError': 'Failed to update the post.',
            'community.deleteConfirm': 'Are you sure you want to delete this post?',
            'community.postDeleted': 'The post has been deleted.',
            'community.deleteError': 'You do not have permission to delete this post, or an error occurred.',
            'community.commentRequired': 'Please enter a comment.',
            'community.commentSubmitError': 'Failed to post the comment.',
            'community.commentEditRequired': 'Please enter the content you want to update.',
            'community.commentEditError': 'Failed to update the comment.',
            'community.commentDeleteConfirm': 'Are you sure you want to delete this comment?',
            'community.commentDeleteError': 'Failed to delete the comment.',
            'community.report': 'Report',
            'community.submit': 'Submit',
            'community.saveChanges': 'Save changes',
            'talk.description': 'Feel free to ask questions and share information about this destination.',
            'talk.writeCancel': 'Cancel writing',
            'talk.write': 'Write a post',
            'talk.titlePlaceholder': 'Enter a title.',
            'talk.contentPlaceholder': 'Enter content.',
            'talk.empty': 'No travel talk posts yet.',
            'talk.noComments': 'No comments yet.',
            'talk.commentPlaceholder': 'Write a comment.',
            'talk.loginRequired': 'Please log in to continue.',
            'talk.titleRequired': 'Please enter a title.',
            'talk.contentRequired': 'Please enter content.',
            'talk.commentRequired': 'Please enter a comment.',
            'talk.postError': 'Failed to post travel talk.',
            'talk.editError': 'Failed to edit travel talk.',
            'talk.deleteError': 'Failed to delete travel talk.',
            'talk.commentPostError': 'Failed to post the comment.',
            'talk.commentEditError': 'Failed to edit the comment.',
            'talk.commentDeleteError': 'Failed to delete the comment.',
            'talk.recommendError': 'Failed to update the recommendation.',
            'talk.deleteConfirm': 'Are you sure you want to delete this post?',
            'talk.commentDeleteConfirm': 'Are you sure you want to delete this comment?',
            'talk.edited': ' (Edited)',
            'report.reasonPrompt': 'Please enter a reason for reporting. (1–500 characters)',
            'report.reasonRequired': 'Please enter a report reason between 1 and 500 characters.',
            'report.submitError': 'Failed to submit the report. Please try again.',
            'report.completed': '🚨 Reported',
            'report.success': 'Your report has been submitted.',
            'inquiry.myList': 'My inquiries',
            'inquiry.management': 'Inquiry management',
            'exchange.selectCountry': 'Please select a country.',
            'exchange.enterAmount': 'Please enter an amount.',
            'exchange.unavailable': 'Exchange-rate information is not currently available for the selected countries.',
            'exchange.estimated': 'Estimated exchanged amount',
            'exchange.asOf': 'As of {date}',
            'exchange.notice': '※ Based on recent exchange rates. The actual exchange amount may differ.',
            'time.selectCountry': 'Please select a country.',
            'time.noDifference': 'There is no time difference.',
            'time.faster': '{country} is {gap} ahead.',
            'time.slower': '{country} is {gap} behind.',
            'time.difference': 'TIME DIFFERENCE',
            'time.hours': '{hours} hour(s)',
            'time.hoursMinutes': '{hours} hour(s) {minutes} minute(s)',
            'weather.selectCountryCity': 'Please select a country and enter a city.',
            'weather.notFound': 'We could not find that city or region.',
            'weather.loadError': 'We could not load the weather information.',
            'weather.clear': 'Clear',
            'weather.partlyCloudy': 'Partly cloudy',
            'weather.cloudy': 'Cloudy',
            'weather.fog': 'Fog',
            'weather.drizzle': 'Drizzle',
            'weather.rain': 'Rain',
            'weather.snow': 'Snow',
            'weather.showers': 'Showers',
            'weather.thunderstorm': 'Thunderstorm',
            'weather.default': 'Weather',
            'weather.feelsLikeHumidity': 'Feels like {temperature}°C · Humidity {humidity}%',
            'weather.hourly': 'Hourly weather',
            'weather.notice': '※ Weather and precipitation probability are based on Open-Meteo forecasts and can differ from local forecasts.',
            'route.enterBoth': 'Please enter both an origin and a destination.',
            'tripList.loadError': 'Could not load destination data. ({status})',
            'tripList.noResults': 'No matching countries.',
            'tripList.defaultPlace': 'Destination',
            'tripList.detail': 'View details →',
            'tripList.descriptionWithRegion': 'A special destination to discover in {region}.',
            'tripList.description': 'A special destination recommended by Odysay.',
            'tripList.allCountries': 'All destinations',
            'tripList.countrySearch': 'Search country names',
            'tripList.allCountriesDescription': 'Explore destinations from around the world.',
            'tripList.countryDescription': 'Explore destinations registered in {country}.',
            'upload.submitError': 'Could not save the destination. Please check your input.',
            'upload.photoLimit': 'You can upload up to 10 main photos.',
            'upload.nearbyPhotoLimit': 'You can upload up to 3 nearby-information photos.',
            'upload.readGuide': 'Please read the registration guide before registering a destination.',
            'upload.agree': 'Please agree to the registration guidelines.',
            'upload.addPhoto': 'Please add at least one main photo.',
            'upload.photoDescription': 'Add photos that showcase this destination. (At least 1 required; up to 10 photos)',
            'tags.maxSelected': 'You can select up to three travel styles.',
            'detail.viewFullMap': 'View on full map →',
            'detail.edit': 'Edit',
            'detail.delete': 'Delete',
            'detail.deleteConfirm': 'Are you sure you want to delete this destination?',
        }
    };

    // Exact, known UI labels only. This is intentionally not a machine
    // translation pass over content entered by users.
    const STATIC_TEXT = Object.freeze({
        '여행지': 'Destinations',
        '국내 여행지': 'Domestic destinations',
        '해외 여행지': 'International destinations',
        '인기 여행지': 'Popular destinations',
        '추천 코스': 'Recommended courses',
        '커뮤니티': 'Community',
        '전체 게시판': 'All boards',
        '여행후기': 'Travel reviews',
        '여행팁': 'Travel tips',
        '자유게시판': 'Free board',
        '여행지 등록': 'Add a destination',
        '새 여행지 등록': 'Add a new destination',
        '등록 가이드': 'Registration guide',
        '마이페이지': 'My page',
        '내정보': 'My profile',
        '내가 쓴 글': 'My posts',
        '내가 찜한 여행지': 'Saved destinations',
        '내가 만든 여행지': 'My destinations',
        '설정': 'Settings',
        '로그인': 'Log in',
        '로그아웃': 'Log out',
        '전체 메뉴': 'All menu',
        '어딧세이': 'Odysay',
        '참여형 여행정보 커뮤니티': 'A participatory travel-information community',
        '여행의 시작, 사람들의 이야기로부터': 'Every journey begins with people’s stories.',
        '어디로 떠나볼까요?': 'Where would you like to go?',
        '나라를 선택해보세요': 'Choose a country',
        '전체': 'All',
        '아시아': 'Asia',
        '유럽': 'Europe',
        '아메리카': 'Americas',
        '오세아니아': 'Oceania',
        '아프리카': 'Africa',
        '전체 여행지': 'All destinations',
        '나라 이름 검색': 'Search country names',
        '다양한 나라의 여행지를 둘러보세요.': 'Explore destinations from around the world.',
        '총': 'Total',
        '개의 여행지': 'destinations',
        '등록된 여행지가 없습니다.': 'No destinations have been registered.',
        '아직 이 나라에 등록된 여행지가 없어요.': 'No destinations have been registered in this country yet.',
        '새로운 여행지를 등록해보세요!': 'Why not add a new destination?',
        '어디로 갈지 고민이라면,': 'Not sure where to go?',
        '✈ 어디로 갈지 고민이라면,': '✈ Not sure where to go?',
        '어딧세이와 함께 떠나요.': 'Travel with Odysay.',
        '어딧세이에서 인기있는 특별한 여행지': 'Popular special destinations on Odysay',
        '어딧세이에서 사람들이 공유한 여행지를 둘러보고': 'Explore destinations shared by the Odysay community',
        '새로운 여행을 발견해보세요.': 'and discover your next journey.',
        '여행은 목적지가 아닌, 새로운 나를 만나는 여정입니다.': 'Travel is not a destination, but a journey to meet a new you.',
        '더 많은 이야기로,': 'With more stories,',
        '더 멀리.': 'go farther.',
        '환율': 'Exchange rates',
        '시차': 'Time difference',
        '길찾기': 'Directions',
        '날씨': 'Weather',
        '국가별 환율': 'Exchange rates by country',
        '국가별 시차': 'Time difference by country',
        '💰 국가별 환율': '💰 Exchange rates by country',
        '🕐 국가별 시차': '🕐 Time difference by country',
        '☀️ 날씨': '☀️ Weather',
        '📍 길찾기': '📍 Directions',
        '환율 계산': 'Calculate exchange rate',
        '시차 확인': 'Check time difference',
        '날씨 확인': 'Check weather',
        '※ 길찾기 결과는 Google Maps에서 확인할 수 있습니다.': '※ View directions in Google Maps.',
        '출발': 'Origin',
        '도착': 'Destination',
        '인기있는 특별한 여행지': 'Popular special destinations on Odysay',
        '최근 등록된 여행지': 'Recently added destinations',
        '새로운 여행지를 확인해보세요!': 'Discover newly added destinations!',
        '커뮤니티 인기글': 'Popular community posts',
        '다양한 이야기와 정보 공유': 'Stories and travel information from the community',
        '더보기 ›': 'More ›',
        '여행지 등록하기': 'Add a destination',
        '여행지 수정하기': 'Edit destination',
        '기본 정보': 'Basic information',
        '나라 선택': 'Country',
        '지역': 'Region',
        '세부 여행지명': 'Destination name',
        '여행지 카테고리': 'Destination category',
        '관광지': 'Attraction',
        '맛집': 'Restaurant',
        '숙소': 'Accommodation',
        '체험 · 액티비티': 'Experiences & activities',
        '기타': 'Other',
        '여행지 소개': 'About this destination',
        '한줄 소개': 'Short introduction',
        '✈ 관광지': '✈ Attractions',
        '🍴 맛집': '🍴 Restaurants',
        '🛏 숙소': '🛏 Accommodation',
        '📷 체험 · 액티비티': '📷 Experiences & activities',
        '··· 기타': '··· Other',
        '(선택)': '(Optional)',
        '📷 사진 등록': '📷 Add photos',
        '📷 맛집 사진 추가': '📷 Add restaurant photos',
        '📷 볼거리 사진 추가': '📷 Add nearby photos',
        '최대 3장까지 등록할 수 있습니다.': 'You can upload up to 3 photos.',
        '여행지의 매력을 보여주는 사진을 추가해주세요. (1~10장)': 'Show what makes this destination special with 1–10 photos.',
        '사진을 클릭하여 업로드하세요.': 'Click to choose photos.',
        'JPG,PNG 형식을 지원합니다.': 'JPG and PNG files are supported.',
        '당신이 다녀온 특별한 여행지를 공유해주세요.': 'Share a special destination you have visited.',
        '당신의 경험이 누군가에게는 소중한 여행의 시작이 됩니다.': 'Your experience could inspire someone’s next journey.',
        '등록 가이드라인을 확인했으며, 이에 동의합니다.': 'I have read and agree to the registration guidelines.',
        '닉네임': 'Nickname',
        '대표 이미지': 'Profile photo',
        '현재 비밀번호': 'Current password',
        '새 비밀번호': 'New password',
        '새 비밀번호 확인': 'Confirm new password',
        '취소': 'Cancel',
        '회원 탈퇴': 'Deactivate account',
        '닉네임은 2~20자로 입력해 주세요.': 'Enter a nickname with 2–20 characters.',
        '글이나 여행지와 관련된 항목을 최대 3개 선택하세요. 선택하지 않아도 등록할 수 있습니다.': 'Choose up to three travel styles. You can also leave them unselected.',
        '여행은': 'Travel is',
        '목적지가 아닌,': 'not a destination,',
        '새로운 나를': 'but a journey',
        '만나는 여정입니다.': 'to meet a new you.',
        '당신의 이야기가': 'Your story could inspire',
        '누군가의 특별한 여행이 됩니다.': 'someone’s special journey.',
        '💡 좋은 여행지가 될 수 있어요!': '💡 Share a great destination!',
        '✓ 직접 경험한 내용을 작성해주세요.': '✓ Share your own experience.',
        '✓ 다른 여행자에게 도움이 되는 정보를 공유해주세요.': '✓ Include useful tips for other travelers.',
        '✓ 사진과 함께 등록하면 더 좋아요!': '✓ Bring your story to life with photos.',
        '✓ 광고성 내용은 제외해주세요.': '✓ Leave out advertising.',
        '여행지 등록 가이드': 'Destination registration guide',
        '다른 여행자에게 도움이 될 수 있도록': 'Help other travelers by sharing useful information.',
        '아래 내용을 확인한 후 여행지를 등록해주세요.': 'Read these guidelines before adding a destination.',
        '01. 직접 경험한 여행지를 등록해주세요.': '01. Share destinations you have visited.',
        '실제로 방문했던 장소를 기준으로 정확하고 유용한 정보를 작성해주세요.': 'Provide accurate, useful information based on your own visit.',
        '02. 여행지 정보를 자세하게 작성해주세요.': '02. Include helpful details.',
        '나라, 지역, 여행지명과 함께 다른 여행자에게 도움이 되는 정보를 작성해주세요.': 'Include the country, region, destination name and practical travel information.',
        '03. 사진을 함께 등록해주세요.': '03. Add your photos.',
        '직접 촬영한 여행 사진을 등록하면 다른 여행자에게 더 많은 도움이 됩니다.': 'Your own travel photos can help others plan their visit.',
        '04. 광고성 내용은 등록하지 말아주세요.': '04. Keep your post free of advertising.',
        '여행 정보와 관계없는 광고 및 홍보성 내용은 제외해주세요.': 'Do not include unrelated advertisements or promotional content.',
        '등록 가이드를 모두 확인하셨나요?': 'Have you read the guidelines?',
        '작성하던 내용은 그대로 유지됩니다.': 'Your draft will be kept.',
        '닉네임을 입력해 주세요.': 'Please enter a nickname.',
        '이미 사용 중인 닉네임입니다.': 'This nickname is already in use.',
        'JPG, PNG, WEBP / 최대 5MB': 'JPG, PNG, WEBP / up to 5 MB',
        '사진을 선택하고 아래 저장 버튼을 눌러 주세요. 선택하지 않으면 기존 이미지가 유지됩니다.': 'Choose a photo and press Save below. Leave this empty to keep your current photo.',
        '닉네임만 수정하려면 아래 세 항목을 모두 비워 두세요. 비밀번호를 변경하면 다시 로그인해야 합니다.': 'To change only your nickname, leave all three password fields empty. Changing your password requires logging in again.',
        '현재 비밀번호와 다른 8~128자의 비밀번호를 입력하세요.': 'Use 8–128 characters and a different password from your current one.',
        '새 비밀번호는 8~128자로 입력해 주세요.': 'Use 8–128 characters for your new password.',
        '작성자': 'Author',
        '작성일': 'Created',
        '수정일': 'Updated',
        '카테고리': 'Category',
        '수정': 'Edit',
        '삭제': 'Delete',
        '답글': 'Reply',
        '♥ 추천': '♥ Recommend',
        '♡ 추천': '♡ Recommend',
        '🚨 신고': '🚨 Report',
        '사진을 준비 중이에요': 'Photos coming soon',
        '이 장소의 이야기를 상세페이지에서 만나보세요.': 'Discover this destination on its detail page.',
        '여행지 자세히 보기 →': 'View destination →',
        '위치': 'Location',
        '📍 기본정보': '📍 Basic information',
        '💬 여행자가 전하는 정보': '💬 Tips from travelers',
        '🍽️ 주변 맛집 정보': '🍽️ Nearby restaurants',
        '🎡 주변 볼거리 / 즐길거리': '🎡 Nearby sights / things to do',
        '🧭 반경 10km 내 주변 여행지': '🧭 Destinations within 10 km',
        '전체 지도에서 보기 →': 'View on full map →',
        '등록된 사진이 없습니다.': 'No photos have been added.',
        '등록된 설명이 없습니다.': 'No description has been added.',
        '등록된 주변 맛집 정보가 없습니다.': 'No nearby restaurants have been added.',
        '등록된 주변 볼거리 정보가 없습니다.': 'No nearby sights have been added.',
        '10km 내에 등록된 다른 여행지가 없습니다.': 'No other destinations have been added within 10 km.',
        '↗ 공유하기': '↗ Share',
        '공유하기': 'Share',
        '카카오톡': 'KakaoTalk',
        '인스타': 'Instagram',
        '페이스북': 'Facebook',
        '링크': 'Link',
        '복사': 'Copy',
        '링크가 복사되었습니다.': 'Link copied.',
        '리뷰 (': 'Reviews (',
        '여행톡 (': 'Travel talk (',
        '개의 리뷰)': ' reviews)',
        '리뷰 작성하기': 'Write a review',
        '리뷰 등록': 'Post review',
        '별점': 'Rating',
        '5점': '5 ★',
        '4점': '4 ★',
        '3점': '3 ★',
        '2점': '2 ★',
        '1점': '1 ★',
        '💬 여행톡': '💬 Travel talk',
        '여행지 정보 공유': 'Travel information',
        '주변 정보': 'Nearby information',
        '주변 맛집': 'Nearby restaurants',
        '주변 볼거리 / 즐길거리': 'Nearby sights / things to do',
        '사진 등록': 'Add photos',
        '취소하기': 'Cancel',
        '등록하기': 'Add destination',
        '수정 완료': 'Save changes',
        '등록하러 가기': 'Start registering',
        '회원가입': 'Sign up',
        '회원가입하고 여행을 시작하세요.': 'Sign up and start your journey.',
        '로그인에 사용할 이름을 3~20자로 입력해 주세요.': 'Enter a username of 3–20 characters.',
        '이미 계정이 있으신가요?': 'Already have an account?',
        '확인 중입니다…': 'Checking...',
        '확인하지 못했습니다. 잠시 후 다시 시도해 주세요.': 'Could not check. Please try again shortly.',
        '사용 가능한 닉네임입니다.': 'This nickname is available.',
        '비밀번호를 다시 입력해 주세요': 'Please re-enter your password.',
        '아이디': 'Username',
        '비밀번호': 'Password',
        '비밀번호 확인': 'Confirm password',
        '이메일': 'Email',
        '검색': 'Search',
        '작성하기': 'Write a post',
        '목록으로': 'Back to list',
        '저장': 'Save',
        '문의하기': 'Contact us',
        '공지사항': 'Notice',
        'QnA': 'Q&A',

        // Community UI (only fixed labels; posts and comments are excluded).
        '여행 후기': 'Travel reviews',
        '여행 팁': 'Travel tips',
        '자유 게시판': 'Free board',
        '글쓰기': 'Write a post',
        '글쓰기 +': 'Write a post +',
        '최신순': 'Newest',
        '인기순': 'Most popular',
        '댓글순': 'Most commented',
        '내 글 중 인기 글': 'Popular posts from me',
        '지금 핫한 글': 'Trending now',
        '더보기 >': 'More >',
        '게시판': 'Board',
        '게시판 선택': 'Choose a board',
        '사진 첨부': 'Attach photos',
        '등록': 'Submit',
        '작성자:': 'Author:',
        '작성일:': 'Created:',
        '수정일:': 'Updated:',
        '(수정됨)': '(edited)',
        '소개:': 'Introduction:',
        '추천 이유:': 'Why I recommend it:',
        '좋아요': 'Like',
        '댓글': 'Comments',
        '댓글 등록': 'Post comment',
        '첨부 이미지': 'Attached image',
        '지금, 나만의': 'Now, share your own',
        '여행 이야기를 공유해보세요!': 'travel story!',
        '좋은 여행지는': 'Great destinations are better',
        '좋은 사람들과!': 'with great people!',
        '지금 바로 커뮤니티에 참여하고': 'Join the community now',
        '다양한 여행 이야기를 만나보세요.': 'and discover a variety of travel stories.',

        // My page, inquiry, map, sign-up and administration labels.
        '내 정보': 'My profile',
        '1:1 문의': '1:1 inquiry',
        '내 문의 목록': 'My inquiries',
        '문의 관리': 'Inquiry management',
        '콘텐츠 관리': 'Content management',
        '회원탈퇴': 'Delete account',
        '프로필 수정': 'Edit profile',
        '안녕하세요.': 'Hello!',
        '나만의 여행 이야기를 기록해보세요.': 'Capture your own travel stories.',
        '여행지를 찜하면 표시됩니다.': 'Save destinations to see them here.',
        '태그가 있는 여행지를 찜하거나 커뮤니티 글에 좋아요를 눌러보세요.': 'Save destinations with travel tags or like community posts.',
        '관심 여행지는 찜한 지역, 여행 스타일은 찜·좋아요한 글의 태그를 바탕으로 표시합니다.': 'Favorite destinations reflect your saved regions. Travel styles reflect tags on destinations you save and posts you like.',
        '관심 여행지': 'Favorite destinations',
        '선호 여행 스타일': 'Preferred travel styles',
        '가입일': 'Member since',
        '가입일 기록 없음': 'Membership date unavailable',
        '받은 추천': 'Recommendations received',
        '최근 작성한 글': 'Recent posts',
        '최근 찜한 여행지': 'Recently saved destinations',
        '내가 등록한 여행지': 'Destinations I added',
        '전체보기 ›': 'View all ›',
        '사진 없음': 'No photo',
        '날짜 없음': 'No date',
        '국가 미등록': 'Country not specified',
        '등록일': 'Added',
        '여행지 둘러보기 →': 'Explore destinations →',
        '← 마이페이지로 돌아가기': '← Back to My page',
        '내 여행지 목록': 'My destinations',
        '찜한 여행지 목록': 'Saved destinations',
        '등록된 사진이 없습니다': 'No photos have been added.',
        '소개가 없습니다.': 'No introduction has been added.',
        '자세히 보기 →': 'View details →',
        '아직 등록한 여행지가 없습니다.': 'You have not added any destinations yet.',
        '아직 찜한 여행지가 없습니다.': 'You have not saved any destinations yet.',
        '현재 대표 이미지': 'Current profile image',
        '기본 대표 이미지': 'Default profile image',
        '비밀번호 변경': 'Change password',
        '여행 둘러보기': 'Explore destinations',
        '로그인하고 여행을 시작하세요.': 'Log in and start your journey.',
        '아직 계정이 없으신가요?': 'Don’t have an account yet?',
        '회원가입 안내': 'Sign-up information',
        '여행지 상세보기는 회원가입 후 로그인하면 이용할 수 있습니다.': 'Sign up and log in to view destination details.',
        '회원가입 페이지로 이동하시겠습니까?': 'Would you like to go to the sign-up page?',
        '아니오': 'No',
        '중복 확인': 'Check availability',
        '사용자 이름': 'Username',
        '생년월일': 'Date of birth',
        '성별': 'Gender',
        '선택하세요': 'Select',
        '남성': 'Male',
        '여성': 'Female',
        '문의 작성': 'Write an inquiry',
        '문의 안내': 'Inquiry guide',
        '답변 완료': 'Answered',
        '답변 대기': 'Awaiting reply',
        '알 수 없는 사용자': 'Unknown user',
        '등록된 문의가 없습니다.': 'There are no inquiries.',
        '관리자 답변': 'Administrator reply',
        '답변일': 'Answered on',
        '아직 답변이 등록되지 않았습니다.': 'No reply has been posted yet.',
        '답변 작성': 'Write reply',
        '답변 수정': 'Edit reply',
        '답변 저장': 'Save reply',
        '이전': 'Previous',
        '다음': 'Next',
        '전체 콘텐츠': 'All content',
        '관리 이력': 'Management history',
        '내용 검색': 'Search content',
        '개별 중단 상태': 'Individual suspension status',
        '중단 안 됨': 'Not suspended',
        '게시 중단': 'Suspend post',
        '게시 복원': 'Restore post',
        '상위 콘텐츠 중단 또는 없음': 'Parent content suspended or unavailable',
        '내용 없음': 'No content',
        '작성자 없음': 'No author',
        '중단 사유:': 'Suspension reason:',
        '내용 및 관리': 'Content and management',
        '게시 상태': 'Publishing status',
        '마지막 처리 사유:': 'Latest action reason:',
        '처리 사유': 'Action reason',
        '수정 사유': 'Reason for edit',
        '수정 내용 저장': 'Save edits',
        '변경 전후 보기': 'View before and after',
        '변경 전': 'Before',
        '변경 후': 'After',
        '아직 관리 이력이 없습니다.': 'There is no management history yet.',
        '커뮤니티 게시글': 'Community post',
        '리뷰': 'Review',
        '커뮤니티 댓글': 'Community comment',
        '여행톡': 'Travel talk',
        '여행톡 댓글': 'Travel talk comment',
        '여행 스타일': 'Travel styles',
        '자연': 'Nature',
        '미식': 'Food',
        '문화': 'Culture',
        '휴양': 'Relaxation',
        '액티비티': 'Activities',
        '쇼핑': 'Shopping',
        '글이나 여행지와 관련된 항목을 최대 3개 선택하세요.': 'Choose up to three items related to your post or destination.',
        '선택하지 않아도 등록할 수 있습니다.': 'You can register without selecting any.'
    });

    const ATTRIBUTE_TEXT = Object.freeze({
        '지역을 입력해주세요.': 'Enter a city or region.',
        'ex) 에펠탑, 후쿠오카 타워, 산토리니 이아 마을': 'e.g. Eiffel Tower, Fukuoka Tower, Oia in Santorini',
        '카테고리를 직접 입력해주세요.': 'Enter your own category.',
        '이 여행지를 한 문장으로 소개해주세요.': 'Describe this destination in one sentence.',
        '이 근처에 추천하고 싶은 맛집이 있나요?': 'Any nearby restaurants you would recommend?',
        '함께 둘러보면 좋은 장소나 즐길거리가 있나요?': 'Any nearby places to visit or things to do?',
        '운영 시간 : 10:00 ~ 18:00 이용 요금 : 성인 10,000원 휴무일 : 매주 월요일 교통·주차 : 전용 주차장 이용 가능 방문 팁 : 사람이 적은 오전 방문을 추천해요. 여행자에게 도움이 될 정보를 자유롭게 작성해주세요.': 'Opening hours: 10:00–18:00\nAdmission: KRW 10,000 per adult\nClosed: Mondays\nTransport / parking: On-site parking available\nTip: Visit in the morning to avoid crowds.\n\nShare any information that could help other travelers.',
        '닉네임을 입력해 주세요.': 'Enter a nickname.',
        '로그인에 사용할 사용자 이름': 'Enter your username',
        '닉네임': 'Nickname',
        '비밀번호': 'Password',
        '비밀번호를 다시 입력해 주세요': 'Confirm your password',
        '새 비밀번호를 입력해 주세요.': 'Enter a new password.',
        '새 비밀번호를 다시 입력해 주세요.': 'Confirm your new password.',
        '여행지 검색': 'Search destinations',
        '어디로 떠나고 싶으신가요? (나라)': 'Where would you like to go? (country)',
        '나라를 검색해주세요.': 'Search for a country.',
        '나라 이름 검색': 'Search country names',
        '첫 번째 국가': 'First country',
        '두 번째 국가': 'Second country',
        '금액 입력': 'Enter amount',
        '국가를 선택해주세요': 'Select a country',
        '도시 또는 지역을 입력해주세요': 'Enter a city or region',
        '출발지를 입력해주세요': 'Enter an origin',
        '도착지를 입력해주세요': 'Enter a destination',
        '전체 메뉴': 'All menu',
        '로그인': 'Log in',
        '검색어를 입력하세요': 'Enter a search term',
        '여행지 지도': 'Destination map',
        '여행 카테고리': 'Travel tools',
        '제목 또는 내용을 검색해보세요.': 'Search titles or content.',
        '게시글 제목을 입력하세요': 'Enter a post title.',
        '내용을 입력하세요...': 'Enter content...',
        '댓글을 입력해 주세요...': 'Enter a comment...',
        '이 여행지에 대한 리뷰를 남겨주세요.': 'Write a review of this destination.',
        '소개': 'Introduction',
        '추천 이유': 'Why I recommend it',
        '현재 비밀번호를 입력해 주세요': 'Enter your current password.',
        '답변 내용을 입력하세요.': 'Enter your reply.'
    });

    const TITLE_TEXT = Object.freeze({
        '어딧세이 | 여행의 시작': 'Odysay | Start your journey',
        '어딧세이 - 여행지 등록': 'Odysay - Add a destination',
        '여행지 | 어딧세이': 'Destinations | Odysay',
        '회원가입 - Odysay': 'Sign up - Odysay',
        '어딧세이 - 커뮤니티': 'Odysay - Community',
        '글쓰기 - 어딧세이': 'Write a post - Odysay',
        '마이페이지': 'My page',
        '설정': 'Settings',
        '프로필 수정 | 어딧세이': 'Edit profile | Odysay',
        '내가 찜한 여행지 | 어딧세이': 'Saved destinations | Odysay',
        '내가 만든 여행지 | 어딧세이': 'My destinations | Odysay',
        '1:1 문의 | 어딧세이': '1:1 Inquiry | Odysay',
        '문의 상세 | 어딧세이': 'Inquiry details | Odysay',
        '문의 작성 | 어딧세이': 'Write an inquiry | Odysay',
        '콘텐츠 관리 | 어딧세이': 'Content management | Odysay',
        '관리 이력 | 어딧세이': 'Management history | Odysay',
        '통합 검색 | 어딧세이': 'Search | Odysay'
    });

    const IGNORE_SELECTOR = [
        'script', 'style', 'textarea', 'input', 'code', 'pre',
        '[contenteditable]', '[data-i18n-ignore]', '[data-user-content]', '[data-translate-field]',
        '.leaflet-container', '.leaflet-pane', '#home-map', '#map',
        '#recommendedList', '#recentList', '#mainCommunityList', '#destinationGrid', '#postList', '#hotList',
        '.post-content', '.comment-content', '.user-content', '.review-content', '.talk-content',
        '.post-title', '.post-desc', '.hot-title', '.inquiry-title', '.inquiry-row-title', '.inquiry-message',
        '.place-title-area', '.place-intro', '.review-user', '.travel-talk-user', '.travel-talk-comment-user'
    ].join(', ');

    // Form controls are skipped for text-node translation, but their static
    // placeholder/ARIA attributes still need localization.
    const ATTRIBUTE_IGNORE_SELECTOR = [
        'script', 'style', '[data-i18n-ignore]', '[data-user-content]',
        '.leaflet-container', '.leaflet-pane', '#home-map', '#map',
        '#postList', '#hotList', '.post-content', '.comment-content', '.user-content', '.review-content', '.talk-content',
        '.post-title', '.post-desc', '.hot-title', '.inquiry-title', '.inquiry-row-title', '.inquiry-message',
        '.place-title-area', '.place-intro', '#reviewList', '.review-list', '.travel-talk-list'
    ].join(', ');

    let currentLanguage = readLanguage();
    let mutationObserver = null;
    let pendingRoots = new Set();
    let mutationFrame = null;

    function readLanguage() {
        const requested = new URL(global.location.href).searchParams.get(LANGUAGE_PARAM);
        if (SUPPORTED_LANGUAGES.has(requested)) return requested;
        try {
            const stored = global.localStorage.getItem(STORAGE_KEY);
            return SUPPORTED_LANGUAGES.has(stored) ? stored : 'ko';
        } catch (_) {
            return 'ko';
        }
    }

    function writeLanguage(language) {
        try {
            global.localStorage.setItem(STORAGE_KEY, language);
        } catch (_) {
            // Private browsing or storage policy should not prevent the UI from working.
        }
    }

    function syncLanguageUrl() {
        const url = new URL(global.location.href);
        if (!['http:', 'https:'].includes(url.protocol)) return;
        if (url.searchParams.get(LANGUAGE_PARAM) === currentLanguage) return;
        url.searchParams.set(LANGUAGE_PARAM, currentLanguage);
        // Retain search filters, map coordinates, fragments and history state.
        // Replacing the current entry also keeps language toggles out of Back history.
        global.history.replaceState(global.history.state, '', url.href);
    }

    function interpolate(template, values = {}) {
        return String(template).replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
    }

    function t(key, values = {}) {
        const template = MESSAGES[currentLanguage]?.[key] || MESSAGES.ko[key] || key;
        return interpolate(template, values);
    }

    function normalizeText(value) {
        return String(value || '').trim().replace(/\s+/g, ' ');
    }

    function isIgnored(node) {
        const parent = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        return Boolean(parent?.closest(IGNORE_SELECTOR));
    }

    function rememberAttribute(element, attribute) {
        let attributes = originalAttribute.get(element);
        if (!attributes) {
            attributes = new Map();
            originalAttribute.set(element, attributes);
        }
        if (!attributes.has(attribute)) attributes.set(attribute, element.getAttribute(attribute));
        return attributes.get(attribute);
    }

    function translateKnownText(root) {
        if (!root || currentLanguage === 'ko' && root.nodeType !== Node.DOCUMENT_NODE && !root.isConnected) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                if (!node.nodeValue?.trim() || isIgnored(node)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach((node) => {
            if (!originalText.has(node)) {
                // Counts and other API-rendered values must not be restored to
                // their initial value when switching back to Korean.
                if (!STATIC_TEXT[normalizeText(node.nodeValue)]) return;
                originalText.set(node, node.nodeValue);
            }
            const source = originalText.get(node);
            if (currentLanguage === 'ko') {
                node.nodeValue = source;
                return;
            }

            const normalized = normalizeText(source);
            const translation = STATIC_TEXT[normalized];
            if (!translation) return;

            const prefix = source.match(/^\s*/)?.[0] || '';
            const suffix = source.match(/\s*$/)?.[0] || '';
            node.nodeValue = `${prefix}${translation}${suffix}`;
        });
    }

    function translateMarkedElements(root) {
        const elements = [];
        if (root instanceof Element && root.matches('[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title], [data-country-name]')) {
            elements.push(root);
        }
        if (root.querySelectorAll) {
            elements.push(...root.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-aria-label], [data-i18n-title], [data-country-name]'));
        }

        elements.forEach((element) => {
            if (element.dataset.i18n) element.textContent = t(element.dataset.i18n);
            if (element.dataset.i18nPlaceholder) element.placeholder = t(element.dataset.i18nPlaceholder);
            if (element.dataset.i18nAriaLabel) element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
            if (element.dataset.i18nTitle) element.title = t(element.dataset.i18nTitle);
            if (element.dataset.countryName) {
                element.textContent = countryName(element.dataset.countryName);
            }
        });
    }

    function translateKnownAttributes(root) {
        const elements = [];
        if (root instanceof Element && root.matches('[placeholder], [aria-label], [title]')) {
            elements.push(root);
        }
        if (root.querySelectorAll) {
            elements.push(...root.querySelectorAll('[placeholder], [aria-label], [title]'));
        }
        elements.forEach((element) => {
            if (element.closest(ATTRIBUTE_IGNORE_SELECTOR)) return;
            ['placeholder', 'aria-label', 'title'].forEach((attribute) => {
                const source = rememberAttribute(element, attribute);
                if (!source) return;
                element.setAttribute(attribute, currentLanguage === 'en'
                    ? (ATTRIBUTE_TEXT[source] || ATTRIBUTE_TEXT[normalizeText(source)] || source)
                    : source);
            });
        });
    }

    function translateDocumentTitle() {
        if (currentLanguage === 'ko') {
            document.title = originalTitle;
            return;
        }

        if (TITLE_TEXT[originalTitle]) {
            document.title = TITLE_TEXT[originalTitle];
            return;
        }

        // Keep a user-entered place/post/search term intact while localizing
        // only the fixed title framing around it.
        document.title = originalTitle
            .replace(/^어딧세이 - /, 'Odysay - ')
            .replace(/ - 커뮤니티 상세$/, ' - Community details')
            .replace(/ \| 어딧세이$/, ' | Odysay');
    }

    function countryName(value) {
        return global.OdysayCountries?.displayName(value, currentLanguage) || value || '';
    }

    function applyTranslations(root = document) {
        if (!document.body && root === document) return;
        translateMarkedElements(root);
        translateKnownAttributes(root);
        translateKnownText(root);
        if (root === document) translateDocumentTitle();
        updateLanguageControls();
        root.querySelectorAll?.('input[type="submit"], input[type="button"]').forEach((input) => {
            const source = rememberAttribute(input, 'value');
            if (source && STATIC_TEXT[source]) input.value = currentLanguage === 'en' ? STATIC_TEXT[source] : source;
        });
        translatePublishedContent(root);
    }

    const contentOriginals = new WeakMap();

    /* =========================================================
       대한민국 여행지명 영문 표기
       - 고유명사: 한글 발음 기반 로마자 표기
       - 장소 종류: 자연스러운 영어 단어로 변환
    ========================================================= */

    const KOREAN_PLACE_TERMS = [
        ['해수욕장', 'Beach'],
        ['놀이공원', 'Theme Park'],
        ['미술관', 'Art Museum'],
        ['박물관', 'Museum'],
        ['대학교', 'University'],
        ['전망대', 'Observatory'],
        ['수목원', 'Arboretum'],
        ['동물원', 'Zoo'],
        ['식물원', 'Botanical Garden'],
        ['벽화마을', 'Mural Village'],
        ['한옥마을', 'Hanok Village'],
        ['호수공원', 'Lake Park'],
        ['공원', 'Park'],
        ['대교', 'Bridge'],
        ['시장', 'Market'],
        ['광장', 'Square'],
        ['폭포', 'Falls'],
        ['해변', 'Beach'],
        ['항구', 'Port'],
        ['공항', 'Airport'],
        ['터미널', 'Terminal'],
        ['역', 'Station']
    ];

    // 외래어 보정
    const KOREAN_LOANWORD_TERMS = [
        ['갤러리아', 'Galleria'],
        ['스타필드', 'Starfield'],
        ['메가박스', 'Megabox'],
        ['플라자', 'Plaza']
    ];

    const HANGUL_INITIALS = [
        'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
        's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'
    ];

    const HANGUL_VOWELS = [
        'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye',
        'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we',
        'wi', 'yu', 'eu', 'ui', 'i'
    ];

    const HANGUL_FINALS = [
        '', 'k', 'k', 'k', 'n', 'n', 'n', 't',
        'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l',
        'm', 'p', 'p', 't', 't', 'ng', 't', 't',
        'k', 't', 'p', 'h'
    ];

    function romanizeHangul(text) {
        return String(text || '').replace(/[가-힣]+/g, word => {
            let result = '';

            for (const character of word) {
                const code = character.charCodeAt(0) - 0xAC00;

                if (code < 0 || code > 11171) {
                    result += character;
                    continue;
                }

                const initial = Math.floor(code / 588);
                const vowel = Math.floor((code % 588) / 28);
                const final = code % 28;

                result +=
                    HANGUL_INITIALS[initial] +
                    HANGUL_VOWELS[vowel] +
                    HANGUL_FINALS[final];
            }

            return result;
        });
    }

    function capitalizePlaceWords(text) {
        return String(text || '')
            .split(/\s+/)
            .map(word => {
                if (!word) return word;
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    function englishKoreanPlaceName(value) {
        let text = String(value || '').trim();

        if (!text) return text;

        const protectedTerms = [];

        function protectTerm(korean, english) {
            if (!text.includes(korean)) return;

            const token = `__PROTECTED_${protectedTerms.length}__`;
            protectedTerms.push(english);
            text = text.replaceAll(korean, ` ${token} `);
        }

        // 1. 외래어 / 브랜드 영문 표기 보호
        KOREAN_LOANWORD_TERMS.forEach(([korean, english]) => {
            protectTerm(korean, english);
        });

        // 2. 역, 공원, 대교 등 장소 종류를 영어로 변환
        KOREAN_PLACE_TERMS.forEach(([korean, english]) => {
            protectTerm(korean, english);
        });

        // 3. 남아 있는 한국 고유명사는 발음대로 로마자 표기
        text = romanizeHangul(text);

        // 4. 보호해둔 영문 단어 복원
        protectedTerms.forEach((english, index) => {
            text = text.replaceAll(`__PROTECTED_${index}__`, english);
        });

                return capitalizePlaceWords(
                text.replace(/\s+/g, ' ').trim()
            );
        }


        function englishKoreanRegion(value) {
        let text = String(value || '').trim();

        if (!text) return text;

        const regionTerms = [
            ['특별자치도', '-do'],
            ['특별자치시', ''],
            ['광역시', ''],
            ['특별시', ''],
            ['도', '-do'],
            ['시', ''],
            ['군', '-gun'],
            ['구', '-gu'],
            ['읍', '-eup'],
            ['면', '-myeon'],
            ['동', '-dong'],
            ['리', '-ri']
        ];

        let suffix = '';

        for (const [korean, english] of regionTerms) {
            if (text.endsWith(korean)) {
                text = text.slice(0, -korean.length);
                suffix = english;
                break;
            }
        }

        const romanized = capitalizePlaceWords(
            romanizeHangul(text)
        );

        return `${romanized}${suffix}`;
    }

    const storedContent = new Map();
    const pendingContent = new Set();
    let contentTimer;
    let translationNotice;
    const contentSelector = '[data-translate-id][data-translate-field], [data-translate-place][data-translate-field]';

    function contentRef(element) {
        return `${element.dataset.translateType || 'place'}:${element.dataset.translateId || element.dataset.translatePlace}`;
    }

    function contentAttrs(kind, id, field) {
        if (!/^[a-z_]+$/.test(kind) || !/^\d+$/.test(String(id)) || !/^[a-z_]+$/.test(field)) return '';
        return `data-translate-type="${kind}" data-translate-id="${id}" data-translate-field="${field}"`;
    }

    function originalContent(element) {
        return contentOriginals.get(element) ?? element?.textContent ?? '';
    }

    function resetContent(element, text) {
        if (!element) return;
        contentOriginals.set(element, text);
        element.textContent = text;
        storedContent.delete(contentRef(element));
        translatePublishedContent(element);
    }

    function bindContent(element, kind, id, field, text) {
        element.dataset.translateType = kind;
        element.dataset.translateId = String(id);
        element.dataset.translateField = field;
        resetContent(element, text);
    }

    function contentStatus() {
        return;
        if (!translationNotice) {
            translationNotice = document.createElement('div');
            translationNotice.dataset.i18nIgnore = 'true';
            translationNotice.className = 'stored-translation-notice';
            translationNotice.setAttribute('role', 'status');
            translationNotice.style.cssText = 'max-width:1200px;margin:12px auto;padding:10px 16px;box-sizing:border-box;font:13px/1.6 sans-serif;overflow-wrap:anywhere;';
            const main = document.querySelector('main');
            if (main) main.before(translationNotice);
            else document.body.prepend(translationNotice);
        }
        const elements = [...document.querySelectorAll(contentSelector)];
        translationNotice.hidden = currentLanguage !== 'en' || !elements.length;
        if (translationNotice.hidden) return;
        const missing = elements.some(el => !storedContent.get(contentRef(el))?.fields?.[el.dataset.translateField]);
        translationNotice.textContent = missing
            ? 'Some translations are pending or unavailable. The original text is shown.'
            : 'Showing saved English translations.';
        const retryRefs = [...new Set(elements.map(contentRef))].filter(ref => {
            const payload = storedContent.get(ref);
            return payload?.can_retry && payload.status !== 'ready';
        });
        if (retryRefs.length) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Retry translation';
            button.style.marginLeft = '12px';
            button.addEventListener('click', async () => {
                button.disabled = true;
                const base = document.querySelector('meta[name="odysay-translations-url"]')?.content;
                const csrf = document.querySelector('meta[name="odysay-translations-csrf"]')?.content;
                try {
                    for (const ref of retryRefs) {
                        const response = await fetch(`${base}/${ref.replace(':', '/')}/retry`, {
                            method: 'POST', headers: {'X-CSRFToken': csrf}, credentials: 'same-origin'
                        });
                        if (!response.ok) throw new Error('Retry unavailable');
                        const result = await response.json();
                        storedContent.set(ref, result);
                        if (result.status !== 'ready') break;
                    }
                } catch (_) { /* Preserve originals; a later click can retry. */ }
                translatePublishedContent(document);
            });
            translationNotice.append(button);
        }
    }

    async function loadStoredContent() {
        contentTimer = null;
        const base = document.querySelector('meta[name="odysay-translations-url"]')?.content;
        if (!base) return;
        const refs = [...pendingContent];
        pendingContent.clear();
        for (let index = 0; index < refs.length; index += 100) {
            const batch = refs.slice(index, index + 100);
            try {
                // This GET only reads the database. It cannot generate translations.
                const response = await fetch(`${base}?refs=${encodeURIComponent(batch.join(','))}`, {credentials: 'same-origin'});
                if (!response.ok) throw new Error('Stored translations unavailable');
                const data = await response.json();
                batch.forEach(ref => storedContent.set(ref, data[ref] || {fields: {}}));
            } catch (_) {
                batch.forEach(ref => storedContent.set(ref, {fields: {}}));
            }
        }
        translatePublishedContent(document);
    }

    function translatePublishedContent(root) {
        // Search suggestions are rendered by the team's header script; leave that script intact.
        root.querySelectorAll?.('a.site-search-item').forEach(link => {
            const path = new URL(link.href, location.href).pathname;
            const place = path.match(/\/trip_location\/(\d+)$/);
            const post = path.match(/\/community\/detail\/post\/(\d+)$/);
            if (!place && !post) return;
            const title = link.querySelector('strong');
            if (!title) return;
            title.dataset.translateType = place ? 'place' : 'post';
            title.dataset.translateId = (place || post)[1];
            title.dataset.translateField = place ? 'place' : 'title';
        });
        const elements = [...(root.querySelectorAll?.(contentSelector) || [])];
        if (root instanceof Element && root.matches(contentSelector)) elements.unshift(root);
        elements.forEach(element => {
            if (element.closest('textarea, input, [contenteditable]')) return;
            if (element.closest('.leaflet-pane, #home-map, #map') && !element.closest('[data-database-popup]')) return;
            if (!contentOriginals.has(element)) contentOriginals.set(element, element.textContent);
            const original = originalContent(element);
            if (currentLanguage === 'ko') {
                if (element.textContent !== original) element.textContent = original;
                return;
            }
            const ref = contentRef(element);
            if (!/^[a-z_]+:\d+$/.test(ref)) return;
            const field = element.dataset.translateField;
            let payload = storedContent.get(ref);
            if (payload?.originals?.[field] !== undefined &&
                normalizeText(payload.originals[field]) !== normalizeText(original) &&
                !element.hasAttribute('data-translation-excerpt')) {
                storedContent.delete(ref);
                payload = undefined;
            }
            const translated = payload?.fields?.[field];
            const text = typeof translated === 'string'
                ? (element.hasAttribute('data-translation-excerpt') && translated.length > 200 ? translated.slice(0, 200) + '…' : translated)
                : original;
            if (element.textContent !== text) element.textContent = text;
            if (!storedContent.has(ref)) {
                storedContent.set(ref, {fields: {}}); // Deduplicate while the batch is in flight.
                pendingContent.add(ref);
                if (!contentTimer) contentTimer = setTimeout(loadStoredContent, 0);
            }
        });
        if (elements.length) contentStatus();
    }

        function romanizePublishedContent(root) {
            const selector = '[data-translate-place][data-translate-field]';
            const elements = [...(root.querySelectorAll?.(selector) || [])];

            if (root instanceof Element && root.matches(selector)) {
                elements.unshift(root);
            }

            elements.forEach(element => {
                if (element.closest('.leaflet-container, .leaflet-pane, #home-map, #map')) {
                    return;
                }

                if (!contentOriginals.has(element)) {
                    contentOriginals.set(element, element.textContent);
                }

                const original = contentOriginals.get(element);
                const field = element.dataset.translateField;

                const placeCountry =
                    global.OdysayCountries?.canonicalize?.(
                        element.dataset.placeCountry
                    ) || element.dataset.placeCountry;

                // 한국어 모드에서는 원문 그대로
                if (currentLanguage === 'ko') {
                    element.textContent = original;
                    return;
                }

                // 대한민국 여행지명만 영문 표기
                if (
                    field === 'place' &&
                    placeCountry === '대한민국'
                ) {
                    element.textContent = englishKoreanPlaceName(original);
                    return;
                }

                // 대한민국 지역명만 영문 표기
                if (
                    field === 'region' &&
                    placeCountry === '대한민국'
                ) {
                    element.textContent = englishKoreanRegion(original);
                    return;
                }

                // 사용자가 작성한 소개글/정보 등은 원문 유지
                element.textContent = original;
            });
        }

    function updateLanguageControls() {
        document.documentElement.lang = currentLanguage;
        document.querySelectorAll('[data-language-toggle]').forEach((button) => {
            const nextLanguage = currentLanguage === 'ko' ? 'en' : 'ko';
            button.textContent = nextLanguage === 'en' ? 'EN' : 'KO';
            button.setAttribute('aria-label', t('language.toggleLabel'));
            button.title = t('language.toggleLabel');
        });
        document.querySelectorAll('[data-language-option]').forEach((button) => {
            const active = button.dataset.languageOption === currentLanguage;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }

    function bindLanguageControls() {
        document.querySelectorAll('[data-language-toggle]').forEach((button) => {
            if (button.dataset.languageBound) return;
            button.dataset.languageBound = 'true';
            button.addEventListener('click', () => setLanguage(currentLanguage === 'ko' ? 'en' : 'ko'));
        });
        document.querySelectorAll('[data-language-option]').forEach((button) => {
            if (button.dataset.languageBound) return;
            button.dataset.languageBound = 'true';
            button.addEventListener('click', () => setLanguage(button.dataset.languageOption));
        });
    }

    function createFloatingLanguageControl() {
        if (document.querySelector('[data-language-toggle]')) return;

        const style = document.createElement('style');
        style.dataset.i18nIgnore = 'true';
        style.textContent = `
            .odysay-language-toggle {
                position: fixed; right: 18px; bottom: 18px; z-index: 2147483000;
                min-width: 48px; min-height: 38px; border: 1px solid #cbd5e1;
                border-radius: 999px; background: #ffffff; color: #142947;
                box-shadow: 0 5px 18px rgba(15, 23, 42, .16); cursor: pointer;
                font: 700 12px/1 system-ui, sans-serif; letter-spacing: .04em;
            }
            .odysay-language-toggle:hover, .odysay-language-toggle:focus-visible {
                background: #142947; color: #ffffff; outline: none;
            }
        `;
        document.head.append(style);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'odysay-language-toggle';
        button.dataset.languageToggle = 'true';
        button.dataset.i18nIgnore = 'true';
        document.body.append(button);
    }

    function observeDynamicUi() {
        if (mutationObserver || !document.body) return;
        mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                        pendingRoots.add(node);
                    }
                });
            });
            if (mutationFrame || !pendingRoots.size) return;
            mutationFrame = requestAnimationFrame(() => {
                pendingRoots.forEach((root) => applyTranslations(root));
                pendingRoots.clear();
                mutationFrame = null;
            });
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    function setLanguage(language) {
        const nextLanguage = SUPPORTED_LANGUAGES.has(language) ? language : 'ko';
        const changed = currentLanguage !== nextLanguage;
        currentLanguage = nextLanguage;
        writeLanguage(currentLanguage);
        syncLanguageUrl();
        if (document.body) applyTranslations(document);
        if (changed) {
            global.dispatchEvent(new CustomEvent('odysay:languagechange', {
                detail: { language: currentLanguage, locale: getLocale() }
            }));
        }
        return currentLanguage;
    }

    function getLocale() {
        return currentLanguage === 'en' ? 'en-US' : 'ko-KR';
    }

    global.OdysayLanguage = Object.freeze({
        getLanguage: () => currentLanguage,
        getLocale,
        getApiLanguage: () => currentLanguage === 'en' ? 'en' : 'ko',
        setLanguage,
        t,
        countryName,
        englishKoreanPlaceName,
        englishKoreanRegion,
        contentAttrs,
        originalContent,
        resetContent,
        bindContent,
        applyTranslations
    });

    writeLanguage(currentLanguage);
    syncLanguageUrl();
    document.documentElement.lang = currentLanguage;
    global.addEventListener('popstate', () => setLanguage(readLanguage()));
    global.addEventListener('pageshow', (event) => {
        if (event.persisted) setLanguage(readLanguage());
    });
    document.addEventListener('DOMContentLoaded', () => {
        createFloatingLanguageControl();
        bindLanguageControls();
        applyTranslations(document);
        observeDynamicUi();
    });
})(window);
