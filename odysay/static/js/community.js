document.addEventListener('DOMContentLoaded', () => {
  let placesData = [];
  const uiText = (key, values) => window.OdysayLanguage?.t?.(key, values) || key;
  const displayCountry = (country) => window.OdysayLanguage?.countryName?.(country) || country || '';

  const isPlaceItem = (item) =>
    String(item?.id || '').startsWith('place_');
  const escapeContent = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const contentSpan = (item, field, value) => {
    const kind = String(item.id).replace(/_\d+$/, '');
    const id = item.raw_id || String(item.id).split('_').pop();
    return `<span ${window.OdysayLanguage.contentAttrs(kind, id, field)}>${escapeContent(value)}</span>`;
 

  const isKoreanPlace = (item) => {
    const country =
      window.OdysayCountries?.canonicalize?.(item?.country) || item?.country;

    return isPlaceItem(item) && country === '대한민국';
  };

  const displayRegion = (item) => {
    const region = item?.region || '';

    if (
      window.OdysayLanguage?.getLanguage?.() === 'en' &&
      isKoreanPlace(item)
    ) {
      return window.OdysayLanguage?.englishKoreanRegion?.(region) || region;
    }

    return region;
  };

  const displayTitle = (item) => {
    const title = item?.title || '';

    if (
      window.OdysayLanguage?.getLanguage?.() === 'en' &&
      isKoreanPlace(item)
    ) {
      return window.OdysayLanguage?.englishKoreanPlaceName?.(title) || title;
    }

    return title;
  };

  const displayCategory = (category) => {
    const normalized = String(category || '').replace(/\s+/g, '');
    const keyByCategory = {
      '여행후기': 'community.categoryReview',
      '여행팁': 'community.categoryTip',
      '자유게시판': 'community.categoryFree'
    };
    return keyByCategory[normalized] ? uiText(keyByCategory[normalized]) : (category || uiText('community.general'));
  };

  // 1. HTML의 hidden input에서 현재 카테고리 및 초기 정렬값 읽기
  const categoryInput = document.getElementById('currentCategoryInput');
  let currentCategory = categoryInput ? categoryInput.value : 'ALL';

  const sortInput = document.getElementById('initialSortInput');
  let currentSort = sortInput ? sortInput.value : 'latest';

  // 정렬 탭 버튼 UI 초기 상태 반영
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.sort === currentSort) {
      btn.classList.add('active');
    }
  });

  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;

  // 2. 백엔드 API로부터 데이터 가져오기
  fetchPlaces();

  function fetchPlaces() {
    const container = document.querySelector('.main-container');
    let baseUrl = container?.dataset.postsApi;

    if (!baseUrl) {
      baseUrl = '/homepage/community/api/places';
    }

    // URL에 query parameter 추가 (category & sort)
    const urlParams = new URLSearchParams();
    if (currentCategory) urlParams.append('category', currentCategory);
    if (currentSort) urlParams.append('sort', currentSort);

    const fullUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${urlParams.toString()}`;

    fetch(fullUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? uiText('community.loginRequired')
              : uiText('community.loadError')
          );
        }
        return response.json();
      })
      .then(data => {
        placesData = data;
        applyFilterAndRender();
        renderHotList(placesData);
      })
      .catch(error => {
        console.error('데이터 가져오기 실패:', error);

        const postList = document.getElementById('postList');
        const pagination = document.getElementById('pagination');

        if (postList) {
          postList.innerHTML = `
            <div style="text-align:center; padding:60px 20px; background:var(--odysay-surface, #fff); border-radius:12px; color:var(--odysay-muted, #888);">
              <i class="fa-solid fa-triangle-exclamation" style="font-size:36px; margin-bottom:12px; color:#ff6b6b;"></i>
              <p>${error.message}</p>
            </div>`;
        }

        if (pagination) {
          pagination.innerHTML = '';
        }
      });
  }

  // 3. 필터링 + 정렬 + 페이징 종합 적용
  function applyFilterAndRender() {
    let filtered = [...placesData];

    // [카테고리 필터링 (클라이언트 측 보완)]
    if (currentCategory !== 'ALL') {
      filtered = filtered.filter(item => {
        if (!item.category) return false;
        const targetCategory = currentCategory.replace(/\s+/g, '');
        const itemCategory = item.category.replace(/\s+/g, '');
        return itemCategory.includes(targetCategory);
      });
    }

    // [검색어 필터링]
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim() !== '') {
      const query = searchInput.value.toLowerCase().trim();
      filtered = filtered.filter(item =>
        (item.title && item.title.toLowerCase().includes(query)) ||
        (item.intro && item.intro.toLowerCase().includes(query)) ||
        (item.country && item.country.toLowerCase().includes(query)) ||
        (item.region && item.region.toLowerCase().includes(query))
      );
    }

    // [정렬 기능: 인기순 / 댓글순 / 최신순]
    filtered.sort((a, b) => {
      const timeA = a.raw_date ? new Date(a.raw_date).getTime() : 0;
      const timeB = b.raw_date ? new Date(b.raw_date).getTime() : 0;

      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      const commentA = a.comment_count ?? a.comments_count ?? 0;
      const commentB = b.comment_count ?? b.comments_count ?? 0;

      if (currentSort === 'popular') {
        const totalA = likesA + commentA;
        const totalB = likesB + commentB;

        if (totalB !== totalA) {
          return totalB - totalA;
        }
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        return timeB - timeA;
      } else if (currentSort === 'comments') {
        // 1순위: 댓글 수 내림차순
        if (commentB !== commentA) {
          return commentB - commentA;
        }
        // 2순위: 댓글 수가 같을 경우 좋아요(하트) 수 내림차순
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        // 3순위: 댓글 수와 좋아요 수가 모두 같을 경우 최신순
        return timeB - timeA;
      } else {
        return timeB - timeA;
      }
    });

    // [페이지네이션 계산]
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    renderPostList(pageItems);
    renderPagination(totalPages);
  }

  // 4. 게시글 리스트 렌더링
  function renderPostList(items) {
    const postList = document.getElementById('postList');
    if (!postList) return;
    postList.innerHTML = '';

    if (items.length === 0) {
      postList.innerHTML = `
        <div style="text-align:center; padding:60px 20px; background:var(--odysay-surface, #fff); border-radius:12px; color:var(--odysay-muted, #888);">
          <i class="fa-regular fa-folder-open" style="font-size:36px; margin-bottom:12px; color:var(--odysay-muted, #ccc);"></i>

          <p>${uiText('community.noPosts')}</p>


        </div>`;
      return;
    }

    items.forEach(item => {
      let hasPhoto = false;
      let thumbImg = '';

      if (item.photos && item.photos.trim() !== '') {
        const photoArray = item.photos.split(',');
        if (photoArray.length > 0 && photoArray[0].trim() !== '') {
          thumbImg = `/static/uploads/${photoArray[0].trim()}`;
          hasPhoto = true;
        }
      }

      const imageHtml = hasPhoto
        ? `<img src="${thumbImg}" alt="${item.title}" class="post-thumb" onerror="this.outerHTML='<div class=\\'post-thumb no-img\\'><i class=\\'fa-regular fa-image\\'></i><span>Odysay</span></div>'">`
        : `<div class="post-thumb no-img"><i class="fa-regular fa-image"></i><span>Odysay</span></div>`;

      const commentCount = item.comment_count ?? item.comments_count ?? 0;

      const cardHtml = `
        <a href="${item.detail_url}" class="post-card">
          ${imageHtml}
          <div class="post-info">
            <div class="post-body-wrap">
              <span class="badge">${displayCategory(item.category)}</span>
              <div class="post-main-content">
                <h3 class="post-title">[${escapeContent(isPlaceItem(item) ? (displayCountry(item.country) || 'Odysay') : uiText('home.defaultCommunity'))}/${isPlaceItem(item) ? contentSpan(item, 'region', item.region) : escapeContent(displayCategory(item.category))}] ${contentSpan(item, isPlaceItem(item) ? 'place' : 'title', item.title)}</h3>                <p class="post-desc">${item.intro ? contentSpan(item, isPlaceItem(item) ? 'intro' : 'content', item.intro) : uiText('community.noContent')}</p>
              </div>
            </div>
            <div class="post-meta">
              <span class="author"><i class="fa-regular fa-user"></i> ${item.author}</span>
              <div class="meta-right">
                <div class="meta-stats">
                  <span class="like-count"><i class="fa-regular fa-heart"></i> ${item.likes || 0}</span>
                  <span class="comment-count"><i class="fa-regular fa-comment"></i> ${commentCount}</span>
                </div>
                <span class="time">${item.created_at || ''}</span>
              </div>
            </div>
          </div>
        </a>
      `;
      postList.insertAdjacentHTML('beforeend', cardHtml);
    });
  }

  // 5. 페이지네이션 버튼 렌더링
  function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    pagination.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-nav';
    prevBtn.innerText = '<';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        applyFilterAndRender();
      }
    });
    pagination.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-num ${i === currentPage ? 'active' : ''}`;
      pageBtn.innerText = i;
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        applyFilterAndRender();
      });
      pagination.appendChild(pageBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-nav';
    nextBtn.innerText = '>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        applyFilterAndRender();
      }
    });
    pagination.appendChild(nextBtn);
  }

  // 6. 우측 사이드바 '지금 핫한 글 / 내 글 중 인기 글' Top 5 렌더링
  function renderHotList(items) {
    const hotList = document.getElementById('hotList');
    if (!hotList) return;
    hotList.innerHTML = '';

    const sorted = [...items].sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      const commentA = a.comment_count ?? a.comments_count ?? 0;
      const commentB = b.comment_count ?? b.comments_count ?? 0;

      const totalA = likesA + commentA;
      const totalB = likesB + commentB;

      if (totalB !== totalA) {
        return totalB - totalA;
      }
      if (likesB !== likesA) {
        return likesB - likesA;
      }
      const timeA = a.raw_date ? new Date(a.raw_date).getTime() : 0;
      const timeB = b.raw_date ? new Date(b.raw_date).getTime() : 0;
      return timeB - timeA;
    }).slice(0, 5);

    sorted.forEach((item, index) => {
      let hasPhoto = false;
      let thumbImg = '';

      if (item.photos && item.photos.trim() !== '') {
        const photoArray = item.photos.split(',');
        if (photoArray.length > 0 && photoArray[0].trim() !== '') {
          thumbImg = `/static/uploads/${photoArray[0].trim()}`;
          hasPhoto = true;
        }
      }

      const hotImageHtml = hasPhoto
        ? `<img src="${thumbImg}" alt="thumb" class="hot-thumb" onerror="this.outerHTML='<div class=\\'hot-thumb no-img\\'><i class=\\'fa-regular fa-image\\'></i></div>'">`
        : `<div class="hot-thumb no-img"><i class="fa-regular fa-image"></i></div>`;

      const commentCount = item.comment_count ?? item.comments_count ?? 0;

      const hotHtml = `
        <li>
          <a href="${item.detail_url}" class="hot-item">
            <span class="hot-rank">${index + 1}</span>
            ${hotImageHtml}
            <div class="hot-details">
              <div class="hot-title">${contentSpan(item, isPlaceItem(item) ? 'place' : 'title', item.title)}</div>
              <div class="hot-stats">
                <i class="fa-regular fa-heart"></i> ${item.likes || 0}
                <i class="fa-regular fa-comment" style="margin-left:6px;"></i> ${commentCount}
              </div>
            </div>
          </a>
        </li>
      `;
      hotList.insertAdjacentHTML('beforeend', hotHtml);
    });
  }

  // 7. 정렬 탭 클릭 이벤트
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      currentSort = targetBtn.dataset.sort || 'latest';
      currentPage = 1;
      fetchPlaces(); // 정렬 변경 시 백엔드 재요청
    });
  });

  // 8. 검색기능
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      currentPage = 1;
      applyFilterAndRender();
    });
    searchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        currentPage = 1;
        applyFilterAndRender();
      }
    });
  }

  window.addEventListener('odysay:languagechange', () => {
    applyFilterAndRender();
    renderHotList(placesData);
  });
});