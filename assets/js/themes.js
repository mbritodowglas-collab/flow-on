/* Flow On — Conteúdos (Themes) v5
   Liga os botões da página e mantém dados em localStorage.
   Depende de window.Data (core.js). Se não houver, cria um fallback leve.
*/

// ---------- DATA LAYER ----------
(function ensureData(){
  if(!window.Data){
    const KEY = 'flowon';
    window.Data = {
      _s: null,
      load(){ try{ this._s = JSON.parse(localStorage.getItem(KEY)||'{}'); }catch(e){ this._s={}; } },
      save(){ localStorage.setItem(KEY, JSON.stringify(this._s||{})); },
      get(){ if(!this._s) this.load(); return this._s; }
    };
    console.warn('[themes] Data fallback ativo (core.js não encontrado).');
  }
})();

function S(){
  const s = Data.get();
  s.content ||= {};
  s.content.ideas ||= [];        // [{id,title}]
  s.content.drafts ||= [];       // [{id,title,kind}]  kind: youtube|short|carousel|static|blog
  s.content.plan ||= [];         // [{id,title,kind,date,status:'scheduled'}]
  s.content.analysis ||= [];     // [{id,title,kind,date,views,likes,comments,clicks,notes,archived:boolean}]
  return s;
}
function uid(prefix='i'){ return `${prefix}_${Math.random().toString(36).slice(2,9)}`; }

// ---------- HELPERS ----------
const KIND_LABEL = {
  youtube: 'YouTube',
  short: 'Reels/TikTok',
  carousel: 'Carrossel',
  static: 'Imagem estática',
  blog: 'Blog'
};
function fmtDayLabel(d){
  // d = 'YYYY-MM-DD'
  const dt = new Date(d+'T00:00:00');
  return dt.toLocaleDateString('pt-BR', { weekday:'short', day:'2-digit'});
}
function todayISO(){
  const t = new Date(); t.setHours(0,0,0,0);
  return t.toISOString().slice(0,10);
}
function addDaysISO(iso, n){
  const d = new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
function next30Range(){
  const start = todayISO();
  const end = addDaysISO(start, 29);
  return {start, end};
}
function inNext30(iso){
  const {start,end} = next30Range();
  return iso >= start && iso <= end;
}

// ---------- RENDER: IDEIAS ----------
function renderIdeas(){
  const wrap = document.getElementById('ideasList');
  const s = S();
  const ideas = s.content.ideas;
  // contador
  const cnt = document.getElementById('ideasCount');
  if(cnt) cnt.textContent = `${ideas.length} ${ideas.length===1?'item':'itens'}`;

  if(!wrap) return;
  wrap.innerHTML = '';
  if(ideas.length === 0){
    wrap.innerHTML = `<div class="empty">Sem ideias por aqui. Clique em <b>+ Ideia</b> para adicionar.</div>`;
    return;
  }
  ideas.forEach(it=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(it.title)}</strong>
      </div>
      <div class="flex">
        <button class="btn small" data-act="use" data-id="${it.id}">Usar no rascunho</button>
        <button class="btn small danger" data-act="del" data-id="${it.id}">Excluir</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  // ações
  wrap.querySelectorAll('[data-act="del"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      s.content.ideas = s.content.ideas.filter(x=>x.id!==id);
      Data.save(); renderIdeas();
    };
  });
  wrap.querySelectorAll('[data-act="use"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      const idea = s.content.ideas.find(x=>x.id===id);
      if(!idea) return;
      // escolher formato
      const kind = prompt('Destino do rascunho (youtube|short|carousel|static|blog):','youtube');
      if(!kind || !KIND_LABEL[kind]) return alert('Formato inválido.');
      s.content.drafts.push({ id: uid('d'), title: idea.title, kind });
      // remove ideia do banco (como definido por você)
      s.content.ideas = s.content.ideas.filter(x=>x.id!==id);
      Data.save(); renderIdeas(); renderDrafts();
    };
  });
}

// ---------- RENDER: RASCUNHOS ----------
let currentFilter = 'all';

function renderDrafts(){
  const wrap = document.getElementById('draftsList');
  if(!wrap) return;
  const s = S();
  const list = s.content.drafts.filter(d => currentFilter==='all' ? true : d.kind===currentFilter);

  wrap.innerHTML = '';
  if(list.length===0){
    wrap.innerHTML = `<div class="empty">Sem rascunhos. Clique em <b>+ Criar rascunho</b> e escolha um destino.</div>`;
    return;
  }
  list.forEach(d=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(d.title)} — ${KIND_LABEL[d.kind]||d.kind}</strong>
        <div class="muted">1 rascunho = 1 destino</div>
      </div>
      <div class="flex">
        <button class="btn small" data-act="schedule" data-id="${d.id}">Agendar</button>
        <button class="btn small danger" data-act="del" data-id="${d.id}">Excluir</button>
      </div>
    `;
    wrap.appendChild(row);
  });

  wrap.querySelectorAll('[data-act="del"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      s.content.drafts = s.content.drafts.filter(x=>x.id!==id);
      Data.save(); renderDrafts();
    };
  });

  wrap.querySelectorAll('[data-act="schedule"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      const d = s.content.drafts.find(x=>x.id===id);
      if(!d) return;
      // data obrigatória
      const date = prompt('Data de publicação (AAAA-MM-DD):', todayISO());
      if(!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert('Data inválida.');
      // move para planejamento
      s.content.plan.push({ id: uid('p'), title: d.title, kind: d.kind, date, status:'scheduled' });
      s.content.drafts = s.content.drafts.filter(x=>x.id!==id);
      Data.save(); renderDrafts(); renderPlan();
      alert('Agendado!');
    };
  });
}

// ---------- RENDER: PLANEJAMENTO (30 DIAS) ----------
function renderPlan(){
  const wrap = document.getElementById('planList');
  const rangeEl = document.getElementById('planRangeLabel');
  if(rangeEl){
    const {start,end} = next30Range();
    const s = new Date(start).toLocaleDateString('pt-BR'); 
    const e = new Date(end).toLocaleDateString('pt-BR');
    rangeEl.textContent = `${s} – ${e}`;
  }
  if(!wrap) return;

  const s = S();
  const items = s.content.plan
    .filter(p=>inNext30(p.date))
    .sort((a,b)=>a.date.localeCompare(b.date));

  // agrupar por dia
  const byDay = {};
  items.forEach(it=>{
    byDay[it.date] ||= [];
    byDay[it.date].push(it);
  });

  wrap.innerHTML = '';
  const {start,end} = next30Range();
  // percorre todos os dias do range (mesmo dias sem item)
  let cursor = start;
  while(cursor <= end){
    const dayItems = byDay[cursor] || [];
    const block = document.createElement('div');
    block.className = 'item';
    const itemsHtml = dayItems.length
      ? dayItems.map(p=>`• ${escapeHtml(p.title)} — ${KIND_LABEL[p.kind]||p.kind} 
           <button class="btn small" data-act="unschedule" data-id="${p.id}">Voltar p/ rascunho</button>
           <button class="btn small" data-act="posted" data-id="${p.id}">OK publicado</button>`).join('<br/>')
      : '<span class="muted">Sem itens</span>';

    block.innerHTML = `
      <div>
        <strong>${fmtDayLabel(cursor)}</strong>
        <div class="muted">planejamento</div>
      </div>
      <div style="max-width:100%">${itemsHtml}</div>
    `;
    wrap.appendChild(block);
    cursor = addDaysISO(cursor, 1);
  }

  // ações dos itens do planejamento
  wrap.querySelectorAll('[data-act="unschedule"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      const p = s.content.plan.find(x=>x.id===id);
      if(!p) return;
      s.content.plan = s.content.plan.filter(x=>x.id!==id);
      s.content.drafts.push({ id: uid('d'), title: p.title, kind: p.kind });
      Data.save(); renderDrafts(); renderPlan();
    };
  });
  wrap.querySelectorAll('[data-act="posted"]').forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute('data-id');
      const s = S();
      const p = s.content.plan.find(x=>x.id===id);
      if(!p) return;
      // abre análise com dados preenchidos
      document.getElementById('anTitle').value = p.title;
      document.getElementById('anFormat').value = p.kind;
      document.getElementById('anDate').value = p.date;
      document.getElementById('anStatus').value = 'posted';
      // remove do plano
      s.content.plan = s.content.plan.filter(x=>x.id!==id);
      Data.save(); renderPlan();
      window.scrollTo({top: document.getElementById('analysisForm').offsetTop-40, behavior:'smooth'});
    };
  });
}

// ---------- RENDER: ANÁLISE ----------
function renderAnalysisRecent(){
  const wrap = document.getElementById('analysisRecent');
  if(!wrap) return;
  const s = S();
  const list = s.content.analysis.slice(-5).reverse(); // últimas 5
  wrap.innerHTML = '';
  if(list.length===0){
    wrap.innerHTML = `<div class="empty">Sem análises recentes.</div>`;
    return;
  }
  list.forEach(a=>{
    const row = document.createElement('div');
    row.className = 'item';
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(a.title)} — ${KIND_LABEL[a.kind]||a.kind}</strong>
        <div class="muted">${new Date(a.date).toLocaleDateString('pt-BR')} • Views ${a.views} • Likes ${a.likes} • Coments ${a.comments} • Cliques ${a.clicks}</div>
      </div>
      <div class="flex">
        ${a.archived?'<span class="pill">Arquivado</span>':''}
      </div>
    `;
    wrap.appendChild(row);
  });
}

// ---------- UI EVENTS (botões da página) ----------
function bindUI(){
  // + Ideia
  const btnAddIdea = document.getElementById('btnAddIdea');
  if(btnAddIdea){
    btnAddIdea.onclick = ()=>{
      const title = prompt('Título da ideia:');
      if(!title) return;
      const s = S();
      s.content.ideas.push({ id: uid('i'), title: title.trim() });
      Data.save(); renderIdeas();
    };
  }

  // + Criar rascunho
  const btnCreateDraft = document.getElementById('btnCreateDraft');
  if(btnCreateDraft){
    btnCreateDraft.onclick = ()=>{
      const s = S();
      const fromIdeas = s.content.ideas;
      let title = '';
      if(fromIdeas.length>0){
        const list = fromIdeas.map((x,i)=>`${i+1}. ${x.title}`).join('\n');
        const pick = prompt(`Escolha uma ideia (número) ou deixe vazio para rascunho em branco:\n\n${list}`);
        if(pick && Number(pick)>=1 && Number(pick)<=fromIdeas.length){
          title = fromIdeas[Number(pick)-1].title;
          // remove ideia (vira rascunho)
          s.content.ideas.splice(Number(pick)-1,1);
        }
      }
      if(!title) title = prompt('Título do rascunho:')||'Sem título';
      const kind = prompt('Destino do rascunho (youtube|short|carousel|static|blog):','youtube');
      if(!kind || !KIND_LABEL[kind]) return alert('Formato inválido.');
      s.content.drafts.push({ id: uid('d'), title: title.trim(), kind });
      Data.save(); renderIdeas(); renderDrafts();
    };
  }

  // filtros (sticky)
  document.querySelectorAll('.filters .btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.filters .btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || 'all';
      renderDrafts();
    });
  });

  // + Post em branco (vai direto pra agenda)
  const btnBlank = document.getElementById('btnNewBlankPost');
  if(btnBlank){
    btnBlank.onclick = ()=>{
      const title = prompt('Título do post:'); if(!title) return;
      const kind = prompt('Formato (youtube|short|carousel|static|blog):','youtube');
      if(!kind || !KIND_LABEL[kind]) return alert('Formato inválido.');
      const date = prompt('Data (AAAA-MM-DD):', todayISO());
      if(!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return alert('Data inválida.');
      const s = S();
      s.content.plan.push({ id: uid('p'), title:title.trim(), kind, date, status:'scheduled' });
      Data.save(); renderPlan();
    };
  }

  // Análise — salvar / arquivar / excluir
  const btnSaveAnalysis = document.getElementById('btnSaveAnalysis');
  const btnArchivePost  = document.getElementById('btnArchivePost');
  const btnDeletePost   = document.getElementById('btnDeletePost');

  function collectAnalysis(){
    const title = (document.getElementById('anTitle').value||'').trim();
    const kind  = document.getElementById('anFormat').value;
    const date  = document.getElementById('anDate').value||todayISO();
    const status= document.getElementById('anStatus').value;
    const views = Number(document.getElementById('anViews').value||0);
    const likes = Number(document.getElementById('anLikes').value||0);
    const comments = Number(document.getElementById('anComments').value||0);
    const clicks = Number(document.getElementById('anClicks').value||0);
    const notes = document.getElementById('anNotes').value||'';
    return {title, kind, date, status, views, likes, comments, clicks, notes};
  }

  if(btnSaveAnalysis){
    btnSaveAnalysis.onclick = ()=>{
      const a = collectAnalysis();
      if(!a.title) return alert('Informe o título/tema.');
      const s = S();
      s.content.analysis.push({ id: uid('a'), ...a, archived:false });
      Data.save(); renderAnalysisRecent();
      alert('Análise salva!');
    };
  }
  if(btnArchivePost){
    btnArchivePost.onclick = ()=>{
      const a = collectAnalysis();
      if(!a.title) return alert('Informe o título/tema.');
      const s = S();
      s.content.analysis.push({ id: uid('a'), ...a, archived:true });
      Data.save(); renderAnalysisRecent();
      alert('Item arquivado.');
    };
  }
  if(btnDeletePost){
    btnDeletePost.onclick = ()=>{
      // Limpa o formulário atual (só visual)
      ['anTitle','anDate','anViews','anLikes','anComments','anClicks','anNotes'].forEach(id=>{
        const el = document.getElementById(id); if(el) el.value='';
      });
      document.getElementById('anStatus').value='posted';
      document.getElementById('anFormat').value='youtube';
      alert('Formulário limpo.');
    };
  }
}

// ---------- UTIL ----------
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', ()=>{
  try{ Data.load(); }catch(e){}
  bindUI();
  renderIdeas();
  renderDrafts();
  renderPlan();
  renderAnalysisRecent();
  console.log('[themes] pronto');
});
