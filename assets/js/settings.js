/* ====== Flow On — Settings (compat v1/v2 + legacy) ====== */
const KEYS = {
  legacy: 'flowon',      // usado pela página de Hábitos/Daily legada
  v2:     'flowon.v2',   // usado pela Home nova e outros módulos
  cfg:    'flowon.config'
};

/* ---------- Config (tema/semana) ---------- */
const Config = {
  _c: { theme: 'gold', week: 'monday' },
  load() {
    try {
      const raw = localStorage.getItem(KEYS.cfg);
      if (raw) this._c = JSON.parse(raw);
    } catch(e) { console.error('[Settings] config load', e); }
  },
  save() {
    localStorage.setItem(KEYS.cfg, JSON.stringify(this._c));
  }
};

/* ---------- Data (lê/grava vários stores) ---------- */
const Data = {
  read(key) {
    try { return localStorage.getItem(key) || ''; }
    catch { return ''; }
  },
  write(key, json) {
    localStorage.setItem(key, json);
  },
  remove(key) {
    localStorage.removeItem(key);
  },

  /* Exporta um pacote único com legacy + v2 + config */
  exportBundle() {
    const bundle = {
      __flowon_export__: 1,
      exportedAt: new Date().toISOString(),
      stores: {
        legacy: this.read(KEYS.legacy), // string JSON (ou "")
        v2:     this.read(KEYS.v2),
        config: localStorage.getItem(KEYS.cfg) || ''
      }
    };
    return JSON.stringify(bundle, null, 2);
  },

  /* Importa: aceita bundle acima OU JSON cru de um store (fallback) */
  importAny(text) {
    let obj = null;
    try { obj = JSON.parse(text); } catch { /* tratar abaixo */ }

    // Caso 1: pacote bundle “oficial”
    if (obj && obj.__flowon_export__ === 1 && obj.stores) {
      const { legacy='', v2='', config='' } = obj.stores;

      if (legacy) this.write(KEYS.legacy, legacy);
      if (v2)     this.write(KEYS.v2, v2);
      if (config) localStorage.setItem(KEYS.cfg, config);

      return { ok:true, mode:'bundle', details:{ hasLegacy:!!legacy, hasV2:!!v2, hasCfg:!!config } };
    }

    // Caso 2: JSON cru — tentar heurística
    // 2a) Se parece ter raiz de journal.habits (provável LEGACY)
    if (obj && (obj.journal?.habits || obj.habits || obj.journal?.daily?.byDate)) {
      this.write(KEYS.legacy, text);
      return { ok:true, mode:'legacy-raw' };
    }

    // 2b) Se parece com v2 (journal.month/items, tri/byQuarter, posts)
    if (obj && (Array.isArray(obj?.journal?.daily) || obj?.journal?.tri?.byQuarter || Array.isArray(obj?.posts))) {
      this.write(KEYS.v2, text);
      return { ok:true, mode:'v2-raw' };
    }

    // 2c) Se parece com config
    if (obj && (obj.theme || obj.week)) {
      localStorage.setItem(KEYS.cfg, text);
      return { ok:true, mode:'config-raw' };
    }

    // Se não deu pra classificar, cai como legacy por padrão (melhor do que perder)
    this.write(KEYS.legacy, text);
    return { ok:true, mode:'fallback-legacy' };
  },

  /* Reset seguro: limpa legacy + v2; mantém config (tema) */
  resetAll({ wipeConfig=false } = {}) {
    this.remove(KEYS.legacy);
    this.remove(KEYS.v2);
    if (wipeConfig) localStorage.removeItem(KEYS.cfg);
  }
};

/* ---------- Tema ---------- */
function applyTheme() {
  const root = document.documentElement;
  const t = Config._c.theme || 'gold';

  // Primeiro: limpar overrides comuns (evitar “fantasmas” de temas anteriores)
  const unsetVars = ['--bg','--card','--muted','--text','--gold'];
  unsetVars.forEach(v => root.style.removeProperty(v));

  if (t === 'red') {
    root.style.setProperty('--gold', '#e32526');
  } else if (t === 'clean') {
    root.style.setProperty('--bg',    '#0a0a0a');
    root.style.setProperty('--card',  '#121212');
    root.style.setProperty('--muted', '#1a1a1a');
    root.style.setProperty('--text',  '#ffffff');
  } else { // gold default
    root.style.setProperty('--gold', '#e0a96d');
  }
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  Config.load();
  applyTheme();

  // marcar item ativo (nav nova ou antiga)
  const markActive = () => {
    const paths = ['pages/settings/', './', '/pages/settings/'];
    // fo-nav (nova)
    document.querySelectorAll('.fo-nav .fo-item').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('is-active', href.includes('pages/settings/'));
    });
    // .menu (antiga)
    document.querySelectorAll('.menu a').forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('active', paths.some(p => href.endsWith(p)) || href.includes('pages/settings/'));
    });
  };
  markActive();

  // refs
  const cfgTheme = document.getElementById('cfgTheme');
  const cfgWeek  = document.getElementById('cfgWeek');
  if (cfgTheme) cfgTheme.value = Config._c.theme || 'gold';
  if (cfgWeek)  cfgWeek.value  = Config._c.week  || 'monday';

  if (cfgTheme) cfgTheme.onchange = () => {
    Config._c.theme = cfgTheme.value; Config.save(); applyTheme();
    alert('Tema salvo.');
  };
  if (cfgWeek) cfgWeek.onchange = () => {
    Config._c.week = cfgWeek.value; Config.save();
    alert('Preferência salva.');
  };

  // Exportar (bundle com legacy + v2 + config)
  const btnExport = document.getElementById('btnExport');
  if (btnExport) btnExport.onclick = () => {
    const blob = new Blob([Data.exportBundle()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flowon-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Importar (auto-detecta bundle/legacy/v2/config)
  const fileImport = document.getElementById('fileImport');
  if (fileImport) fileImport.onchange = async (ev) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const res = Data.importAny(text);
      alert('Backup importado com sucesso! (' + res.mode + ')');
      ev.target.value = ''; // limpa input
    } catch (e) {
      console.error('[Settings] import', e);
      alert('Arquivo inválido.');
    }
  };

  // Reset (limpa legacy + v2; mantém tema; opcional wipe total)
  const btnReset = document.getElementById('btnReset');
  if (btnReset) btnReset.onclick = () => {
    const sure = confirm('Tem certeza? Isso apagará os dados locais (hábitos, dailies, temas) de todas as versões.');
    if (!sure) return;
    const wipeTheme = confirm('Também deseja apagar as preferências de tema/semana? (OK = Sim, Cancelar = Não)');
    Data.resetAll({ wipeConfig: !!wipeTheme });
    alert('Dados apagados. Recarregue a página.');
  };
});