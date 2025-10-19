/* ===== Flow On — Core (estado + utilitários) ===== */
const STORE_KEY = 'flowon.v2';

/* ---------- Estado global ---------- */
const Data = {
  _s: { habits: [], journal: { daily: [], month: { items: [] }, tri: { byQuarter: {} } } },
  load(){
    const raw = localStorage.getItem(STORE_KEY);
    this._s = raw ? JSON.parse(raw)
                  : { habits: [], journal: { daily: [], month: { items: [] }, tri: { byQuarter: {} } } };

    // defaults
    this._s.habits = this._s.habits || [];
    this._s.journal = this._s.journal || { daily: [], month: { items: [] }, tri: { byQuarter: {} } };
    this._s.journal.month = this._s.journal.month || { items: [] };
    this._s.journal.month.items = this._s.journal.month.items || [];
    this._s.journal.daily = this._s.journal.daily || [];
    if (!this._s.journal.tri) this._s.journal.tri = { byQuarter: {} };
    this._s.journal.tri.byQuarter = this._s.journal.tri.byQuarter || {};

    // migração antiga (triNotes -> tri.byQuarter[YYYY-Tn])
    if (typeof this._s.journal.triNotes === 'string' && this._s.journal.triNotes.trim()) {
      const now = new Date();
      const key = `${now.getFullYear()}-T${Math.floor(now.getMonth()/3)+1}`;
      this._s.journal.tri.byQuarter[key] = this._s.journal.triNotes;
      delete this._s.journal.triNotes;
    }

    this.save();
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)); },
  get(){ return this._s; }
};

/* ---------- Helpers de data ---------- */
const toLocalISO = (date) => {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseLocal = (iso) => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
function daysBack(n=14){
  const end = new Date();
  return [...Array(n)].map((_,i)=> toLocalISO(new Date(end.getFullYear(), end.getMonth(), end.getDate()-i)) );
}
function sameMonth(aIso, bIso){
  const a = parseLocal(aIso), b = parseLocal(bIso);
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth();
}
function daysOfMonth(year, monthIndex){ // 0..11
  const last = new Date(year, monthIndex+1, 0).getDate();
  return [...Array(last)].map((_,i)=> toLocalISO(new Date(year, monthIndex, i+1)) );
}
function clampDay(y, m, d){ const last = new Date(y, m+1, 0).getDate(); return Math.min(d, last); }
function nextMonthDate(iso){
  if(!iso) return iso;
  const [y,m,d] = iso.split('-').map(Number);
  const ny = m===12 ? y+1 : y;
  const nm = m===12 ? 1 : m+1;
  const nd = clampDay(ny, nm-1, d);
  return `${ny}-${String(nm).padStart(2,'0')}-${String(nd).padStart(2,'0')}`;
}
function monthNamePT(i){ return new Date(2000, i, 1).toLocaleDateString('pt-BR', { month:'long' }); }
function monthNamePTFull(i){ const s = monthNamePT(i); return s.charAt(0).toUpperCase()+s.slice(1); }

/* ---------- Helpers de trimestre ---------- */
function getQuarterFromDate(d){ return Math.floor(d.getMonth()/3)+1; } // 1..4
function quarterKey(year, q){ return `${year}-T${q}`; }
function prevQuarter(year,q){ return q===1 ? {year:year-1, q:4} : {year, q:q-1}; }
function nextQuarter(year,q){ return q===4 ? {year:year+1, q:1} : {year, q:q+1}; }
function quarterLabel(year,q){ return `T${q} de ${year}`; }
