// assets/js/home-extra.js
(function(){
  console.log("[home-extra] carregado v8");

  // === storages ===
  const KEY_OLD = 'flowon';
  const KEY_V2  = 'flowon.v2';
  let SOLD={}, S2={};
  try{ SOLD = JSON.parse(localStorage.getItem(KEY_OLD)||'{}'); }catch(e){ SOLD={}; }
  try{ S2   = JSON.parse(localStorage.getItem(KEY_V2 )||'{}'); }catch(e){ S2  ={}; }

  // journal getters
  const J_OLD = ()=>{ SOLD.journal ||= {}; return SOLD.journal; };
  const J_V2  = ()=>{ S2.journal  ||= {}; return S2.journal;  };

  // === helpers de data (modo local, sem TZ) ===
  const toISO = d => {
    const dt=new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const y=dt.getFullYear(), m=String(dt.getMonth()+1).padStart(2,'0'), day=String(dt.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const todayISO = () => toISO(new Date());
  const addDays  = (iso,n)=> toISO(new Date(new Date(iso+'T00:00:00').getTime()+n*86400000));
  const parseLocal = iso => { const [y,m,d]=(iso||'').split('-').map(Number); return new Date(y,(m||1)-1,d||1); };

  const firstDow = (iso=todayISO())=>{
    const d=parseLocal(iso), k=(d.getDay()+6)%7; d.setDate(d.getDate()-k); return toISO(d);
  };
  const weekKeyOfISO = (iso)=>{
    const d=parseLocal(iso), onejan=new Date(d.getFullYear(),0,1);
    const day=Math.floor((d-onejan)/86400000)+1;
    const wk=Math.ceil((day+((onejan.getDay()+6)%7))/7);
    return `${d.getFullYear()}-W${String(wk).padStart(2,'0')}`;
  };
  const dayIndexOfISO = (iso)=> (parseLocal(iso).getDay()+6)%7;

  const qKey=(y,q)=>`${y}-T${q}`, qLabel=(y,q)=>`T${q} de ${y}`;
  const quarter=iso=>{ const d=parseLocal(iso); return {year:d.getFullYear(), q:Math.floor(d.getMonth()/3)+1}; };

  // util seguro de setText
  function setText(id,txt){ const el=document.getElementById(id); if(el) el.textContent = (txt ?? ""); }

  // ===== Fonte única de hábitos + marks por data (se existir) =====
  function getHabitsSource(){
    // Prioridade: página Hábitos nova (legado)
    if (Array.isArray(J_OLD().habits?.items) && J_OLD().habits.items.length){
      return { list: J_OLD().habits.items, marks: J_OLD().habits.marks || null };
    }
    // Legado simples: flowon.habits (array)
    if (Array.isArray(SOLD.habits) && SOLD.habits.length){
      return { list: SOLD.habits, marks: null };
    }
    // V2 em journal.habits.items
    if (Array.isArray(J_V2().habits?.items) && J_V2().habits.items.length){
      return { list: J_V2().habits.items, marks: J_V2().habits.marks || null };
    }
    // V2 raiz
    if (Array.isArray(S2.habits) && S2.habits.length){
      return { list: S2.habits, marks: null };
    }
    return { list: [], marks: null };
  }

  // === Leitura unificada de "feito" ===
  // Suporta: marks[date] (array de ids ou map id->bool),
  //          checks["YYYY-Www"][7], e mapas por data (byDate|days|dates|checksByDate)
  function isChecked(habit, iso, marks){
    const id = habit.id || habit.key || habit.title;

    // 1) marks centralizado por data
    if (marks && marks[iso]){
      const m = marks[iso];
      if (Array.isArray(m)) return m.includes(id);
      if (typeof m === 'object') return !!m[id];
    }

    // 2) checks por semana dentro do hábito
    if (habit.checks && typeof habit.checks==='object'){
      const wk = weekKeyOfISO(iso), idx = dayIndexOfISO(iso);
      const arr = habit.checks[wk];
      if (Array.isArray(arr) && arr.length>idx) return !!arr[idx];
    }

    // 3) mapas por data dentro do hábito
    const dateMaps = ['byDate','days','dates','checksByDate'];
    for(const k of dateMaps){
      if (habit[k] && typeof habit[k]==='object' && Object.prototype.hasOwnProperty.call(habit[k], iso)){
        return !!habit[k][iso];
      }
    }

    return false;
  }

  // ========== KPIs ==========
  try{
    let habitsPct='—', d7='0', posts7='0';

    // Hábitos (semana)
    try{
      const {list: HLIST, marks: HMARKS} = getHabitsSource();
      if(HLIST.length){
        const start = firstDow(); let done=0, total=HLIST.length*7;
        for(let i=0;i<7;i++){
          const d = addDays(start,i);
          HLIST.forEach(h => { if(isChecked(h, d, HMARKS)) done++; });
        }
        habitsPct = total? (Math.round(done/total*100)+'%') : '—';
      }
    }catch(e){ console.warn("[home-extra] KPI hábitos:", e); }

    // Dailies nos últimos 7 dias (v2 array OU legado byDate)
    try{
      let c=0; const past7=[...Array(7)].map((_,i)=> addDays(todayISO(),-i));
      const D_old = J_OLD().daily?.byDate || {};
      const D_v2  = Array.isArray(J_V2().daily) ? J_V2().daily : null;

      if (D_v2){
        c = D_v2.filter(r => r?.date && past7.includes(r.date) && (r.focus||r.notes||r.mits||r.gratitude)).length;
      } else {
        for(const d of past7){
          const v=D_old[d];
          if(v&&(v.focus||v.notes||v.mits||v.gratitude)) c++;
        }
      }
      d7=String(c);
    }catch(e){ console.warn("[home-extra] KPI dailies:", e); }

    // Conteúdos próximos 7 dias (compat)
    try{
      const schedOld=(SOLD.content?.scheduled)||(SOLD.themes?.scheduled)||{};
      const postsV2 = Array.isArray(S2.posts) ? S2.posts : null;
      let c=0;
      if (postsV2){
        const start=todayISO();
        for(let i=0;i<7;i++){
          const d=addDays(start,i);
          c += S2.posts.filter(p=>!p.archived && p.status!=='Rascunho' && p.date===d).length;
        }
      } else {
        for(let i=0;i<7;i++){
          const d=addDays(todayISO(),i); const a=schedOld[d];
          if(Array.isArray(a)) c+=a.length;
          else if(a&&typeof a==='object') c+=Object.keys(a).length;
        }
      }
      posts7=String(c);
    }catch(e){ console.warn("[home-extra] KPI posts:", e); }

    setText('kpi-habits', habitsPct);
    setText('kpi-dailies', d7);
    setText('kpi-posts', posts7);
  }catch(e){ console.error("[home-extra] KPIs falhou:", e); }

  // ========== Trimestral (lookup robusto) ==========
  try{
    const {year,q}=quarter(todayISO());
    const key = qKey(year,q);
    setText('quarter-label', `(${qLabel(year,q)})`);

    const roots = [
      J_V2().tri, J_V2().quarterly, J_V2().trimestral, J_V2(),
      J_OLD().tri, J_OLD().quarterly, J_OLD().trimestral, J_OLD()
    ].filter(Boolean);

    let notes='';
    for(const r of roots){
      if(r?.byQuarter && r.byQuarter[key]) { notes = r.byQuarter[key]; break; }
      if(r && r[key]) { notes = r[key]; break; }
    }
    if(!notes){
      const any = roots.find(r=>typeof r==='object');
      if(any){
        const k = Object.keys(any).find(k=>k.endsWith(key));
        if(k) notes = any[k];
      }
    }
    setText('quarter-notes', notes || 'Sem anotações do trimestre ainda.');
    console.log("[home-extra] trimestral", {key, notesLen: (notes||'').length});
  }catch(e){ console.error("[home-extra] Trimestral falhou:", e); }

  // ========== Painel “21 dias” dos hábitos ==========
  (function(){
    const {list: HLIST, marks: HMARKS} = getHabitsSource();
    const btn=document.getElementById('btn-habits-21');
    const panel=document.getElementById('habits-21-panel');
    if(!btn || !panel) return;

    if(!HLIST.length){
      btn.style.display='none';
      return;
    }

    function build(){
      panel.innerHTML='';
      const days=[...Array(21)].map((_,i)=> addDays(todayISO(),-(20-i))); // últimos 21
      HLIST.forEach(h=>{
        const id=h.id||h.key||h.title;
        const row=document.createElement('div'); row.className='fo-habit-row';
        const name=document.createElement('div'); name.className='fo-habit-name'; name.textContent=h.title||id;
        const grid=document.createElement('div'); grid.className='fo-dots';
        days.forEach(d=>{
          const on = isChecked(h, d, HMARKS);
          const dot=document.createElement('div'); dot.className='fo-dot'+(on?' on':''); dot.title=d;
          grid.appendChild(dot);
        });
        row.appendChild(name); row.appendChild(grid); panel.appendChild(row);
      });
    }

    btn.onclick=()=>{
      const open = panel.style.display!=='none';
      if(open){ panel.style.display='none'; btn.textContent='📈 21 dias'; }
      else { build(); panel.style.display='block'; btn.textContent='Ocultar 21 dias'; }
    };
  })();

  // “bandeirinha” de vida
  (function(){
    const el = document.getElementById('progress-card');
    if(el){
      const tag = document.createElement('div');
      tag.className='fo-muted';
      tag.style.fontSize='.8rem';
      tag.style.marginTop='6px';
      tag.textContent='scripts ok • home-extra v8';
      el.appendChild(tag);
    }
  })();

})();