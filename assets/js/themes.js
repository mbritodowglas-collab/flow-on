/* ====== Flow On — Temas & Roteiros (modelo Tema + Post) ====== */
const STORE_KEY = 'flowon.v2';

const Data = {
  _s: { themes: [], posts: [] },
  load(){
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){ this._s = JSON.parse(raw); return; }

    // migração a partir do v1, se existir
    const rawV1 = localStorage.getItem('flowon.v1');
    if(rawV1){
      const old = JSON.parse(rawV1);
      this._s.themes = (old.themes||[]).map(t=>({ id:t.id, title:t.title, persona:t.persona||'', objetivo:t.objetivo||'', archived: t.archived||false }));
      this._s.posts  = (old.themes||[]).filter(t=>t.dates?.publicacao).map(t=>({
        id:'p_'+t.id, themeId:t.id, type:'yt_long', date:t.dates.publicacao,
        status:'Agendado', script:(t.scripts?.yt||''), analytics:{views:0,likes:0,comments:0,clicks:0,notes:''}, archived:false
      }));
      this.save(); return;
    }

    // seed novo
    this._s = {
      themes: [{ id:'t1', title:'Dopamina e motivação no treino', persona:'Mulheres 30+', objetivo:'Chamar para avaliação', archived:false }],
      posts: []
    };
    this.save();
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* utils */
const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseLocal = (iso) => { const [y,m,d]= (iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
function daysAhead(n = 30){
  const start = new Date();
  return [...Array(n)].map((_,i)=>{ const d = new Date(start.getFullYear(), start.getMonth(), start.getDate()+i); return toLocalISO(d) });
}

/* ===== IDEIAS ===== */
function drawIdeas(){
  const box = document.getElementById('ideasList'); box.innerHTML = '';
  const { themes } = Data.get();

  if(!themes.length){
    box.innerHTML = `<div class="muted">Sem ideias ainda.</div>`;
    return;
  }

  themes.filter(t=>!t.archived).forEach(t=>{
    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small">${t.title}</span>
        <span>
          <a class="btn small" href="editor.html?themeId=${t.id}">Usar no rascunho</a>
          <button class="btn small" data-del="${t.id}">Excluir</button>
        </span>
      </div>`;
    row.querySelector('[data-del]').onclick = ()=>{
      const s = Data.get();
      s.themes = s.themes.filter(x=>x.id!==t.id);
      // também remove posts órfãos
      s.posts = s.posts.filter(p=>p.themeId!==t.id);
      Data.save(); drawIdeas(); drawDrafts(); drawPlan(); drawInsights();
    };
    box.appendChild(row);
  });
}

/* ===== RASCUNHOS (posts sem data) ===== */
function drawDrafts(){
  const box = document.getElementById('draftsList'); box.innerHTML = '';
  const s = Data.get();
  const drafts = s.posts.filter(p=> p.status==='Rascunho' && !p.archived);

  if(!drafts.length){ box.innerHTML = `<div class="muted">Sem rascunhos no momento.</div>`; return; }

  drafts.forEach(p=>{
    const theme = s.themes.find(t=>t.id===p.themeId);
    const label = ({yt_long:'YouTube',short:'Reels/TikTok',carousel:'Carrossel',static:'Imagem',blog:'Blog'})[p.type] || p.type;
    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small"><b>${theme?.title||'—'}</b> • ${label}</span>
        <span>
          <a class="btn small" href="editor.html?postId=${p.id}">Editar</a>
          <button class="btn small" data-del="${p.id}">Excluir</button>
        </span>
      </div>`;
    row.querySelector('[data-del]').onclick = ()=>{
      const ix = s.posts.findIndex(x=>x.id===p.id);
      if(ix>=0){ s.posts.splice(ix,1); Data.save(); drawDrafts(); }
    };
    box.appendChild(row);
  });
}

/* ===== PLANEJAMENTO 30 DIAS (posts com data) ===== */
function drawPlan(){
  const box = document.getElementById('planList'); box.innerHTML = '';
  const s = Data.get();
  const dates = daysAhead(30);

  dates.forEach(d=>{
    const dayWrap = document.createElement('div'); dayWrap.className='list-day';
    const display = parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'});
    dayWrap.innerHTML = `
      <div class="list-day-head">
        <span>${display}</span>
        <span class="muted">planejamento</span>
      </div>`;

    const items = s.posts.filter(p=> !p.archived && p.status!=='Rascunho' && p.date===d);
    const list = document.createElement('div');

    if(!items.length){
      list.innerHTML = `<span class="muted">Sem itens</span>`;
    }else{
      items.forEach(p=>{
        const theme = s.themes.find(t=>t.id===p.themeId);
        const label = ({yt_long:'YouTube',short:'Reels/TikTok',carousel:'Carrossel',static:'Imagem',blog:'Blog'})[p.type] || p.type;

        const row = document.createElement('div'); row.className='small badge';
        row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.margin='4px 0 0';
        row.innerHTML = `
          <span>${theme?.title||'—'} • ${label}</span>
          <span style="display:flex; gap:6px">
            <a class="btn small" href="editor.html?postId=${p.id}">Editar</a>
            <button class="btn small" data-back="${p.id}">Voltar p/ rascunho</button>
            <button class="btn small" data-ok="${p.id}">OK publicado</button>
          </span>`;

        row.querySelector('[data-back]').onclick = ()=>{
          p.status = 'Rascunho'; p.date = ''; Data.save(); drawPlan(); drawDrafts();
        };
        row.querySelector('[data-ok]').onclick = ()=>{
          p.status = 'Publicado'; Data.save(); drawPlan(); drawInsights();
        };
        list.appendChild(row);
      });
    }

    dayWrap.appendChild(list);
    box.appendChild(dayWrap);
  });
}

/* ===== ANÁLISE (posts publicados, não arquivados) ===== */
function drawInsights(){
  const box = document.getElementById('insightsList'); box.innerHTML='';
  const s = Data.get();
  const published = s.posts.filter(p=> p.status==='Publicado' && !p.archived);

  if(!published.length){ box.innerHTML = `<div class="muted">Sem itens publicados aguardando análise.</div>`; return; }

  published.forEach(p=>{
    p.analytics = p.analytics || { views:0, likes:0, comments:0, clicks:0, notes:'' };
    const theme = s.themes.find(t=>t.id===p.themeId);
    const label = ({yt_long:'YouTube',short:'Reels/TikTok',carousel:'Carrossel',static:'Imagem',blog:'Blog'})[p.type] || p.type;

    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small"><b>${theme?.title||'—'}</b> • ${label} • ${p.date||'—'}</span>
      </div>
      <div class="small" style="display:grid; gap:8px; grid-template-columns: repeat(4, minmax(0,1fr));">
        <label>Views<br><input type="number" min="0" value="${p.analytics.views||0}" data-f="views" style="width:100%"></label>
        <label>Likes<br><input type="number" min="0" value="${p.analytics.likes||0}" data-f="likes" style="width:100%"></label>
        <label>Comments<br><input type="number" min="0" value="${p.analytics.comments||0}" data-f="comments" style="width:100%"></label>
        <label>Cliques/CTA<br><input type="number" min="0" value="${p.analytics.clicks||0}" data-f="clicks" style="width:100%"></label>
      </div>
      <div style="margin-top:8px">
        <textarea data-f="notes" rows="3" placeholder="Observações, hipóteses, próximos testes..." style="width:100%">${p.analytics.notes||''}</textarea>
      </div>
      <div style="margin-top:8px; display:flex; gap:8px">
        <button class="btn small" data-save="${p.id}">Salvar análise</button>
        <button class="btn small" data-archive="${p.id}">Arquivar</button>
      </div>`;

    row.querySelector('[data-save]').onclick = ()=>{
      const get = sel => row.querySelector(`[data-f="${sel}"]`);
      p.analytics = {
        views: Number(get('views').value||0),
        likes: Number(get('likes').value||0),
        comments: Number(get('comments').value||0),
        clicks: Number(get('clicks').value||0),
        notes: get('notes').value||''
      };
      Data.save(); alert('Análise salva!');
    };
    row.querySelector('[data-archive]').onclick = ()=>{
      if(confirm('Arquivar este post?')){ p.archived = true; Data.save(); drawInsights(); }
    };

    box.appendChild(row);
  });
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  // marca menu ativo
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === './' || a.getAttribute('href')?.endsWith('/themes/'));
  });

  Data.load();
  drawIdeas(); drawDrafts(); drawPlan(); drawInsights();

  // nova ideia
  document.getElementById('btnAddIdea').onclick = ()=>{
    const title = prompt('Título da ideia:'); if(!title) return;
    const s = Data.get();
    s.themes.push({ id:'t_'+Date.now(), title, persona:'', objetivo:'', archived:false });
    Data.save(); drawIdeas();
  };

  // criar post em branco (sem tema) -> cria tema "Sem título"
  document.getElementById('btnNewFromBlank').onclick = ()=>{
    const s = Data.get();
    const theme = { id:'t_'+Date.now(), title:'Sem título', persona:'', objetivo:'', archived:false };
    s.themes.push(theme);
    s.posts.push({ id:'p_'+Date.now(), themeId:theme.id, type:'yt_long', date:'', status:'Rascunho', script:'', analytics:{views:0,likes:0,comments:0,clicks:0,notes:''}, archived:false });
    Data.save(); location.href = 'editor.html?postId='+s.posts[s.posts.length-1].id;
  };
});
