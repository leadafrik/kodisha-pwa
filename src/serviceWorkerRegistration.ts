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
        if (config?.onSuccess) config.onSuccess(reg);

        if (reg.waiting && config?.onUpdate) {
          config.onUpdate(reg);
        }

        reg.onupdatefound = () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.onstatechange = () => {
            if (installing.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                if (config?.onUpdate) config.onUpdate(reg);
              } else if (config?.onSuccess) {
                config.onSuccess(reg);
              }
            }
          };
        };
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
