/* ===== Página: Trimestral ===== */
let triYear = new Date().getFullYear();
let triQ    = Math.floor(new Date().getMonth()/3)+1; // 1..4

function quarterKey(year, q){ return `${year}-T${q}`; }
function quarterLabel(year,q){ return `T${q} de ${year}`; }
function prevQuarter(year,q){ return q===1 ? {year:year-1, q:4} : {year, q:q-1}; }
function nextQuarter(year,q){ return q===4 ? {year:year+1, q:1} : {year, q:q+1}; }

function drawTriHeaderAndNotes(){
  document.getElementById('triLabel').textContent = quarterLabel(triYear, triQ);
  const key = quarterKey(triYear, triQ);
  const s = Data.get();
  s.journal ||= {};
  s.journal.tri ||= { byQuarter:{} };
  s.journal.tri.byQuarter ||= {};
  document.getElementById('triNotes').value = s.journal.tri.byQuarter[key] || '';
}
function saveTri(){
  const s = Data.get();
  const key = quarterKey(triYear, triQ);
  s.journal ||= {};
  s.journal.tri ||= { byQuarter:{} };
  s.journal.tri.byQuarter ||= {};
  s.journal.tri.byQuarter[key] = document.getElementById('triNotes').value;
  Data.save(); alert('Trimestre salvo!');
}
function triPrev(){ const r=prevQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triNext(){ const r=nextQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triToday(){ const n=new Date(); triYear=n.getFullYear(); triQ=Math.floor(n.getMonth()/3)+1; drawTriHeaderAndNotes(); }

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  document.getElementById('btnTriPrev').onclick = triPrev;
  document.getElementById('btnTriNext').onclick = triNext;
  document.getElementById('btnTriToday').onclick = triToday;
  document.getElementById('btnSaveTri').onclick = saveTri;
  drawTriHeaderAndNotes();
});
