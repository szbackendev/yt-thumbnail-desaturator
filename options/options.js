/**
 * YouTube Saturation — Options Page Controller
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : chrome;

  const I18N = {
    ru: {
      pageTitle: "Параметры расширения",
      langTitle: "Язык интерфейса",
      langDesc: "Выберите язык для всплывающего окна и параметров расширения.",
      langAuto: "Системный (Авто)",
      langAutoDesc: "Как в браузере",
      syncTitle: "Синхронизация",
      syncDesc: "Настройки сохраняются в профиле и синхронизируются через аккаунт браузера.",
      saved: "Сохранено"
    },
    en: {
      pageTitle: "Extension Settings",
      langTitle: "Interface Language",
      langDesc: "Choose language for popup window and extension settings.",
      langAuto: "System (Auto)",
      langAutoDesc: "Follow browser",
      syncTitle: "Cloud Synchronization",
      syncDesc: "Settings are stored in your profile and synced across devices via browser account.",
      saved: "Saved"
    }
  };

  const radios = document.querySelectorAll('input[name="lang"]');
  const titleEl = document.getElementById('opt-page-title');
  const langTitleEl = document.getElementById('opt-lang-title');
  const langDescEl = document.getElementById('opt-lang-desc');
  const langAutoEl = document.getElementById('opt-lang-auto');
  const langAutoDescEl = document.getElementById('opt-lang-auto-desc');
  const syncTitleEl = document.getElementById('opt-sync-title');
  const syncDescEl = document.getElementById('opt-sync-desc');
  const statusEl = document.getElementById('save-status');

  function getEffectiveLang(langSetting) {
    if (langSetting === 'ru' || langSetting === 'en') {
      return langSetting;
    }
    // Auto detection
    const uiLang = (extApi.i18n && typeof extApi.i18n.getUILanguage === 'function') 
      ? extApi.i18n.getUILanguage() 
      : (navigator.language || 'en');
    return uiLang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function applyLanguage(langChoice) {
    const lang = getEffectiveLang(langChoice);
    const strings = I18N[lang] || I18N.en;

    titleEl.textContent = strings.pageTitle;
    langTitleEl.textContent = strings.langTitle;
    langDescEl.textContent = strings.langDesc;
    langAutoEl.textContent = strings.langAuto;
    langAutoDescEl.textContent = strings.langAutoDesc;
    syncTitleEl.textContent = strings.syncTitle;
    syncDescEl.textContent = strings.syncDesc;
    statusEl.textContent = strings.saved;
  }

  function save(langValue) {
    applyLanguage(langValue);

    const payload = { language: langValue };

    if (extApi.storage && extApi.storage.sync) {
      extApi.storage.sync.set(payload).catch(() => {});
    }
    if (extApi.storage && extApi.storage.local) {
      extApi.storage.local.set(payload).catch(() => {});
    }

    statusEl.style.opacity = '1';
    setTimeout(() => {
      statusEl.style.opacity = '0.7';
    }, 1500);
  }

  function init() {
    const storage = extApi.storage && extApi.storage.sync ? extApi.storage.sync : extApi.storage.local;

    storage.get({ language: 'auto' }).then((res) => {
      const choice = res && res.language ? res.language : 'auto';
      radios.forEach((r) => {
        r.checked = (r.value === choice);
      });
      applyLanguage(choice);
    }).catch(() => {
      // Fallback local
      if (extApi.storage && extApi.storage.local) {
        extApi.storage.local.get({ language: 'auto' }, (res) => {
          const choice = res && res.language ? res.language : 'auto';
          radios.forEach((r) => {
            r.checked = (r.value === choice);
          });
          applyLanguage(choice);
        });
      }
    });

    radios.forEach((r) => {
      r.addEventListener('change', () => {
        if (r.checked) {
          save(r.value);
        }
      });
    });
  }

  init();
})();

