/* ===== Flow On — Journal (Hábitos, Daily, Monthly Agenda, Trimestral) ===== */
const STORE_KEY = 'flowon.v2';

const Data = {
  _s: { habits: [], journal: { daily: [], month: { items: [] }, triNotes: '' } },
  load(){
    const raw = localStorage.getItem(STORE_KEY);
    this._s = raw ? JSON.parse(raw) : { habits: [], journal: { daily: [], month: { items: [] }, triNotes: '' } };

    // defaults
    this._s.habits = this._s.habits || [];
    this._s.journal = this._s.journal || { daily: [], month: { items: [] }, triNotes: '' };
    this._s.journal.month = this._s.journal.month || { items: [] };
    this._s.journal.month.items = this._s.journal.month.items || [];
    this._s.journal.daily = this._s.journal.daily || [];
    this._s.journal.triNotes = this._s.journal.triNotes || '';
    this.save();
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* ===== helpers de data (LOCAL) ===== */
const toLocalISO = (date) => {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseLocal = (iso) => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
function daysBack(n=14){
  const end = new Date();
  return [...Array(n)].map((_,i)=> toLocalISO(new Date(end.getFullYear(), end.getMonth(), end.getDate()-i)) );
}
function daysOfMonth(year, monthIndex){ // 0..11
  const last = new Date(year, monthIndex+1, 0).getDate();
  return [...Array(last)].map((_,i)=> toLocalISO(new Date(year, monthIndex, i+1)) );
}
function clampDay(y, m, d){
  const last = new Date(y, m+1, 0).getDate();
  return Math.min(d, last);
}
function nextMonthDate(iso){
  if(!iso) return iso;
  const [y,m,d] = iso.split('-').map(Number);
  const ny = m===12 ? y+1 : y;
  const nm = m===12 ? 1 : m+1;
  const nd = clampDay(ny, nm-1, d);
  return `${ny}-${String(nm).padStart(2,'0')}-${String(nd).padStart(2,'0')}`;
}
function monthNamePT(monthIndex){
  return new Date(2000, monthIndex, 1).toLocaleDateString('pt-BR', { month:'long' });
}

/* ===== Tabs ===== */
function bindTabs(){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll('.tab').forEach(b=> b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p=> p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    };
  });
}

/* ===== Hábitos ===== */
function drawHabits(){
  const box = document.getElementById('habitsList'); box.innerHTML='';
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
        <span><button class="btn small" data-del="${h.id}">Excluir</button></span>
      </div>`;
    row.querySelector('[data-del]').onclick = ()=>{
      s.habits = s.habits.filter(x=>x.id!==h.id); Data.save(); drawHabits();
    };
    box.appendChild(row);
  });
}
function addHabit(){
  const title = prompt('Nome do hábito:'); if(!title) return;
  const s = Data.get(); s.habits.push({id:'h_'+Date.now(), name:title});
  Data.save(); drawHabits();
}

/* ===== Daily Log ===== */
function drawDaily(){
  const s = Data.get();
  const sel = document.getElementById('dailyDate'); sel.innerHTML='';
  const days = daysBack(14).reverse();

  days.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = parseLocal(d).toLocaleDateString('pt-BR');
    if(d===toLocalISO(new Date())) opt.selected = true;
    sel.appendChild(opt);
  });

  function fill(date){
    const reg = s.journal.daily.find(r=>r.date===date);
    document.getElementById('dailyFocus').value = reg?.focus || '';
    document.getElementById('dailyMITs').value  = reg?.mits || '';
    document.getElementById('dailyGrat').value  = reg?.grat || '';
    document.getElementById('dailyMood').value  = reg?.mood || '';
    document.getElementById('dailyNotes').value = reg?.notes || '';
  }

  sel.onchange = ()=> fill(sel.value);
  fill(sel.value);

  document.getElementById('btnSaveDaily').onclick = ()=>{
    const date = sel.value;
    const reg = {
      date,
      focus: document.getElementById('dailyFocus').value.trim(),
      mits : document.getElementById('dailyMITs').value.trim(),
      grat : document.getElementById('dailyGrat').value.trim(),
      mood : Number(document.getElementById('dailyMood').value||0),
      notes: document.getElementById('dailyNotes').value.trim()
    };
    const ix = s.journal.daily.findIndex(r=>r.date===date);
    if(ix>=0) s.journal.daily[ix]=reg; else s.journal.daily.push(reg);
    Data.save();
    drawDailyRecent();
    alert('Daily salvo!');
  };

  drawDailyRecent();
}
function drawDailyRecent(){
  const s = Data.get();
  const box = document.getElementById('dailyRecent'); box.innerHTML='';
  const last = [...s.journal.daily].sort((a,b)=> (a.date<b.date?1:-1)).slice(0,5);
  if(!last.length){ box.innerHTML = `<div class="muted">Sem registros recentes.</div>`; return; }
  last.forEach(r=>{
    const card = document.createElement('div'); card.className='list-day';
    card.innerHTML = `
      <div class="list-day-head">
        <span>${parseLocal(r.date).toLocaleDateString('pt-BR')}</span>
        <span class="muted">Humor: ${r.mood||'—'}</span>
      </div>
      <div class="small">Foco: <b>${r.focus||'—'}</b></div>
      <div class="small">Gratidão: <b>${r.grat||'—'}</b></div>`;
    box.appendChild(card);
  });
}

/* ===== Monthly Log — estado de visualização ===== */
let viewYear  = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0..11
let monthFilter = 'all'; // all | pending | done | moved

function setMonthLabelAndCounters(){
  // Label
  const label = `${monthNamePT(viewMonth)} de ${viewYear}`;
  document.getElementById('monthLabel').textContent = label.charAt(0).toUpperCase() + label.slice(1);

  // Counters
  const s = Data.get();
  const items = s.journal.month.items.filter(it=>{
    const d = parseLocal(it.date);
    return !it.archived && d.getFullYear()===viewYear && d.getMonth()===viewMonth;
  });
  const total = items.length;
  const done  = items.filter(i=>i.done).length;
  const pend  = total - done;
  const moved = items.filter(i=> i.movedFrom && i.movedFrom.year===viewYear && i.movedFrom.month===viewMonth-1).length;
  document.getElementById('monthCounters').innerHTML =
    `Pendentes: <b>${pend}</b> • Concluídos: <b>${done}</b> • Total: <b>${total}</b>`;
}
function goPrevMonth(){
  if(viewMonth===0){ viewMonth=11; viewYear--; } else { viewMonth--; }
  setMonthLabelAndCounters();
  drawMonthList();
}
function goNextMonth(){
  if(viewMonth===11){ viewMonth=0; viewYear++; } else { viewMonth++; }
  setMonthLabelAndCounters();
  drawMonthList();
}

function setMonthFilter(f){
  monthFilter = f;
  document.querySelectorAll('#monthFilters .btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.filter===f);
  });
  drawMonthList();
}

/* ===== Monthly: CRUD ===== */
function addMonthItem(){
  const s = Data.get();
  const title = document.getElementById('mTitle').value.trim();
  const date  = document.getElementById('mDate').value;
  const notes = document.getElementById('mNotes').value.trim();
  if(!title){ alert('Dê um título ao item.'); return; }
  if(!date){ alert('Escolha uma data.'); return; }

  s.journal.month.items.push({
    id: 'm_'+Date.now(),
    title, date, notes, done:false, archived:false
  });
  Data.save();
  document.getElementById('mTitle').value='';
  document.getElementById('mDate').value='';
  document.getElementById('mNotes').value='';
  setMonthLabelAndCounters();
  drawMonthList();
}

function moveAllNextMonth(){
  const s = Data.get();
  let moved = 0;
  s.journal.month.items.forEach(it=>{
    const d = parseLocal(it.date);
    if(!it.done && d.getFullYear()===viewYear && d.getMonth()===viewMonth){
      it.date = nextMonthDate(it.date);
      it.movedAt = Date.now();
      it.movedFrom = { year:viewYear, month:viewMonth }; // guarda de onde veio
      moved++;
    }
  });
  Data.save();
  setMonthLabelAndCounters();
  drawMonthList();

  const banner = document.getElementById('monthBanner');
  if(moved>0){
    // aponta para o mês DESTINO
    const destYear  = viewMonth===11 ? viewYear+1 : viewYear;
    const destMonth = viewMonth===11 ? 0 : viewMonth+1;
    banner.style.display='block';
    banner.innerHTML = `✅ <b>${moved}</b> item(ns) movidos para <b>${monthNamePT(destMonth)} de ${destYear}</b>.
      <button id="jumpNext" class="btn small" style="margin-left:8px">Ir para próximo mês</button>
      <button id="showMoved" class="btn small" style="margin-left:6px">Ver movidos</button>`;
    document.getElementById('jumpNext').onclick = ()=>{ viewYear=destYear; viewMonth=destMonth; setMonthLabelAndCounters(); setMonthFilter('moved'); banner.style.display='none'; };
    document.getElementById('showMoved').onclick = ()=>{ setMonthFilter('moved'); };
  }else{
    banner.style.display='block';
    banner.textContent = 'Nenhum item pendente para mover.';
    setTimeout(()=> banner.style.display='none', 2000);
  }
}

function drawMonthList(){
  const s = Data.get();
  const box = document.getElementById('monthList'); box.innerHTML='';
  const currentMonthDays = daysOfMonth(viewYear, viewMonth);
  const now = Date.now();

  let any = false;
  currentMonthDays.forEach(d=>{
    let items = s.journal.month.items.filter(it=> {
      if(it.archived || it.date!==d) return false;
      const dd = parseLocal(it.date);
      if(dd.getFullYear()!==viewYear || dd.getMonth()!==viewMonth) return false;

      // filtros
      if(monthFilter==='pending' && it.done) return false;
      if(monthFilter==='done'     && !it.done) return false;
      if(monthFilter==='moved'){
        // aparece se veio do mês anterior E chegou nos últimos 48h
        if(!it.movedFrom) return false;
        const fromPrev = (it.movedFrom.year=== (viewMonth===0?viewYear-1:viewYear)) &&
                         (it.movedFrom.month=== (viewMonth===0?11:viewMonth-1));
        const recent   = (now - (it.movedAt||0)) <= 1000*60*60*48;
        return fromPrev || recent;
      }
      return true;
    });

    if(!items.length) return;

    any = true;
    const wrap = document.createElement('div'); wrap.className='list-day';
    wrap.innerHTML = `
      <div class="list-day-head">
        <span>${parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
        <span class="muted">mês</span>
      </div>`;
    const list = document.createElement('div');

    items.forEach(it=>{
      const movedBadge = (it.movedAt && (now - it.movedAt) <= 1000*60*60*48)
        ? `<span class="badge" style="margin-left:6px">recém-movido</span>` : '';

      const row = document.createElement('div'); row.className='small badge';
      row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.margin='4px 0 0';
      row.innerHTML = `
        <span>${it.title} ${movedBadge}</span>
        <span style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn small" data-done="${it.id}">${it.done?'Desmarcar':'Concluir'}</button>
          <button class="btn small" data-move="${it.id}">Mover p/ próximo mês</button>
          <button class="btn small" data-edit="${it.id}">Editar</button>
          <button class="btn small" data-del="${it.id}">Excluir</button>
        </span>`;

      row.querySelector('[data-done]').onclick = ()=>{
        it.done = !it.done; Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-move]').onclick = ()=>{
        it.date = nextMonthDate(it.date);
        it.movedAt = Date.now();
        it.movedFrom = { year:viewYear, month:viewMonth };
        Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-edit]').onclick = ()=>{
        const nt = prompt('Título', it.title||'') ?? it.title;
        if(nt===null) return;
        const nd = prompt('Data (AAAA-MM-DD)', it.date||'') ?? it.date;
        if(nd===null) return;
        const nn = prompt('Notas', it.notes||'') ?? it.notes;
        it.title = String(nt).trim(); it.date = String(nd); it.notes = String(nn);
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
        notes.style.margin='4px 0 0 0';
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

/* ===== Trimestral ===== */
function saveTri(){
  const s = Data.get();
  s.journal.triNotes = document.getElementById('triNotes').value;
  Data.save(); alert('Trimestral salvo!');
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  bindTabs();
  Data.load();

  // Hábitos
  drawHabits();
  document.getElementById('btnAddHabit').onclick = addHabit;

  // Daily
  drawDaily();

  // Monthly
  document.getElementById('btnAddMonthItem').onclick = addMonthItem;
  document.getElementById('btnMoveAllNextMonth').onclick = moveAllNextMonth;
  document.getElementById('btnPrevMonth').onclick = goPrevMonth;
  document.getElementById('btnNextMonth').onclick = goNextMonth;
  document.querySelectorAll('#monthFilters .btn').forEach(b=>{
    b.onclick = ()=> setMonthFilter(b.dataset.filter);
  });
  setMonthLabelAndCounters();
  setMonthFilter('all'); // também desenha a lista

  // Trimestral
  document.getElementById('btnSaveTri').onclick = saveTri;
  document.getElementById('triNotes').value = Data.get().journal.triNotes || '';
});
