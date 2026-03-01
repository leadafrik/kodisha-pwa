Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);
// isLocalhost is not used but kept for potential debugging purposes

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(reg => {
        if (reg.waiting && config?.onUpdate) {
          config.onUpdate(reg);
        }

        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;

          if (!installingWorker) {
            return;
          }

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state !== 'installed') {
              return;
            }

            if (navigator.serviceWorker.controller) {
              if (config?.onUpdate) config.onUpdate(reg);
            } else {
              if (config?.onSuccess) config.onSuccess(reg);
            }
          });
        });

        const triggerUpdateCheck = () => {
          reg.update().catch(() => {
            /* silent */
          });
        };

        window.addEventListener('focus', triggerUpdateCheck);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            triggerUpdateCheck();
          }
        });

        triggerUpdateCheck();
      })
      .catch(() => {
        /* silent */
      });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
  }
}
