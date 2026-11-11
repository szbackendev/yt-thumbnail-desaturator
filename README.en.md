# YouTube Thumbnail Desaturator (Zen & Firefox Extension)

> **Language / Язык:** [Русский](README.md) | **English**

> [!NOTE]
> **AI Created**: Developed leveraging modern AI assistants for architecture, layout, and logic.

A lightweight web extension built specifically for **Zen Browser** (and Firefox / Gecko forks) to finely calibrate and desaturate video and Shorts thumbnails on YouTube.

Eliminates screaming visual noise, sensory overload, and clickbait hooks, transforming YouTube feeds into a calm, aesthetic, and distraction-free workspace without affecting active video playback.

---

## Features

- **Smooth Saturation Slider (0% – 100%)**:
  - `0%` — Complete monochrome / grayscale thumbnails.
  - `25% – 50%` — Subtle, muted tones (detox mode).
  - `100%` — Standard YouTube full-saturation default.
- **Instant Quick Presets**: One-click preset toggles (`0%`, `25%`, `50%`, `75%`, `100%`).
- **Bilingual Interface (Russian & English)**: Language settings are hosted on a dedicated browser options page (`about:addons` -> Extension Preferences) to keep the popup uncluttered.
- **Shorts Coverage**: Desaturates Shorts previews across home feeds, shelves, search results, and channel tabs (can be toggled independently).
- **Hover Restoration**: Hovering over supported thumbnail cards restores 100% color saturation (`0.22s` ease-in-out transition) to inspect thumbnails before clicking.
- **Instant Cross-Tab Sync**: Preference changes in the popup propagate immediately to all active YouTube tabs in real-time without requiring a page reload.
- **Early CSS Initialization**: Default attributes are applied at `document_start`, before asynchronous storage access. Saved preferences may arrive after the first frame; zero transient color changes are not guaranteed. CSS filters avoid per-card JavaScript scanning; GPU usage and CPU cost depend on the browser and hardware.
- **Protected Exclusions**: Channel avatars, topbar navigation icons, channel banners, and active video streams (`<video>`) are strictly preserved at full fidelity.

---

## Repository Structure

```text
thumbnail_yt_saturation_ext/
├── manifest.json         # WebExtension Manifest V3 (Gecko / Zen / Firefox)
├── content/
│   ├── content.css       # Hardware-accelerated CSS filter declarations
│   └── content.js        # Early injection & live storage synchronization
├── popup/
│   ├── popup.html        # Compact Zen Minimal popup interface
│   ├── popup.css         # 4px grid, graphite ramp, calibrated YouTube Red
│   └── popup.js          # Live slider logic, preset buttons & dual storage
├── options/
│   ├── options.html      # Extension preferences (language selection)
│   ├── options.css       # Options UI styling
│   └── options.js        # Language persistence & storage synchronization
├── donate/
│   ├── donate.html       # Built-in donation page (DonationAlerts & Crypto)
│   ├── donate.css        # Donation page styling
│   └── donate.js         # Wallet addresses, one-click copy & localization
├── tests/
│   ├── test_*.py         # Static checks, packaging, release tools and browser fixtures
│   └── runtime.test.cjs  # Executable Promise/callback WebExtension API regressions
├── shared/settings.js   # Settings normalization, dual-write, fallback and live events
├── icons/                # Extension aperture icons (16, 32, 48, 128 px)
└── package.py            # Standalone build packager producing .xpi archive
```

---

## Development & Git Workflow

- **Active Development Branch**: All feature development, bug fixes, refactoring, and code changes are conducted **strictly on the `dev` branch**.
- **Protected `main` Branch**: The `main` branch is reserved exclusively for tagged, verified stable releases. Direct commits to `main` are strictly prohibited.
- **Workflow Steps**:
  1. Ensure your active branch is `dev`:
     ```bash
     git checkout dev
     ```
  2. Author code changes and run the test suite:
     ```bash
     python -m unittest discover tests
     ```
  3. Build the release package:
     ```bash
     python package.py
     ```
  4. Commit changes and push to `origin dev`:
     ```bash
     git add .
     git commit -m "feat/fix: concise summary of changes"
     git push origin dev
     ```
  5. Merge into `main` through a PR after CI and Firefox/Zen smoke checks pass. Releases run only for a `v<version>` tag matching the manifest and pointing to a commit in `main`.

### Release verification

Python 3.12+ and Node.js 24+ are required. No npm packages are needed:

```powershell
python -m unittest discover tests -v
node --test tests/runtime.test.cjs
python package.py
```

Set `THUMBNAIL_TEST_BROWSER` to the absolute path of an installed Chromium executable for additional local CSS/UI fixtures. These two checks are explicitly skipped when the variable is absent. Fixtures do not validate Gecko extension integration or the current live YouTube DOM.

Firefox/Zen smoke checks: Home → Search → Watch → Shorts, dynamically loaded cards, 0/100% presets, both toggles, hover, popup reopening, two tabs, and RU/EN/Auto switching. Active playback, avatars and banners must remain unchanged.

`python package.py --output <path>` writes to a separate archive. Tests never overwrite the working release archive. `python bump_version.py patch` is restricted to `dev`, runs checks and rebuilds; failure restores the previous manifest and archive bytes.

---

## Installation in Zen Browser

Because **Zen Browser** is built upon modern Gecko (Firefox 109+), standard WebExtension loading is used:

### Method 1: Temporary Add-on (Development & Testing)
1. Open **Zen Browser**.
2. Navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
   *(or go to Menu -> Tools -> Debug Add-ons)*.
3. Click **"Load Temporary Add-on…"**.
4. Select the project folder and choose `manifest.json`.
5. The extension activates immediately in your Zen toolbar!
6. Visit [YouTube](https://www.youtube.com), open the popup, and choose your preferred saturation level.

The archive generated by `package.py` is **unsigned**. Permanent installation in standard Firefox requires Mozilla signing. Temporary add-ons are unloaded when the browser exits.

---

## Compatibility
- **Zen Browser** (all modern releases)
- **Mozilla Firefox** (109+)
- **Floorp** / **Waterfox** / other Gecko forks

