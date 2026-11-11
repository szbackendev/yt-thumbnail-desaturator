/**
 * YouTube Thumbnail Desaturator — Content Script
 * Applies CSS attributes and variables to document.documentElement
 * Listens for live updates via storage.onChanged and YouTube SPA navigation
 */
(function () {
  'use strict';

  let currentConfig;
  let rootObserver;

  function updateDom(config = currentConfig) {
    currentConfig = config;
    const root = document.documentElement;
    if (!root) {
      if (!rootObserver) {
        rootObserver = new MutationObserver(() => {
          if (document.documentElement) {
            rootObserver.disconnect();
            rootObserver = null;
            updateDom();
          }
        });
        rootObserver.observe(document, { childList: true });
      }
      return;
    }

    root.setAttribute('data-yt-sat-enabled', String(config.enabled));
    root.setAttribute('data-yt-sat-shorts', String(config.applyShorts));
    root.setAttribute('data-yt-sat-hover', String(config.hoverRestore));
    root.style.setProperty('--yt-thumb-sat', `${config.saturation}%`);
  }

  YtThumbnailSettings.observe(updateDom);
  // Reapply cached configuration on SPA navigation, without stale storage reads.
  window.addEventListener('yt-navigate-finish', () => updateDom(), { passive: true });
})();
