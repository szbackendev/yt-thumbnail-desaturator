/**
 * YouTube Thumbnail Desaturator — Donation Page Controller
 */
(function () {
  'use strict';

  const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

  /**
   * Creator's Public Crypto Wallets
   * Replace placeholder strings with actual public addresses.
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
      cryptoSub: "Прямой перевод на кошелёк (без сторонних комиссий)",
      copyBtn: "Копировать",
      copiedBtn: "Скопировано! ✓",
      footerNote: "Спасибо за поддержку свободного программного обеспечения!"
    },
    en: {
      pageTitle: "Support Project — YouTube Thumbnail Desaturator",
      headerTitle: "Support Development",
      intro: "This extension is 100% free and open-source. If it makes your YouTube experience calmer and reduces visual clickbait fatigue, feel free to support the developer with a tip:",
      sectionFiat: "Bank Cards & Online Payments",
      daMethods: "Cards (Visa, Mastercard, Mir), Fast Payments, ЮMoney",
      daBtn: "Proceed to donation →",
      sectionCrypto: "Cryptocurrency",
      cryptoSub: "Direct wallet transfer (0% third-party platform fee)",
      copyBtn: "Copy",
      copiedBtn: "Copied! ✓",
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

  let currentLang = 'ru';

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
      if (currentLang === 'ru') btnLangRu.classList.add('active');
      else btnLangRu.classList.remove('active');
    }
    if (btnLangEn) {
      if (currentLang === 'en') btnLangEn.classList.add('active');
      else btnLangEn.classList.remove('active');
    }

    renderWallets();
  }

  function saveLanguage(lang) {
    applyLanguage(lang);
    if (!extApi || !extApi.storage) return;
    const payload = { language: lang };
    try {
      if (extApi.storage.sync) extApi.storage.sync.set(payload, () => { });
      if (extApi.storage.local) extApi.storage.local.set(payload, () => { });
    } catch (e) {
      console.warn('Failed to save language:', e);
    }
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
      document.execCommand('copy');
      showCopied(btnElement, strings);
    } catch (err) {
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
    walletListEl.innerHTML = '';

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
    if (btnLangRu) {
      btnLangRu.addEventListener('click', () => saveLanguage('ru'));
    }
    if (btnLangEn) {
      btnLangEn.addEventListener('click', () => saveLanguage('en'));
    }

    if (!extApi || !extApi.storage) {
      applyLanguage('auto');
      return;
    }

    const storage = extApi.storage.sync || extApi.storage.local;
    try {
      const res = storage.get({ language: 'auto' }, (items) => {
        applyLanguage(items && items.language ? items.language : 'auto');
      });
      if (res && typeof res.then === 'function') {
        res.then((items) => {
          applyLanguage(items && items.language ? items.language : 'auto');
        }).catch(() => applyLanguage('auto'));
      }
    } catch {
      applyLanguage('auto');
    }

    if (extApi.storage.onChanged) {
      extApi.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' || areaName === 'local') {
          if (changes.language && changes.language.newValue) {
            applyLanguage(changes.language.newValue);
          }
        }
      });
    }
  }

  init();
})();
