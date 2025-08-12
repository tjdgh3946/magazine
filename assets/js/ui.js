export function initUI(){
  const searchBox  = document.getElementById('searchBox');
  const searchIcon = document.getElementById('searchIcon');
  const searchInput= document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');

  if (searchIcon && searchBox && searchInput) {
    searchIcon.addEventListener('click', () => {
      searchBox.classList.toggle('active');
      if (searchBox.classList.contains('active')) searchInput.focus();
      else searchInput.value='';
    });
    searchInput.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter'){
        const q = searchInput.value.trim();
        if(q) location.href = `../index.html?q=${encodeURIComponent(q)}`;
      }
    });
    document.addEventListener('click', e=>{
      if (searchBox.classList.contains('active') && !searchBox.contains(e.target)) {
        searchBox.classList.remove('active'); searchInput.value='';
      }
    });
  }
  refreshBtn?.addEventListener('click', ()=> location.reload());
}
