/* ===== Flow On — Journal (Hábitos, Daily, Monthly, Trimestral) ===== */
const STORE_KEY = 'flowon.v2';

/* ---------- Estado ---------- */
const Data = {
  _s: { habits: [], journal: { daily: [], month: { items: [] }, tri: { byQuarter: {} } } },
  load(){
    const raw = localStorage.getItem(STORE_KEY);
    this._s = raw ? JSON.parse(raw) : { habits: [], journal: { daily: [], month: { items: [] }, tri: { byQuarter: {} } } };

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
function monthNamePT(monthIndex){ return new Date(2000, monthIndex, 1).toLocaleDateString('pt-BR', { month:'long' }); }
function monthNamePTFull(i){ const s = monthNamePT(i); return s.charAt(0).toUpperCase()+s.slice(1); }

/* ---------- Trimestre helpers ---------- */
function getQuarterFromDate(d){ return Math.floor(d.getMonth()/3)+1; } // 1..4
function quarterKey(year, q){ return `${year}-T${q}`; }
function prevQuarter(year,q){ return q===1 ? {year:year-1, q:4} : {year, q:q-1}; }
function nextQuarter(year,q){ return q===4 ? {year:year+1, q:1} : {year, q:q+1}; }
function quarterLabel(year,q){ return `T${q} de ${year}`; }

/* ---------- Tabs ---------- */
function bindTabs(){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.tab').forEach(b=> b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p=> p.classList.remove('active'));
      btn.classList.add('active');
      const pane = document.getElementById('tab-'+btn.dataset.tab);
      if(pane) pane.classList.add('active');
    };
  });
}

/* ---------- Hábitos ---------- */
function drawHabits(){
  const box = document.getElementById('habitsList');
  if(!box) return;
  box.innerHTML='';
  const s = Data.get();

  if(!s.habits.length){
    box.innerHTML = `<div class="muted">Sem hábitos ainda. Clique em <b>+ Hábito</b>.</div>`;
    return;
  }

  s.habits.forEach(h=>{
    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small">${h.name}</span>
        <span>
          <button class="btn small" data-del="${h.id}">Excluir</button>
        </span>
      </div>`;
    row.querySelector('[data-del]').onclick = ()=>{
      s.habits = s.habits.filter(x=>x.id!==h.id);
      Data.save(); drawHabits();
    };
    box.appendChild(row);
  });
}
function addHabit(){
  const title = prompt('Nome do hábito:'); if(!title) return;
  const s = Data.get(); s.habits.push({id:'h_'+Date.now(), name:title.trim()});
  Data.save(); drawHabits();
}

/* ---------- Daily Log ---------- */
function fillDailyForm(date){
  const s = Data.get();
  const reg = s.journal.daily.find(r=>r.date===date);
  const sel = document.getElementById('dailyDate');
  if(sel) sel.value = date;
  (document.getElementById('dailyFocus') || {}).value = reg?.focus || '';
  (document.getElementById('dailyMITs')  || {}).value = reg?.mits || '';
  (document.getElementById('dailyGrat')  || {}).value = reg?.grat || '';
  (document.getElementById('dailyMood')  || {}).value = reg?.mood || '';
  (document.getElementById('dailyNotes') || {}).value = reg?.notes || '';
  const dailyPane = document.getElementById('tab-daily');
  if(dailyPane) dailyPane.scrollIntoView({behavior:'smooth', block:'start'});
}
function drawDaily(){
  const s = Data.get();
  const sel = document.getElementById('dailyDate'); if(!sel) return;
  sel.innerHTML='';
  const days = daysBack(14).reverse();

  days.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = parseLocal(d).toLocaleDateString('pt-BR');
    if(d===toLocalISO(new Date())) opt.selected = true;
    sel.appendChild(opt);
  });

  sel.onchange = ()=> fillDailyForm(sel.value);
  fillDailyForm(sel.value);

  const saveBtn = document.getElementById('btnSaveDaily');
  if(saveBtn){
    saveBtn.onclick = ()=>{
      const date = sel.value;
      const reg = {
        date,
        focus: (document.getElementById('dailyFocus')||{}).value?.trim() || '',
        mits : (document.getElementById('dailyMITs') ||{}).value?.trim() || '',
        grat : (document.getElementById('dailyGrat') ||{}).value?.trim() || '',
        mood : Number((document.getElementById('dailyMood') ||{}).value||0),
        notes: (document.getElementById('dailyNotes')||{}).value?.trim() || ''
      };
      const ix = s.journal.daily.findIndex(r=>r.date===date);
      if(ix>=0) s.journal.daily[ix]=reg; else s.journal.daily.push(reg);
      Data.save();
      drawDailyRecent();
      const monthWrap = document.getElementById('dailyMonth');
      if(monthWrap && monthWrap.style.display!=='none') drawDailyMonthList();
      alert('Daily salvo!');
    };
  }

  const toggleMonthBtn = document.getElementById('btnToggleDailyMonth');
  if(toggleMonthBtn){
    toggleMonthBtn.onclick = ()=>{
      const wrap = document.getElementById('dailyMonth');
      const open = wrap && wrap.style.display !== 'none';
      if(wrap) wrap.style.display = open ? 'none' : 'block';
      toggleMonthBtn.textContent = open ? 'Ver todos do mês' : 'Ocultar';
      if(!open) drawDailyMonthList();
    };
  }

  drawDailyRecent();
}
function drawDailyRecent(){
  const s = Data.get();
  const box = document.getElementById('dailyRecent'); if(!box) return;
  box.innerHTML='';
  const last3 = [...s.journal.daily].sort((a,b)=> (a.date<b.date?1:-1)).slice(0,3);

  if(!last3.length){
    box.innerHTML = `<div class="muted">Sem registros recentes.</div>`;
    return;
  }

  last3.forEach(r=>{
    const card = document.createElement('div'); card.className='list-day';
    card.innerHTML = `
      <div class="list-day-head">
        <span>${parseLocal(r.date).toLocaleDateString('pt-BR')}</span>
        <span class="muted">Humor: ${r.mood||'—'}</span>
      </div>
      <div class="small">Foco: <b>${r.focus||'—'}</b></div>
      <div class="small">Gratidão: <b>${r.grat||'—'}</b></div>
      <div style="margin-top:6px"><button class="btn small" data-edit="${r.date}">Editar</button></div>`;
    card.querySelector('[data-edit]').onclick = ()=> fillDailyForm(r.date);
    box.appendChild(card);
  });
}
function drawDailyMonthList(){
  const s = Data.get();
  const box = document.getElementById('dailyMonthList'); if(!box) return;
  box.innerHTML='';
  const nowIso = toLocalISO(new Date());
  const monthRegs = s.journal.daily
    .filter(r=> sameMonth(r.date, nowIso))
    .sort((a,b)=> a.date<b.date ? 1 : -1);

  if(!monthRegs.length){
    box.innerHTML = `<div class="muted">Sem registros neste mês.</div>`;
    return;
  }

  monthRegs.forEach(r=>{
    const item = document.createElement('div'); item.className='list-day';
    item.innerHTML = `
      <div class="list-day-head">
        <span>${parseLocal(r.date).toLocaleDateString('pt-BR')}</span>
        <span class="muted">Humor: ${r.mood||'—'}</span>
      </div>
      <div class="small">Foco: <b>${r.focus||'—'}</b></div>
      <div class="small">Gratidão: <b>${r.grat||'—'}</b></div>
      <div class="small">MITs: <b>${r.mits||'—'}</b></div>
      <div style="margin-top:6px"><button class="btn small" data-edit="${r.date}">Editar</button></div>`;
    item.querySelector('[data-edit]').onclick = ()=> fillDailyForm(r.date);
    box.appendChild(item);
  });
}

/* ---------- Monthly (Agenda do mês) ---------- */
let viewYear  = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0..11
let monthFilter = 'all'; // all | pending | done

function setMonthLabelAndCounters(){
  const labelEl = document.getElementById('monthLabel');
  if(labelEl) labelEl.textContent = `${monthNamePTFull(viewMonth)} de ${viewYear}`;

  const s = Data.get();
  const items = s.journal.month.items.filter(it=>{
    const d = parseLocal(it.date);
    return !it.archived && d.getFullYear()===viewYear && d.getMonth()===viewMonth;
  });
  const total = items.length;
  const done  = items.filter(i=>i.done).length;
  const pend  = total - done;
  const cnt = document.getElementById('monthCounters');
  if(cnt) cnt.innerHTML = `Pendentes: <b>${pend}</b> • Concluídos: <b>${done}</b> • Total: <b>${total}</b>`;

  // selects jump
  const ySel = document.getElementById('jumpYear');
  if(ySel && !ySel.childElementCount){
    const cur = new Date().getFullYear();
    for(let y=cur-5; y<=cur+5; y++){
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      ySel.appendChild(opt);
    }
  }
  if(ySel) ySel.value = String(viewYear);
  const mSel = document.getElementById('jumpMonth');
  if(mSel) mSel.value = String(viewMonth);
}
function goPrevMonth(){ if(viewMonth===0){ viewMonth=11; viewYear--; } else { viewMonth--; } setMonthLabelAndCounters(); drawMonthList(); }
function goNextMonth(){ if(viewMonth===11){ viewMonth=0; viewYear++; } else { viewMonth++; } setMonthLabelAndCounters(); drawMonthList(); }
function jumpToSelected(){
  const ySel = document.getElementById('jumpYear');
  const mSel = document.getElementById('jumpMonth');
  if(!ySel || !mSel) return;
  viewYear = Number(ySel.value);
  viewMonth = Number(mSel.value);
  setMonthLabelAndCounters(); drawMonthList();
}
function jumpToToday(){
  const now = new Date();
  viewYear  = now.getFullYear();
  viewMonth = now.getMonth();
  setMonthLabelAndCounters(); drawMonthList();
}
function setMonthFilter(f){
  monthFilter = f;
  document.querySelectorAll('#monthFilters .btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.filter===f);
  });
  drawMonthList();
}

function addMonthItem(){
  const s = Data.get();
  const titleEl = document.getElementById('mTitle');
  const dateEl  = document.getElementById('mDate');
  const notesEl = document.getElementById('mNotes');
  if(!titleEl || !dateEl || !notesEl) return;
  const title = titleEl.value.trim();
  const date  = dateEl.value;
  const notes = notesEl.value.trim();
  if(!title){ alert('Dê um título ao item.'); return; }
  if(!date){ alert('Escolha uma data.'); return; }
  s.journal.month.items.push({ id:'m_'+Date.now(), title, date, notes, done:false, archived:false });
  Data.save();
  titleEl.value=''; dateEl.value=''; notesEl.value='';
  setMonthLabelAndCounters(); drawMonthList();
}
function moveAllNextMonth(){
  const s = Data.get(); let moved=0;
  s.journal.month.items.forEach(it=>{
    const d = parseLocal(it.date);
    if(!it.done && d.getFullYear()===viewYear && d.getMonth()===viewMonth){
      it.date = nextMonthDate(it.date);
      it.movedAt = Date.now();
      it.movedFrom = { year:viewYear, month:viewMonth };
      moved++;
    }
  });
  Data.save(); setMonthLabelAndCounters(); drawMonthList();
  if(moved>0) alert(`${moved} item(ns) movidos para o próximo mês.`);
}
function drawMonthList(){
  const s = Data.get();
  const box = document.getElementById('monthList'); if(!box) return;
  box.innerHTML='';
  const currentMonthDays = daysOfMonth(viewYear, viewMonth);
  let any=false;

  currentMonthDays.forEach(d=>{
    let items = s.journal.month.items.filter(it=>{
      if(it.archived) return false;
      const dd = parseLocal(it.date);
      if(dd.getFullYear()!==viewYear || dd.getMonth()!==viewMonth) return false;
      if(it.date!==d) return false;
      if(monthFilter==='pending' && it.done) return false;
      if(monthFilter==='done' && !it.done) return false;
      return true;
    });
    if(!items.length) return;

    any=true;
    const wrap = document.createElement('div'); wrap.className='list-day';
    wrap.innerHTML = `
      <div class="list-day-head">
        <span>${parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
        <span class="muted">mês</span>
      </div>`;
    const list = document.createElement('div');

    items.forEach(it=>{
      const row = document.createElement('div'); row.className='small badge';
      row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.margin='4px 0';
      row.innerHTML = `
        <span>${it.title}</span>
        <span style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn small" data-done="${it.id}">${it.done?'Desmarcar':'Concluir'}</button>
          <button class="btn small" data-move="${it.id}">Mover</button>
          <button class="btn small" data-edit="${it.id}">Editar</button>
          <button class="btn small" data-del="${it.id}">Excluir</button>
        </span>`;

      row.querySelector('[data-done]').onclick = ()=>{
        it.done = !it.done; Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-move]').onclick = ()=>{
        it.date = nextMonthDate(it.date); it.movedAt=Date.now(); it.movedFrom={year:viewYear, month:viewMonth};
        Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-edit]').onclick = ()=>{
        const nt = prompt('Título', it.title||'') ?? it.title; if(nt===null) return;
        const nd = prompt('Data (AAAA-MM-DD)', it.date||'') ?? it.date; if(nd===null) return;
        const nn = prompt('Notas', it.notes||'') ?? it.notes;
        it.title = String(nt).trim(); it.date = String(nd); it.notes = String(nn||'');
        Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-del]').onclick = ()=>{
        if(confirm('Excluir item do mês?')){
          s.journal.month.items = s.journal.month.items.filter(x=>x.id!==it.id);
          Data.save(); setMonthLabelAndCounters(); drawMonthList();
        }
      };

      list.appendChild(row);
      if(it.notes){
        const notes = document.createElement('div');
        notes.className='small';
        notes.style.margin='4px 0 0';
        notes.style.opacity='.8';
        notes.textContent = it.notes;
        list.appendChild(notes);
      }
    });

    wrap.appendChild(list);
    box.appendChild(wrap);
  });

  if(!any){
    box.innerHTML = `<div class="muted">Sem itens neste filtro/mês. Adicione acima.</div>`;
  }
}

/* ---------- Trimestral ---------- */
let triYear = new Date().getFullYear();
let triQ    = getQuarterFromDate(new Date());

function drawTriHeaderAndNotes(){
  const lbl = document.getElementById('triLabel');
  if(lbl) lbl.textContent = quarterLabel(triYear, triQ);
  const key = quarterKey(triYear, triQ);
  const s = Data.get();
  const area = document.getElementById('triNotes');
  if(area) area.value = s.journal.tri.byQuarter[key] || '';
}
function saveTri(){
  const s = Data.get();
  const key = quarterKey(triYear, triQ);
  const area = document.getElementById('triNotes'); if(!area) return;
  s.journal.tri.byQuarter[key] = area.value;
  Data.save();
  alert('Trimestre salvo!');
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    bindTabs();
    Data.load();

    // Hábitos
    drawHabits();
    const btnAddHabit = document.getElementById('btnAddHabit');
    if(btnAddHabit) btnAddHabit.onclick = addHabit;

    // Daily
    drawDaily();

    // Monthly
    const addBtn  = document.getElementById('btnAddMonthItem');
    const movAll  = document.getElementById('btnMoveAllNextMonth');
    const prevBtn = document.getElementById('btnPrevMonth');
    const nextBtn = document.getElementById('btnNextMonth');
    const jumpBtn = document.getElementById('btnJump');
    const todayBtn= document.getElementById('btnToday');

    if(addBtn)  addBtn.onclick = addMonthItem;
    if(movAll)  movAll.onclick = moveAllNextMonth;
    if(prevBtn) prevBtn.onclick = goPrevMonth;
    if(nextBtn) nextBtn.onclick = goNextMonth;
    if(jumpBtn) jumpBtn.onclick = jumpToSelected;
    if(todayBtn)todayBtn.onclick = jumpToToday;

    document.querySelectorAll('#monthFilters .btn').forEach(b=>{
      b.onclick = ()=> setMonthFilter(b.dataset.filter);
    });
    setMonthLabelAndCounters();
    setMonthFilter('all'); // também desenha a lista

    // Trimestral
    const svTri = document.getElementById('btnSaveTri');
    const triPrev = document.getElementById('btnTriPrev');
    const triNext = document.getElementById('btnTriNext');
    if(svTri) svTri.onclick = saveTri;
    if(triPrev) triPrev.onclick = ()=>{ const r=prevQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); };
    if(triNext) triNext.onclick = ()=>{ const r=nextQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); };
    drawTriHeaderAndNotes();

  }catch(err){
    console.error('Erro ao iniciar:', err);
    alert('Houve um erro de script. Recarregue a página (Ctrl/Cmd + Shift + R).');
  }
});
