/* ===== Flow On — Reports (Mensal / Trimestral) ===== */
const STORE_KEY = 'flowon.v2';

function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  if(!raw) return { habits:[], journal:{ daily:[], month:{items:[]}, tri:{byQuarter:{}} } };
  const s = JSON.parse(raw);
  s.habits = s.habits || [];
  s.journal = s.journal || { daily:[], month:{items:[]}, tri:{byQuarter:{}} };
  s.journal.month = s.journal.month || { items:[] };
  s.journal.month.items = s.journal.month.items || [];
  s.journal.daily = s.journal.daily || [];
  if(!s.journal.tri) s.journal.tri = { byQuarter:{} };
  s.journal.tri.byQuarter = s.journal.tri.byQuarter || {};
  return s;
}

function monthNamePT(m){ return new Date(2000, m, 1).toLocaleDateString('pt-BR',{month:'long'}); }
function toISO(d){ const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), da=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`; }
function parseISO(s){ const [y,m,d]=s.split('-').map(Number); return new Date(y,(m||1)-1,d||1); }
function sameMonth(a,b){ a=parseISO(a); b=parseISO(b); return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth(); }
function qRange(year, q){ const startMonth=(q-1)*3; const start=new Date(year,startMonth,1); const end=new Date(year,startMonth+3,0); return {start,end}; }
function quarterKey(y,q){ return `${y}-T${q}`; }
function avg(nums){ if(!nums.length) return 0; return (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2); }
function dl(filename, text){ const blob=new Blob([text],{type:'text/plain;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
async function copy(text){ if(navigator.clipboard?.writeText) await navigator.clipboard.writeText(text); }
function openNew(url){ window.open(url,'_blank','noopener'); }

function tabBind(){
  document.querySelectorAll('.tab').forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('tab-'+b.dataset.tab).classList.add('active');
    };
  });
}

function fillYearSelects(){
  const cur=new Date().getFullYear();
  const years = []; for(let y=cur-5;y<=cur+5;y++) years.push(y);
  const y1=document.getElementById('rYear'), y2=document.getElementById('qYear');
  years.forEach(y=>{
    const o1=document.createElement('option'); o1.value=y; o1.textContent=y; y1.appendChild(o1);
    const o2=document.createElement('option'); o2.value=y; o2.textContent=y; y2.appendChild(o2);
  });
  y1.value=String(cur); y2.value=String(cur);
  document.getElementById('rMonth').value=String(new Date().getMonth());
  document.getElementById('qQuarter').value=String(Math.floor(new Date().getMonth()/3)+1);
}

/* ---------- RELATÓRIO MENSAL ---------- */
function buildMonthlyReport(year, month){
  const s = loadState();
  const header = `# Relatório Mensal — ${monthNamePT(month)} de ${year}\n`;
  const dailies = s.journal.daily.filter(r=>{
    const rd=parseISO(r.date); return rd.getFullYear()===year && rd.getMonth()===month;
  }).sort((a,b)=> a.date<b.date? -1:1);
  const moodAvg = avg(dailies.filter(r=>r.mood).map(r=>Number(r.mood)));
  const items = s.journal.month.items.filter(it=>{
    const dt=parseISO(it.date); return dt.getFullYear()===year && dt.getMonth()===month;
  }).sort((a,b)=> a.date<b.date? -1:1);
  const done = items.filter(i=>i.done).length;
  const habits = s.habits.map(h=>`- ${h.name}`).join('\n') || '—';

  let md = `${header}
**Resumo**
- Entradas no Daily: **${dailies.length}**
- Humor médio: **${moodAvg || '—'}**
- Itens de agenda do mês: **${items.length}** (concluídos: **${done}**)
- Hábitos monitorados:  
${habits}

---

## Agenda do mês
${items.length? items.map(i=>`- ${i.date} · ${i.title} ${i.done?'✅':''}${i.notes?` — _${i.notes}_`:''}`).join('\n') : '—'}

---

## Daily Log (resumo)
${dailies.length? dailies.map(r=>`- ${r.date} · Foco: **${r.focus||'—'}** · Gratidão: ${r.grat||'—'} · Humor: ${r.mood||'—'}`).join('\n') : '—'}
`;

  const csv = `date,title,done,notes\n` + items.map(i=>{
    const esc = (t)=> `"${String(t||'').replace(/"/g,'""')}"`;
    return [i.date, esc(i.title), i.done?1:0, esc(i.notes||'')].join(',');
  }).join('\n');

  return { md, csv };
}

/* ---------- RELATÓRIO TRIMESTRAL ---------- */
function buildQuarterReport(year, quarter){
  const s = loadState();
  const {start,end} = qRange(year, quarter);
  const header = `# Relatório Trimestral — T${quarter} de ${year}\n_Período: ${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}_\n`;
  const months = [start.getMonth(), start.getMonth()+1, start.getMonth()+2];

  const dailies = s.journal.daily.filter(r=>{
    const d=parseISO(r.date); return d>=start && d<=end;
  });
  const moodAvg = avg(dailies.filter(r=>r.mood).map(r=>Number(r.mood)));

  const items = s.journal.month.items.filter(i=>{
    const d=parseISO(i.date); return d>=start && d<=end;
  }).sort((a,b)=> a.date<b.date? -1:1);
  const done = items.filter(i=>i.done).length;

  const triKey = quarterKey(year, quarter);
  const triNotes = (s.journal.tri.byQuarter && s.journal.tri.byQuarter[triKey]) || '—';

  const porMes = months.map(m=>{
    const i = items.filter(x=> parseISO(x.date).getMonth()===m).length;
    const d = items.filter(x=> parseISO(x.date).getMonth()===m && x.done).length;
    return `- **${monthNamePT(m)}**: ${i} itens (concluídos: ${d})`;
  }).join('\n');

  const md = `${header}
**Resumo**
- Entradas no Daily: **${dailies.length}**
- Humor médio: **${moodAvg || '—'}**
- Itens de agenda no trimestre: **${items.length}** (concluídos: **${done}**)

---

## Itens por mês
${porMes}

---

## Notas do trimestre
${triNotes}

---

## Agenda (detalhada)
${items.length? items.map(i=>`- ${i.date} · ${i.title} ${i.done?'✅':''}${i.notes?` — _${i.notes}_`:''}`).join('\n') : '—'}
`;
  return { md };
}

/* ---------- UI ---------- */
function init(){
  // abas
  document.querySelectorAll('.tab').forEach(b=>{
    b.onclick=()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('tab-'+b.dataset.tab).classList.add('active');
    };
  });

  // anos / mês / tri
  const cur=new Date().getFullYear();
  const years=[]; for(let y=cur-5;y<=cur+5;y++) years.push(y);
  const y1=document.getElementById('rYear'), y2=document.getElementById('qYear');
  years.forEach(y=>{
    const a=document.createElement('option'); a.value=y; a.textContent=y; y1.appendChild(a);
    const b=document.createElement('option'); b.value=y; b.textContent=y; y2.appendChild(b);
  });
  y1.value=String(cur); y2.value=String(cur);
  document.getElementById('rMonth').value=String(new Date().getMonth());
  document.getElementById('qQuarter').value=String(Math.floor(new Date().getMonth()/3)+1);

  // Mensal
  let lastMonthMD='', lastMonthCSV='';
  document.getElementById('btnBuildMonth').onclick = ()=>{
    const y = Number(document.getElementById('rYear').value);
    const m = Number(document.getElementById('rMonth').value);
    const {md, csv} = buildMonthlyReport(y,m);
    lastMonthMD = md; lastMonthCSV = csv;
    document.getElementById('monthPreview').textContent = md;
    ['btnDLMonthMD','btnDLMonthCSV','btnCopyMonth','btnOpenDocsMonth','btnOpenSheetsMonth'].forEach(id=>document.getElementById(id).disabled=false);
    document.getElementById('btnDLMonthMD').onclick = ()=> dl(`relatorio-${y}-${String(m+1).padStart(2,'0')}.md`, md);
    document.getElementById('btnDLMonthCSV').onclick = ()=> dl(`agenda-${y}-${String(m+1).padStart(2,'0')}.csv`, csv);
    document.getElementById('btnCopyMonth').onclick = ()=> copy(md);
    document.getElementById('btnOpenDocsMonth').onclick = async ()=>{
      await copy(lastMonthMD);
      openNew('https://docs.new'); // cole com Ctrl+V
    };
    document.getElementById('btnOpenSheetsMonth').onclick = async ()=>{
      await copy(lastMonthCSV);
      openNew('https://sheets.new'); // cole com Ctrl+V
    };
  };

  // Trimestral
  let lastQMD='';
  document.getElementById('btnBuildQuarter').onclick = ()=>{
    const y = Number(document.getElementById('qYear').value);
    const q = Number(document.getElementById('qQuarter').value);
    const {md} = buildQuarterReport(y,q);
    lastQMD = md;
    document.getElementById('quarterPreview').textContent = md;
    ['btnDLQuarterMD','btnCopyQuarter','btnOpenDocsQuarter'].forEach(id=>document.getElementById(id).disabled=false);
    document.getElementById('btnDLQuarterMD').onclick = ()=> dl(`relatorio-T${q}-${y}.md`, md);
    document.getElementById('btnCopyQuarter').onclick = ()=> copy(md);
    document.getElementById('btnOpenDocsQuarter').onclick = async ()=>{
      await copy(lastQMD);
      openNew('https://docs.new'); // cole com Ctrl+V
    };
  };
}
document.addEventListener('DOMContentLoaded', init);
