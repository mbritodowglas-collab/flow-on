/* ====== Flow On — Home (progresso, trimestre, hábitos semana + 21 dias) ====== */
const STORE_KEY = 'flowon.v2';

/* ---------- Storage ---------- */
const Data = {
  _s: {},
  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) this._s = JSON.parse(raw);

      // seeds mínimos (apenas se vazio)
      this._s.habits ||= [
        { id: 'h1', name: 'Planejar dia anterior' },
        { id: 'h2', name: 'Treinar' },
        { id: 'h3', name: 'Meditar 5 min' },
        { id: 'h4', name: 'Arrumar casa' }
      ];
      // Estrutura do journal esperada pelas páginas
      this._s.journal ||= { daily: [], month: { items: [] }, tri: { byQuarter: {} } };
      this._s.journal.month ||= { items: [] };
      this._s.journal.tri   ||= { byQuarter: {} };

      this._s.themes ||= [];
      this._s.posts  ||= [];

      this.save();
    } catch (e) { console.error(e); }
  },
  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this._s)); },
  get()  { return this._s; }
};

/* ---------- Helpers de data (local) ---------- */
const toISO = (d) => {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const fromISO = (iso) => {
  const [y, m, d] = (iso || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};
const todayISO   = () => toISO(new Date());
const addDaysISO = (iso, n) => toISO(new Date(fromISO(iso).getTime() + n * 86400000));

function mondayOfWeekISO(iso) {
  const d = fromISO(iso);
  const offset = (d.getDay() + 6) % 7; // seg=0..dom=6
  d.setDate(d.getDate() - offset);
  return toISO(d);
}
function weekRangeFromISO(iso) {
  const mon = mondayOfWeekISO(iso);
  return [...Array(7)].map((_, i) => addDaysISO(mon, i));
}
function weekKeyOfISO(iso) {
  const d = fromISO(iso);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((d - onejan) / 86400000) + 1;
  const week = Math.ceil((dayOfYear + ((onejan.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}
function dayIndexOfISO(iso) {
  const d = fromISO(iso);
  return (d.getDay() + 6) % 7; // seg=0
}

/* ---------- Progresso Geral ---------- */
function renderProgress() {
  const s = Data.get();
  const weekDays = weekRangeFromISO(todayISO());

  // Hábitos: soma dos 7 dias x nº de hábitos (baseado em checks por semana)
  let habitsDone = 0, habitsTotal = 0;
  (s.habits || []).forEach(h => {
    h.checks ||= {}; // { "YYYY-Www": [bool x7] }
    weekDays.forEach(iso => {
      const wkKey = weekKeyOfISO(iso);
      const idx   = dayIndexOfISO(iso);
      const arr   = (h.checks[wkKey] ||= Array(7).fill(false));
      habitsTotal += 1;
      if (arr[idx]) habitsDone += 1;
    });
  });
  const habitsPct = habitsTotal ? Math.round((habitsDone / habitsTotal) * 100) + '%' : '—';

  // Dailies (últimos 7 dias com qualquer campo preenchido)
  const daily = s.journal?.daily || [];
  const past7 = [...Array(7)].map((_, i) => addDaysISO(todayISO(), -i));
  const dailies7 = daily.filter(d => past7.includes(d.date) && (d.focus || d.notes || d.mits || d.gratitude)).length;

  // Conteúdos (próx. 7 dias, não-rascunho e não arquivados)
  const nowISO = todayISO();
  const in7    = addDaysISO(nowISO, 7);
  const posts7 = (s.posts || []).filter(p =>
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
  const s = Data.get();
  const d = fromISO(todayISO());
  const y = d.getFullYear();
  const q = Math.floor(d.getMonth() / 3) + 1;
  const key   = `${y}-T${q}`;
  const label = `T${q} de ${y}`;
  const note  = s.journal?.tri?.byQuarter?.[key] || 'Sem anotações do trimestre ainda.';

  const labEl   = document.getElementById('quarter-label');
  const notesEl = document.getElementById('quarter-notes');
  if (labEl)   labEl.textContent = `(${label})`;
  if (notesEl) notesEl.textContent = note;
}

/* ---------- Hábitos: visão semanal (somente leitura) ---------- */
function renderHabitsSummary() {
  const el = document.getElementById('habits-summary');
  if (!el) return;

  const s    = Data.get();
  const days = weekRangeFromISO(todayISO());
  let html = '';

  (s.habits || []).forEach(h => {
    h.checks ||= {}; // weekKey -> [7]
    const dots = days.map(iso => {
      const wkKey = weekKeyOfISO(iso);
      const idx   = dayIndexOfISO(iso);
      const arr   = (h.checks[wkKey] ||= Array(7).fill(false));
      return `<span class="ring-dot ${arr[idx] ? 'done' : ''}"></span>`;
    }).join('');

    const wkKey = weekKeyOfISO(days[0]);
    const pct   = Math.round(((h.checks[wkKey] || []).filter(Boolean).length / 7) * 100) || 0;

    html += `
      <div class="h-row">
        <div class="h-name">${h.name}</div>
        <div class="h-dots">${dots}<div class="h-pct">${pct}%</div></div>
      </div>`;
  });

  if (!(s.habits || []).length) {
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

    const s = Data.get();
    const habits = s.habits || [];
    const today  = todayISO();
    let html = '';

    habits.forEach(h => {
      h.checks ||= {};
      html += `<div class="fo-habit-row"><div class="fo-habit-name">${h.name}</div><div class="fo-dots">`;
      for (let i = 20; i >= 0; i--) {
        const iso   = addDaysISO(today, -i);
        const wkKey = weekKeyOfISO(iso);
        const idx   = dayIndexOfISO(iso);
        const arr   = (h.checks[wkKey] ||= Array(7).fill(false));
        const on    = !!arr[idx];
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