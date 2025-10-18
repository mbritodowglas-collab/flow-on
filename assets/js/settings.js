/* ====== Flow On — Settings ====== */
const STORE_KEY = 'flowon.v1';
const CFG_KEY = 'flowon.config';

const Config = {
  _c: { theme:'gold', week:'monday' },
  load(){
    try{
      const raw = localStorage.getItem(CFG_KEY);
      if(raw) this._c = JSON.parse(raw);
    }catch(e){ console.error(e) }
  },
  save(){ localStorage.setItem(CFG_KEY, JSON.stringify(this._c)) }
};

const Data = {
  load(){ return localStorage.getItem(STORE_KEY) || JSON.stringify({}) },
  save(json){ localStorage.setItem(STORE_KEY, json) },
  reset(){ localStorage.removeItem(STORE_KEY) }
};

function applyTheme(){
  const root = document.documentElement;
  const t = Config._c.theme;
  if(t === 'red'){
    root.style.setProperty('--gold', '#e32526');
  }else if(t === 'clean'){
    root.style.setProperty('--bg', '#0a0a0a');
    root.style.setProperty('--card', '#121212');
    root.style.setProperty('--muted', '#1a1a1a');
    root.style.setProperty('--text', '#ffffff');
  }else{ // gold default
    root.style.setProperty('--gold', '#e0a96d');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  Config.load();

  // marca menu ativo
  document.querySelectorAll('.menu a').forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === './' || a.getAttribute('href')?.endsWith('/settings/'));
  });

  // prefs
  const cfgTheme = document.getElementById('cfgTheme');
  const cfgWeek = document.getElementById('cfgWeek');
  cfgTheme.value = Config._c.theme || 'gold';
  cfgWeek.value = Config._c.week || 'monday';
  applyTheme();

  cfgTheme.onchange = ()=>{ Config._c.theme = cfgTheme.value; Config.save(); applyTheme(); alert('Tema salvo.'); };
  cfgWeek.onchange = ()=>{ Config._c.week = cfgWeek.value; Config.save(); alert('Preferência salva.'); };

  // backup
  document.getElementById('btnExport').onclick = ()=>{
    const blob = new Blob([Data.load()], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flowon-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('fileImport').onchange = async (ev)=>{
    const file = ev.target.files?.[0];
    if(!file) return;
    const text = await file.text();
    try{
      JSON.parse(text); // valida
      Data.save(text);
      alert('Backup importado com sucesso!');
    }catch(e){
      alert('Arquivo inválido.');
    }
  };

  document.getElementById('btnReset').onclick = ()=>{
    if(confirm('Tem certeza? Isso apagará os dados locais (hábitos, dailies, temas).')){
      Data.reset(); alert('Dados apagados. Recarregue a página.');
    }
  };
});
