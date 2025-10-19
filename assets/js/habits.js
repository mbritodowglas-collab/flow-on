/* ===== Página: Hábitos ===== */
function drawHabits(){
  const box = document.getElementById('habitsList'); box.innerHTML='';
  const s = Data.get();

  if(!s.habits.length){
    box.innerHTML = `<div class="muted">Sem hábitos ainda. Clique em <b>+ Hábito</b>.</div>`;
    return;
  }

  s.habits.forEach(h=>{
    const row = document.createElement('div'); row.className='list-day';
    row.innerHTML = `
      <div class="list-day-head">
        <span class="small">${h.name}</span>
        <span><button class="btn small" data-del="${h.id}">Excluir</button></span>
      </div>`;
    row.querySelector('[data-del]').onclick = ()=>{
      s.habits = s.habits.filter(x=>x.id!==h.id); Data.save(); drawHabits();
    };
    box.appendChild(row);
  });
}
function addHabit(){
  const title = prompt('Nome do hábito:'); if(!title) return;
  const s = Data.get(); s.habits.push({id:'h_'+Date.now(), name:title.trim()});
  Data.save(); drawHabits();
}

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  drawHabits();
  document.getElementById('btnAddHabit').onclick = addHabit;
});
