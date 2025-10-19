// Registra o SW com escopo da raiz (ajuste se seu site estiver em subpasta)
(function(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js', { scope: '/' });

      // Se houver SW novo, pede para ativar logo
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');

      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            // SW atualizado — força pegar recursos novos
            reg.waiting && reg.waiting.postMessage('SKIP_WAITING');
            // Opcional: auto-reload suave
            setTimeout(() => window.location.reload(), 400);
          }
        });
      });

      // Quando o SW ativar, recarrega uma vez para limpar cache antigo de HTML/JS
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (e) {
      console.warn('SW registration failed', e);
    }
  });
})();