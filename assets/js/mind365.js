/* Flow On — Mind365 (Exercício & Reflexão do Dia)
   - Injeta um card abaixo de #progress-card
   - Carrega assets/data/mind365.json (se existir)
   - Fallback: usa seed local (não sobrescreve nada que já exista em flowon.v2)
*/
(function(){
  const LS_KEY = 'flowon.v2';
  const DATA_URL = 'assets/data/mind365.json';

  // ---------- utils ----------
  const $ = sel => document.querySelector(sel);
  const toISO = d => { const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); return x.toISOString().slice(0,10); };
  const dayOfYear = (d)=>{
    const start = new Date(d.getFullYear(),0,1);
    const oneDay = 24*60*60*1000;
    return Math.floor((d - start)/oneDay)+1; // 1..366
  };
  function readState(){
    try{ return JSON.parse(localStorage.getItem(LS_KEY)||'{}'); }catch(e){ return {}; }
  }
  function writeState(s){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(s)); }catch(e){}
  }

  // ---------- seed mínimo (pode remover depois que usar o JSON) ----------
  const SEED = [
    {
      id: 1, source:"Estoico", title:"Foque no que controla",
      quote:"Concentre-se no que depende de você.",
      reflection:"Troque ruminação por ação: escolha a próxima micro-ação sob seu controle.",
      practice:"Escreva 1 coisa que controla e faça-a em 10 minutos."
    },
    {
      id: 2, source:"Hermético", title:"Correspondência",
      quote:"Como em cima, assim embaixo.",
      reflection:"Seu ambiente reflete seu estado interno. Organize 1 pequeno espaço.",
      practice:"Arrume sua mesa por 5 minutos, intencionalmente."
    },
    {
      id: 3, source:"Taoísta", title:"Agir sem forçar (Wu-wei)",
      quote:"O rio vence sem pressa.",
      reflection:"Solte a tensão de fazer ‘de qualquer jeito’. Faça menos, melhor.",
      practice:"Pegue 1 tarefa e elimine 2 passos desnecessários."
    },
    {
      id: 4, source:"Espiritismo", title:"Caridade discreta",
      quote:"Faça o bem em silêncio.",
      reflection:"Direcione atenção e gentileza sem buscar crédito.",
      practice:"Envie 1 mensagem sincera de apoio para alguém."
    },
    {
      id: 5, source:"Estoico", title:"Negativo construtivo",
      quote:"Antecipe obstáculos, não para temer, mas para se preparar.",
      reflection:"Visualize um imprevisto e sua resposta serena.",
      practice:"Escreva o obstáculo mais provável de hoje e um plano B simples."
    },
    {
      id: 6, source:"Hermético", title:"Polaridade",
      quote:"Quente e frio são graus do mesmo.",
      reflection:"Transforme ansiedade em energia direcionada.",
      practice:"Respire 4x4x8 e converta inquietação em foco numa tarefa só."
    },
    {
      id: 7, source:"Taoísta", title:"Caminho do meio",
      quote:"Excesso é inimigo do fluxo.",
      reflection:"Ajuste ritmo para sustentável.",
      practice:"Defina um limite de tempo moderado para a próxima atividade."
    },
    {
      id: 8, source:"Espiritismo", title:"Perdão prático",
      quote:"Compreensão liberta o coração.",
      reflection:"Solte um micro-ressentimento hoje.",
      practice:"Escreva 1 frase de compreensão sobre alguém que te irritou."
    },
    {
      id: 9, source:"Estoico", title:"Amor Fati",
      quote:"Ame o que acontece, torne-o útil.",
      reflection:"Encontre utilidade no imprevisto.",
      practice:"Responda a um atraso com uma micro-tarefa produtiva."
    },
    {
      id:10, source:"Hermético", title:"Ritmo",
      quote:"Marés sobem e descem.",
      reflection:"Se o dia está pesado, reduza amplitude, não pare.",
      practice:"Quebre a próxima tarefa em 3 blocos minúsculos."
    },
    {
      id:11, source:"Taoísta", title:"Suavidade eficaz",
      quote:"O flexível supera o rígido.",
      reflection:"Mude de estratégia sem perder o objetivo.",
      practice:"Tente um caminho alternativo para a mesma entrega."
    },
    {
      id:12, source:"Espiritismo", title:"Gratidão ativa",
      quote:"Alegre-se no bem que já tem.",
      reflection:"Agradecer muda a qualidade da ação.",
      practice:"Liste 3 coisas e aja a partir desse estado (1 pequena ação)."
    },
    {
      id:13, source:"Estoico", title:"Dicotomia do controle 2.0",
      quote:"Controle: intenções, esforços, atitudes.",
      reflection:"Avalie sua última reação. Houve algo controlável?",
      practice:"Reescreva essa reação em 1 frase, agora sob seu controle."
    },
    {
      id:14, source:"Hermético", title:"Causa & Efeito",
      quote:"Seja causa, não efeito.",
      reflection:"Faça o dia reagir a você: inicie algo.",
      practice:"Dispare 1 ação-propulsora (mensagem, pedido, esboço)."
    }
  ];

  // ---------- cria card no DOM (abaixo do #progress-card) ----------
  function ensureCard(){
    if (document.getElementById('mind-card')) return document.getElementById('mind-card');

    const anchor = document.getElementById('progress-card');
    const sec = document.createElement('section');
    sec.className = 'fo-card';
    sec.id = 'mind-card';
    sec.innerHTML = `
      <h2 class="fo-title">Exercício & Reflexão do Dia <span class="fo-muted" id="mind-source"></span></h2>
      <div id="mind-title" style="font-weight:700; margin-bottom:6px"></div>
      <div class="fo-muted" id="mind-quote" style="white-space:pre-line; margin-bottom:6px"></div>
      <div id="mind-reflection" style="margin:6px 0 8px"></div>
      <div class="small"><b>Prática:</b> <span id="mind-practice"></span></div>
    `;
    if (anchor && anchor.parentNode){
      anchor.parentNode.insertBefore(sec, anchor.nextSibling);
    } else {
      // fallback: adiciona ao main
      const main = document.querySelector('main') || document.body;
      main.appendChild(sec);
    }
    return sec;
  }

  function pickForToday(list){
    if (!Array.isArray(list) || list.length===0) return null;
    const idx = (dayOfYear(new Date()) - 1) % list.length;
    return list[idx];
  }

  function render(item){
    if(!item) return;
    ensureCard();
    const set = (id, val)=>{ const el = document.getElementById(id); if(el) el.textContent = val || ''; };
    set('mind-source', item.source ? `• ${item.source}` : '');
    set('mind-title', item.title || '');
    set('mind-quote', item.quote || '');
    set('mind-reflection', item.reflection || '');
    set('mind-practice', item.practice || '');
  }

  async function boot(){
    // 1) lê do localStorage (se já existir uma base)
    const S = readState();
    const localItems = S.mind365?.items;
    if (Array.isArray(localItems) && localItems.length){
      render(pickForToday(localItems));
      return;
    }

    // 2) tenta carregar o JSON externo
    try{
      const res = await fetch(DATA_URL, {cache:'no-store'});
      if (res.ok){
        const payload = await res.json(); // { items:[...] }
        if (Array.isArray(payload?.items) && payload.items.length){
          // salva no v2 (sem apagar nada do resto)
          S.mind365 = S.mind365 || {};
          S.mind365.items = payload.items;
          writeState(S);
          render(pickForToday(payload.items));
          return;
        }
      }
    }catch(e){
      // segue pro seed
    }

    // 3) fallback seed local (não grava nada no LS — apenas exibe)
    render(pickForToday(SEED));
  }

  document.addEventListener('DOMContentLoaded', boot);
})();