/**
 * YouTube Thumbnail Desaturator — Donation Page Controller
 */
(function () {
  'use strict';

  const settingsApi = YtThumbnailSettings;
  const extApi = settingsApi.api;

  /**
    * Public donation addresses. Never include private keys or seed phrases.
   */
  const WALLETS = [
    {
      id: 'usdt-trc20',
      name: 'USDT & TRON',
      network: 'TRC-20 / TRX',
      badge: 'TRC-20 & TRX',
      badgeClass: 'badge-trc20',
      address: 'TQpJpN5HtgiJdZJ6BUKzbaiVv1naM6avgh'
    },
    {
      id: 'usdt-erc20',
      name: 'USDT & Ethereum',
      network: 'ERC-20 / ETH',
      badge: 'ERC-20 & ETH',
      badgeClass: 'badge-erc20',
      address: '0x1ff96669F6a64a5e7F33252Daae087aF3846594c'
    },
    {
      id: 'gram-ton',
      name: 'GRAM',
      network: 'The Open Network (ex. TON)',
      badge: 'GRAM (ex. TON)',
      badgeClass: 'badge-ton',
      address: 'UQCXacS9QlFqQxvreTWErDs-bY-V8c6aCj3TkI6rVy4blZ3C'
    }
  ];

  const I18N = {
    ru: {
      pageTitle: "Поддержать проект — YouTube Thumbnail Desaturator",
      headerTitle: "Поддержать разработку",
      intro: "Расширение является бесплатным и с открытым исходным кодом. Если оно делает просмотр YouTube комфортнее и помогает снизить визуальный шум, вы можете поддержать автора любой суммой:",
      sectionFiat: "Банковские карты и СБП",
      daMethods: "Банковские карты (МИР, Visa, Mastercard), СБП, ЮMoney",
      daBtn: "Перейти к донату →",
      sectionCrypto: "Криптовалюта",
      cryptoSub: "Прямой перевод; возможны комиссии сети и сервиса отправки",
      copyBtn: "Копировать",
      copiedBtn: "Скопировано! ✓",
      copyFailed: "Не удалось скопировать",
      footerNote: "Спасибо за поддержку свободного программного обеспечения!"
    },
    en: {
      pageTitle: "Support project — YouTube Thumbnail Desaturator",
      headerTitle: "Support development",
      intro: "This extension is 100% free and open-source. If it makes your YouTube experience calmer and reduces visual clickbait fatigue, feel free to support the developer with a tip:",
      sectionFiat: "Bank cards & online payments",
      daMethods: "Cards (Visa, Mastercard, Mir), Fast Payments, ЮMoney",
      daBtn: "Proceed to donation →",
      sectionCrypto: "Cryptocurrency",
      cryptoSub: "Direct transfer; network and sending-service fees may apply",
      copyBtn: "Copy",
      copiedBtn: "Copied! ✓",
      copyFailed: "Copy failed",
      footerNote: "Thank you for supporting open-source software!"
    }
  };

  const titleEl = document.getElementById('txt-donate-title');
  const introEl = document.getElementById('txt-donate-intro');
  const sectionFiatEl = document.getElementById('txt-section-fiat');
  const daMethodsEl = document.getElementById('txt-da-methods');
  const daBtnEl = document.getElementById('txt-da-btn');
  const sectionCryptoEl = document.getElementById('txt-section-crypto');
  const cryptoSubEl = document.getElementById('txt-crypto-sub');
  const footerNoteEl = document.getElementById('txt-footer-note');
  const walletListEl = document.getElementById('wallet-list');
  const btnLangRu = document.getElementById('btn-lang-ru');
  const btnLangEn = document.getElementById('btn-lang-en');
  const verEl = document.getElementById('donate-version');

  let currentLang = 'ru';
  let updateSettings;

  function getEffectiveLang(langSetting) {
    return settingsApi.effectiveLanguage(langSetting);
  }

  function applyLanguage(langChoice) {
    currentLang = getEffectiveLang(langChoice);
    const strings = I18N[currentLang] || I18N.en;

    document.documentElement.lang = currentLang;
    document.title = strings.pageTitle;
    if (titleEl) titleEl.textContent = strings.headerTitle;
    if (introEl) introEl.textContent = strings.intro;
    if (sectionFiatEl) sectionFiatEl.textContent = strings.sectionFiat;
    if (daMethodsEl) daMethodsEl.textContent = strings.daMethods;
    if (daBtnEl) daBtnEl.textContent = strings.daBtn;
    if (sectionCryptoEl) sectionCryptoEl.textContent = strings.sectionCrypto;
    if (cryptoSubEl) cryptoSubEl.textContent = strings.cryptoSub;
    if (footerNoteEl) footerNoteEl.textContent = strings.footerNote;

    if (btnLangRu) {
      btnLangRu.setAttribute('aria-pressed', String(currentLang === 'ru'));
      if (currentLang === 'ru') btnLangRu.classList.add('active');
      else btnLangRu.classList.remove('active');
    }
    if (btnLangEn) {
      btnLangEn.setAttribute('aria-pressed', String(currentLang === 'en'));
      if (currentLang === 'en') btnLangEn.classList.add('active');
      else btnLangEn.classList.remove('active');
    }

    renderWallets();
  }

  function saveLanguage(lang) {
    updateSettings({ language: lang });
    settingsApi.write({ language: lang }).catch((error) => console.warn('Failed to save language:', error));
  }

  function copyText(text, btnElement, strings) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showCopied(btnElement, strings)).catch(() => fallbackCopy(text, btnElement, strings));
    } else {
      fallbackCopy(text, btnElement, strings);
    }
  }

  function fallbackCopy(text, btnElement, strings) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      if (document.execCommand('copy')) showCopied(btnElement, strings);
      else btnElement.textContent = strings.copyFailed;
    } catch (err) {
      btnElement.textContent = strings.copyFailed;
      console.warn('Copy failed:', err);
    }
    document.body.removeChild(ta);
  }

  function showCopied(btnElement, strings) {
    btnElement.classList.add('copied');
    btnElement.textContent = strings.copiedBtn;
    setTimeout(() => {
      btnElement.classList.remove('copied');
      btnElement.textContent = strings.copyBtn;
    }, 2000);
  }

  function renderWallets() {
    if (!walletListEl) return;
    const strings = I18N[currentLang] || I18N.en;
    walletListEl.replaceChildren();

    WALLETS.forEach((wallet) => {
      const card = document.createElement('div');
      card.className = 'wallet-card';

      const meta = document.createElement('div');
      meta.className = 'wallet-meta';

      const header = document.createElement('div');
      header.className = 'wallet-header';

      const name = document.createElement('span');
      name.className = 'wallet-name';
      name.textContent = `${wallet.name} (${wallet.network})`;

      const badge = document.createElement('span');
      badge.className = `wallet-badge ${wallet.badgeClass || ''}`;
      badge.textContent = wallet.badge;

      header.appendChild(name);
      header.appendChild(badge);

      const addr = document.createElement('div');
      addr.className = 'wallet-address';
      addr.textContent = wallet.address;

      meta.appendChild(header);
      meta.appendChild(addr);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn-copy';
      copyBtn.setAttribute('aria-live', 'polite');
      copyBtn.textContent = strings.copyBtn;
      copyBtn.addEventListener('click', () => {
        copyText(wallet.address, copyBtn, strings);
      });

      card.appendChild(meta);
      card.appendChild(copyBtn);

      walletListEl.appendChild(card);
    });
  }

  function init() {
    if (verEl) {
      const manifestVer = (extApi && extApi.runtime && extApi.runtime.getManifest)
        ? extApi.runtime.getManifest().version
        : '1.0.0';
      verEl.textContent = `v${manifestVer}`;
    }

    if (btnLangRu) {
      btnLangRu.addEventListener('click', () => saveLanguage('ru'));
    }
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => saveLanguage('en'));
    }

    updateSettings = settingsApi.observe((settings) => applyLanguage(settings.language));
  }

  init();
})();
