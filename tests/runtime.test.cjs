'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const flush = () => new Promise((resolve) => setImmediate(resolve));

function element(value = '') {
  const attrs = {};
  const classes = new Set();
  const listeners = {};
  return {
    value, checked: true, disabled: false, children: [], textContent: '',
    style: { setProperty(key, val) { this[key] = val; } },
    classList: {
      add: (key) => classes.add(key), remove: (key) => classes.delete(key),
      contains: (key) => classes.has(key),
      toggle(key, force) { if (force) classes.add(key); else classes.delete(key); }
    },
    setAttribute: (key, val) => { attrs[key] = String(val); },
    getAttribute: (key) => attrs[key],
    addEventListener: (key, fn) => { listeners[key] = fn; },
    dispatch(key) { listeners[key]?.(); },
    appendChild(child) { this.children.push(child); },
    removeChild(child) { this.children = this.children.filter((item) => item !== child); },
    replaceChildren(...children) { this.children = children; },
    select() {},
    set innerHTML(value) { assert.equal(value, ''); this.children = []; }
  };
}

function harness(script, { kind = 'promise', sync = {}, local = {}, failure,
  noRoot = false, delayed = false, copyResult = false, writeFailure = false,
  noApi = false, missingSync = false, missingLocal = false, clipboard } = {}) {
  const ids = new Map();
  const get = (id) => {
    if (!ids.has(id)) ids.set(id, element());
    return ids.get(id);
  };
  const presets = [0, 25, 50, 75, 100].map((val) => {
    const btn = element(); btn.setAttribute('data-val', val); return btn;
  });
  const radios = ['auto', 'ru', 'en'].map(element);
  const html = element();
  const observers = [];
  const storageListeners = [];
  const writes = [];
  const pending = [];
  const warnings = [];
  const timers = [];
  const runtime = {
    getManifest: () => ({ version: '2.3.4' }),
    getURL: (url) => `moz-extension://test/${url}`,
    openOptionsPage: () => Promise.resolve()
  };
  function area(name, data) {
    return {
      get(keys, callback) {
        if (kind === 'promise' && arguments.length !== 1) {
          throw new TypeError('Firefox storage.get expects one argument');
        }
        if (failure === 'throw' && name === 'sync') throw new Error('sync unavailable');
        const result = () => {
          const defaults = Array.isArray(keys) ? {} : keys;
          const selected = { ...defaults };
          for (const key of Array.isArray(keys) ? keys : Object.keys(keys)) {
            if (key in data) selected[key] = data[key];
          }
          return selected;
        };
        const failed = failure === 'reject' && name === 'sync';
        const snapshot = result();
        if (kind === 'promise') {
          if (delayed) return new Promise((resolve, reject) => pending.push(() =>
            failed ? reject(new Error('sync unavailable')) : resolve(snapshot)));
          return failed ? Promise.reject(new Error('sync unavailable')) : Promise.resolve(snapshot);
        }
        const finish = () => {
          runtime.lastError = failed ? { message: 'sync unavailable' } : undefined;
          callback(failed ? undefined : snapshot);
          delete runtime.lastError;
        };
        if (delayed) pending.push(finish); else finish();
      },
      set(data, callback) {
        if (kind === 'promise' && arguments.length !== 1) {
          throw new TypeError('Firefox storage.set expects one argument');
        }
        writes.push({ area: name, data: JSON.parse(JSON.stringify(data)) });
        const failed = writeFailure === true || writeFailure === name;
        if (!failed) Object.assign(name === 'sync' ? sync : local, data);
        if (kind === 'promise') {
          return failed ? Promise.reject(new Error('write failed')) : Promise.resolve();
        }
        runtime.lastError = failed ? { message: 'write failed' } : undefined;
        callback?.();
        delete runtime.lastError;
      }
    };
  }
  const api = {
    runtime, i18n: { getUILanguage: () => 'en-US' },
    storage: { sync: area('sync', sync), local: area('local', local),
      onChanged: { addListener: (fn) => storageListeners.push(fn) } },
    tabs: { create: () => Promise.resolve() }
  };
  const document = {
    documentElement: noRoot ? null : html, readyState: 'loading', body: element(),
    getElementById: get, createElement: () => element(),
    querySelector: (selector) => get(selector),
    querySelectorAll: (selector) => selector === '.preset-btn' ? presets : radios,
    addEventListener() {}, execCommand: () => copyResult
  };
  if (missingSync) delete api.storage.sync;
  if (missingLocal) delete api.storage.local;
  const context = vm.createContext({
    document, window: { addEventListener() {}, open() {} },
    navigator: { language: 'en-US', clipboard },
    console: { warn: (...args) => warnings.push(args) },
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout() {},
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe(target, options) { assert.equal(target, document); assert.deepEqual(options.childList, true); }
      disconnect() { this.disconnected = true; }
    }, ...(noApi ? {} : { [kind === 'promise' ? 'browser' : 'chrome']: api })
  });
  // New shared helpers are loaded only when present; regressions run against legacy code too.
  const shared = path.join(root, 'shared/settings.js');
  if (fs.existsSync(shared)) vm.runInContext(fs.readFileSync(shared, 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, script), 'utf8'), context, { filename: script });
  return { html, document, get, radios, presets, observers, writes, warnings, timers, pending, context,
    emit(changes, areaName = 'local') { storageListeners.forEach((fn) => fn(changes, areaName)); } };
}

for (const kind of ['promise', 'callback']) {
  for (const failure of [undefined, 'reject', 'throw']) {
    test(`content reads stored settings with ${kind} API, failure=${failure}`, async () => {
      const h = harness('content/content.js', { kind, failure,
        sync: { saturation: 0, enabled: false }, local: { saturation: 0, enabled: false } });
      await flush();
      assert.equal(h.html.style['--yt-thumb-sat'], '0%');
      assert.equal(h.html.getAttribute('data-yt-sat-enabled'), 'false');
    });
  }
  test(`empty sync and partial sync use local settings (${kind})`, async () => {
    const h = harness('content/content.js', { kind, sync: { hoverRestore: false },
      local: { saturation: 75, applyShorts: false } });
    await flush();
    assert.equal(h.html.style['--yt-thumb-sat'], '75%');
    assert.equal(h.html.getAttribute('data-yt-sat-hover'), 'false');
    assert.equal(h.html.getAttribute('data-yt-sat-shorts'), 'false');
  });
  test(`popup persists only changed keys to both stores (${kind})`, async () => {
    const h = harness('popup/popup.js', { kind, sync: { language: 'en' } });
    await flush();
    h.presets[0].dispatch('click');
    await flush();
    assert.deepEqual(h.writes, [
      { area: 'sync', data: { saturation: 0 } }, { area: 'local', data: { saturation: 0 } }
    ]);
  });
  for (const script of ['popup/popup.js', 'options/options.js', 'donate/donate.js']) {
    test(`${script} local language fallback and document lang (${kind})`, async () => {
      const h = harness(script, { kind, failure: 'reject', local: { language: 'ru' } });
      await flush();
      assert.equal(h.html.lang, 'ru');
    });
    test(`${script} live language updates and deletion (${kind})`, async () => {
      const h = harness(script, { kind, sync: { language: 'ru' } });
      await flush();
      h.emit({ language: { newValue: 'en' } });
      await flush();
      assert.equal(h.html.lang, 'en');
      h.emit({ language: { oldValue: 'en' } });
      await flush();
      assert.equal(h.html.lang, 'en'); // deleted preference follows English browser UI
    });
  }
}

test('default attributes are applied synchronously before storage resolves', () => {
  const h = harness('content/content.js', { delayed: true });
  assert.equal(h.html.getAttribute('data-yt-sat-enabled'), 'true');
  assert.equal(h.html.style['--yt-thumb-sat'], '30%');
});

test('missing document root uses one observer and latest settings', async () => {
  const h = harness('content/content.js', { noRoot: true });
  h.emit({ saturation: { newValue: 80 } });
  await flush();
  assert.equal(h.observers.length, 1);
  h.document.documentElement = h.html;
  h.observers[0].callback();
  assert.equal(h.html.style['--yt-thumb-sat'], '80%');
  assert.equal(h.observers[0].disconnected, true);
});

test('local events do not re-read stale sync and startup reads cannot overwrite them', async () => {
  const h = harness('content/content.js', { delayed: true, sync: { saturation: 10 } });
  h.emit({ saturation: { newValue: 90 } });
  for (let i = 0; i < 4; i++) { h.pending.splice(0).forEach((fn) => fn()); await flush(); }
  assert.equal(h.html.style['--yt-thumb-sat'], '90%');
});

for (const [value, expected] of [['0', '0%'], ['150', '100%'], ['-2', '0%'],
  [NaN, '30%'], [Infinity, '30%'], ['invalid', '30%'], [null, '30%']]) {
  test(`saturation normalization: ${String(value)}`, async () => {
    const h = harness('content/content.js', { sync: { saturation: value } });
    await flush();
    assert.equal(h.html.style['--yt-thumb-sat'], expected);
  });
}

test('disabled popup controls cannot be activated from keyboard', async () => {
  const h = harness('popup/popup.js', { sync: { enabled: false } });
  await flush();
  for (const control of [h.get('saturation-slider'), h.get('saturation-num'),
    h.get('shorts-toggle'), h.get('hover-toggle'), ...h.presets]) assert.equal(control.disabled, true);
});

test('popup accessible labels follow language and preset state', async () => {
  const h = harness('popup/popup.js', { sync: { language: 'en', saturation: 25 } });
  await flush();
  assert.equal(h.get('enabled-toggle').getAttribute('aria-label'), 'Enable or disable');
  assert.equal(h.get('saturation-num').getAttribute('aria-label'), 'Saturation percentage');
  assert.equal(h.presets[1].getAttribute('aria-pressed'), 'true');
});

test('failed clipboard copy must not report success', async () => {
  const h = harness('donate/donate.js', { kind: 'callback', copyResult: false });
  await flush();
  const btn = h.get('wallet-list').children[0].children[1];
  btn.dispatch('click');
  assert.equal(btn.classList.contains('copied'), false);
  assert.equal(btn.textContent, 'Copy failed');
});

test('failed storage writes must not show Saved', async () => {
  const h = harness('options/options.js', { kind: 'callback', writeFailure: true });
  await flush();
  h.radios[2].checked = true;
  h.radios[2].dispatch('change');
  await flush();
  assert.equal(h.get('save-status').textContent, 'Could not save settings');
});

test('versions on options and donation pages are read from manifest', async () => {
  for (const [script, id] of [['options/options.js', 'opt-version'], ['donate/donate.js', 'donate-version']]) {
    const h = harness(script, { kind: 'callback' });
    await flush();
    assert.equal(h.get(id).textContent, 'v2.3.4');
  }
});

for (const kind of ['promise', 'callback']) {
  test(`missing sync area uses local (${kind})`, async () => {
    const h = harness('content/content.js', { kind, missingSync: true, local: { saturation: 50 } });
    await flush();
    assert.equal(h.html.style['--yt-thumb-sat'], '50%');
  });
  test(`missing local area uses sync (${kind})`, async () => {
    const h = harness('content/content.js', { kind, missingLocal: true, sync: { saturation: 50 } });
    await flush();
    assert.equal(h.html.style['--yt-thumb-sat'], '50%');
  });
  test(`local save succeeds while sync fails, without unhandled rejection (${kind})`, async () => {
    const h = harness('options/options.js', { kind, writeFailure: 'sync' });
    await flush();
    h.radios[2].checked = true;
    h.radios[2].dispatch('change');
    await flush();
    assert.equal(h.writes.length, 2);
    assert.equal(h.get('save-status').textContent, 'Saved locally; sync unavailable');
    assert.equal(h.warnings.length, 1);
  });
  test(`sync save succeeds while local fails (${kind})`, async () => {
    const h = harness('options/options.js', { kind, writeFailure: 'local' });
    await flush();
    h.radios[2].checked = true;
    h.radios[2].dispatch('change');
    await flush();
    assert.equal(h.get('save-status').textContent, 'Saved');
    assert.equal(h.warnings.length, 1);
  });
}

test('no extension API retains usable defaults', async () => {
  for (const script of ['content/content.js', 'popup/popup.js', 'options/options.js', 'donate/donate.js']) {
    const h = harness(script, { noApi: true });
    await flush();
    if (script.startsWith('content')) assert.equal(h.html.style['--yt-thumb-sat'], '30%');
    else assert.equal(h.html.lang, 'en');
  }
});

test('unrelated storage events and unmanaged areas are ignored', async () => {
  const h = harness('content/content.js', { sync: { saturation: 75 } });
  await flush();
  h.emit({ unrelated: { newValue: 0 } });
  h.emit({ saturation: { newValue: 0 } }, 'managed');
  assert.equal(h.html.style['--yt-thumb-sat'], '75%');
});

test('clipboard success copies exactly the displayed address and resets state', async () => {
  let copied;
  const h = harness('donate/donate.js', { clipboard: { writeText(text) { copied = text; return Promise.resolve(); } } });
  await flush();
  const card = h.get('wallet-list').children[0];
  const button = card.children[1];
  button.dispatch('click');
  await flush();
  assert.equal(copied, card.children[0].children[1].textContent);
  assert.equal(button.classList.contains('copied'), true);
  h.timers.forEach((fn) => fn());
  assert.equal(button.classList.contains('copied'), false);
  assert.equal(button.textContent, 'Copy');
});

test('rejected clipboard permission can use successful execCommand fallback', async () => {
  const h = harness('donate/donate.js', { copyResult: true,
    clipboard: { writeText: () => Promise.reject(new Error('denied')) } });
  await flush();
  const button = h.get('wallet-list').children[0].children[1];
  button.dispatch('click');
  await flush();
  assert.equal(button.classList.contains('copied'), true);
  assert.equal(h.document.body.children.length, 0);
});

test('invalid language preference falls back to system and checks auto radio', async () => {
  const h = harness('options/options.js', { sync: { language: 'unsupported' } });
  await flush();
  assert.equal(h.html.lang, 'en');
  assert.equal(h.radios[0].checked, true);
});

for (const page of ['options', 'donate']) {
  test(`${page}: user language selection survives delayed startup read`, async () => {
    const h = harness(`${page}/${page}.js`, { delayed: true, sync: { language: 'ru' } });
    if (page === 'options') { h.radios[2].checked = true; h.radios[2].dispatch('change'); }
    else h.get('btn-lang-en').dispatch('click');
    // A delayed read may carry a snapshot captured before the user interaction.
    h.emit({ unrelated: { newValue: 1 } });
    h.pending.splice(0).forEach((fn) => fn());
    await flush();
    assert.equal(h.html.lang, 'en');
  });
}