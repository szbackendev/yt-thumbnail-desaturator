/**
 * YouTube Thumbnail Saturation — Popup Controller
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : chrome;

  const enabledToggle = document.getElementById('enabled-toggle');
  const saturationSlider = document.getElementById('saturation-slider');
  const saturationNum = document.getElementById('saturation-num');
  const shortsToggle = document.getElementById('shorts-toggle');
  const hoverToggle = document.getElementById('hover-toggle');
  const controlsEl = document.getElementById('controls');
  const optionsEl = document.getElementById('options');
  const presetButtons = document.querySelectorAll('.preset-btn');

  const I18N = {
    ru: {
      title: "Насыщенность YouTube",
      toggleTitle: "Включить или выключить",
      optionsTitle: "Параметры",
      labelThumbnails: "Обложки видео",
      presetBw: "Ч/Б",
      applyShorts: "Применять к Shorts",
      hoverRestore: "Цвет при наведении"
    },
    en: {
      title: "YouTube Saturation",
      toggleTitle: "Enable or disable",
      optionsTitle: "Settings",
      labelThumbnails: "Video thumbnails",
      presetBw: "B&W",
      applyShorts: "Apply to Shorts",
      hoverRestore: "Restore color on hover"
    }
  };

  const txtTitle = document.getElementById('txt-title');
  const txtSwitchLabel = document.getElementById('txt-switch-label');
  const txtLabelThumbnails = document.getElementById('txt-label-thumbnails');
  const txtPresetBw = document.getElementById('txt-preset-bw');
  const txtOptShorts = document.getElementById('txt-opt-shorts');
  const txtOptHover = document.getElementById('txt-opt-hover');
  const btnOptions = document.getElementById('btn-options');

  function getEffectiveLang(langSetting) {
    if (langSetting === 'ru' || langSetting === 'en') {
      return langSetting;
    }
    const uiLang = (extApi.i18n && typeof extApi.i18n.getUILanguage === 'function')
      ? extApi.i18n.getUILanguage()
      : (navigator.language || 'en');
    return uiLang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function applyLanguage(langSetting) {
    const lang = getEffectiveLang(langSetting);
    const strings = I18N[lang] || I18N.en;

    if (txtTitle) txtTitle.textContent = strings.title;
    if (txtSwitchLabel) txtSwitchLabel.title = strings.toggleTitle;
    if (txtLabelThumbnails) txtLabelThumbnails.textContent = strings.labelThumbnails;
    if (txtPresetBw) txtPresetBw.textContent = strings.presetBw;
    if (txtOptShorts) txtOptShorts.textContent = strings.applyShorts;
    if (txtOptHover) txtOptHover.textContent = strings.hoverRestore;
    if (btnOptions) btnOptions.title = strings.optionsTitle;
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
    enabledToggle.checked = settings.enabled;

    if (settings.enabled) {
      controlsEl.classList.remove('disabled-state');
      optionsEl.classList.remove('disabled-state');
    } else {
      controlsEl.classList.add('disabled-state');
      optionsEl.classList.add('disabled-state');
    }

    saturationSlider.value = settings.saturation;
    saturationSlider.style.setProperty('--val', `${settings.saturation}%`);
    saturationNum.value = settings.saturation;

    presetButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      if (val === settings.saturation) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    shortsToggle.checked = settings.applyShorts;
    hoverToggle.checked = settings.hoverRestore;
  }

  const storageArea = extApi.storage && extApi.storage.sync ? extApi.storage.sync : extApi.storage.local;

  function saveSettings() {
    try {
      // Dual-write: save to sync (cloud) and local (offline backup)
      if (extApi.storage && extApi.storage.sync) {
        extApi.storage.sync.set(currentSettings).catch(() => {});
      }
      if (extApi.storage && extApi.storage.local) {
        extApi.storage.local.set(currentSettings).catch(() => {});
      }
    } catch (e) {
      console.error('[YT Saturation] Storage save error:', e);
    }
  }

  function setSaturation(val) {
    const clamped = Math.max(0, Math.min(100, isNaN(val) ? DEFAULT_SETTINGS.saturation : val));
    currentSettings.saturation = clamped;
    updateVisuals(currentSettings);
    saveSettings();
  }

  function init() {
    try {
      const getPromise = storageArea.get(DEFAULT_SETTINGS);
      if (getPromise && typeof getPromise.then === 'function') {
        getPromise.then((stored) => {
          if (stored && Object.keys(stored).length > 0) {
            currentSettings = { ...DEFAULT_SETTINGS, ...stored };
            updateVisuals(currentSettings);
          } else {
            // Fallback to local if sync returned empty
            extApi.storage.local.get(DEFAULT_SETTINGS).then((localStored) => {
              currentSettings = { ...DEFAULT_SETTINGS, ...(localStored || {}) };
              updateVisuals(currentSettings);
            }).catch(() => updateVisuals(currentSettings));
          }
        }).catch(() => {
          extApi.storage.local.get(DEFAULT_SETTINGS).then((localStored) => {
            currentSettings = { ...DEFAULT_SETTINGS, ...(localStored || {}) };
            updateVisuals(currentSettings);
          }).catch(() => updateVisuals(currentSettings));
        });
      } else {
        storageArea.get(DEFAULT_SETTINGS, (stored) => {
          currentSettings = { ...DEFAULT_SETTINGS, ...(stored || {}) };
          updateVisuals(currentSettings);
        });
      }
    } catch (e) {
      updateVisuals(currentSettings);
    }
  }

  enabledToggle.addEventListener('change', () => {
    currentSettings.enabled = enabledToggle.checked;
    updateVisuals(currentSettings);
    saveSettings();
  });

  saturationSlider.addEventListener('input', () => {
    setSaturation(parseInt(saturationSlider.value, 10));
  });

  saturationNum.addEventListener('change', () => {
    setSaturation(parseInt(saturationNum.value, 10));
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setSaturation(parseInt(btn.getAttribute('data-val'), 10));
    });
  });

  shortsToggle.addEventListener('change', () => {
    currentSettings.applyShorts = shortsToggle.checked;
    saveSettings();
  });

  hoverToggle.addEventListener('change', () => {
    currentSettings.hoverRestore = hoverToggle.checked;
    saveSettings();
  });

  if (extApi.storage && extApi.storage.onChanged) {
    extApi.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        storageArea.get(DEFAULT_SETTINGS).then((stored) => {
          if (stored) {
            currentSettings = { ...currentSettings, ...stored };
            updateVisuals(currentSettings);
          }
        }).catch(() => {});
      }
    });
  }

  if (btnOptions) {
    btnOptions.addEventListener('click', () => {
      if (extApi.runtime && extApi.runtime.openOptionsPage) {
        extApi.runtime.openOptionsPage();
      }
    });
  }

  init();
})();
