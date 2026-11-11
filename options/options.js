/**
 * YouTube Saturation — Options Page Controller
 */
(function () {
  'use strict';

  const settingsApi = YtThumbnailSettings;
  const extApi = settingsApi.api;

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
      saved: "Сохранено",
      savedLocal: "Сохранено локально; синхронизация недоступна",
      saveFailed: "Не удалось сохранить настройки"
    },
    en: {
      pageTitle: "Extension settings",
      docTitle: "Settings — YouTube Thumbnail Saturation",
      langTitle: "Interface language",
      langDesc: "Choose language for popup window and extension settings.",
      langAuto: "System (auto)",
      langAutoDesc: "Follow browser",
      langRuDesc: "Russian",
      langEnDesc: "English",
      syncTitle: "Cloud synchronization",
      syncDesc: "Settings are stored in your profile and synced across devices via browser account.",
      supportTitle: "Support project",
      supportDesc: "If you enjoy this extension, consider supporting the developer with a tip.",
      supportBtn: "Donation page (Cards, Crypto, DonationAlerts) →",
      saved: "Saved",
      savedLocal: "Saved locally; sync unavailable",
      saveFailed: "Could not save settings"
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
    return settingsApi.effectiveLanguage(langSetting);
  }

  function applyLanguage(langChoice) {
    const lang = getEffectiveLang(langChoice);
    const strings = I18N[lang] || I18N.en;

    document.title = strings.docTitle;
    document.documentElement.lang = lang;
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
  }

  let saveRevision = 0;
  let statusTimer;
  let updateSettings;

  async function save(langValue) {
    const revision = ++saveRevision;
    updateSettings({ language: langValue });
    const strings = I18N[getEffectiveLang(langValue)];
    let message;
    try {
      const result = await settingsApi.write({ language: langValue });
      message = result.synced ? strings.saved : strings.savedLocal;
    } catch {
      message = strings.saveFailed;
    }
    if (!statusEl || revision !== saveRevision) return;
    statusEl.textContent = message;
    statusEl.style.opacity = '1';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { statusEl.style.opacity = '0.7'; }, 1500);
  }

  function init() {
    if (verEl) {
      const manifestVer = (extApi && extApi.runtime && extApi.runtime.getManifest)
        ? extApi.runtime.getManifest().version
        : '1.0.0';
      verEl.textContent = `v${manifestVer}`;
    }

    updateSettings = settingsApi.observe((res) => {
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
