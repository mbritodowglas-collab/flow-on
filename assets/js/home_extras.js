// assets/js/home-extra.js
(function(){
  console.log("[home-extra] carregado");

  // === helpers ===
  const KEY='flowon';
  let S={}; try{ S=JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ S={}; }
  const J=()=>{ S.journal ||= {}; return S.journal; };

  const toISO=d=>d.toISOString().slice(0,10);
  const todayISO=()=>{ const d=new Date(); d.setHours(0,0,0,0); return toISO(d); };
  const addDays=(iso,n)=>{ const d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return toISO(d); };
  const firstDow=(iso=todayISO())=>{
    const d=new Date(iso+'T00:00:00');
    const k=(d.getDay()+6)%7; // segunda=0
    d.setDate(d.getDate()-k);
    return toISO(d);
  };
  const qKey=(y,q)=>`${y}-T${q}`, qLabel=(y,q)=>`T${q} de ${y}`;
  const quarter=iso=>{ const d=new Date(iso+'T00:00:00'); return {year:d.getFullYear(), q:Math.floor(d.getMonth()/3)+1}; };

  // util seguro de setText
  function setText(id,txt){ const el=document.getElementById(id); if(el) el.textContent = (txt ?? ""); }

  // ========== KPIs ==========
  try{
    let habitsPct='—', d7='0', posts7='0';

    // Hábitos (semana)
    try{
      const H=J().habits;
      if(H?.items?.length){
        const ids=H.items.map(h=>h.id||h.key||h.title);
        const start=firstDow(); let done=0,total=ids.length*7;
        for(let i=0;i<7;i++){
          const d=addDays(start,i), m=H.marks?.[d];
          if(m){
            ids.forEach(id=>{
              const v = Array.isArray(m) ? m.includes(id) : (typeof m==='object' && !!m[id]);
              if(v) done++;
            });
          }
        }
        habitsPct = total? (Math.round(done/total*100)+'%') : '—';
      }
    }catch(e){ console.warn("[home-extra] KPI hábitos:", e); }

    // Dailies nos últimos 7 dias
    try{
      const D=J().daily?.byDate||{};
      let c=0;
      for(let i=0;i<7;i++){
        const d=addDays(todayISO(),-i), v=D[d];
        if(v&&(v.focus||v.notes||v.mits||v.gratitude)) c++;
      }
      d7=String(c);
    }catch(e){ console.warn("[home-extra] KPI dailies:", e); }

    // Conteúdos próximos 7 dias
    try{
      const sched=(S.content?.scheduled)||(S.themes?.scheduled)||{};
      let c=0;
      for(let i=0;i<7;i++){
        const d=addDays(todayISO(),i); const a=sched[d];
        if(Array.isArray(a)) c+=a.length;
        else if(a&&typeof a==='object') c+=Object.keys(a).length;
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
      J().tri,          // { byQuarter: { 'YYYY-TQ': '...' } }
      J().quarterly,
      J().trimestral,
      J()               // fallback: journal['YYYY-TQ']
    ].filter(Boolean);

    let notes='';
    for(const r of roots){
      if(notes) break;
      if(r.byQuarter && r.byQuarter[key]) { notes = r.byQuarter[key]; break; }
      if(r[key]) { notes = r[key]; break; }
    }
    if(!notes){
      // procura chave que termine com o trimestre (ex.: “…2025-T4”)
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
    const H=J().habits;
    const btn=document.getElementById('btn-habits-21');
    const panel=document.getElementById('habits-21-panel');
    if(!btn || !panel) return;

    if(!H?.items?.length){
      btn.style.display='none';
      return;
    }

    function build(){
      panel.innerHTML='';
      H.items.forEach(h=>{
        const id=h.id||h.key||h.title;
        const row=document.createElement('div'); row.className='fo-habit-row';
        const name=document.createElement('div'); name.className='fo-habit-name'; name.textContent=h.title||id;
        const grid=document.createElement('div'); grid.className='fo-dots';
        for(let i=20;i>=0;i--){
          const d=addDays(todayISO(),-i), m=H.marks?.[d];
          const on = m ? (Array.isArray(m)?m.includes(id):!!m[id]) : false;
          const dot=document.createElement('div'); dot.className='fo-dot'+(on?' on':''); dot.title=d;
          grid.appendChild(dot);
        }
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
      tag.textContent='scripts ok • home-extra v7';
      el.appendChild(tag);
    }
  })();

})();
