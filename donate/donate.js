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
      name: 'USDT',
      network: 'TRC-20 (TRON)',
      badge: 'TRC-20',
      badgeClass: 'badge-trc20',
      address: 'TYOUR_TRC20_USDT_WALLET_ADDRESS_HERE'
    },
    {
      id: 'usdt-erc20',
      name: 'USDT',
      network: 'ERC-20 (Ethereum)',
      badge: 'ERC-20',
      badgeClass: 'badge-erc20',
      address: '0xYOUR_ERC20_USDT_WALLET_ADDRESS_HERE'
    },
    {
      id: 'eth',
      name: 'Ethereum',
      network: 'ETH / Arbitrum / Optimism / Base',
      badge: 'ETH',
      badgeClass: 'badge-erc20',
      address: '0xYOUR_ETHEREUM_WALLET_ADDRESS_HERE'
    },
    {
      id: 'trx',
      name: 'TRON',
      network: 'TRX',
      badge: 'TRX',
      badgeClass: 'badge-trc20',
      address: 'TYOUR_TRON_TRX_WALLET_ADDRESS_HERE'
    },
    {
      id: 'ton',
      name: 'TON',
      network: 'The Open Network',
      badge: 'TON',
      badgeClass: 'badge-ton',
      address: 'EQYOUR_TON_WALLET_ADDRESS_HERE'
    },
    {
      id: 'btc',
      name: 'Bitcoin',
      network: 'BTC',
      badge: 'BTC',
      badgeClass: 'badge-btc',
      address: 'bc1qYOUR_BITCOIN_WALLET_ADDRESS_HERE'
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
      daBtn: "Go to donation page →",
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

    document.title = strings.pageTitle;
    if (titleEl) titleEl.textContent = strings.headerTitle;
    if (introEl) introEl.textContent = strings.intro;
    if (sectionFiatEl) sectionFiatEl.textContent = strings.sectionFiat;
    if (daMethodsEl) daMethodsEl.textContent = strings.daMethods;
    if (daBtnEl) daBtnEl.textContent = strings.daBtn;
    if (sectionCryptoEl) sectionCryptoEl.textContent = strings.sectionCrypto;
    if (cryptoSubEl) cryptoSubEl.textContent = strings.cryptoSub;
    if (footerNoteEl) footerNoteEl.textContent = strings.footerNote;

    renderWallets();
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
  }

  init();
})();
