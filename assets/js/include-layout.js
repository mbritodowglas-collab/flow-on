// assets/js/include-layout.js
(function () {
  // Remove headers antigos (.navbar) para evitar duplicidade
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('header.navbar').forEach(h => h.remove());
  });

  // Calcula prefixo relativo até a raiz (…/…/)
  function rootPrefix() {
    const parts = location.pathname.split('/').filter(Boolean); // ex: ['pages','habits','index.html']
    const idx = parts.indexOf('pages');
    const up = idx >= 0 ? (parts.length - idx - 1) : 0;
    return '../'.repeat(up);
  }
  const base = rootPrefix();

  // Marca item ativo pelo path
  const path = location.pathname;
  const active = path.includes('/pages/journal/')    ? 'journal'
               : path.includes('/pages/themes/')     ? 'themes'
               : path.includes('/pages/settings/')   ? 'settings'
               : 'home';

  // Estilos mínimos para Topbar + Dock (iguais da Home)
  const style = document.createElement('style');
  style.textContent = `
    :root{
      --surface: rgba(20,20,20,.7);
      --text: #cfcfd3;
      --text-strong: #ffffff;
      --brand: #f2a65a;
      --brand-ghost: rgba(242,166,90,.18);
      --border: rgba(255,255,255,.08);
      --radius: 14px; --radius-lg: 18px;
    }
    .fo-topbar{position:sticky;top:0;z-index:50;display:flex;justify-content:center;align-items:center;padding:10px 12px;background:var(--surface);backdrop-filter:blur(8px);border-bottom:1px solid var(--border)}
    .fo-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none}
    .fo-logo{width:28px;height:28px;display:block;filter:drop-shadow(0 0 6px var(--brand-ghost))}
    .fo-brand-text{color:var(--brand);font-weight:600;letter-spacing:.6px;font-size:1.05rem}
    .fo-nav{position:sticky;top:60px;z-index:40;display:flex;justify-content:center;align-items:center;gap:22px;padding:14px 10px;margin:10px auto 18px;width:min(980px,96%);background:var(--surface);backdrop-filter:blur(8px);border:1px solid var(--border);border-radius:var(--radius-lg)}
    .fo-item{text-decoration:none;color:var(--text);display:grid;place-items:center;gap:6px;padding:8px 10px;min-width:74px;border-radius:var(--radius);transition:transform .18s ease,color .18s ease,background .18s ease,box-shadow .18s ease}
    .fo-item .fo-ico{font-size:1.4rem;line-height:1}
    .fo-item .fo-label{font-size:.9rem;font-weight:500}
    .fo-item:hover,.fo-item:focus-visible{color:var(--text-strong);background:rgba(255,255,255,.04);transform:translateY(-1px);outline:none}
    .fo-item.is-active{color:var(--text-strong);background:linear-gradient(180deg,rgba(242,166,90,.16),rgba(242,166,90,.06));box-shadow:0 6px 14px rgba(242,166,90,.12), inset 0 0 0 1px rgba(242,166,90,.35)}
    @media (max-width:380px){ .fo-nav{gap:14px} .fo-item{min-width:66px;padding:8px 8px} .fo-item .fo-label{font-size:.85rem} }
    #flowon-badge,.fo-watermark,.flowon-mark{display:none!important}
  `;
  document.head.appendChild(style);

  // Topbar
  const top = document.createElement('header');
  top.className = 'fo-topbar';
  top.innerHTML = `
    <a class="fo-brand" href="${base}">
      <img src="${base}assets/img/logo.svg" alt="Flow On logo" class="fo-logo" />
      <span class="fo-brand-text">Flow On</span>
    </a>`;
  document.body.prepend(top);

  // Dock de navegação
  const nav = document.createElement('nav');
  nav.className = 'fo-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Navegação principal');
  nav.innerHTML = `
    <a class="fo-item ${active==='home'?'is-active active':''}" href="${base}" aria-label="Home">
      <span class="fo-ico" aria-hidden="true">🏠</span><span class="fo-label">Home</span>
    </a>
    <a class="fo-item ${active==='journal'?'is-active':''}" href="${base}pages/journal/" aria-label="Journal">
      <span class="fo-ico" aria-hidden="true">📓</span><span class="fo-label">Journal</span>
    </a>
    <a class="fo-item ${active==='themes'?'is-active':''}" href="${base}pages/themes/" aria-label="Temas">
      <span class="fo-ico" aria-hidden="true">🎬</span><span class="fo-label">Temas</span>
    </a>
    <a class="fo-item ${active==='settings'?'is-active':''}" href="${base}pages/settings/" aria-label="Configurações">
      <span class="fo-ico" aria-hidden="true">⚙️</span><span class="fo-label">Configurações</span>
    </a>`;
  // Insere após a topbar
  top.after(nav);
})();