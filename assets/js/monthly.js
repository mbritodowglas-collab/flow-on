/* ===== Página: Monthly ===== */
let viewYear  = new Date().getFullYear();
let viewMonth = new Date().getMonth(); // 0..11
let monthFilter = 'all';

function setMonthLabelAndCounters(){
  document.getElementById('monthLabel').textContent = `${monthNamePTFull(viewMonth)} de ${viewYear}`;

  // preencher selects jump (uma vez)
  const ySel = document.getElementById('jumpYear');
  if(ySel && !ySel.childElementCount){
    const cur = new Date().getFullYear();
    for(let y=cur-5;y<=cur+5;y++){
      const o=document.createElement('option'); o.value=y; o.textContent=y; ySel.appendChild(o);
    }
  }
  if(ySel) ySel.value = String(viewYear);
  const mSel=document.getElementById('jumpMonth'); if(mSel) mSel.value=String(viewMonth);

  const s=Data.get();
  const items = s.journal.month.items.filter(it=>{
    const d = parseLocal(it.date);
    return !it.archived && d.getFullYear()===viewYear && d.getMonth()===viewMonth;
  });
  const total=items.length, done=items.filter(i=>i.done).length, pend=total-done;
  document.getElementById('monthCounters').innerHTML = `Pendentes: <b>${pend}</b> • Concluídos: <b>${done}</b> • Total: <b>${total}</b>`;
}
function goPrevMonth(){ if(viewMonth===0){ viewMonth=11; viewYear--; } else viewMonth--; setMonthLabelAndCounters(); drawMonthList(); }
function goNextMonth(){ if(viewMonth===11){ viewMonth=0; viewYear++; } else viewMonth++; setMonthLabelAndCounters(); drawMonthList(); }
function jumpToSelected(){ viewYear=Number(document.getElementById('jumpYear').value); viewMonth=Number(document.getElementById('jumpMonth').value); setMonthLabelAndCounters(); drawMonthList(); }
function jumpToToday(){ const n=new Date(); viewYear=n.getFullYear(); viewMonth=n.getMonth(); setMonthLabelAndCounters(); drawMonthList(); }
function setMonthFilter(f){ monthFilter=f; document.querySelectorAll('#monthFilters .btn').forEach(b=> b.classList.toggle('active', b.dataset.filter===f)); drawMonthList(); }

function addMonthItem(){
  const s=Data.get();
  const title=document.getElementById('mTitle').value.trim();
  const date=document.getElementById('mDate').value;
  const notes=document.getElementById('mNotes').value.trim();
  if(!title) return alert('Dê um título.'); if(!date) return alert('Escolha a data.');
  s.journal.month.items.push({id:'m_'+Date.now(), title, date, notes, done:false, archived:false});
  Data.save();
  document.getElementById('mTitle').value=''; document.getElementById('mDate').value=''; document.getElementById('mNotes').value='';
  setMonthLabelAndCounters(); drawMonthList();
}
function moveAllNextMonth(){
  const s=Data.get(); let moved=0;
  s.journal.month.items.forEach(it=>{
    const d=parseLocal(it.date);
    if(!it.done && d.getFullYear()===viewYear && d.getMonth()===viewMonth){
      it.date = nextMonthDate(it.date);
      it.movedAt=Date.now();
      it.movedFrom={year:viewYear, month:viewMonth};
      moved++;
    }
  });
  Data.save(); setMonthLabelAndCounters(); drawMonthList();
  if(moved>0) alert(`${moved} item(ns) movidos.`);
}
function drawMonthList(){
  const s=Data.get();
  const box=document.getElementById('monthList'); box.innerHTML='';
  const currentMonthDays=daysOfMonth(viewYear, viewMonth);
  let any=false;

  currentMonthDays.forEach(d=>{
    const items=s.journal.month.items.filter(it=>{
      if(it.archived) return false;
      const dd=parseLocal(it.date);
      if(dd.getFullYear()!==viewYear || dd.getMonth()!==viewMonth) return false;
      if(it.date!==d) return false;
      if(monthFilter==='pending' && it.done) return false;
      if(monthFilter==='done' && !it.done) return false;
      return true;
    });
    if(!items.length) return;

    any=true;
    const wrap=document.createElement('div'); wrap.className='list-day';
    wrap.innerHTML=`<div class="list-day-head">
      <span>${parseLocal(d).toLocaleDateString('pt-BR',{weekday:'short', day:'2-digit'})}</span>
      <span class="muted">mês</span>
    </div>`;
    const list=document.createElement('div');

    items.forEach(it=>{
      const row=document.createElement('div'); row.className='small badge';
      row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.margin='4px 0';
      row.innerHTML=`
        <span>${it.title}</span>
        <span style="display:flex; gap:6px; flex-wrap:wrap">
          <button class="btn small" data-done="${it.id}">${it.done?'Desmarcar':'Concluir'}</button>
          <button class="btn small" data-move="${it.id}">Mover</button>
          <button class="btn small" data-edit="${it.id}">Editar</button>
          <button class="btn small" data-del="${it.id}">Excluir</button>
        </span>`;
      row.querySelector('[data-done]').onclick=()=>{ it.done=!it.done; Data.save(); setMonthLabelAndCounters(); drawMonthList(); };
      row.querySelector('[data-move]').onclick=()=>{ it.date=nextMonthDate(it.date); Data.save(); setMonthLabelAndCounters(); drawMonthList(); };
      row.querySelector('[data-edit]').onclick=()=>{
        const nt=prompt('Título', it.title??'') ?? it.title; if(nt===null) return;
        const nd=prompt('Data (AAAA-MM-DD)', it.date??'') ?? it.date; if(nd===null) return;
        const nn=prompt('Notas', it.notes??'') ?? it.notes;
        it.title=String(nt).trim(); it.date=String(nd); it.notes=String(nn||''); Data.save(); setMonthLabelAndCounters(); drawMonthList();
      };
      row.querySelector('[data-del]').onclick=()=>{
        if(confirm('Excluir item?')){ s.journal.month.items=s.journal.month.items.filter(x=>x.id!==it.id); Data.save(); setMonthLabelAndCounters(); drawMonthList(); }
      };
      list.appendChild(row);
      if(it.notes){
        const notes=document.createElement('div'); notes.className='small'; notes.style.margin='4px 0 0'; notes.style.opacity='.8'; notes.textContent=it.notes;
        list.appendChild(notes);
      }
    });

    wrap.appendChild(list); box.appendChild(wrap);
  });

  if(!any) box.innerHTML=`<div class="muted">Sem itens neste filtro/mês. Adicione acima.</div>`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  document.getElementById('btnPrevMonth').onclick=goPrevMonth;
  document.getElementById('btnNextMonth').onclick=goNextMonth;
  document.getElementById('btnJump').onclick=jumpToSelected;
  document.getElementById('btnToday').onclick=jumpToToday;
  document.getElementById('btnAddMonthItem').onclick=addMonthItem;
  document.getElementById('btnMoveAllNextMonth').onclick=moveAllNextMonth;
  document.querySelectorAll('#monthFilters .btn').forEach(b=> b.onclick=()=> setMonthFilter(b.dataset.filter));
  setMonthLabelAndCounters(); drawMonthList();
});
