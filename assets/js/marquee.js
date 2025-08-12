// Tags marquee: article 폭 기준 무한 슬라이드
export function initMarquee() {
   const container = document.querySelector('.tags-marquee');
    const track = document.getElementById('tagTrack');

    const article = document.querySelector('article');
    const w = article.offsetWidth; // 절반(한 세트) 폭
    track.style.setProperty('--marquee-width', `${w}px`);


    if (!container || !track) return;

    // 1) 트랙을 두 번 이어붙여 끊김 없는 루프 생성
    //track.innerHTML = track.innerHTML + track.innerHTML;

    // 2) 콘텐츠 길이에 따라 속도 자동 조절 (px/sec)
    //    60px/s 정도가 자연스러움. 필요 시 숫자만 조절.
    const speed = 12; // px per second
    // scrollWidth는 두 번 붙인 상태의 전체 길이, 절반만 이동하면 한 사이클
    const total = track.scrollWidth / 2;
    const duration = total / speed; // seconds

    track.style.animationDuration = `${duration}s`;
    container.classList.add('animate');

    // 3) 리사이즈 시 길이 재계산
    let raf;
    window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
        const newTotal = track.scrollWidth / 2;
        track.style.animationDuration = `${newTotal / speed}s`;
    });
    }, { passive: true });
}


// 사이드 무빙 슬라이드 초기화
export function initSideMarquee(list){
  const track = document.getElementById('sideTrack');
  const wrap  = track?.closest('.side-marquee');
  if(!track || !wrap) return;

  // 1) 콘텐츠 렌더
  track.innerHTML = '';
  list.forEach((data, i) => {
  const idx = (typeof data.index === 'number') ? data.index : i;

  const a = document.createElement('a');
  a.className = 'side-item';
  a.href = withBase(`pages/${idx + 1}-1.html`);
  a.setAttribute('aria-label', data.title || data.caption || 'article');

  // 썸네일 박스
  const box = document.createElement('div');
  box.className = 'side-thumbbox';

  const img = document.createElement('img');
  img.className = 'side-thumb';
  img.src = withBase(data.filename);
  img.alt = data.title || data.caption || 'thumb';
  img.loading = 'lazy';
  img.decoding = 'async';

  box.appendChild(img);

  // 이모지 + 제목
  const row = document.createElement('div');
  row.className = 'side-row';

  const emoji = document.createElement('span');
  emoji.className = 'side-emoji';

  const title = document.createElement('div');
  title.className = 'side-title';
  title.textContent = data.title || '';

  row.append(title);

  a.append(box, row);
  track.appendChild(a);
});

  // 2) 무한 루프용 복제 (2배)
  const baseHTML = track.innerHTML;
  track.innerHTML = baseHTML + baseHTML;

  // 3) 높이/속도 계산
  // 한 세트 높이 = 트랙 전체 높이의 절반
  const singleHeight = track.scrollHeight / 2;
  // 속도(px/s) 조절: 40~70 정도 취향대로
  const SPEED = 30;
  const duration = singleHeight / SPEED; // seconds

  track.style.setProperty('--loop-height', singleHeight + 'px');
  track.style.setProperty('--loop-duration', duration + 's');

  // 4) 애니메이션 on
  wrap.classList.add('animate');

  // 5) 리사이즈 대응 (디바운스)
  let raf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      // 다시 계산
      track.innerHTML = baseHTML + baseHTML;
      const h = track.scrollHeight / 2;
      track.style.setProperty('--loop-height', h + 'px');
      track.style.setProperty('--loop-duration', (h / SPEED) + 's');
    });
  }, { passive: true });
}


function withBase(path) {
  // 절대 URL/루트(/...)면 그대로
  if (/^https?:\/\//.test(path) || path.startsWith('/')) return path;
  // pages 하위면 한 단계 올라가기
  const inPages = location.pathname.includes('/pages/');
  return inPages ? `../${path}` : path;
}
