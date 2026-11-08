/**
 * YouTube Thumbnail Saturation — Popup Controller
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const enabledToggle = document.getElementById('enabled-toggle');
  const saturationSlider = document.getElementById('saturation-slider');
  const saturationNum = document.getElementById('saturation-num');
  const shortsToggle = document.getElementById('shorts-toggle');
  const hoverToggle = document.getElementById('hover-toggle');
  const controlsEl = document.getElementById('controls');
  const optionsEl = document.getElementById('options');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const presetGroup = document.querySelector('.preset-group');

  const I18N = {
    ru: {
      title: "Насыщенность YouTube",
      toggleTitle: "Включить или выключить",
      optionsTitle: "Параметры",
      labelThumbnails: "Обложки видео",
      presetBw: "Ч/Б",
      presetAria: "Быстрые пресеты",
      applyShorts: "Применять к Shorts",
      hoverRestore: "Цвет при наведении",
      donate: "Поддержать проект"
    },
    en: {
      title: "YouTube Saturation",
      toggleTitle: "Enable or disable",
      optionsTitle: "Settings",
      labelThumbnails: "Video thumbnails",
      presetBw: "B&W",
      presetAria: "Quick presets",
      applyShorts: "Apply to Shorts",
      hoverRestore: "Restore color on hover",
      donate: "Support project"
    }
  };

  const txtTitle = document.getElementById('txt-title');
  const txtSwitchLabel = document.getElementById('txt-switch-label');
  const txtLabelThumbnails = document.getElementById('txt-label-thumbnails');
  const txtPresetBw = document.getElementById('txt-preset-bw');
  const txtOptShorts = document.getElementById('txt-opt-shorts');
  const txtOptHover = document.getElementById('txt-opt-hover');
  const btnOptions = document.getElementById('btn-options');
  const btnDonate = document.getElementById('btn-donate');
  const txtDonate = document.getElementById('txt-donate');

  function getEffectiveLang(langSetting) {
    if (langSetting === 'ru' || langSetting === 'en') {
      return langSetting;
    }
    const uiLang = (extApi && extApi.i18n && typeof extApi.i18n.getUILanguage === 'function')
      ? extApi.i18n.getUILanguage()
      : (navigator.language || 'en');
    return uiLang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function applyLanguage(langSetting) {
    const lang = getEffectiveLang(langSetting);
    const strings = I18N[lang] || I18N.en;

    document.title = strings.title;
    if (txtTitle) txtTitle.textContent = strings.title;
    if (txtSwitchLabel) txtSwitchLabel.title = strings.toggleTitle;
    if (txtLabelThumbnails) txtLabelThumbnails.textContent = strings.labelThumbnails;
    if (txtPresetBw) txtPresetBw.textContent = strings.presetBw;
    if (txtOptShorts) txtOptShorts.textContent = strings.applyShorts;
    if (txtOptHover) txtOptHover.textContent = strings.hoverRestore;
    if (btnOptions) btnOptions.title = strings.optionsTitle;
    if (presetGroup) presetGroup.setAttribute('aria-label', strings.presetAria);
    if (txtDonate) txtDonate.textContent = strings.donate;
    if (btnDonate) btnDonate.title = strings.donate;
  }

  const DEFAULT_SETTINGS = {
    enabled: true,
    saturation: 30,
    applyShorts: true,
    hoverRestore: true,
    language: 'auto'
  };

  let currentSettings = { ...DEFAULT_SETTINGS };

  function updateVisuals(settings) {
    applyLanguage(settings.language);
    if (enabledToggle) {
      enabledToggle.checked = settings.enabled !== false;
    }

    const isEnabled = settings.enabled !== false;
    if (isEnabled) {
      if (controlsEl) controlsEl.classList.remove('disabled-state');
      if (optionsEl) optionsEl.classList.remove('disabled-state');
    } else {
      if (controlsEl) controlsEl.classList.add('disabled-state');
      if (optionsEl) optionsEl.classList.add('disabled-state');
    }

    const sat = typeof settings.saturation === 'number'
      ? Math.max(0, Math.min(100, settings.saturation))
      : (parseInt(settings.saturation, 10) || DEFAULT_SETTINGS.saturation);

    if (saturationSlider) {
      saturationSlider.value = sat;
      saturationSlider.style.setProperty('--val', `${sat}%`);
    }
    if (saturationNum) {
      saturationNum.value = sat;
    }

    presetButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      if (val === sat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (shortsToggle) shortsToggle.checked = settings.applyShorts !== false;
    if (hoverToggle) hoverToggle.checked = settings.hoverRestore !== false;
  }

  function safeSetStorage(area, data) {
    if (!area) return;
    try {
      const res = area.set(data, () => {
        if (extApi && extApi.runtime && extApi.runtime.lastError) {
          // ignore or log
        }
      });
      if (res && typeof res.catch === 'function') {
        res.catch(() => {});
      }
    } catch (e) {
      console.warn('[YT Saturation] Storage set failed:', e);
    }
  }

  function saveSettings() {
    if (!extApi || !extApi.storage) return;
    // Dual-write: cloud sync + local cache
    safeSetStorage(extApi.storage.sync, currentSettings);
    safeSetStorage(extApi.storage.local, currentSettings);
  }

  function setSaturation(val) {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? DEFAULT_SETTINGS.saturation : val));
    currentSettings.saturation = clamped;
    updateVisuals(currentSettings);
    saveSettings();
  }

  function readStorage(defaults, callback) {
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

  function init() {
    readStorage(DEFAULT_SETTINGS, (stored) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...(stored || {}) };
      updateVisuals(currentSettings);
    });
  }

  if (enabledToggle) {
    enabledToggle.addEventListener('change', () => {
      currentSettings.enabled = enabledToggle.checked;
      updateVisuals(currentSettings);
      saveSettings();
    });
  }

  if (saturationSlider) {
    saturationSlider.addEventListener('input', () => {
      setSaturation(parseInt(saturationSlider.value, 10));
    });
  }

  if (saturationNum) {
    saturationNum.addEventListener('input', () => {
      if (saturationNum.value !== '') {
        setSaturation(parseInt(saturationNum.value, 10));
      }
    });

    saturationNum.addEventListener('change', () => {
      setSaturation(parseInt(saturationNum.value, 10));
    });
  }

  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setSaturation(parseInt(btn.getAttribute('data-val'), 10));
    });
  });

  if (shortsToggle) {
    shortsToggle.addEventListener('change', () => {
      currentSettings.applyShorts = shortsToggle.checked;
      saveSettings();
    });
  }

  if (hoverToggle) {
    hoverToggle.addEventListener('change', () => {
      currentSettings.hoverRestore = hoverToggle.checked;
      saveSettings();
    });
  }

  if (extApi && extApi.storage && extApi.storage.onChanged) {
    extApi.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        readStorage(DEFAULT_SETTINGS, (stored) => {
          if (stored) {
            currentSettings = { ...currentSettings, ...stored };
            updateVisuals(currentSettings);
          }
        });
      }
    });
  }

  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (extApi && extApi.runtime && extApi.runtime.openOptionsPage) {
        extApi.runtime.openOptionsPage();
      }
    });
  }

  if (btnDonate) {
    btnDonate.addEventListener('click', () => {
      const donateUrl = extApi && extApi.runtime && extApi.runtime.getURL
        ? extApi.runtime.getURL('donate/donate.html')
        : 'donate/donate.html';

      if (extApi && extApi.tabs && extApi.tabs.create) {
        extApi.tabs.create({ url: donateUrl });
      } else {
        window.open(donateUrl, '_blank');
      }
    });
  }

  init();
})();
