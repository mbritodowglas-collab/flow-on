/* ===== Flow On — Editor de Post ===== */
const STORE_KEY = 'flowon.v2';

const Data = {
  _s: { themes: [], posts: [] },
  load(){
    const raw = localStorage.getItem(STORE_KEY);
    this._s = raw ? JSON.parse(raw) : { themes: [], posts: [] };
  },
  save(){ localStorage.setItem(STORE_KEY, JSON.stringify(this._s)) },
  get(){ return this._s }
};

const qs = new URLSearchParams(location.search);
const postId  = qs.get('postId');
const themeId = qs.get('themeId');

function fillForm(){
  const s = Data.get();
  const post  = s.posts.find(p=>p.id===postId);
  const theme = s.themes.find(t=>t.id=== (post?.themeId || themeId));

  document.getElementById('eThemeTitle').value = theme?.title || '—';
  document.getElementById('eType').value = post?.type || 'yt_long';
  document.getElementById('eDate').value = post?.date || '';
  document.getElementById('eScript').value = post?.script || '';
}

function save(){
  const s = Data.get();
  const type = document.getElementById('eType').value;
  const date = document.getElementById('eDate').value;
  const script = document.getElementById('eScript').value;

  if(postId){
    const ix = s.posts.findIndex(p=>p.id===postId);
    if(ix>=0){
      s.posts[ix].type = type;
      s.posts[ix].date = date;                 // data única define Agendado
      s.posts[ix].status = date ? 'Agendado' : 'Rascunho';
      s.posts[ix].script = script;
    }
  }else{
    if(!themeId){ alert('Sem tema válido.'); return; }
    s.posts.push({
      id:'p_'+Date.now(),
      themeId,
      type,
      date,
      status: date ? 'Agendado' : 'Rascunho',
      script,
      analytics:{ views:0, likes:0, comments:0, clicks:0, notes:'' },
      archived:false
    });
  }
  Data.save();
  location.href = './';
}

function del(){
  if(!confirm('Excluir este post?')) return;
  const s = Data.get();
  const ix = s.posts.findIndex(p=>p.id===postId);
  if(ix>=0){ s.posts.splice(ix,1); Data.save(); }
  location.href = './';
}

document.addEventListener('DOMContentLoaded', ()=>{
  Data.load();
  fillForm();
  document.getElementById('btnSavePost').onclick = save;
  document.getElementById('btnDeletePost').onclick = del;
});
