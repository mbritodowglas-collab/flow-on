/* === Flow On: inclui topo e navegação globais === */
document.addEventListener('DOMContentLoaded',()=>{
  const headerHTML = `
  <header class="fo-topbar">
    <a class="fo-brand" href="../../index.html">
      <img src="../../assets/img/logo.svg" alt="Flow On logo" class="fo-logo" />
      <span class="fo-brand-text">Flow On</span>
    </a>
  </header>`;

  const navHTML = `
  <nav class="fo-nav" role="navigation" aria-label="Navegação principal">
    <a class="fo-item" href="../../index.html" data-page="home">
      <span class="fo-ico" aria-hidden="true">🏠</span>
      <span class="fo-label">Home</span>
    </a>
    <a class="fo-item" href="../journal/" data-page="journal">
      <span class="fo-ico" aria-hidden="true">📓</span>
      <span class="fo-label">Journal</span>
    </a>
    <a class="fo-item" href="../themes/" data-page="themes">
      <span class="fo-ico" aria-hidden="true">🎬</span>
      <span class="fo-label">Temas</span>
    </a>
    <a class="fo-item" href="../settings/" data-page="settings">
      <span class="fo-ico" aria-hidden="true">⚙️</span>
      <span class="fo-label">Configurações</span>
    </a>
  </nav>`;

  // Insere o topo e o nav no corpo da página (no início)
  const body = document.body;
  body.insertAdjacentHTML('afterbegin', navHTML);
  body.insertAdjacentHTML('afterbegin', headerHTML);

  // Marca ativo automaticamente
  const path = window.location.pathname;
  const current = path.includes('/journal/') ? 'journal'
                : path.includes('/themes/') ? 'themes'
                : path.includes('/settings/') ? 'settings'
                : 'home';

  document.querySelectorAll('.fo-item').forEach(a=>{
    if(a.dataset.page === current) a.classList.add('is-active');
  });
});