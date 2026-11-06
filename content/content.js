/**
 * YouTube Thumbnail Desaturator — Content Script
 * Applies CSS attributes and variables to document.documentElement
 * Listens for live updates via storage.onChanged
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : chrome;

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

    const isEnabled = config.enabled !== false;
    const saturation = typeof config.saturation === 'number' ? Math.max(0, Math.min(100, config.saturation)) : DEFAULT_CONFIG.saturation;
    const applyShorts = config.applyShorts !== false;
    const hoverRestore = config.hoverRestore !== false;

    root.setAttribute('data-yt-sat-enabled', isEnabled ? 'true' : 'false');
    root.setAttribute('data-yt-sat-shorts', applyShorts ? 'true' : 'false');
    root.setAttribute('data-yt-sat-hover', hoverRestore ? 'true' : 'false');
    root.style.setProperty('--yt-thumb-sat', `${saturation}%`);
  }

  const storageArea = extApi.storage && extApi.storage.sync ? extApi.storage.sync : extApi.storage.local;

  function fetchAndApply() {
    try {
      const getPromise = storageArea.get(DEFAULT_CONFIG);
      if (getPromise && typeof getPromise.then === 'function') {
        getPromise.then((items) => {
          if (items && Object.keys(items).length > 0) {
            updateDom(items);
          } else if (extApi.storage && extApi.storage.local) {
            extApi.storage.local.get(DEFAULT_CONFIG).then(updateDom).catch(() => updateDom(DEFAULT_CONFIG));
          } else {
            updateDom(DEFAULT_CONFIG);
          }
        }).catch(() => {
          if (extApi.storage && extApi.storage.local) {
            extApi.storage.local.get(DEFAULT_CONFIG).then(updateDom).catch(() => updateDom(DEFAULT_CONFIG));
          } else {
            updateDom(DEFAULT_CONFIG);
          }
        });
      } else {
        storageArea.get(DEFAULT_CONFIG, (items) => {
          updateDom(items || DEFAULT_CONFIG);
        });
      }
    } catch (e) {
      console.warn('[YT Desaturator] Storage call exception:', e);
      updateDom(DEFAULT_CONFIG);
    }
  }

  // Initial early injection
  fetchAndApply();

  // Handle storage changes in real-time without reloading page
  if (extApi.storage && extApi.storage.onChanged) {
    extApi.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        fetchAndApply();
      }
    });
  }

  // Backup check on DOMContentLoaded in case documentElement was recreated or attributes stripped
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndApply, { once: true });
  }
})();

