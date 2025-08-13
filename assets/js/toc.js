// toc.js
// 사용법:
// import { slugify, initTOC } from './toc.js';
// initTOC();  // 필요할 때 호출

function setActive(links, targetLink) {
  links.forEach(a => a.classList.remove('active'));
  if (targetLink) targetLink.classList.add('active');
}

export function slugify(text) {
  const base = String(text ?? '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^0-9A-Za-z가-힣\-_]/g, '')
    .toLowerCase();
  return base || 'section';
}

export function initTOC(opts = {}) {
  const {
    contentSelector = 'main',
    tocSelector = '#toc',
    observeActive = true,
    rootMargin = '0px 0px -70% 0px',
    threshold = [0, 1.0],
    headingsSelector = 'h1, h2, h3, h4, h5, h6',
    addAnchor = true,
  } = opts;

  const content = document.querySelector(contentSelector);
  const tocEl = document.querySelector(tocSelector);
  if (!content || !tocEl) return { headings: [], links: [] };

  // 1) 헤드라인 수집 및 id 보장
  const headings = Array.from(content.querySelectorAll(headingsSelector));
  const idCount = new Map();

  for (const h of headings) {
    if (!h.id) {
      let id = slugify(h.textContent);
      const n = (idCount.get(id) || 0) + 1;
      idCount.set(id, n);
      if (n > 1) id = `${id}-${n}`;
      h.id = id;
    }
    if (addAnchor && !h.querySelector('.anchor')) {
      const a = document.createElement('a');
      a.href = `#${h.id}`;
      a.className = 'anchor';
      a.ariaLabel = '링크 복사';
      a.textContent = '¶';
      h.appendChild(a);
    }
  }

  // 2) TOC 렌더링
  const frag = document.createDocumentFragment();
  for (const h of headings) {
    const level = parseInt(h.tagName.substring(1), 10);
    
    const li = document.createElement('li');
    li.classList.add(`lvl-${level}`);     // ← li로 이동
    const link = document.createElement('a')
    link.href = `#${h.id}`;
    link.textContent = h.textContent.replace(/¶$/, '').trim();
    li.appendChild(link);

    frag.appendChild(li);
  }
  tocEl.innerHTML = ''; // 재호출 시 초기화
  tocEl.appendChild(frag);

  const links = Array.from(tocEl.querySelectorAll('a'));
  
  // id -> link 매핑 (클릭/해시 변경/폴백에서 재사용)
  const linkById = new Map(
    headings.map(h => [h.id, links.find(a => a.getAttribute('href') === `#${h.id}`)])
  );

  // 3) 현재 섹션 하이라이트
  if (observeActive && 'IntersectionObserver' in window) {
    const map = new Map(
      headings.map(h => [h.id, links.find(a => a.getAttribute('href') === `#${h.id}`)])
    );

    const io = new IntersectionObserver((entries) => {
      let topMost = null;
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!topMost || e.boundingClientRect.top < topMost.boundingClientRect.top) {
            topMost = e;
          }
        }
      }
      if (topMost) {
        links.forEach(a => a.classList.remove('active'));
        const a = map.get(topMost.target.id);
        if (a) a.classList.add('active');
      }
    }, { rootMargin, threshold });

    headings.forEach(h => io.observe(h));
  } else {
    // ---- 폴백: 스크롤 이벤트로 활성 섹션 계산 ----
    const pickActive = () => {
      const y = 80; // 상단 오프셋(헤더 높이 등 있으면 조절)
      let cand = null;
      for (const h of headings) {
        const t = h.getBoundingClientRect().top;
        if (t - y <= 0) cand = h; else break;
      }
      const target = cand ?? headings[0];
      setActive(links, linkById.get(target.id));
    };
    pickActive();
    window.addEventListener('scroll', () => { requestAnimationFrame(pickActive); }, { passive: true });
  }

  // ---- TOC 클릭 시 즉시 활성화(스크롤 애니메이션 전에 표시) ----
  tocEl.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    setActive(links, a);
    // 기본 앵커 동작은 그대로 두되, 스무스 스크롤 쓰는 경우에도 즉시 반영됨
  });

  // ---- 해시가 외부 요인으로 바뀔 때(뒤로가기 등) 활성화 ----
  const applyHash = () => {
    const id = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (id && linkById.has(id)) setActive(links, linkById.get(id));
  };
  window.addEventListener('hashchange', applyHash);
  applyHash(); // 초기 로드 시에도 한 번

  return { headings, links };
}
