/* ===== Flow On — Core (estado + utilitários compat) ===== */
(function (global) {
  const STORE_KEY_V2  = 'flowon.v2';
  const STORE_KEY_OLD = 'flowon';

  /* ---------- Estado global (v2) + leitura do legacy ---------- */
  const Core = {
    _s: {},          // estado v2
    _legacy: {},     // leitura do legacy (somente leitura)
    load() {
      // v2
      try { this._s = JSON.parse(localStorage.getItem(STORE_KEY_V2) || '{}'); }
      catch { this._s = {}; }

      // legacy (não salvamos nele)
      try { this._legacy = JSON.parse(localStorage.getItem(STORE_KEY_OLD) || '{}'); }
      catch { this._legacy = {}; }

      // garantir estrutura mínima v2
      this._s.habits  ||= [];
      this._s.journal ||= { daily: [], month: { items: [] }, tri: { byQuarter: {} }, habits: { items: [], marks: {} } };
      this._s.journal.month ||= { items: [] };
      this._s.journal.month.items ||= [];
      this._s.journal.daily ||= [];
      this._s.journal.tri ||= { byQuarter: {} };
      this._s.journal.tri.byQuarter ||= {};
      this._s.journal.habits ||= { items: [], marks: {} };
      this._s.journal.habits.items ||= [];
      this._s.journal.habits.marks ||= {};
      this._s.themes ||= [];
      this._s.posts  ||= [];

      // seeds só se não houver hábitos em NENHUMA fonte
      const hasLegacy =
        Array.isArray(this._legacy?.journal?.habits?.items) && this._legacy.journal.habits.items.length ||
        Array.isArray(this._legacy?.habits) && this._legacy.habits.length;
      const hasV2 =
        Array.isArray(this._s.journal?.habits?.items) && this._s.journal.habits.items.length ||
        Array.isArray(this._s.habits) && this._s.habits.length;

      if (!hasLegacy && !hasV2 && this._s.habits.length === 0) {
        this._s.habits = [
          { id: 'h1', name: 'Planejar dia anterior' },
          { id: 'h2', name: 'Treinar' },
          { id: 'h3', name: 'Meditar 5 min' }
        ];
      }

      // migração antiga (triNotes -> tri.byQuarter[YYYY-Tn])
      if (typeof this._s.journal.triNotes === 'string' && this._s.journal.triNotes.trim()) {
        const now = new Date();
        const key = `${now.getFullYear()}-T${Math.floor(now.getMonth() / 3) + 1}`;
        this._s.journal.tri.byQuarter[key] = this._s.journal.triNotes;
        delete this._s.journal.triNotes;
      }

      this.save();
    },
    save() {
      localStorage.setItem(STORE_KEY_V2, JSON.stringify(this._s));
    },
    get() { return this._s; },
    getLegacy() { return this._legacy; },

    /* ---------- Getters “unificados” (prioridade compatível com tua Home) ---------- */
    getHabits() {
      // 1) legacy: journal.habits.items
      if (Array.isArray(this._legacy?.journal?.habits?.items) && this._legacy.journal.habits.items.length)
        return this._legacy.journal.habits.items;
      // 2) legacy: habits
      if (Array.isArray(this._legacy?.habits) && this._legacy.habits.length)
        return this._legacy.habits;
      // 3) v2: journal.habits.items
      if (Array.isArray(this._s?.journal?.habits?.items) && this._s.journal.habits.items.length)
        return this._s.journal.habits.items;
      // 4) v2: habits
      if (Array.isArray(this._s?.habits) && this._s.habits.length)
        return this._s.habits;
      return [];
    },
    getHabitMarks() {
      // usado pela page de hábitos (legacy)
      return this._legacy?.journal?.habits?.marks || {};
    },
    getDailyByDate() {
      // Preferimos legacy (byDate) quando existe, pois tua página Daily usa isso
      return this._legacy?.journal?.daily?.byDate || null;
    },
    getPosts() {
      return this._s?.posts || [];
    }
  };

  /* ---------- Helpers de data (modo local, sem timezone) ---------- */
  function toISO(d) {
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function fromISO(iso) {
    const [y, m, d] = (iso || '').split('-').map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
  }
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

  // Exporta no global
  global.Core = Core;
  global.CoreDates = {
    toISO, fromISO, todayISO, addDaysISO,
    mondayOfWeekISO, weekRangeFromISO, weekKeyOfISO, dayIndexOfISO
  };

  // Auto-load
  Core.load();

})(window);