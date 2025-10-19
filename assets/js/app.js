/* ====== Flow On — Home ====== */
const STORE_KEY = 'flowon.v2';

const Data = {
  _s: {},
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this._s = JSON.parse(raw);
      this._s.habits ||= [
        { id: 'h1', name: 'Planejar dia anterior' },
        { id: 'h2', name: 'Treinar' },
        { id: 'h3', name: 'Meditar 5 min' },
        { id: 'h4', name: 'Arrumar casa' }
      ];
      this._s.journal ||= { daily: [], month: { items: [] }, tri: { byQuarter: {} } };
      this._s.themes ||= [];
      this._s.posts ||= [];
      this.save();
    } catch (e) { console.error(e); }
  },
  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this._s)); },
  get() { return this._s; }
};

/* ===== Helpers de data ===== */
const toISO = d => d.toISOString().slice(0, 10);
const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const todayISO = () => toISO(new Date());
function weekRange(date = new Date()) {
  const d = new Date(date);
  const jsDay = d.getDay();
  const offset = (jsDay + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
  return [...Array(7)].map((_, i) =>
    toISO(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i))
  );
}
function quarterKey(iso = todayISO()) {
  const d = new Date(iso + 'T00:00:00');
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  return { key: `${y}-T${q}`, label: `T${q} de ${y}` };
}

/* ===== Progresso Geral ===== */
function renderProgress() {
  const s = Data.get();
  const wk = weekRange();
  let habitsDone = 0, habitsTotal = 0, dailies7 = 0, posts7 = 0;

  // Hábitos
  s.habits.forEach(h => {
    h.checks ||= {};
    wk.forEach((_, i) => {
      h.checks[wk] ||= Array(7).fill(false);
      const weekKey = Object.keys(h.checks).pop();
      if (h.checks[weekKey]) {
        habitsTotal += 1;
        if (h.checks[weekKey][i]) habitsDone += 1;
      }
    });
  });
  const habitsPct = habitsTotal ? Math.round((habitsDone / habitsTotal) * 100) + '%' : '—';

  // Dailies
  const daily = s.journal.daily || [];
  const today = new Date();
  const past7 = [...Array(7)].map((_, i) => toISO(new Date(today - i * 86400000)));
  dailies7 = daily.filter(d => past7.includes(d.date) && (d.focus || d.notes)).length;

  // Conteúdos
  const posts = s.posts || [];
  posts7 = posts.filter(p => {
    const pd = new Date(p.date);
    const diff = (pd - today) / 86400000;
    return diff >= 0 && diff < 7;
  }).length;

  document.getElementById('kpi-habits').textContent = habitsPct;
  document.getElementById('kpi-dailies').textContent = dailies7;
  document.getElementById('kpi-posts').textContent = posts7;
}

/* ===== Visão do Trimestre ===== */
function renderQuarter() {
  const s = Data.get();
  const { key, label } = quarterKey();
  const note = s.journal?.tri?.byQuarter?.[key] || 'Sem anotações do trimestre ainda.';
  document.getElementById('quarter-label').textContent = `(${label})`;
  document.getElementById('quarter-notes').textContent = note;
}

/* ===== Hábitos (semana + 21 dias) ===== */
function renderHabitsSummary() {
  const el = document.getElementById('habits-summary');
  const s = Data.get();
  const wk = weekRange();
  let html = '';

  s.habits.forEach(h => {
    h.checks ||= {};
    const weekKey = Object.keys(h.checks).pop() || 'wk';
    h.checks[weekKey] ||= Array(7).fill(false);
    const dots = h.checks[weekKey].map(v => `<span class="ring-dot ${v ? 'done' : ''}"></span>`).join('');
    const pct = Math.round((h.checks[weekKey].filter(Boolean).length / 7) * 100);
    html += `
      <div class="h-row">
        <div class="h-name">${h.name}</div>
        <div class="h-dots">${dots}<div class="h-pct">${pct}%</div></div>
      </div>`;
  });

  if (!s.habits.length) html = `<div class="muted">Sem hábitos cadastrados. Edite em Journal.</div>`;
  el.innerHTML = html + `<div class="muted" style="margin-top:6px">* visão geral — edite em Journal → Hábitos</div>`;
}

/* ===== Painel de 21 dias ===== */
function setupHabits21() {
  const btn = document.getElementById('btn-habits-21');
  const panel = document.getElementById('habits-21-panel');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
      btn.textContent = 'Ver 21 dias';
      return;
    }
    const s = Data.get();
    const habits = s.habits || [];
    const today = todayISO();
    let html = '';
    habits.forEach(h => {
      const id = h.id;
      html += `<div class="fo-habit-row"><div class="fo-habit-name">${h.name}</div><div class="fo-dots">`;
      for (let i = 20; i >= 0; i--) {
        const date = addDays(today, -i);
        const mark = h.checks && Object.values(h.checks).some(arr => arr[i]);
        html += `<span class="fo-dot${mark ? ' on' : ''}" title="${date}"></span>`;
      }
      html += `</div></div>`;
    });
    panel.innerHTML = html;
    panel.style.display = 'block';
    btn.textContent = 'Ocultar';
  });
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', () => {
  Data.load();
  renderProgress();
  renderQuarter();
  renderHabitsSummary();
  setupHabits21();
});
