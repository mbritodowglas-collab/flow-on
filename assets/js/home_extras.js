/* Flow On — Home EXTRAS
   - Botão "Ver 21 dias" em Hábitos + grade compacta
   - Card "Progresso Geral" (KPIs simples)
   - Card "Visão do Trimestre" (pega do Journal › Trimestral)
   Seguro: só injeta conteúdo na Home sem quebrar o que já existe.
*/

/* ---------- Storage básico (compatível com o restante do app) ---------- */
const FO_STORE = 'flowon';
const FOData = {
  _s: null,
  load(){ try{ this._s = JSON.parse(localStorage.getItem(FO_STORE)||'{}'); } catch(e){ this._s = {}; } },
  get(){ if(!this._s) this.load(); return this._s; },
  save(){ localStorage.setItem(FO_STORE, JSON.stringify(this._s||{})); }
};

/* ---------- Helpers ---------- */
const toISO = d => d.toISOString().slice(0,10);
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return toISO(d); }
function addDaysISO(iso, n){ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return toISO(d); }
function firstDayOfWeekISO(baseISO=todayISO()){
  const d = new Date(baseISO+'T00:00:00');
  const dow = (d.getDay()+6)%7; // segunda=0
  d.setDate(d.getDate()-dow);
  return toISO(d);
}
function quarterOf(dateISO){
  const d = new Date(dateISO+'T00:00:00');
  const q = Math.floor(d.getMonth()/3)+1;
  return {year: d.getFullYear(), q};
}
function quarterKey(y,q){ return `${y}-T${q}`; }
function quarterLabel(y,q){ return `T${q} de ${y}`; }

/* ---------- UI helpers ---------- */
function injectStyles(){
  if(document.getElementById('fo-home-extras-style')) return;
  const css = `
    .fo-card{border:1px solid var(--border); border-radius:16px; padding:14px; margin:14px 0; background:rgba(255,255,255,.02);}
    .fo-title{font-size:1.25rem; font-weight:700; margin:0 0 8px;}
    .fo-muted{opacity:.7}
    .fo-kpis{display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:10px; margin-top:8px}
    .fo-kpi{border:1px solid var(--border); border-radius:12px; padding:12px}
    .fo-kpi strong{font-size:1.4rem}
    .fo-flex{display:flex; gap:8px; flex-wrap:wrap; align-items:center}
    .fo-dots{display:grid; grid-template-columns:repeat(21, 10px); gap:6px; margin-top:10px}
    .fo-dot{width:10px; height:10px; border-radius:50%; border:1px solid var(--border); opacity:.6}
    .fo-dot.on{background:linear-gradient(180deg,#50fa7b,#2ecc71); border-color:transparent; opacity:1}
    .fo-habit-row{margin:10px 0}
    .fo-habit-name{font-weight:600; margin-bottom:6px}
    .fo-link{color:#7aa2ff; text-decoration:underline}
  `;
  const s = document.createElement('style');
  s.id = 'fo-home-extras-style';
  s.textContent = css;
  document.head.appendChild(s);
}
function makeCard(html){
  const div = document.createElement('section');
  div.className = 'fo-card';
  div.innerHTML = html;
  return div;
}

/* ---------- Locate blocks on current Home ---------- */
function findContainer(){ return document.querySelector('.container') || document.body; }
function findHabitsSection() {
  // tenta achar pelo título "Hábitos da Semana"
  const nodes = Array.from(document.querySelectorAll('.card, section, div'));
  return nodes.find(n => /Hábitos da Semana/i.test(n.textContent||'')) || null;
}

/* ---------- KPIs ---------- */
function calcKPIs(){
  const s = FOData.get();

  // 1) % hábitos concluídos nesta semana
  // Estrutura tolerante: s.journal.habits.items e s.journal.habits.marks[date] = [ids] OU {id:true}
  let habitsPct = '—';
  try{
    const H = (s.journal && s.journal.habits) ? s.journal.habits : null;
    if(H && H.items && H.items.length){
      const ids = H.items.map(h=>h.id || h.key || h.title);
      const start = firstDayOfWeekISO();
      let done=0, total=ids.length*7;
      for(let i=0;i<7;i++){
        const d = addDaysISO(start,i);
        const marks = (H.marks && H.marks[d]) ? H.marks[d] : null;
        if(marks){
          ids.forEach(id=>{
            if(Array.isArray(marks) ? marks.includes(id) : !!marks[id]) done++;
          });
        }
      }
      habitsPct = total ? Math.round((done/total)*100)+'%' : '—';
    }
  }catch(e){ /* silencioso */ }

  // 2) Dailies feitos nos últimos 7 dias
  let dailies7 = '0';
  try{
    const D = s.journal?.daily?.byDate || {};
    let c=0;
    for(let i=0;i<7;i++){
      const d = addDaysISO(todayISO(), -i);
      if(D[d] && (D[d].focus || D[d].notes || D[d].mits || D[d].gratitude)) c++;
    }
    dailies7 = String(c);
  }catch(e){}

  // 3) Conteúdos agendados próximos 7 dias (estrutura tolerante)
  let posts7 = '0';
  try{
    // aceitar s.content?.scheduled[date]=[items] OU s.themes?.scheduled
    const sched = s.content?.scheduled || s.themes?.scheduled || {};
    let c=0;
    for(let i=0;i<7;i++){
      const d = addDaysISO(todayISO(), i);
      const arr = sched[d];
      if(Array.isArray(arr)) c += arr.length;
      else if (arr && typeof arr === 'object') c += Object.keys(arr).length;
    }
    posts7 = String(c);
  }catch(e){}

  return {habitsPct, dailies7, posts7};
}

/* ---------- Trimestre atual ---------- */
function getQuarterNotes(){
  try{
    const s = FOData.get();
    const {year,q} = quarterOf(todayISO());
    const notes = s.journal?.tri?.byQuarter?.[quarterKey(year,q)] || '';
    return {label: quarterLabel(year,q), notes};
  }catch(e){ return {label:'Trimestre', notes:''}; }
}

/* ---------- Habits: 21 dias ---------- */
function build21DaysGrid(){
  const s = FOData.get();
  const H = s.journal?.habits;
  if(!H || !H.items || !H.items.length) return document.createElement('div');

  const wrapper = document.createElement('div');
  H.items.forEach(h=>{
    const id = h.id || h.key || h.title;
    const row = document.createElement('div');
    row.className = 'fo-habit-row';
    row.innerHTML = `<div class="fo-habit-name">${h.title || id}</div>`;
    const grid = document.createElement('div'); grid.className = 'fo-dots';
    for(let i=20;i>=0;i--){
      const d = addDaysISO(todayISO(), -i);
      const marks = H.marks?.[d];
      const done = marks ? (Array.isArray(marks) ? marks.includes(id) : !!marks[id]) : false;
      const dot = document.createElement('div');
      dot.className = 'fo-dot'+(done?' on':'');
      dot.title = d;
      grid.appendChild(dot);
    }
    row.appendChild(grid);
    wrapper.appendChild(row);
  });
  return wrapper;
}

/* ---------- Render extras ---------- */
function renderHomeExtras(){
  injectStyles();
  const container = findContainer();
  if(!container) return;

  // 1) Progresso Geral (insere no topo)
  const {habitsPct, dailies7, posts7} = calcKPIs();
  const kpisCard = makeCard(`
    <h3 class="fo-title">Progresso Geral</h3>
    <div class="fo-kpis">
      <div class="fo-kpi"><div class="fo-muted">Hábitos (semana)</div><strong>${habitsPct}</strong></div>
      <div class="fo-kpi"><div class="fo-muted">Dailies (7 dias)</div><strong>${dailies7}</strong></div>
      <div class="fo-kpi"><div class="fo-muted">Conteúdos (próx. 7 dias)</div><strong>${posts7}</strong></div>
    </div>
  `);
  container.insertBefore(kpisCard, container.firstElementChild);

  // 2) Visão do Trimestre (abaixo do progresso)
  const q = getQuarterNotes();
  const triCard = makeCard(`
    <h3 class="fo-title">Visão do Trimestre <span class="fo-muted">(${q.label})</span></h3>
    <div class="fo-muted" style="white-space:pre-line; margin-top:6px">${q.notes ? q.notes : 'Sem anotações do trimestre ainda.'}</div>
    <div style="margin-top:8px"><a class="fo-link" href="./pages/quarterly/">Abrir página do Trimestral</a></div>
  `);
  container.insertBefore(triCard, kpisCard.nextSibling);

  // 3) Botão + painel de 21 dias no bloco de Hábitos
  const habitsSection = findHabitsSection();
  if(habitsSection){
    // botão
    const btn = document.createElement('button');
    btn.className = 'btn small';
    btn.textContent = 'Ver 21 dias';
    btn.style.margin = '8px 0';

    // painel
    const panel = document.createElement('div');
    panel.style.display = 'none';
    panel.appendChild(build21DaysGrid());

    btn.onclick = ()=>{
      const open = panel.style.display !== 'none';
      if(open){ panel.style.display='none'; btn.textContent='Ver 21 dias'; }
      else{ panel.innerHTML=''; panel.appendChild(build21DaysGrid()); panel.style.display='block'; btn.textContent='Ocultar'; }
    };

    // onde encaixar (no fim do card de hábitos)
    habitsSection.appendChild(btn);
    habitsSection.appendChild(panel);
  }
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  FOData.load();
  renderHomeExtras();
});
