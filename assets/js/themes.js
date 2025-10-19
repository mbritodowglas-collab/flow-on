<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Flow On — Temas</title>

  <!-- CSS principal -->
  <link rel="stylesheet" href="../../assets/css/style.css" />

  <!-- FAVICONS -->
  <link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml" />
  <link rel="icon" href="../../assets/img/favicon-32.png" sizes="32x32" type="image/png" />
  <link rel="apple-touch-icon" href="../../assets/img/icons/icon-192.png" />

  <!-- PWA -->
  <link rel="manifest" href="../../manifest.webmanifest" />
  <meta name="theme-color" content="#0b0d10" />

  <style>
    :root{
      --surface: rgba(20,20,20,.7);
      --text:#cfcfd3; --text-strong:#fff;
      --brand:#f2a65a; --brand-ghost:rgba(242,166,90,.18);
      --border: rgba(255,255,255,.08);
      --radius:14px; --radius-lg:18px;
    }

    /* NAVBAR / MENU padrão Home */
    .fo-topbar{
      position:sticky; top:0; z-index:50;
      display:flex; justify-content:center; align-items:center;
      padding:10px 12px; background:var(--surface);
      backdrop-filter:blur(8px); border-bottom:1px solid var(--border);
    }
    .fo-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none}
    .fo-logo{width:28px;height:28px;display:block;filter:drop-shadow(0 0 6px var(--brand-ghost))}
    .fo-brand-text{color:var(--brand);font-weight:600;letter-spacing:.6px;font-size:1.05rem}

    .fo-nav{
      position:sticky; top:60px; z-index:40;
      display:flex; justify-content:center; align-items:center; gap:22px;
      padding:14px 10px; margin:10px auto 18px; width:min(980px,96%);
      background:var(--surface); backdrop-filter:blur(8px);
      border:1px solid var(--border); border-radius:var(--radius-lg);
    }
    .fo-item{
      text-decoration:none; color:var(--text);
      display:grid; place-items:center; gap:6px;
      padding:8px 10px; min-width:74px; border-radius:var(--radius);
      transition:transform .18s ease,color .18s ease,background .18s ease,box-shadow .18s ease;
    }
    .fo-item .fo-ico{font-size:1.4rem;line-height:1}
    .fo-item .fo-label{font-size:.9rem;font-weight:500}
    .fo-item:hover,.fo-item:focus-visible{
      color:var(--text-strong); background:rgba(255,255,255,.04); transform:translateY(-1px); outline:none;
    }
    .fo-item.is-active{
      color:var(--text-strong);
      background:linear-gradient(180deg,rgba(242,166,90,.16),rgba(242,166,90,.06));
      box-shadow:0 6px 14px rgba(242,166,90,.12), inset 0 0 0 1px rgba(242,166,90,.35);
    }
    @media (max-width:380px){
      .fo-nav{gap:14px}
      .fo-item{min-width:66px;padding:8px 8px}
      .fo-item .fo-label{font-size:.85rem}
    }

    /* Corpo principal */
    .card h2{margin-top:0}
    .filters{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}
    .filters .btn.active{background:var(--brand);color:#000;font-weight:600}
    .item{border:1px solid var(--border);border-radius:var(--radius);padding:10px;margin-bottom:10px;background:rgba(255,255,255,.02)}
    .empty{color:var(--muted);padding:12px;text-align:center}
  </style>
</head>

<body>
  <!-- TOPBAR + MENU -->
  <header class="fo-topbar">
    <a class="fo-brand" href="../../index.html">
      <img src="../../assets/img/logo.svg" alt="Flow On logo" class="fo-logo" />
      <span class="fo-brand-text">Flow On</span>
    </a>
  </header>

  <nav class="fo-nav" role="navigation" aria-label="Navegação principal">
    <a class="fo-item" href="../../index.html">
      <span class="fo-ico">🏠</span><span class="fo-label">Home</span>
    </a>
    <a class="fo-item" href="../journal/">
      <span class="fo-ico">📓</span><span class="fo-label">Journal</span>
    </a>
    <a class="fo-item is-active active" href="./">
      <span class="fo-ico">🎬</span><span class="fo-label">Temas</span>
    </a>
    <a class="fo-item" href="../settings/">
      <span class="fo-ico">⚙️</span><span class="fo-label">Configurações</span>
    </a>
  </nav>

  <!-- CONTEÚDO -->
  <main class="container">
    <section class="card">
      <h2>Banco de Ideias</h2>
      <div class="controls">
        <button id="btnAddIdea" class="btn small">+ Ideia</button>
      </div>
      <div id="ideasCount" class="muted small" style="margin-top:6px"></div>
      <div id="ideasList"></div>
    </section>

    <section class="card">
      <h2>Rascunhos</h2>
      <div class="filters">
        <button class="btn small active" data-filter="all">Todos</button>
        <button class="btn small" data-filter="youtube">YouTube</button>
        <button class="btn small" data-filter="short">Reels/TikTok</button>
        <button class="btn small" data-filter="carousel">Carrossel</button>
        <button class="btn small" data-filter="static">Imagem</button>
        <button class="btn small" data-filter="blog">Blog</button>
      </div>
      <div class="controls">
        <button id="btnCreateDraft" class="btn small">+ Criar rascunho</button>
      </div>
      <div id="draftsList"></div>
    </section>

    <section class="card">
      <h2>Planejamento (30 dias)</h2>
      <div class="controls">
        <button id="btnNewBlankPost" class="btn small">+ Post direto</button>
        <span id="planRangeLabel" class="muted small"></span>
      </div>
      <div id="planList"></div>
    </section>

    <section class="card" id="analysisForm">
      <h2>Análise de Publicações</h2>
      <div class="grid-2">
        <div>
          <label>Título</label>
          <input type="text" id="anTitle" />
        </div>
        <div>
          <label>Formato</label>
          <select id="anFormat">
            <option value="youtube">YouTube</option>
            <option value="short">Reels/TikTok</option>
            <option value="carousel">Carrossel</option>
            <option value="static">Imagem</option>
            <option value="blog">Blog</option>
          </select>
        </div>
      </div>
      <div class="grid-3">
        <div><label>Data</label><input type="date" id="anDate" /></div>
        <div><label>Status</label>
          <select id="anStatus">
            <option value="posted">Publicado</option>
            <option value="pending">Pendente</option>
          </select>
        </div>
      </div>
      <div class="grid-4">
        <div><label>Views</label><input type="number" id="anViews" min="0" /></div>
        <div><label>Likes</label><input type="number" id="anLikes" min="0" /></div>
        <div><label>Coments</label><input type="number" id="anComments" min="0" /></div>
        <div><label>Cliques</label><input type="number" id="anClicks" min="0" /></div>
      </div>
      <div>
        <label>Notas / Insights</label>
        <textarea id="anNotes" rows="3"></textarea>
      </div>
      <div class="controls">
        <button id="btnSaveAnalysis" class="btn small">💾 Salvar análise</button>
        <button id="btnArchivePost" class="btn small">📦 Arquivar</button>
        <button id="btnDeletePost" class="btn small danger">🗑️ Limpar formulário</button>
      </div>
    </section>

    <section class="card">
      <h2>Análises Recentes</h2>
      <div id="analysisRecent"></div>
    </section>
  </main>

  <footer class="footer">
    <p>Flow On © 2025 — Planeje. Execute. Evolua.</p>
  </footer>

  <!-- Scripts -->
  <script src="../../assets/js/themes.js?v=5"></script>

  <!-- Service Worker -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('../../service-worker.js', { scope: '../../' })
          .catch(err => console.warn('[PWA] erro SW:', err));
      });
    }
  </script>
</body>
</html>