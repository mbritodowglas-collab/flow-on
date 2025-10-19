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

/* utils datas locais */
const toLocalISO = (date) => {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,'0'), d = String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
};
const parseLocal = (iso) => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
function daysBack(n=14){
  const end = new Date();
  return [...Array(n)].map((_,i)=> toLocalISO(new Date(end.getFullYear(), end.getMonth(), end.getDate()-i)) );
}
function daysOfMonth(date=new Date()){
  const y = date.getFullYear(), m = date.getMonth();
  const last = new Date(y, m+1, 0).getDate();
  return [...Array(last)].map((_,i)=> toLocalISO(new Date(y, m, i+1)) );
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

/* ===== Monthly Log — Agenda do mês ===== */
let monthFilter = 'all'; // all | pending | done

function setMonthFilter(f){
  monthFilter = f;
  // atualizar estilo ativo
  document.querySelectorAll('#monthFilters .btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.filter===f);
  });
  drawMonthList();
}

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
  drawMonthList();
}

function moveAllNextMonth(){
  const s = Data.get();
  const month = new Date().getMonth();
  const year  = new Date().getFullYear();
  // só pendentes do mês atual
  s.journal.month.items.forEach(it=>{
    const d = parseLocal(it.date);
    if(!it.done && d.getMonth()===month && d.getFullYear()===year){
      it.date = nextMonthDate(it.date);
    }
  });
  Data.save();
  drawMonthList();
  alert('Pendentes movidos para o próximo mês.');
}

function drawMonthList(){
  const s = Data.get();
  const box = document.getElementById('monthList'); box.innerHTML='';
  const currentMonthDays = daysOfMonth(new Date());

  let any = false;
  currentMonthDays.forEach(d=>{
    let items = s.journal.month.items.filter(it=> !it.archived && it.date===d);
    if(monthFilter==='pending') items = items.filter(it=> !it.done);
    if(monthFilter==='done')     items = items.filter(it=>  it.done);

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
      const row = document.createElement('div'); row.className='small badge';
      row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.margin='4px 0 0';
      row.innerHTML = `
        <span>${it.title}</span>
        <span style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn small" data-done="${it.id}">${it.done?'Desmarcar':'Concluir'}</button>
          <button class="btn small" data-move="${it.id}">Mover p/ próximo mês</button>
          <button class="btn small" data-edit="${it.id}">Editar</button>
          <button class="btn small" data-del="${it.id}">Excluir</button>
        </span>`;

      row.querySelector('[data-done]').onclick = ()=>{
        it.done = !it.done; Data.save(); drawMonthList();
      };
      row.querySelector('[data-move]').onclick = ()=>{
        it.date = nextMonthDate(it.date); Data.save(); drawMonthList();
      };
      row.querySelector('[data-edit]').onclick = ()=>{
        const nt = prompt('Título', it.title||'') ?? it.title;
        if(nt===null) return;
        const nd = prompt('Data (AAAA-MM-DD)', it.date||'') ?? it.date;
        if(nd===null) return;
        const nn = prompt('Notas', it.notes||'') ?? it.notes;
        it.title = String(nt).trim(); it.date = String(nd); it.notes = String(nn);
        Data.save(); drawMonthList();
      };
      row.querySelector('[data-del]').onclick = ()=>{
        if(confirm('Excluir item do mês?')){
          s.journal.month.items = s.journal.month.items.filter(x=>x.id!==it.id);
          Data.save(); drawMonthList();
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
  document.querySelectorAll('#monthFilters .btn').forEach(b=>{
    b.onclick = ()=> setMonthFilter(b.dataset.filter);
  });
  setMonthFilter('all'); // inicia e desenha lista

  // Trimestral
  document.getElementById('btnSaveTri').onclick = saveTri;
  document.getElementById('triNotes').value = Data.get().journal.triNotes || '';
});
