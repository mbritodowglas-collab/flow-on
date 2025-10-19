/* ===== Página: Daily ===== */
function fillDailyForm(date){
  const s = Data.get();
  const reg = s.journal.daily.find(r=>r.date===date);
  document.getElementById('dailyDate').value = date;
  document.getElementById('dailyFocus').value = reg?.focus || '';
  document.getElementById('dailyMITs').value  = reg?.mits || '';
  document.getElementById('dailyGrat').value  = reg?.grat || '';
  document.getElementById('dailyMood').value  = reg?.mood || '';
  document.getElementById('dailyNotes').value = reg?.notes || '';
  document.getElementById('tab-daily').scrollIntoView({behavior:'smooth', block:'start'});
}
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

  sel.onchange = ()=> fillDailyForm(sel.value);
  fillDailyForm(sel.value);

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
    if(document.getElementById('dailyMonth').style.display!=='none') drawDailyMonthList();
    alert('Daily salvo!');
  };

  document.getElementById('btnToggleDailyMonth').onclick = ()=>{
    const wrap = document.getElementById('dailyMonth');
    const open = wrap.style.display !== 'none';
    wrap.style.display = open ? 'none' : 'block';
    document.getElementById('btnToggleDailyMonth').textContent = open ? 'Ver todos do mês' : 'Ocultar';
    if(!open) drawDailyMonthList();
  };

  drawDailyRecent();
}
function drawDailyRecent(){
  const s = Data.get();
  const box = document.getElementById('dailyRecent'); box.innerHTML='';
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
  const box = document.getElementById('dailyMonthList'); box.innerHTML='';
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

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  drawDaily();
});
