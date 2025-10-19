/* Flow On — Daily Log (v2)  ----------------------------------------------
   - Salvar/editar/excluir registros diários
   - Últimos 3 registros + lista do mês atual
   - Toggle "Ver todos do mês / Ocultar"
   - Usa window.Data do core.js; há fallback se não existir
-------------------------------------------------------------------------*/

// ---------- Data (fallback se core.js não estiver presente) -------------
(function ensureData(){
  if(!window.Data){
    const KEY = 'flowon';
    window.Data = {
      _s:null,
      load(){ try{ this._s = JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ this._s={}; } },
      save(){ localStorage.setItem(KEY, JSON.stringify(this._s||{})); },
      get(){ if(!this._s) this.load(); return this._s; }
    };
    console.warn('[daily] Data fallback ativo.');
  }
})();

function J(){
  const s = Data.get();
  s.journal ||= {};
  s.journal.daily ||= { byDate:{} };
  return s;
}

// ---------- Helpers ------------------------------------------------------
function todayISO(){
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString().slice(0,10);
}
function addDaysISO(iso, n){
  const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
function monthKey(iso){ const d=new Date(iso+'T00:00:00'); return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`; }
function toBR(iso){ return new Date(iso+'T00:00:00').toLocaleDateString('pt-BR'); }

function populateDateOptions(){
  const sel = document.getElementById('dailyDate');
  if(!sel) return;

  const s = J();
  const existing = Object.keys(s.journal.daily.byDate || {});
  const baseStart = addDaysISO(todayISO(), -29); // últimos 30 dias
  const dates = new Set();

  for(let i=0;i<30;i++){ dates.add(addDaysISO(baseStart, i)); }
  existing.forEach(d=>dates.add(d));

  const arr = Array.from(dates).sort().reverse(); // mais recentes no topo
  sel.innerHTML = '';
  arr.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = toBR(d);
    sel.appendChild(opt);
  });

  // Seleciona hoje por padrão
  const t = todayISO();
  sel.value = arr.includes(t) ? t : arr[0];
}

// ---------- Form utils ---------------------------------------------------
function readForm(){
  return {
    date: (document.getElementById('dailyDate').value || todayISO()),
    focus: (document.getElementById('dailyFocus').value || '').trim(),
    mits:  (document.getElementById('dailyMITs').value || '').trim(),
    gratitude: (document.getElementById('dailyGrat').value || '').trim(),
    mood: Number(document.getElementById('dailyMood').value || 0) || null,
    notes: (document.getElementById('dailyNotes').value || '').trim(),
    ts: Date.now()
  };
}
function fillForm(d, rec){
  document.getElementById('dailyDate').value = d;
  document.getElementById('dailyFocus').value = rec?.focus || '';
  document.getElementById('dailyMITs').value = rec?.mits || '';
  document.getElementById('dailyGrat').value = rec?.gratitude || '';
  document.getElementById('dailyMood').value = rec?.mood ?? '';
  document.getElementById('dailyNotes').value = rec?.notes || '';
}
function clearForm(){
  document.getElementById('dailyFocus').value = '';
  document.getElementById('dailyMITs').value = '';
  document.getElementById('dailyGrat').value = '';
  document.getElementById('dailyMood').value = '';
  document.getElementById('dailyNotes').value = '';
}

// ---------- CRUD ---------------------------------------------------------
function saveDaily(){
  const s = J();
  const r = readForm();
  s.journal.daily.byDate[r.date] = {
    focus:r.focus, mits:r.mits, gratitude:r.gratitude, mood:r.mood, notes:r.notes, ts:r.ts
  };
  Data.save();
  renderDailyRecent();
  renderDailyMonth();
  alert('Daily salvo!');
}

function loadDailyIntoForm(dateISO){
  const s = J();
  const rec = s.journal.daily.byDate[dateISO] || null;
  fillForm(dateISO, rec);
}

function deleteDaily(dateISO){
  const s = J();
  if(!s.journal.daily.byDate[dateISO]) return;
  delete s.journal.daily.byDate[dateISO];
  Data.save();

  // se estava no formulário, limpa
  if(document.getElementById('dailyDate').value === dateISO){
    clearForm();
  }
  // repopula datas (pode ter sumido do select) e seleciona hoje
  populateDateOptions();
  document.getElementById('dailyDate').value = todayISO();

  renderDailyRecent();
  renderDailyMonth();
}

// ---------- Render: Últimos 3 -------------------------------------------
function renderDailyRecent(){
  const wrap = document.getElementById('dailyRecent');
  if(!wrap) return;
  const s = J();

  const entries = Object.entries(s.journal.daily.byDate)
    .sort((a,b)=> b[0].localeCompare(a[0])) // data desc
    .slice(0,3);

  wrap.innerHTML = '';
  if(entries.length===0){
    wrap.innerHTML = `<div class="empty">Sem registros recentes.</div>`;
    return;
  }

  entries.forEach(([date, rec])=>{
    const card = document.createElement('div');
    card.className = 'item';
    card.innerHTML = `
      <div>
        <strong>${toBR(date)}</strong>
        <div class="muted">Humor: ${rec.mood ?? '—'}</div>
        <div style="margin-top:6px">
          <div>Foco: ${rec.focus || '—'}</div>
          <div>Gratidão: ${rec.gratitude || '—'}</div>
          ${rec.mits ? `<div>MITs: ${rec.mits}</div>` : ''}
        </div>
      </div>
      <div class="flex">
        <button class="btn small" data-act="edit" data-date="${date}">Editar</button>
        <button class="btn small danger" data-act="del" data-date="${date}">Excluir</button>
      </div>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('[data-act="edit"]').forEach(b=>{
    b.onclick = ()=>{ loadDailyIntoForm(b.dataset.date); window.scrollTo({top:0,behavior:'smooth'}); };
  });
  wrap.querySelectorAll('[data-act="del"]').forEach(b=>{
    b.onclick = ()=>{ if(confirm('Excluir este registro diário?')) deleteDaily(b.dataset.date); };
  });
}

// ---------- Render: Mês atual -------------------------------------------
function renderDailyMonth(){
  const wrap = document.getElementById('dailyMonthList');
  if(!wrap) return;
  const s = J();

  const nowKey = monthKey(todayISO());
  const entries = Object.entries(s.journal.daily.byDate)
    .filter(([d])=> monthKey(d) === nowKey)
    .sort((a,b)=> b[0].localeCompare(a[0]));

  wrap.innerHTML = '';
  if(entries.length===0){
    wrap.innerHTML = `<div class="empty">Sem registros neste mês.</div>`;
    return;
  }

  entries.forEach(([date, rec])=>{
    const card = document.createElement('div');
    card.className = 'item';
    card.innerHTML = `
      <div>
        <strong>${toBR(date)}</strong>
        <div class="muted">Humor: ${rec.mood ?? '—'}</div>
        <div style="margin-top:6px">
          <div>Foco: ${rec.focus || '—'}</div>
          <div>Gratidão: ${rec.gratitude || '—'}</div>
          ${rec.mits ? `<div>MITs: ${rec.mits}</div>` : ''}
        </div>
      </div>
      <div class="flex">
        <button class="btn small" data-act="edit" data-date="${date}">Editar</button>
        <button class="btn small danger" data-act="del" data-date="${date}">Excluir</button>
      </div>
    `;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('[data-act="edit"]').forEach(b=>{
    b.onclick = ()=>{ loadDailyIntoForm(b.dataset.date); window.scrollTo({top:0,behavior:'smooth'}); };
  });
  wrap.querySelectorAll('[data-act="del"]').forEach(b=>{
    b.onclick = ()=>{ if(confirm('Excluir este registro diário?')) deleteDaily(b.dataset.date); };
  });
}

// ---------- Toggle "Ver todos do mês" -----------------------------------
function bindToggle(){
  const btn = document.getElementById('btnToggleDailyMonth');
  const box = document.getElementById('dailyMonth');
  if(!btn || !box) return;

  btn.onclick = ()=>{
    const open = box.style.display !== 'none';
    box.style.display = open ? 'none' : 'block';
    btn.textContent = open ? 'Ver todos do mês' : 'Ocultar';
  };
}

// ---------- Bind salvar + carregar --------------------------------------
function bindSave(){
  const btn = document.getElementById('btnSaveDaily');
  if(!btn) return;
  btn.onclick = saveDaily;
}

function bindDateChange(){
  const sel = document.getElementById('dailyDate');
  if(!sel) return;
  sel.onchange = ()=>{
    const d = sel.value;
    const s = J();
    const rec = s.journal.daily.byDate[d] || null;
    fillForm(d, rec);
  };
}

// ---------- Boot ---------------------------------------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  try{ Data.load(); }catch(e){}
  populateDateOptions();
  // carrega hoje se existir
  const t = todayISO();
  const s = J();
  if(s.journal.daily.byDate[t]) fillForm(t, s.journal.daily.byDate[t]);

  bindSave();
  bindToggle();
  bindDateChange();

  renderDailyRecent();
  renderDailyMonth();
  console.log('[daily] pronto');
});

