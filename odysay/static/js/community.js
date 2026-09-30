document.addEventListener('DOMContentLoaded', () => {
  let placesData = [];

  // 1. HTML의 hidden input에서 현재 카테고리값 읽기
  const categoryInput = document.getElementById('currentCategoryInput');
  let currentCategory = categoryInput ? categoryInput.value : 'ALL';

  let currentSort = 'latest';
  let currentPage = 1;
  const ITEMS_PER_PAGE = 5; // 1페이지당 5개 게시물

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

    // [정렬]
    if (currentSort === 'popular') {
      filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

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
      let thumbImg = 'https://via.placeholder.com/100?text=No+Image';
      if (item.photos) {
        const photoArray = item.photos.split(',');
        if (photoArray.length > 0 && photoArray[0].trim() !== '') {
          thumbImg = `/static/uploads/${photoArray[0].trim()}`;
        }
      }

      const cardHtml = `
        <a href="${item.detail_url}" class="post-card">
          <img src="${thumbImg}" alt="${item.title}" class="post-thumb" onerror="this.src='https://via.placeholder.com/100'">
          <div class="post-info">
            <div>
              <div class="post-header">
                <span class="badge">여행 후기</span>
                <span class="post-title">[${item.country}/${item.region}] ${item.title}</span>
              </div>
              <p class="post-desc">${item.intro || '등록된 소개가 없습니다.'}</p>
            </div>
            <div class="post-meta">
              <div class="author-time">
                <span class="author"><i class="fa-regular fa-user"></i> ${item.author}</span>
                <span class="time">${item.created_at}</span>
              </div>
              <div class="stats">
                <span><i class="fa-regular fa-heart"></i> ${item.likes}</span>
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
      let thumbImg = 'https://via.placeholder.com/44';
      if (item.photos) {
        const photoArray = item.photos.split(',');
        if (photoArray.length > 0 && photoArray[0].trim() !== '') {
          thumbImg = `/static/uploads/${photoArray[0].trim()}`;
        }
      }

      const hotHtml = `
        <li>
          <a href="${item.detail_url}" class="hot-item">
            <span class="hot-rank">${index + 1}</span>
            <img src="${thumbImg}" alt="thumb" class="hot-thumb" onerror="this.src='https://via.placeholder.com/44'">
            <div class="hot-details">
              <div class="hot-title">${item.title}</div>
              <div class="hot-stats">
                <i class="fa-regular fa-heart"></i> ${item.likes}
              </div>
            </div>
          </a>
        </li>
      `;
      hotList.insertAdjacentHTML('beforeend', hotHtml);
    });
  }

  // 7. 정렬 탭 클릭
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentSort = btn.dataset.sort;
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