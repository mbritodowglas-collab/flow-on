
/* Flow On — mind365 loader */
(function(){
  const wrap = document.getElementById('mind365-card');
  if(!wrap) return;

  function dayOfYear(d){
    const start = new Date(d.getFullYear(),0,0);
    return Math.floor((d - start)/86400000);
  }

  function render(item){
    wrap.innerHTML = `
      <div class="mind-item">
        <div class="small fo-muted">${item.tradition} • ${item.theme}</div>
        <div style="margin:6px 0 8px"><strong>${item.title}</strong></div>
        <div class="small" style="opacity:.9"><em>${item.motto}</em></div>
        <div style="margin-top:8px">${item.exercise}</div>
        <div class="fo-muted" style="margin-top:6px">${item.reflection}</div>
        <div class="small" style="margin-top:8px"><b>Jornal:</b> ${item.journal_prompt}</div>
      </div>
    `;
  }

  fetch('assets/data/mind365.json')
    .then(r=>r.json())
    .then(db=>{
      const items = db.items || [];
      if(!items.length){ wrap.innerHTML = `<p class="muted small">Sem base de exercícios carregada.</p>`; return; }
      const idx = (dayOfYear(new Date()) - 1) % items.length;
      render(items[idx]);
    })
    .catch(()=>{
      wrap.innerHTML = `<p class="muted small">Não foi possível carregar os exercícios. Verifique <code>assets/data/mind365.json</code>.</p>`;
    });
})();
