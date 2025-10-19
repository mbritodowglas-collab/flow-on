/* ===== Página: Trimestral ===== */
let triYear = new Date().getFullYear();
let triQ    = getQuarterFromDate(new Date());

function drawTriHeaderAndNotes(){
  document.getElementById('triLabel').textContent = quarterLabel(triYear, triQ);
  const key = quarterKey(triYear, triQ);
  const s = Data.get();
  document.getElementById('triNotes').value = s.journal.tri.byQuarter[key] || '';
}
function saveTri(){
  const s = Data.get();
  const key = quarterKey(triYear, triQ);
  s.journal.tri.byQuarter[key] = document.getElementById('triNotes').value;
  Data.save(); alert('Trimestre salvo!');
}
function triPrev(){ const r=prevQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triNext(){ const r=nextQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triToday(){ const n=new Date(); triYear=n.getFullYear(); triQ=getQuarterFromDate(n); drawTriHeaderAndNotes(); }

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  document.getElementById('btnTriPrev').onclick = triPrev;
  document.getElementById('btnTriNext').onclick = triNext;
  document.getElementById('btnTriToday').onclick = triToday;
  document.getElementById('btnSaveTri').onclick = saveTri;
  drawTriHeaderAndNotes();
});
