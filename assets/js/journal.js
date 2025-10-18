/* ====== Flow On — Journal ====== */
const STORE_KEY = 'flowon.v1';
const Data = {
  _s: { habits: [], journal: { daily: [] }, themes: [] },
  load(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if(raw) this._s = JSON.parse(raw);
      // seeds
      if(!this._s.habits?.length){
        this._s.habits = [
          {id:'h1', name:'Planejar dia anterior'},
          {id:'h2', name:'Treinar'},
          {id:'h3', name:'Meditar 5 min'}
        ];
      }
      if(!this._s.journal) this._s.journal = { daily: [] };
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

/* utils */
const toISO = d => new Date(d).toISOString().slice(0,10);
function weekRange(date){
  const d = new Date(date); const day = (d.getDay()+6)%7; // seg=0
  const monday = new Date(d); monday.setDate(d.getDate()-day);
  return [...Array(7)].map((_,i)=>{ const x = new Date(monday); x.setDate(monday.getDate()+i); return toISO(x) });
}
function weekKey(date=new Date()){
  const d=new Date(date); const onejan=new Date(d.getFullYear(),0,1);
  const week=Math.ceil((((d-onejan)/86400000)+onejan.getDay()+1)/7);
  return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
}

/* nav tabs */
function setupTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-view').forEach(v=>v.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
      if(btn.dataset.tab==='monthly') renderMonthly();
      if(btn.dataset.tab==='daily') renderDailyList();
      if(btn.dataset.tab==='habits') renderHabits();
    });
  });
}

/* HABITS */
function renderHabits(){
  const s = Data.get(); const wk = weekKey();
  const dates = weekRange(new Date());
  const box = document.getElementById('habitsTable');
  box.innerHTML = '';

  s.habits.forEach(h=>{
    h.checks = h.checks || {}; h.checks[wk] = h.checks[wk] || Array(7).fill(false);
    const row = document.createElement('div'); row.className = 'h-row';
    const left = document.createElement('div'); left.className = 'h-name'; left.textContent = h.name;
    const right = document.createElement('div'); right.className = 'h-dots';

    h.checks[wk].forEach((v,i)=>{
      const b = document.createElement('button');
      b.className = 'ring-dot'+(v?' done':''); b.title = dates[i];
      b.addEventListener('click', ()=>{ h.checks[wk][i]=!h.checks[wk][i]; Data.save(); renderHabits(); });
      right.appendChild(b);
    });

    const pct = Math.round(100 * h.checks[wk].filter(Boolean).length / 7);
    const pctEl = document.createElement('div'); pctEl.className='h-pct'; pctEl.textContent = pct+'%';
    const wrap = document.createElement('div'); wrap.style.display='flex'; wrap.style.gap='8px'; wrap.style.alignItems='center';
    wrap.appendChild(right); wrap.appendChild(pctEl);

    row.appendChild(left); row.appendChild(wrap);
    box.appendChild(row);
  });

  document.getElementById('btnAddHabit').onclick = ()=>{
    const name = prompt('Nome do hábito:');
    if(!name) return;
    s.habits.push({ id:'h_'+Date.now(), name });
    Data.save(); renderHabits();
  };
}

/* DAILY */
function initDailyForm(){
  const d = toISO(new Date());
  document.getElementById('dlDate').value = d;
  document.getElementById('btnSaveDaily').onclick = ()=>{
    const s = Data.get();
    const date = document.getElementById('dlDate').value || toISO(new Date());
    const item = {
      date,
      focus: document.getElementById('dlFocus').value,
      mits: document.getElementById('dlMITs').value,
      gratidao: document.getElementById('dlGratidao').value,
      mood: Number(document.getElementById('dlMood').value || 0),
      notes: document.getElementById('dlNotes').value
    };
    const ix = s.journal.daily.findIndex(x=>x.date===date);
    if(ix>=0) s.journal.daily[ix]=item; else s.journal.daily.push(item);
    Data.save(); renderDailyList(); alert('Daily salvo!');
  };
}
function renderDailyList(){
  const s = Data.get();
  const box = document.getElementById('dailyList'); box.innerHTML='';
  const last = s.journal.daily.slice(-7).reverse();
  if(!last.length){ box.innerHTML = `<div class="muted">Sem registros ainda.</div>`; return; }
  last.forEach(d=>{
    const card = document.createElement('div'); card.className='list-day';
    card.innerHTML = `
      <div class="list-day-head">
        <span>${new Date(d.date).toLocaleDateString('pt-BR')}</span>
        <span class="muted">Humor: ${d.mood||'—'}</span>
      </div>
      <div class="small">Foco: ${d.focus||'—'}</div>
      <div class="muted small">Gratidão: ${d.gratidao||'—'}</div>
    `;
    box.appendChild(card);
  });
}

/* MONTHLY */
function renderMonthly(){
  const s = Data.get();
  const thisMonth = new Date().toISOString().slice(0,7);
  const monthDailies = s.journal.daily.filter(d=> (d.date||'').startsWith(thisMonth));
  const moods = monthDailies.map(d=>d.mood).filter(Boolean);
  const avg = moods.length? (moods.reduce((a,b)=>a+b,0)/moods.length).toFixed(1) : '—';

  const counts = {};
  monthDailies.forEach(d=>{
    (d.gratidao||'').split(/;|,|\n/).map(x=>x.trim()).filter(Boolean)
      .forEach(g=>{ counts[g]=(counts[g]||0)+1 });
  });
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const box = document.getElementById('monthlySummary');
  const pills = top.length
    ? top.map(([k,v])=> `<span class="pill">${k} <span class="muted">(x${v})</span></span>`).join('')
    : `<span class="muted">Sem registros de gratidão ainda.</span>`;
  box.innerHTML = `
    <div class="small" style="margin-bottom:6px">Humor médio do mês: <b>${avg}</b></div>
    <div><div class="small" style="opacity:.8;margin-bottom:4px">Marcos de Gratidão (Top 5)</div>${pills}</div>
  `;
}

/* QUARTER */
function initQuarter(){ /* campos livres — mantidos no DOM; se quiser, podemos salvar aqui também depois */ }

/* boot */
document.addEventListener('DOMContentLoaded', ()=>{
  // marca menu ativo
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === './' || a.getAttribute('href')?.endsWith('/journal/'));
  });

  Data.load();
  setupTabs();
  renderHabits();
  initDailyForm();
  renderDailyList();
  renderMonthly();
  initQuarter();
});
