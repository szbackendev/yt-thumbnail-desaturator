/** Shared settings access for Promise-based Gecko and callback-based Chrome APIs. */
globalThis.YtThumbnailSettings = (() => {
  'use strict';

  const promiseApi = typeof browser !== 'undefined';
  const api = promiseApi ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  const defaults = Object.freeze({
    enabled: true, saturation: 30, applyShorts: true, hoverRestore: true, language: 'auto'
  });

  function normalizeSaturation(value) {
    const number = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
      ? Number(value) : NaN;
    return Number.isFinite(number) ? Math.round(Math.max(0, Math.min(100, number))) : defaults.saturation;
  }

  function normalize(settings) {
    return {
      enabled: settings.enabled !== false,
      saturation: normalizeSaturation(settings.saturation),
      applyShorts: settings.applyShorts !== false,
      hoverRestore: settings.hoverRestore !== false,
      language: ['ru', 'en'].includes(settings.language) ? settings.language : 'auto'
    };
  }

  function call(area, method, value) {
    if (!area) return Promise.reject(new Error('Storage area unavailable'));
    try {
      if (promiseApi) return Promise.resolve(area[method](value));
      return new Promise((resolve, reject) => {
        area[method](value, (result) => {
          const error = api?.runtime?.lastError;
          if (error) reject(new Error(error.message));
          else resolve(result);
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async function read() {
    if (!api?.storage) return { ...defaults };
    const keys = Object.keys(defaults);
    const [sync, local] = await Promise.allSettled([
      call(api.storage.sync, 'get', keys), call(api.storage.local, 'get', keys)
    ]);
    // Empty/partial sync must not mask the local cache with injected defaults.
    return normalize({ ...defaults,
      ...(local.status === 'fulfilled' ? local.value : {}),
      ...(sync.status === 'fulfilled' ? sync.value : {}) });
  }

  async function write(patch) {
    const payload = {};
    const normalized = normalize({ ...defaults, ...patch });
    for (const key of Object.keys(defaults)) {
      if (Object.hasOwn(patch, key)) payload[key] = normalized[key];
    }
    const results = await Promise.allSettled([
      call(api?.storage?.sync, 'set', payload), call(api?.storage?.local, 'set', payload)
    ]);
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`[YT Saturation] ${index === 0 ? 'sync' : 'local'} save failed:`, result.reason);
      }
    });
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Could not save settings');
    }
    return { synced: results[0].status === 'fulfilled', local: results[1].status === 'fulfilled' };
  }

  function observe(callback) {
    let current = { ...defaults };
    const pending = {};
    let initialized = false;
    const applyPatch = (patch) => {
      if (!initialized) Object.assign(pending, patch);
      current = normalize({ ...current, ...patch });
      callback(current);
    };
    const listener = (changes, areaName) => {
      if (areaName !== 'sync' && areaName !== 'local') return;
      const patch = {};
      for (const key of Object.keys(defaults)) {
        if (Object.hasOwn(changes, key)) patch[key] = changes[key].newValue ?? defaults[key];
      }
      if (!Object.keys(patch).length) return;
      applyPatch(patch);
    };
    api?.storage?.onChanged?.addListener(listener);
    callback(current); // Synchronous defaults before asynchronous storage access or first paint.
    read().then((stored) => {
      initialized = true;
      current = normalize({ ...stored, ...pending });
      callback(current);
    });
    // Local edits use the same startup race guard before onChanged is delivered.
    return applyPatch;
  }

  function effectiveLanguage(choice) {
    if (choice === 'ru' || choice === 'en') return choice;
    const language = api?.i18n?.getUILanguage?.() || navigator.language || 'en';
    return language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  return { api, defaults, normalizeSaturation, read, write, observe, effectiveLanguage };
})();