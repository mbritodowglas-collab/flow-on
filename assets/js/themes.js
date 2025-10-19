/* ====== Flow On — Temas & Roteiros (30 dias, data única, Análise) ====== */
const STORE_KEY = 'flowon.v1';

const Data = {
  _s: { habits: [], journal: { daily: [] }, themes: [] },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw) this._s = JSON.parse(raw);

      if(!this._s.themes?.length){
        this._s.themes = [{
          id:'t1',
          title:'Dopamina e motivação no treino',
          persona:'Mulheres 30+',
          objetivo:'Chamar para avaliação',
          status:'Rascunho',
          platforms:['YouTube','Instagram'],
          dates:{ publicacao:'' },                 // data única
          scripts:{ yt:'', reels:'' },
          analytics:{ views:0, likes:0, comments:0, clicks:0, notes:'' },
          archived:false
        }];
      }
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* utils — datas locais */
const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
// próximos N dias
function daysAhead(n = 30){
  const start = new Date();
  return [...Array(n)].map((_,i)=>{ const d = new Date(start); d.setDate(start.getDate()+i); return toLocalISO(d) });
}

/* render */
let editingId = null;

function drawIdeas(){
  const box = document.getElementById('ideasList'); box.innerHTML = '';
  Data.get().themes
    .filter(t=>!t.archived && (!t.dates?.publicacao) && t.status==='Rascunho')
    .forEach(t=>{
      const row = document.createElement('div'); row.className='list-day';
      row.innerHTML = `
        <div class="list-day-head">
          <span class="small">${t.title}</span>
          <span>
            <button class="btn small" data-open="${t.id}">Editar</button>
            <button class="btn small" data-del="${t.id}">Excluir</button>
          </span>
        </div>`;
      row.querySelector('[data-open]').onclick = ()=> openThemeModal(t);
      row.querySelector('[data-del]').onclick = ()=>{ const s=Data.get(); s.themes=s.themes.filter(x=>x.id!==t.id); Data.save(); drawIdeas(); };
      box.appendChild(row);
    });
  if(!box.children.length) box.innerHTML = `<div class="muted">Sem rascunhos por enquanto.</div>`;
}

function drawDrafts(){
  const box = document.getElementById('draftsList'); box.innerHTML = '';
  Data.get().themes
    .filter(t=>!t.archived && t.dates?.publicacao && t.status!=='Publicado')
    .forEach(t=>{
      const row = document.createElement('div'); row.className='list-day';
      row.innerHTML = `
        <div class="list-day-head">
          <span class="small"><b>${t.title}</b> • ${(t.platforms||[]).join(' • ')||'—'} • Pub.: ${t.dates?.publicacao||'—'}</span>
          <span>
            <button class="btn small" data-open="${t.id}">Abrir</button>
            <button class="btn small" data-del="${t.id}">Excluir</button>
          </span>
        </div>`;
      row.querySelector('[data-open]').onclick = ()=> openThemeModal(t);
      row.querySelector('[data-del]').onclick = ()=>{ const s=Data.get(); s.themes=s.themes.filter(x=>x.id!==t.id); Data.save(); drawDrafts(); drawPlan(); };
      box.appendChild(row);
    });
  if(!box.children.length) box.innerHTML = `<div class="muted">Nenhum item agendado ainda.</div>`;
}

function drawPlan(){ // planejamento 30 dias
  const box = document.getElementById('weekPub'); box.innerHTML = '';
  const dates = daysAhead(30);
  dates.forEach(d=>{
    const dayWrap = document.createElement('div'); dayWrap.className='list-day';
    dayWrap.innerHTML = `
      <div class="list-day-head">
        <span>${new Date(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
        <span class="muted">planejamento</span>
      </div>`;
    const list = document.createElement('div');

    const items = Data.get().themes.filter(t=> !t.archived && t.status==='Agendado' && t.dates?.publicacao === d);
    if(!items.length){
      list.innerHTML = `<span class="muted">Sem itens</span>`;
    } else {
      items.forEach(t=>{
        const row = document.createElement('div'); row.className='small badge';
        row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
        row.style.margin='4px 0 0';
        row.innerHTML = `
          <span>${t.title} — ${(t.platforms||[]).join(' • ')}</span>
          <button class="btn small" data-ok="${t.id}" style="margin-left:8px">OK publicado</button>`;
        row.querySelector('[data-ok]').onclick = ()=>{
          const s=Data.get(); const ix=s.themes.findIndex(x=>x.id===t.id);
          if(ix>=0){ s.themes[ix].status='Publicado'; /* NÃO arquiva ainda */ Data.save(); drawPlan(); drawInsights(); }
        };
        list.appendChild(row);
      });
    }
    dayWrap.appendChild(list);
    box.appendChild(dayWrap);
  });
}

/* === ANÁLISE: publicados (com possibilidade de arquivar) === */
function drawInsights(){
  const box = document.getElementById('insightsList'); if(!box) return;
  box.innerHTML = '';

  const published = Data.get().themes.filter(t=> t.status==='Publicado' && !t.archived);
  if(!published.length){
    box.innerHTML = `<div class="muted">Sem itens publicados aguardando análise.</div>`;
    return;
  }

  published.forEach(t=>{
    t.analytics = t.analytics || { views:0, likes:0, comments:0, clicks:0, notes:'' };
    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small"><b>${t.title}</b> • ${t.dates?.publicacao||'—'} • ${(t.platforms||[]).join(' • ')||'—'}</span>
      </div>
      <div class="small" style="display:grid; gap:8px; grid-template-columns: repeat(4, minmax(0,1fr));">
        <label>Views<br><input type="number" min="0" value="${t.analytics.views||0}" data-f="views" style="width:100%"></label>
        <label>Likes<br><input type="number" min="0" value="${t.analytics.likes||0}" data-f="likes" style="width:100%"></label>
        <label>Comments<br><input type="number" min="0" value="${t.analytics.comments||0}" data-f="comments" style="width:100%"></label>
        <label>Cliques/CTA<br><input type="number" min="0" value="${t.analytics.clicks||0}" data-f="clicks" style="width:100%"></label>
      </div>
      <div style="margin-top:8px">
        <textarea data-f="notes" rows="3" placeholder="Observações, hipóteses, próximos testes..." style="width:100%">${t.analytics.notes||''}</textarea>
      </div>
      <div style="margin-top:8px; display:flex; gap:8px">
        <button class="btn small" data-save="${t.id}">Salvar análise</button>
        <button class="btn small" data-archive="${t.id}">Arquivar item</button>
      </div>
    `;

    row.querySelector('[data-save]').onclick = ()=>{
      const get = sel => row.querySelector(`[data-f="${sel}"]`);
      t.analytics = {
        views: Number(get('views').value||0),
        likes: Number(get('likes').value||0),
        comments: Number(get('comments').value||0),
        clicks: Number(get('clicks').value||0),
        notes: get('notes').value||''
      };
      Data.save(); alert('Análise salva!');
    };
    row.querySelector('[data-archive]').onclick = ()=>{
      if(confirm('Arquivar este item? Você poderá vê-lo no histórico futuramente.')){
        t.archived = true; Data.save(); drawInsights();
      }
    };

    box.appendChild(row);
  });
}

/* MODAL */
let modalEl;
function openThemeModal(data={}){
  const s = Data.get();
  modalEl = document.getElementById('modalTheme');
  modalEl.showModal();

  editingId = data.id || null;
  document.getElementById('fTitulo').value = data.title||'';
  document.getElementById('fPersona').value = data.persona||'';
  document.getElementById('fObjetivo').value = data.objetivo||'';
  document.getElementById('dPublicacao').value = data.dates?.publicacao || '';
  document.getElementById('pYT').checked = !!data.platforms?.includes('YouTube');
  document.getElementById('pIG').checked = !!data.platforms?.includes('Instagram');
  document.getElementById('pBlog').checked = !!data.platforms?.includes('Blog');
  document.getElementById('fStatus').value = (data.dates?.publicacao ? 'Agendado' : 'Rascunho');
  document.getElementById('rYT').value = data.scripts?.yt||'';
  document.getElementById('rReels').value = data.scripts?.reels||'';
  document.getElementById('themeIdInfo').textContent = editingId || 'novo';

  document.getElementById('btnSaveTheme').onclick = ()=>{
    const pub = document.getElementById('dPublicacao').value;
    const status = pub ? 'Agendado' : 'Rascunho';

    const obj = {
      id: editingId || ('t_'+Date.now()),
      title: document.getElementById('fTitulo').value.trim(),
      persona: document.getElementById('fPersona').value.trim(),
      objetivo: document.getElementById('fObjetivo').value.trim(),
      platforms: [
        document.getElementById('pYT').checked && 'YouTube',
        document.getElementById('pIG').checked && 'Instagram',
        document.getElementById('pBlog').checked && 'Blog'
      ].filter(Boolean),
      status,
      dates: { publicacao: pub },
      scripts: { yt: document.getElementById('rYT').value, reels: document.getElementById('rReels').value },
      analytics: data.analytics || { views:0, likes:0, comments:0, clicks:0, notes:'' },
      archived: data.archived || false
    };

    const ix = s.themes.findIndex(x=>x.id===obj.id);
    if(ix>=0) s.themes[ix]=obj; else s.themes.push(obj);
    Data.save();

    modalEl.close();
    drawIdeas(); drawDrafts(); drawPlan(); drawInsights();
  };
}

/* boot */
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === './' || a.getAttribute('href')?.endsWith('/themes/'));
  });

  Data.load();
  drawIdeas(); drawDrafts(); drawPlan(); drawInsights();

  document.getElementById('btnAddIdea').onclick = ()=>{
    const title = prompt('Título da ideia:'); if(!title) return;
    Data.get().themes.push({
      id:'t_'+Date.now(), title, status:'Rascunho',
      persona:'', objetivo:'', platforms:[],
      dates:{ publicacao:'' }, scripts:{ yt:'', reels:'' },
      analytics:{ views:0, likes:0, comments:0, clicks:0, notes:'' },
      archived:false
    });
    Data.save(); drawIdeas();
  };
  document.getElementById('btnNewTheme').onclick = ()=> openThemeModal({});
});