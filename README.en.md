# YouTube Thumbnail Desaturator

> **Language / Язык:** [Русский](README.md) | **English**

A **Zen Browser and Firefox** extension that mutes the colors of YouTube video and Shorts thumbnails. It makes the feed less visually busy while keeping active video playback, channel avatars and banners in color.

**[Install from Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/youtube-thumbnail-desaturator/)** · [Download source](https://github.com/szbackendev/yt-thumbnail-desaturator/archive/refs/heads/main.zip) · [Report a problem](https://github.com/szbackendev/yt-thumbnail-desaturator/issues)

## Features

- **Saturation from 0% to 100%**: grayscale thumbnails, muted colors or their original appearance. The default is **30%**.
- **Slider, numeric input and presets**: `0%`, `25%`, `50%`, `75%`, `100%`.
- **Restore color on hover**: when enabled, static and moving previews return to full saturation under the pointer.
- **Separate Shorts control**: keep Shorts thumbnails in color while filtering regular video thumbnails.
- **No page reloads for changes**: preferences apply to open YouTube tabs and new cards loaded while scrolling.
- **RU / EN / Auto**: choose the interface language in settings; Auto follows the browser language — Russian or English.
- **Saved preferences** in the browser profile; cross-device synchronization depends on browser account settings.

## Installation

### From the store — recommended

1. Open [YouTube Thumbnail Desaturator on Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/youtube-thumbnail-desaturator/) in Zen or Firefox.
2. Click the button to add the extension and confirm the requested permissions.
3. Reload existing YouTube tabs and open the extension from the browser toolbar.

Store installations remain available after browser restarts. Store updates may arrive later than changes in the repository.

### From the repository — temporary installation

Use this to try the current code without waiting for a store update. No Python, Node.js or build step is needed.

1. [Download the source ZIP](https://github.com/szbackendev/yt-thumbnail-desaturator/archive/refs/heads/main.zip) and extract it.
2. Open `about:debugging#/runtime/this-firefox` in Zen or Firefox.
3. Click **Load Temporary Add-on…** and select `manifest.json` inside the extracted folder.
4. Reload open YouTube tabs.

**Important:** temporary add-ons are unloaded when the browser closes. The repository XPI is **not signed by Mozilla** and is not intended for permanent installation in standard Firefox. Use the store for permanent installation. Do not keep store and temporary installations of the same extension active together.

## Usage

1. Open the extension popup using its browser toolbar icon.
2. Choose saturation with the slider, numeric field or a preset: `0%` is grayscale; `100%` restores original colors.
3. Turn off **Restore color on hover** or **Apply to Shorts** if preferred. The master switch disables all filters.
4. The settings button opens the **RU / EN / Auto** language selector.

Changes apply immediately. If the thumbnail under the pointer stays colorful at `0%`, disable hover restoration or move the pointer away.

## Privacy

The extension contains no analytics or telemetry, collects no viewing history and loads no remote executable code. YouTube access is needed to filter thumbnails; storage permission saves preferences.

The support page contains an external DonationAlerts link and public wallet addresses. Support is optional; visiting a third-party service is subject to its own data and payment policies.

## Compatibility and help

- Primary platforms are desktop **Zen Browser and Firefox**. Other Gecko forks may work but have not been separately tested; Android and Chromium browsers are not declared supported.
- YouTube changes its markup and runs experiments: some card layouts or third-party styles may affect filtering.
- If filtering is missing, reload the tab, check the master switch and ensure the extension is allowed to run on YouTube. Active video playback should retain its colors.
- To report a bug, open [GitHub Issues](https://github.com/szbackendev/yt-thumbnail-desaturator/issues) with browser/extension versions, the YouTube page, settings and reproduction steps. A screenshot helps; hide personal information.

## About

A free, independent project not affiliated with Google or YouTube. Developed with assistance from AI tools; source code is available in this repository.

For development and maintenance, see [CONTRIBUTING.en.md](https://github.com/szbackendev/yt-thumbnail-desaturator/blob/main/CONTRIBUTING.en.md).