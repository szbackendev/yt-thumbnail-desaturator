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
- **Hover Restoration**: Hovering over any video card smoothly restores 100% color saturation (`0.22s` cubic-bezier transition) to inspect thumbnails before clicking.
- **Instant Cross-Tab Sync**: Preference changes in the popup propagate immediately to all active YouTube tabs in real-time without requiring a page reload.
- **Zero-FOUC & Zero CPU Overhead**: Early injection at `document_start` prevents color flashes on cold page loads. Filtering runs purely on GPU-accelerated CSS custom properties without costly DOM MutationObserver loops.
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
├── tests/
│   └── test_extension.py # Automated test suite (Manifest, CSS, JS, DOM, i18n)
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
  5. Merges into `main` occur only via pull requests or release promotions after all tests pass.

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

---

## Compatibility
- **Zen Browser** (all modern releases)
- **Mozilla Firefox** (109+)
- **Floorp** / **Waterfox** / other Gecko forks

