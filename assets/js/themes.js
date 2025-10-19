/* ====== Flow On — Temas & Roteiros (30 dias + data única) ====== */
const STORE_KEY = 'flowon.v1';

const Data = {
  _s: { habits: [], journal: { daily: [] }, themes: [] },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw) this._s = JSON.parse(raw);

      // seed compatível com data única
      if(!this._s.themes?.length){
        this._s.themes = [{
          id:'t1',
          title:'Dopamina e motivação no treino',
          persona:'Mulheres 30+',
          objetivo:'Chamar para avaliação',
          status:'Rascunho',
          platforms:['YouTube','Instagram'],
          dates:{ publicacao:'' }, // <<< data única
          scripts:{ yt:'', reels:'' },
          archived:false
        }];
      }
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* utils */
const toISO = d => new Date(d).toISOString().slice(0,10);
function weekRange(date){
  const d = new Date(date); const day = (d.getDay()+6)%7; // seg=0
  const monday = new Date(d); monday.setDate(d.getDate()-day);
  return [...Array(7)].map((_,i)=>{ const x = new Date(monday); x.setDate(monday.getDate()+i); return toISO(x) });
}
// 30 dias a partir de hoje
function daysAhead(n = 30){
  const start = new Date();
  return [...Array(n)].map((_,i)=>{ const d = new Date(start); d.setDate(start.getDate()+i); return toISO(d) });
}

/* render */
let editingId = null;

function drawIdeas(){
  const box = document.getElementById('ideasList'); box.innerHTML = '';
  Data.get().themes.filter(t=>t.status==='Rascunho' && !t.archived && !t.dates?.publicacao).forEach(t=>{
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
  Data.get().themes.filter(t=>t.dates?.publicacao && !t.archived && t.status!=='Publicado').forEach(t=>{
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
    row.querySelector('[data-del]').onclick = ()=>{ const s=Data.get(); s.themes=s.themes.filter(x=>x.id!==t.id); Data.save(); drawDrafts(); drawWeekPub(); };
    box.appendChild(row);
  });
  if(!box.children.length) box.innerHTML = `<div class="muted">Nenhum item agendado ainda.</div>`;
}

function drawWeekPub(){ // mantém o id, mas agora mostra 30 dias
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
          if(ix>=0){ s.themes[ix].status='Publicado'; s.themes[ix].archived=true; Data.save(); drawWeekPub(); }
        };
        list.appendChild(row);
      });
    }
    dayWrap.appendChild(list);
    box.appendChild(dayWrap);
  });
}

function openThemeModal(data={}){
  const s = Data.get();
  const modal = document.getElementById('modalTheme');
  modal.showModal();

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
    const status = pub ? 'Agendado' : 'Rascunho'; // lógica simples confirmada (Opção A)

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
      dates: { publicacao: pub }, // data única
      scripts: { yt: document.getElementById('rYT').value, reels: document.getElementById('rReels').value },
      archived: data.archived || false
    };

    const ix = s.themes.findIndex(x=>x.id===obj.id);
    if(ix>=0) s.themes[ix]=obj; else s.themes.push(obj);
    Data.save();

    modal.close();
    drawIdeas(); drawDrafts(); drawWeekPub();
  };
}

/* boot */
document.addEventListener('DOMContentLoaded', ()=>{
  // marca menu ativo
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === './' || a.getAttribute('href')?.endsWith('/themes/'));
  });

  Data.load();
  drawIdeas(); drawDrafts(); drawWeekPub();

  document.getElementById('btnAddIdea').onclick = ()=>{
    const title = prompt('Título da ideia:'); if(!title) return;
    Data.get().themes.push({
      id:'t_'+Date.now(), title, status:'Rascunho',
      persona:'', objetivo:'', platforms:[],
      dates:{ publicacao:'' }, scripts:{ yt:'', reels:'' }, archived:false
    });
    Data.save(); drawIdeas();
  };
  document.getElementById('btnNewTheme').onclick = ()=> openThemeModal({});
});
