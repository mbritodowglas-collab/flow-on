/* ====== Flow On — Home (visão geral, semana com status) ====== */

const STORE_KEY = 'flowon.v2';

const Data = {
  _s: { habits: [], journal: { daily: [], month: { items: [] } }, themes: [], posts: [] },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw){ this._s = JSON.parse(raw); }

      // seeds mínimos
      this._s.habits   = this._s.habits || [
        {id:'h1', name:'Planejar dia anterior'},
        {id:'h2', name:'Treinar'},
        {id:'h3', name:'Meditar 5 min'}
      ];
      this._s.journal  = this._s.journal || { daily: [], month: { items: [] } };
      this._s.journal.month = this._s.journal.month || { items: [] };
      this._s.themes   = this._s.themes || [];
      this._s.posts    = this._s.posts || [];

      this.save();
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* ===== Datas (LOCAL, sem UTC) ===== */
const toLocalISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,'0');
  const d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseLocal = (iso) => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };

function weekRange(date){
  const d = new Date(date);
  const jsDay = d.getDay();            // 0 dom...6 sáb
  const offset = (jsDay + 6) % 7;      // segunda = 0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate()-offset);
  return [...Array(7)].map((_,i)=>{
    const x = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate()+i);
    return toLocalISO(x);
  });
}
function weekKey(date=new Date()){
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const onejan = new Date(d.getFullYear(),0,1);
  const dayOfYear = Math.floor((d - onejan)/86400000) + 1;
  const week = Math.ceil((dayOfYear + ((onejan.getDay()+6)%7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

/* ===== Hábitos (visão geral) ===== */
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
        <div class="h-dots">${dots}<div class="h-pct">${pct}%</div></div>
      </div>`;
  });
  if(!s.habits.length) html = `<div class="muted">Sem hábitos cadastrados. Cadastre em <b>Journal</b>.</div>`;
  el.innerHTML = html + `<div class="muted" style="margin-top:6px">* visão geral — edite em Journal → Hábitos</div>`;
}

/* ===== Agenda de Conteúdo (semana, por POSTS) ===== */
function renderContentSummary(){
  const el = document.getElementById('content-summary');
  const s = Data.get();
  const dates = weekRange(new Date());
  const today = toLocalISO(new Date());

  const statusBadge = (dateStr, status)=>{
    if(status==='Agendado'){
      if(dateStr < today) return `<span class="badge" style="background:#321; border-color:#633; color:#f8d7da">Atrasado</span>`;
      if(dateStr === today) return `<span class="badge" style="background:#332b00; border-color:#806b00; color:#ffec99">Pendente</span>`;
      return `<span class="badge" style="background:#102915; border-color:#1f6f34; color:#b7ffd1">Agendado</span>`;
    }
    if(status==='Publicado') return `<span class="badge" style="background:#0e2a3a; border-color:#1f5168; color:#a8e1ff">Publicado</span>`;
    return '';
  };

  let html = '';
  dates.forEach(d=>{
    const items = s.posts.filter(p=> !p.archived && p.status!=='Rascunho' && p.date === d);
    const list = items.length
      ? items.map(p=>{
          const theme = s.themes.find(t=>t.id===p.themeId);
          const label = ({yt_long:'YouTube',short:'Reels/TikTok',carousel:'Carrossel',static:'Imagem',blog:'Blog'})[p.type] || p.type;
          return `<div class="small badge" style="display:flex; align-items:center; gap:6px; margin:2px 4px 0 0">
            <span>${theme?.title||'—'} • ${label}</span>${statusBadge(p.date, p.status)}
          </div>`;
        }).join('')
      : `<span class="muted">Sem itens</span>`;

    const display = parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'});
    html += `<div class="list-day"><div class="list-day-head">
        <span>${display}</span><span class="muted">semana</span></div><div>${list}</div></div>`;
  });
  el.innerHTML = html;
}

/* ===== Resumo do Journal (AGORA = agenda semanal do Monthly Log) ===== */
function renderJournalSummary(){
  const el = document.getElementById('journal-summary');
  const s = Data.get();
  const dates = weekRange(new Date());
  const items = (s.journal.month?.items || []).filter(it=> !it.archived);

  let html = '';
  dates.forEach(d=>{
    const dayItems = items.filter(it=> it.date === d);
    const list = dayItems.length
      ? dayItems.map(it=>{
          const badge = it.done
            ? `<span class="badge" style="background:#0e2a3a; border-color:#1f5168; color:#a8e1ff">Concluído</span>`
            : `<span class="badge" style="background:#332b00; border-color:#806b00; color:#ffec99">Pendente</span>`;
          return `<div class="small badge" style="display:flex; align-items:center; gap:6px; margin:2px 4px 0 0">
              <span>${it.title}</span>${badge}
            </div>`;
        }).join('')
      : `<span class="muted">Sem itens</span>`;

    const display = parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'});
    html += `<div class="list-day j-card">
        <div class="list-day-head"><span class="small" style="opacity:.8">${display}</span>
        <span class="muted">agenda</span></div>
        <div>${list}</div>
      </div>`;
  });
  el.innerHTML = html;
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href').endsWith('/index.html') || a.getAttribute('href')==='./index.html');
  });

  Data.load();
  renderHabitsSummary();
  renderContentSummary();
  renderJournalSummary();
});
