/* ==============================================================
   Flow On — Hábitos (Journal)
   - Lista de hábitos
   - Rastreador semanal com 7 bolinhas
   - Clique só no dia de HOJE (verde)
   - Dias passados não marcados viram vermelho automático (sem retroativo)
   - Estrutura salva em:
     state.journal.habits = { items:[{id,title}], marks:{ 'YYYY-MM-DD': { [id]: 1|0 } } }
   ============================================================== */

(function(){
  const KEY = 'flowon';
  // ---------- util datas (LOCAL) ----------
  const toISO = d => {
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const parse = iso => { const [y,m,d]=iso.split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
  const todayISO = ()=>{ const d=new Date(); d.setHours(0,0,0,0); return toISO(d); };
  const addDays = (iso,n)=>{ const d=parse(iso); d.setDate(d.getDate()+n); return toISO(d); };
  const mondayOf = (iso)=>{ const d=parse(iso); const k=(d.getDay()+6)%7; d.setDate(d.getDate()-k); return toISO(d); };
  const week = (iso)=>{ const mon=mondayOf(iso); return [...Array(7)].map((_,i)=>addDays(mon,i)); };

  // ---------- storage ----------
  let S={};
  function load(){
    try{ S = JSON.parse(localStorage.getItem(KEY)||'{}'); }catch{ S={}; }
    S.journal ||= {};
    S.journal.habits ||= { items:[], marks:{} };
    S.journal.habits.items ||= [];
    S.journal.habits.marks ||= {};
    save(); // garante chaves
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(S)); }

  // ---------- helpers ----------
  function uid(){ return 'h_' + Math.random().toString(36).slice(2,9); }

  // Preenche automaticamente “miss” (0) para dias passados que ficaram em aberto
  function backfillMisses(){
    const H = S.journal.habits;
    const isoToday = todayISO();
    // vamos olhar só a semana corrente para performance
    const days = week(isoToday);
    for(const d of days){
      if(d >= isoToday) continue; // só dias passados
      H.marks[d] ||= {};
      for(const it of H.items){
        if(!(it.id in H.marks[d])) H.marks[d][it.id] = 0; // 0 = falhou (vermelho)
      }
    }
  }

  // ---------- render ----------
  function render(){
    backfillMisses();
    const root = document.getElementById('habList');
    const H = S.journal.habits;
    const isoToday = todayISO();
    const days = week(isoToday);
    const dayNames = ['seg','ter','qua','qui','sex','sáb','dom'];

    if(!H.items.length){
      root.innerHTML = `<div class="muted">Sem hábitos por aqui. Clique em <b>+ Hábito</b> para adicionar.</div>`;
      return;
    }

    root.innerHTML = H.items.map((it)=>{
      // monta grid da semana
      const cells = days.map((d,idx)=>{
        const v = (H.marks[d] && H.marks[d][it.id]);
        const isToday = d === isoToday;
        let cls = 'mark';
        if(v === 1) cls += ' done';
        else if(v === 0 && d < isoToday) cls += ' miss';
        else if(isToday) cls += ' today';
        const label = `${dayNames[idx]} ${parse(d).getDate().toString().padStart(2,'0')}`;
        return `<div class="day-cell">
                  <div class="day-name">${label}</div>
                  <div class="${cls}" data-id="${it.id}" data-date="${d}" title="${label}"></div>
                </div>`;
      }).join('');

      return `
        <div class="hab-row">
          <div class="hab-head">
            <div class="hab-title">${it.title}</div>
            <div class="controls">
              <button class="btn small danger" data-del="${it.id}">Excluir</button>
            </div>
          </div>
          <div class="week-grid">${cells}</div>
        </div>
      `;
    }).join('');

    // binds
    root.querySelectorAll('[data-del]').forEach(btn=>{
      btn.onclick = () => {
        const id = btn.getAttribute('data-del');
        if(!confirm('Excluir esse hábito?')) return;
        S.journal.habits.items = S.journal.habits.items.filter(h=>h.id!==id);
        // também limpa as marcas desse hábito
        for(const d in S.journal.habits.marks){
          if(S.journal.habits.marks[d] && (id in S.journal.habits.marks[d])) delete S.journal.habits.marks[d][id];
        }
        save(); render();
      };
    });

    // clique apenas no “hoje”
    root.querySelectorAll('.mark.today').forEach(dot=>{
      dot.onclick = () => {
        const id = dot.getAttribute('data-id');
        const d  = dot.getAttribute('data-date'); // sempre hoje
        S.journal.habits.marks[d] ||= {};
        // alterna entre indefinido -> 1 (feito) -> indefinido
        S.journal.habits.marks[d][id] = S.journal.habits.marks[d][id] === 1 ? undefined : 1;
        if(S.journal.habits.marks[d][id] === undefined) delete S.journal.habits.marks[d][id];
        save(); render();
      };
    });
  }

  // ---------- eventos header ----------
  function bindHeader(){
    const btnAdd = document.getElementById('btnAdd');
    btnAdd.onclick = () => {
      const title = prompt('Nome do hábito:');
      if(!title) return;
      S.journal.habits.items.push({ id: uid(), title });
      save(); render();
    };
  }

  // ---------- boot ----------
  document.addEventListener('DOMContentLoaded', ()=>{
    load();
    bindHeader();
    render();
  });
})();
