document.addEventListener('DOMContentLoaded', () => {
  let placesData = [];

  // 1. HTML의 hidden input에서 현재 카테고리값 읽기
  const categoryInput = document.getElementById('currentCategoryInput');
  let currentCategory = categoryInput ? categoryInput.value : 'ALL';

  // 기본 정렬값
  let currentSort = 'latest';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5;

  // 2. 백엔드 API로부터 데이터 가져오기
  fetchPlaces();

  function fetchPlaces() {
    fetch('/homepage/community/api/places')
      .then(response => response.json())
      .then(data => {
        placesData = data;
        applyFilterAndRender();
        renderHotList(placesData);
      })
      .catch(error => {
        console.error('데이터 가져오기 실패:', error);
      });
  }

  // 3. 필터링 + 정렬 + 페이징 종합 적용
  function applyFilterAndRender() {
    let filtered = [...placesData];

    // [카테고리 필터링]
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

      if (currentSort === 'popular') {
        // 인기순 (좋아요 수 내림차순, 동일할 경우 최신순)
        const likesA = a.likes || 0;
        const likesB = b.likes || 0;
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        return timeB - timeA;
      } else if (currentSort === 'comments') {
        // 댓글순 (댓글 수 내림차순, 동일할 경우 최신순)
        const countA = a.comment_count ?? a.comments_count ?? 0;
        const countB = b.comment_count ?? b.comments_count ?? 0;
        if (countB !== countA) {
          return countB - countA;
        }
        return timeB - timeA;
      } else {
        // 최신순 (기본값)
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
        <div style="text-align:center; padding:60px 20px; background:#fff; border-radius:12px; color:#888;">
          <i class="fa-regular fa-folder-open" style="font-size:36px; margin-bottom:12px; color:#ccc;"></i>
          <p>등록된 게시글이 없습니다.</p>
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
              <span class="badge">${item.category || '일반'}</span>
              <div class="post-main-content">
                <h3 class="post-title">[${item.country || '어딧세이'}/${item.region || '게시판'}] ${item.title}</h3>
                <p class="post-desc">${item.intro || '등록된 내용이 없습니다.'}</p>
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

  // 6. 우측 상단 '지금 핫한 글' 렌더링
  function renderHotList(items) {
    const hotList = document.getElementById('hotList');
    if (!hotList) return;
    hotList.innerHTML = '';

    const sorted = [...items].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);

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

      const hotHtml = `
        <li>
          <a href="${item.detail_url}" class="hot-item">
            <span class="hot-rank">${index + 1}</span>
            ${hotImageHtml}
            <div class="hot-details">
              <div class="hot-title">${item.title}</div>
              <div class="hot-stats">
                <i class="fa-regular fa-heart"></i> ${item.likes || 0}
              </div>
            </div>
          </a>
        </li>
      `;
      hotList.insertAdjacentHTML('beforeend', hotHtml);
    });
  }

  // 7. 정렬 탭 클릭 이벤트 (탭 클릭 시 data-sort 속성값 읽기)
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      const targetBtn = e.currentTarget;
      targetBtn.classList.add('active');
      currentSort = targetBtn.dataset.sort || 'latest';
      currentPage = 1;
      applyFilterAndRender();
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
});