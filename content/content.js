/**
 * YouTube Thumbnail Desaturator — Content Script
 * Applies CSS attributes and variables to document.documentElement
 * Listens for live updates via storage.onChanged and YouTube SPA navigation
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const DEFAULT_CONFIG = {
    enabled: true,
    saturation: 30,
    applyShorts: true,
    hoverRestore: true
  };

  function updateDom(config) {
    const root = document.documentElement;
    if (!root) {
      // If root is not yet parsed, attach as soon as <html> appears to eliminate color flashing
      const obs = new MutationObserver(() => {
        if (document.documentElement) {
          obs.disconnect();
          updateDom(config);
        }
      });
      obs.observe(document, { childList: true });
      return;
    }

    const cfg = config || DEFAULT_CONFIG;
    const isEnabled = cfg.enabled !== false;
    const saturation = typeof cfg.saturation === 'number'
      ? Math.max(0, Math.min(100, cfg.saturation))
      : (parseInt(cfg.saturation, 10) || DEFAULT_CONFIG.saturation);
    const applyShorts = cfg.applyShorts !== false;
    const hoverRestore = cfg.hoverRestore !== false;

    root.setAttribute('data-yt-sat-enabled', isEnabled ? 'true' : 'false');
    root.setAttribute('data-yt-sat-shorts', applyShorts ? 'true' : 'false');
    root.setAttribute('data-yt-sat-hover', hoverRestore ? 'true' : 'false');
    root.style.setProperty('--yt-thumb-sat', `${saturation}%`);
  }

  function fetchStorage(defaults, callback) {
    if (!extApi || !extApi.storage) {
      callback(defaults);
      return;
    }

    const syncArea = extApi.storage.sync;
    const localArea = extApi.storage.local;
    const primary = syncArea || localArea;

    let resolved = false;
    const done = (data) => {
      if (!resolved) {
        resolved = true;
        callback(data || defaults);
      }
    };

    try {
      const p = primary.get(defaults, (items) => {
        if (extApi.runtime && extApi.runtime.lastError) {
          // If primary failed, try local fallback
          if (localArea && primary !== localArea) {
            try {
              localArea.get(defaults, (localItems) => done(localItems || defaults));
            } catch {
              done(defaults);
            }
          } else {
            done(defaults);
          }
        } else {
          done(items);
        }
      });

      // Handle Promise return for Gecko / modern MV3
      if (p && typeof p.then === 'function') {
        p.then((items) => {
          if (items && Object.keys(items).length > 0) {
            done(items);
          } else if (localArea && primary !== localArea) {
            localArea.get(defaults).then(done).catch(() => done(defaults));
          } else {
            done(defaults);
          }
        }).catch(() => {
          if (localArea && primary !== localArea) {
            try {
              const lp = localArea.get(defaults, done);
              if (lp && typeof lp.then === 'function') {
                lp.then(done).catch(() => done(defaults));
              }
            } catch {
              done(defaults);
            }
          } else {
            done(defaults);
          }
        });
      }
    } catch {
      done(defaults);
    }
  }

  function fetchAndApply() {
    fetchStorage(DEFAULT_CONFIG, updateDom);
  }

  // Initial early injection
  fetchAndApply();

  // Handle storage changes in real-time across tabs without page reload
  if (extApi && extApi.storage && extApi.storage.onChanged) {
    extApi.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        fetchAndApply();
      }
    });
  }

  // Backup sync on YouTube SPA in-page navigation (e.g. Home -> Watch -> Search)
  window.addEventListener('yt-navigate-finish', fetchAndApply, { passive: true });

  // Backup check on DOMContentLoaded in case documentElement attributes were manipulated
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndApply, { once: true });
  }
})();
