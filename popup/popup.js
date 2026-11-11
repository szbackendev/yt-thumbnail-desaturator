/**
 * YouTube Thumbnail Saturation — Popup Controller
 */
(function () {
  'use strict';

  const settingsApi = YtThumbnailSettings;
  const extApi = settingsApi.api;

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
      saturationAria: "Процент насыщенности",
      optionsTitle: "Параметры",
      labelThumbnails: "Обложки видео",
      presetBw: "Ч/Б",
      presetAria: "Быстрые пресеты",
      applyShorts: "Применять к Shorts",
      hoverRestore: "Цвет при наведении",
      donate: "Поддержать проект"
    },
    en: {
      title: "YouTube saturation",
      toggleTitle: "Enable or disable",
      saturationAria: "Saturation percentage",
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
    return settingsApi.effectiveLanguage(langSetting);
  }

  function applyLanguage(langSetting) {
    const lang = getEffectiveLang(langSetting);
    const strings = I18N[lang] || I18N.en;

    document.title = strings.title;
    document.documentElement.lang = lang;
    if (enabledToggle) enabledToggle.setAttribute('aria-label', strings.toggleTitle);
    if (saturationNum) saturationNum.setAttribute('aria-label', strings.saturationAria);
    if (txtTitle) txtTitle.textContent = strings.title;
    if (txtSwitchLabel) txtSwitchLabel.title = strings.toggleTitle;
    if (txtLabelThumbnails) txtLabelThumbnails.textContent = strings.labelThumbnails;
    if (txtPresetBw) txtPresetBw.textContent = strings.presetBw;
    if (txtOptShorts) txtOptShorts.textContent = strings.applyShorts;
    if (txtOptHover) txtOptHover.textContent = strings.hoverRestore;
    if (btnOptions) {
      btnOptions.title = strings.optionsTitle;
      btnOptions.setAttribute('aria-label', strings.optionsTitle);
    }
    if (presetGroup) presetGroup.setAttribute('aria-label', strings.presetAria);
    if (txtDonate) txtDonate.textContent = strings.donate;
    if (btnDonate) btnDonate.title = strings.donate;
  }

  const DEFAULT_SETTINGS = settingsApi.defaults;

  let currentSettings = { ...DEFAULT_SETTINGS };

  function updateVisuals(settings) {
    applyLanguage(settings.language);
    if (enabledToggle) {
      enabledToggle.checked = settings.enabled !== false;
    }

    const isEnabled = settings.enabled !== false;
    [saturationSlider, saturationNum, shortsToggle, hoverToggle, ...presetButtons].forEach((control) => {
      if (control) control.disabled = !isEnabled;
    });
    if (isEnabled) {
      if (controlsEl) controlsEl.classList.remove('disabled-state');
      if (optionsEl) optionsEl.classList.remove('disabled-state');
    } else {
      if (controlsEl) controlsEl.classList.add('disabled-state');
      if (optionsEl) optionsEl.classList.add('disabled-state');
    }

    const sat = settingsApi.normalizeSaturation(settings.saturation);

    if (saturationSlider) {
      saturationSlider.value = sat;
      saturationSlider.style.setProperty('--val', `${sat}%`);
    }
    if (saturationNum) {
      saturationNum.value = sat;
    }

    presetButtons.forEach((btn) => {
      const val = parseInt(btn.getAttribute('data-val'), 10);
      btn.setAttribute('aria-pressed', String(val === sat));
      if (val === sat) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (shortsToggle) shortsToggle.checked = settings.applyShorts !== false;
    if (hoverToggle) hoverToggle.checked = settings.hoverRestore !== false;
  }

  const pendingEdits = {};

  function saveSettings(patch) {
    Object.assign(pendingEdits, patch);
    settingsApi.write(patch).catch((error) => console.warn('[YT Saturation] Save failed:', error));
  }

  function setSaturation(val) {
    const clamped = settingsApi.normalizeSaturation(val);
    currentSettings.saturation = clamped;
    updateVisuals(currentSettings);
    saveSettings({ saturation: clamped });
  }

  function init() {
    settingsApi.observe((stored) => {
      for (const key of Object.keys(pendingEdits)) {
        if (stored[key] === pendingEdits[key]) delete pendingEdits[key];
      }
      currentSettings = { ...stored, ...pendingEdits };
      updateVisuals(currentSettings);
    });
  }

  if (enabledToggle) {
    enabledToggle.addEventListener('change', () => {
      currentSettings.enabled = enabledToggle.checked;
      updateVisuals(currentSettings);
      saveSettings({ enabled: currentSettings.enabled });
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
      saveSettings({ applyShorts: currentSettings.applyShorts });
    });
  }

  if (hoverToggle) {
    hoverToggle.addEventListener('change', () => {
      currentSettings.hoverRestore = hoverToggle.checked;
      saveSettings({ hoverRestore: currentSettings.hoverRestore });
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
