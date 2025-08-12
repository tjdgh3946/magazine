window.MathJax = {
  tex: {
    tags: 'ams',                  // 수식 번호 붙이기
    useLabelIds: true,            // 라벨 이름을 id의 베이스로
    packages: { '[+]': ['tagformat'] },
    tagformat: {
      id: (id) => id               // 프리픽스 제거
    },
    inlineMath: [['\\(','\\)'], ['$', '$']],
    displayMath: [['\\[','\\]'], ['$$','$$']]
  },
  options: {
    skipHtmlTags: ['script','noscript','style','textarea','pre','code']
  }
};

(function(){
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
  script.async = true;
  document.head.appendChild(script);
})();
