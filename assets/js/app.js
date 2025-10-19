/* ====== Flow On — Home (progresso, trimestre, hábitos semana + 21 dias) ====== */
const STORE_KEY = 'flowon.v2';
const STORE_OLD = 'flowon';

/* ---------- Storage ---------- */
const Data = {
  _s: {},
  _old: {},
  load() {
    try { this._s   = JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); } catch { this._s = {}; }
    try { this._old = JSON.parse(localStorage.getItem(STORE_OLD)||'{}'); } catch { this._old = {}; }

    // seeds mínimos (só se vazio)
    this._s.habits ||= [
      { id: 'h1', name: 'Planejar dia anterior' },
      { id: 'h2', name: 'Treinar' },
      { id: 'h3', name: 'Meditar 5 min' },
      { id: 'h4', name: 'Arrumar casa' }
    ];
    this._s.journal ||= { daily: [], month: { items: [] }, tri: { byQuarter: {} } };
    this._s.journal.month ||= { items: [] };
    this._s.journal.tri   ||= { byQuarter: {} };
    this._s.themes ||= [];
    this._s.posts  ||= [];

    this.save();
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)); },
  get(){ return this._s; },
  getOld(){ return this._old; }
};

/* ---------- Helpers de data (local) ---------- */
const toISO = d => {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};
const fromISO = iso => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y||1970,(m||1)-1,d||1); };
const todayISO   = () => toISO(new Date());
const addDaysISO = (iso,n) => toISO(new Date(fromISO(iso).getTime()+n*86400000));

function mondayOfWeekISO(iso){ const d=fromISO(iso); const off=(d.getDay()+6)%7; d.setDate(d.getDate()-off); return toISO(d); }
function weekRangeFromISO(iso){ const mon=mondayOfWeekISO(iso); return [...Array(7)].map((_,i)=> addDaysISO(mon,i)); }
function weekKeyOfISO(iso){
  const d=fromISO(iso), onejan=new Date(d.getFullYear(),0,1);
  const day=Math.floor((d-onejan)/86400000)+1;
  const wk=Math.ceil((day+((onejan.getDay()+6)%7))/7);
  return `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
}
function dayIndexOfISO(iso){ return (fromISO(iso).getDay()+6)%7; }

/* ---------- Fonte de hábitos + marks (auto) ---------- */
function getHabitsSource(){
  const old = Data.getOld();
  const v2  = Data.get();

  // 1) página Hábitos (legado): journal.habits.items + marks[ISO]
  if (Array.isArray(old?.journal?.habits?.items) && old.journal.habits.items.length)
    return { list: old.journal.habits.items, marks: old.journal.habits.marks || null };

  // 2) legado simples
  if (Array.isArray(old?.habits) && old.habits.length)
    return { list: old.habits, marks: null };

  // 3) v2 em journal.habits.items
  if (Array.isArray(v2?.journal?.habits?.items) && v2.journal.habits.items.length)
    return { list: v2.journal.habits.items, marks: v2.journal.habits.marks || null };

  // 4) v2 raiz
  if (Array.isArray(v2?.habits) && v2.habits.length)
    return { list: v2.habits, marks: null };

  return { list: [], marks: null };
}

/* Leitura unificada do “feito” */
function isChecked(habit, iso, marks){
  const id = habit.id || habit.key || habit.name || habit.title;

  // marks por data (array de ids ou map id->bool)
  if (marks && marks[iso]){
    const m = marks[iso];
    if (Array.isArray(m)) return m.includes(id);
    if (typeof m==='object') return !!m[id];
  }

  // checks por semana
  if (habit.checks && typeof habit.checks==='object'){
    const wk=weekKeyOfISO(iso), idx=dayIndexOfISO(iso), arr=habit.checks[wk];
    if (Array.isArray(arr) && arr.length>idx) return !!arr[idx];
  }

  // mapas por data no próprio hábito
  const dateMaps = ['byDate','days','dates','checksByDate'];
  for (const k of dateMaps){
    if (habit[k] && typeof habit[k]==='object' && Object.prototype.hasOwnProperty.call(habit[k], iso))
      return !!habit[k][iso];
  }

  return false;
}

/* ---------- Progresso Geral ---------- */
function renderProgress() {
  const v2 = Data.get();
  const {list: habits, marks} = getHabitsSource();
  const weekDays = weekRangeFromISO(todayISO());

  // Hábitos
  let habitsDone = 0, habitsTotal = habits.length * 7;
  weekDays.forEach(iso => {
    habits.forEach(h => { if (isChecked(h, iso, marks)) habitsDone++; });
  });
  const habitsPct = habitsTotal ? Math.round((habitsDone / habitsTotal) * 100) + '%' : '—';

  // Dailies (v2 array OU legado byDate)
  const old = Data.getOld();
  const past7 = [...Array(7)].map((_, i) => addDaysISO(todayISO(), -i));
  let dailies7 = 0;

  if (Array.isArray(v2.journal?.daily)) {
    dailies7 = v2.journal.daily.filter(d => past7.includes(d.date) && (d.focus||d.notes||d.mits||d.gratitude)).length;
  } else {
    const byDate = old?.journal?.daily?.byDate || {};
    dailies7 = past7.filter(d => {
      const v = byDate[d]; return v && (v.focus||v.notes||v.mits||v.gratitude);
    }).length;
  }

  // Conteúdos (próx. 7 dias)
  const nowISO = todayISO(), in7 = addDaysISO(nowISO, 7);
  const posts7 = (v2.posts || []).filter(p =>
    p.date >= nowISO && p.date < in7 && !p.archived && p.status !== 'Rascunho'
  ).length;

  const hEl = document.getElementById('kpi-habits');
  const dEl = document.getElementById('kpi-dailies');
  const pEl = document.getElementById('kpi-posts');
  if (hEl) hEl.textContent = habitsPct;
  if (dEl) dEl.textContent = dailies7;
  if (pEl) pEl.textContent = posts7;
}

/* ---------- Visão do Trimestre ---------- */
function renderQuarter() {
  const v2 = Data.get();
  const old = Data.getOld();
  const d = fromISO(todayISO());
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  const key   = `${y}-T${q}`;
  const label = `T${q} de ${y}`;

  let note = v2.journal?.tri?.byQuarter?.[key] || '';

  if (!note) {
    // fallbacks no legado
    const J = old.journal || {};
    const roots = [ J.tri, J.quarterly, J.trimestral, J ];
    for (const r of roots){
      if (!r) continue;
      if (r.byQuarter && r.byQuarter[key]) { note = r.byQuarter[key]; break; }
      if (r[key]) { note = r[key]; break; }
    }
  }
  if (!note) note = 'Sem anotações do trimestre ainda.';

  const labEl   = document.getElementById('quarter-label');
  const notesEl = document.getElementById('quarter-notes');
  if (labEl)   labEl.textContent = `(${label})`;
  if (notesEl) notesEl.textContent = note;
}

/* ---------- Hábitos: visão semanal (somente leitura) ---------- */
function renderHabitsSummary() {
  const el = document.getElementById('habits-summary');
  if (!el) return;

  const {list: habits, marks} = getHabitsSource();
  const days = weekRangeFromISO(todayISO());
  let html = '';

  habits.forEach(h => {
    const dots = days.map(iso => `<span class="ring-dot ${isChecked(h, iso, marks) ? 'done' : ''}"></span>`).join('');
    // % da semana baseado na primeira semana (segunda..domingo)
    const wkKey = weekKeyOfISO(days[0]);
    // tenta checks semanais; se não houver, conta a semana por data
    let pct = 0;
    if (h.checks && Array.isArray(h.checks[wkKey])) {
      pct = Math.round((h.checks[wkKey].filter(Boolean).length / 7) * 100) || 0;
    } else {
      const weekCount = days.reduce((acc, iso) => acc + (isChecked(h, iso, marks) ? 1 : 0), 0);
      pct = Math.round((weekCount / 7) * 100);
    }
    html += `
      <div class="h-row">
        <div class="h-name">${h.name || h.title || 'Hábito'}</div>
        <div class="h-dots">${dots}<div class="h-pct">${pct}%</div></div>
      </div>`;
  });

  if (!habits.length) {
    html = `<div class="muted">Sem hábitos cadastrados. Edite em <b>Journal → Hábitos</b>.</div>`;
  }

  el.innerHTML = html + `<div class="muted" style="margin-top:6px">* visão geral — edite em Journal → Hábitos</div>`;
}

/* ---------- Painel “21 dias” (somente leitura) ---------- */
function setupHabits21() {
  const btn   = document.getElementById('btn-habits-21');
  const panel = document.getElementById('habits-21-panel');
  if (!btn || !panel) return;

  btn.addEventListener('click', () => {
    const open = panel.style.display === 'block';
    if (open) {
      panel.style.display = 'none';
      btn.textContent = 'Ver 21 dias';
      return;
    }

    const {list: habits, marks} = getHabitsSource();
    const today = todayISO();

    let html = '';
    habits.forEach(h => {
      html += `<div class="fo-habit-row"><div class="fo-habit-name">${h.name || h.title || 'Hábito'}</div><div class="fo-dots">`;
      for (let i = 20; i >= 0; i--) {
        const iso = addDaysISO(today, -i);
        const on  = isChecked(h, iso, marks);
        html += `<span class="fo-dot${on ? ' on' : ''}" title="${iso}"></span>`;
      }
      html += `</div></div>`;
    });

    panel.innerHTML = html;
    panel.style.display = 'block';
    btn.textContent = 'Ocultar';
  });
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Data.load();
  renderProgress();
  renderQuarter();
  renderHabitsSummary();
  setupHabits21();
});