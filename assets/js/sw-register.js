// Registra o Service Worker (PWA)
(function(){
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => {
        // atualiza automaticamente quando houver SW novo
        if (reg.waiting) { reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              // SW novo instalado; próxima navegação já usa
              console.log('[FlowOn] SW atualizado.');
            }
          });
        });
      })
      .catch(err => console.warn('[FlowOn] SW erro:', err));
  });

  // Mensagem para ativar SW novo imediatamente
  navigator.serviceWorker?.addEventListener?.('message', (e) => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
})();