/* ====== Flow On — Home (visão geral, semana com status) ====== */

const STORE_KEY = 'flowon.v1';
const Data = {
  _s: { habits: [], journal: { daily: [] }, themes: [] },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw) this._s = JSON.parse(raw);

      // seeds
      if(!this._s.habits?.length){
        this._s.habits = [
          {id:'h1', name:'Planejar dia anterior'},
          {id:'h2', name:'Treinar'},
          {id:'h3', name:'Meditar 5 min'}
        ];
      }
      if(!this._s.themes?.length){
        this._s.themes = [{
          id:'t1',
          title:'Dopamina e motivação no treino',
          persona:'Mulheres 30+',
          objetivo:'Chamar para avaliação',
          status:'Rascunho',
          platforms:['YouTube','Instagram'],
          dates:{ publicacao:'' }, // data única
          scripts:{ yt:'', reels:'' },
          archived:false
        }];
      }
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* Utils — datas em HORÁRIO LOCAL (sem UTC) */
const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
function weekRange(date){
  const d = new Date(date);
  // semana começa na segunda
  const jsDay = d.getDay();                  // 0=dom,1=seg...
  const offset = (jsDay + 6) % 7;            // 0=seg,6=dom
  const monday = new Date(d); monday.setDate(d.getDate()-offset);

  return [...Array(7)].map((_,i)=>{
    const x = new Date(monday); x.setDate(monday.getDate()+i);
    return toLocalISO(x);
  });
}
function weekKey(date=new Date()){
  // chave só para hábitos (não impacta bug)
  const d = new Date(date);
  const onejan = new Date(d.getFullYear(),0,1);
  const dayOfYear = Math.floor((d - onejan) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + ((onejan.getDay()+6)%7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

/* Render Home */
function renderHabitsSummary(){
  const el = document.getElementById('habits-summary');
  const s = Data.get();
  const wk = weekKey();
  let html = '';

  s.habits.forEach(h=>{
    h.checks = h.checks || {}; h.checks[wk] = h.checks[wk] || Array(7).fill(false);
    const dots = h.checks[wk].map(v=> `<span class="ring-dot ${v?'done':''}"></span>`).join('');
    const pct = Math.round(100 * h.checks[wk].filter(Boolean).length / 7);
    html += `
      <div class="h-row">
        <div class="h-name">${h.name}</div>
        <div class="h-dots">
          ${dots}
          <div class="h-pct">${pct}%</div>
        </div>
      </div>
    `;
  });
  if(!s.habits.length) html = `<div class="muted">Sem hábitos cadastrados. Cadastre em <b>Journal</b>.</div>`;
  el.innerHTML = html + `<div class="muted" style="margin-top:6px">* visão geral — edite em Journal → Hábitos</div>`;
}

function renderContentSummary(){
  const el = document.getElementById('content-summary');
  const s = Data.get();
  const dates = weekRange(new Date());
  const today = toLocalISO(new Date());

  const statusBadge = (dateStr)=>{
    if(!dateStr) return '';
    if(dateStr < today) return `<span class="badge" style="background:#321; border-color:#633; color:#f8d7da">Atrasado</span>`;
    if(dateStr === today) return `<span class="badge" style="background:#332b00; border-color:#806b00; color:#ffec99">Pendente</span>`;
    return `<span class="badge" style="background:#102915; border-color:#1f6f34; color:#b7ffd1">Agendado</span>`;
  };

  let html = '';
  dates.forEach(d=>{
    const items = s.themes.filter(t=> !t.archived && t.status==='Agendado' && t.dates?.publicacao === d);
    const list = items.length
      ? items.map(t=> `
          <div class="small badge" style="display:flex; align-items:center; gap:6px; margin:2px 4px 0 0">
            <span>${t.title} — ${(t.platforms||[]).join(' • ')}</span>
            ${statusBadge(t.dates?.publicacao)}
          </div>
        `).join('')
      : `<span class="muted">Sem itens</span>`;

    html += `
      <div class="list-day">
        <div class="list-day-head">
          <span>${new Date(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
          <span class="muted">semana</span>
        </div>
        <div>${list}</div>
      </div>
    `;
  });
  el.innerHTML = html;
}

function renderJournalSummary(){
  const el = document.getElementById('journal-summary');
  const s = Data.get();
  const dates = weekRange(new Date());
  let html = '';

  dates.forEach(d=>{
    const day = s.journal.daily.find(x=>x.date===d);
    const mood = day?.mood ? `Humor ${day.mood}/10` : '—';
    const foco = day?.focus ? `• ${day.focus}` : '';
    html += `
      <div class="list-day j-card">
        <span class="small" style="opacity:.8">${new Date(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
        <span class="small">${mood} <span class="muted">${foco}</span></span>
        <span class="muted">resumo</span>
      </div>
    `;
  });
  el.innerHTML = html;
}

/* Boot */
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href').endsWith('/index.html') || a.getAttribute('href')==='./index.html');
  });

  Data.load();
  renderHabitsSummary();
  renderContentSummary();
  renderJournalSummary();
});
