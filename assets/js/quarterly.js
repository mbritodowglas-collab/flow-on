/* ===== Página: Trimestral ===== */
let triYear = new Date().getFullYear();
let triQ    = Math.floor(new Date().getMonth()/3)+1; // 1..4

function quarterKey(year, q){ return `${year}-T${q}`; }
function quarterLabel(year,q){ return `T${q} de ${year}`; }
function prevQuarter(year,q){ return q===1 ? {year:year-1, q:4} : {year, q:q-1}; }
function nextQuarter(year,q){ return q===4 ? {year:year+1, q:1} : {year, q:q+1}; }

function drawTriHeaderAndNotes(){
  const label = document.getElementById('triLabel');
  if (!label) return; // proteção caso HTML não carregue
  label.textContent = quarterLabel(triYear, triQ);

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
  Data.save();
  alert('Trimestre salvo!');
}

function triPrev(){ const r=prevQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triNext(){ const r=nextQuarter(triYear, triQ); triYear=r.year; triQ=r.q; drawTriHeaderAndNotes(); }
function triToday(){ const n=new Date(); triYear=n.getFullYear(); triQ=Math.floor(n.getMonth()/3)+1; drawTriHeaderAndNotes(); }

document.addEventListener('DOMContentLoaded', ()=>{
  console.log('Quarterly JS carregado'); // diagnóstico
  Data.load();

  const prevBtn = document.getElementById('btnTriPrev');
  const nextBtn = document.getElementById('btnTriNext');
  const todayBtn= document.getElementById('btnTriToday');
  const saveBtn = document.getElementById('btnSaveTri');

  if (prevBtn) prevBtn.onclick = triPrev;
  if (nextBtn) nextBtn.onclick = triNext;
  if (todayBtn) todayBtn.onclick = triToday;
  if (saveBtn)  saveBtn.onclick  = saveTri;

  drawTriHeaderAndNotes();
});
