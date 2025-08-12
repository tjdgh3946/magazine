import { initMarquee } from './marquee.js';
import { initUI } from './ui.js';
import { initSideMarquee } from './marquee.js';


function initPageKeywords() {
  const track = document.getElementById('tagTrack');

  if (!track || !window.imageData) return;

  const filename = window.location.pathname.split('/').pop();
  const match = filename.match(/^(\d+)-/);

  if (!match) return;

  const index = parseInt(match[1], 10) - 1;
  const item = window.imageData[index];
  if (!item || !Array.isArray(item.keywords)) return;

  // 기존 내용 초기화
  track.innerHTML = '';

  // Tags: 라벨 추가
  const label = document.createElement('strong');
  label.textContent = 'Tags:';
  label.style.marginRight = '8px';
  track.appendChild(label);

  // 태그 나열
  item.keywords.forEach((k, i) => {
    const a = document.createElement('span');
    a.className = 'keyword';
    a.textContent = `#${k}`;

    // 라벨 뒤에 붙이기
    track.appendChild(a);

    // 태그 간 간격
    if (i < item.keywords.length - 1) {
      const spacer = document.createTextNode(' ');
      track.appendChild(spacer);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initUI();
  initPageKeywords();
  //initMarquee();  
  initSideMarquee(imageData.slice().reverse()); 
});
