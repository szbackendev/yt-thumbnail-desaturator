/**
 * YouTube Saturation — Options Page Controller
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  const I18N = {
    ru: {
      pageTitle: "Параметры расширения",
      docTitle: "Настройки — YouTube Thumbnail Saturation",
      langTitle: "Язык интерфейса",
      langDesc: "Выберите язык для всплывающего окна и параметров расширения.",
      langAuto: "Системный (Авто)",
      langAutoDesc: "Как в браузере",
      langRuDesc: "Русский",
      langEnDesc: "Английский",
      syncTitle: "Синхронизация",
      syncDesc: "Настройки сохраняются в профиле и синхронизируются через аккаунт браузера.",
      supportTitle: "Поддержать проект",
      supportDesc: "Если вам нравится расширение, вы можете поддержать автора любой суммой.",
      supportBtn: "Страница донатов (Карты, СБП, Криптовалюта) →",
      saved: "Сохранено"
    },
    en: {
      pageTitle: "Extension Settings",
      docTitle: "Settings — YouTube Thumbnail Saturation",
      langTitle: "Interface Language",
      langDesc: "Choose language for popup window and extension settings.",
      langAuto: "System (Auto)",
      langAutoDesc: "Follow browser",
      langRuDesc: "Russian",
      langEnDesc: "English",
      syncTitle: "Cloud Synchronization",
      syncDesc: "Settings are stored in your profile and synced across devices via browser account.",
      supportTitle: "Support Project",
      supportDesc: "If you enjoy this extension, consider supporting the developer with a tip.",
      supportBtn: "Donation page (Cards, Crypto, DonationAlerts) →",
      saved: "Saved"
    }
  };

  const radios = document.querySelectorAll('input[name="lang"]');
  const titleEl = document.getElementById('opt-page-title');
  const langTitleEl = document.getElementById('opt-lang-title');
  const langDescEl = document.getElementById('opt-lang-desc');
  const langAutoEl = document.getElementById('opt-lang-auto');
  const langAutoDescEl = document.getElementById('opt-lang-auto-desc');
  const langRuDescEl = document.getElementById('opt-lang-ru-desc');
  const langEnDescEl = document.getElementById('opt-lang-en-desc');
  const syncTitleEl = document.getElementById('opt-sync-title');
  const syncDescEl = document.getElementById('opt-sync-desc');
  const supportTitleEl = document.getElementById('opt-support-title');
  const supportDescEl = document.getElementById('opt-support-desc');
  const supportBtnEl = document.getElementById('opt-support-btn');
  const statusEl = document.getElementById('save-status');
  const verEl = document.getElementById('opt-version');

  function getEffectiveLang(langSetting) {
    if (langSetting === 'ru' || langSetting === 'en') {
      return langSetting;
    }
    const uiLang = (extApi && extApi.i18n && typeof extApi.i18n.getUILanguage === 'function')
      ? extApi.i18n.getUILanguage()
      : (navigator.language || 'en');
    return uiLang.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  }

  function applyLanguage(langChoice) {
    const lang = getEffectiveLang(langChoice);
    const strings = I18N[lang] || I18N.en;

    document.title = strings.docTitle;
    if (titleEl) titleEl.textContent = strings.pageTitle;
    if (langTitleEl) langTitleEl.textContent = strings.langTitle;
    if (langDescEl) langDescEl.textContent = strings.langDesc;
    if (langAutoEl) langAutoEl.textContent = strings.langAuto;
    if (langAutoDescEl) langAutoDescEl.textContent = strings.langAutoDesc;
    if (langRuDescEl) langRuDescEl.textContent = strings.langRuDesc;
    if (langEnDescEl) langEnDescEl.textContent = strings.langEnDesc;
    if (syncTitleEl) syncTitleEl.textContent = strings.syncTitle;
    if (syncDescEl) syncDescEl.textContent = strings.syncDesc;
    if (supportTitleEl) supportTitleEl.textContent = strings.supportTitle;
    if (supportDescEl) supportDescEl.textContent = strings.supportDesc;
    if (supportBtnEl) supportBtnEl.textContent = strings.supportBtn;
    if (statusEl) statusEl.textContent = strings.saved;
  }

  function safeSetStorage(area, data) {
    if (!area) return;
    try {
      const res = area.set(data, () => {});
      if (res && typeof res.catch === 'function') {
        res.catch(() => {});
      }
    } catch (e) {
      console.warn('[YT Saturation] Options set failed:', e);
    }
  }

  function save(langValue) {
    applyLanguage(langValue);

    const payload = { language: langValue };

    if (extApi && extApi.storage) {
      safeSetStorage(extApi.storage.sync, payload);
      safeSetStorage(extApi.storage.local, payload);
    }

    if (statusEl) {
      statusEl.style.opacity = '1';
      setTimeout(() => {
        statusEl.style.opacity = '0.7';
      }, 1500);
    }
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
    if (verEl) {
      const manifestVer = (extApi && extApi.runtime && extApi.runtime.getManifest)
        ? extApi.runtime.getManifest().version
        : '1.0.0';
      verEl.textContent = `v${manifestVer}`;
    }

    readStorage({ language: 'auto' }, (res) => {
      const choice = res && res.language ? res.language : 'auto';
      radios.forEach((r) => {
        r.checked = (r.value === choice);
      });
      applyLanguage(choice);
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
