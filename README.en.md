# YouTube Thumbnail Desaturator

> **Language / Язык:** [Русский](README.md) | **English**

> [!NOTE]
> Developed with assistance from AI tools. Source code is available in this repository; a separate license has not yet been added.

A desktop Zen Browser and Firefox extension that reduces the saturation of YouTube video and Shorts thumbnails. Filters apply to previews, not to active video playback.

The slider adjusts color intensity without changing images on YouTube's servers.

---

## Features

- **Smooth saturation slider (0% – 100%)**:
  - `0%` — Complete monochrome / grayscale thumbnails.
  - `25% – 50%` — Muted tones; the default is `30%`.
  - `100%` — Standard YouTube full-saturation default.
- **Quick presets**: One-click buttons (`0%`, `25%`, `50%`, `75%`, `100%`), with a slider and numeric input.
- **RU / EN / Auto**: The settings button in the popup opens the language selector. Auto selects Russian for a Russian browser UI and English otherwise.
- **Master toggle**: Disable all filters; Shorts processing and hover restoration have separate controls. All three toggles are enabled by default.
- **Shorts coverage**: Desaturates Shorts previews in shelves, feeds and search results; it can be disabled independently.
- **Hover restoration**: Hovering over supported thumbnail cards restores full color, including supported moving previews.
- **Live tab updates**: Preference changes apply to open YouTube tabs without reloading; CSS rules also cover newly inserted cards.
- **CSS filtering without DOM scanning**: A CSS variable controls saturation; no per-card JavaScript processing is needed. GPU usage and CPU cost depend on the browser and hardware.
- **Exclusions**: Active video, channel avatars and banners should retain their colors.
- **Settings persistence**: Writes to both `storage.sync` and `storage.local`; cross-device synchronization depends on browser account capabilities and configuration.
- **Optional project support**: A built-in page links to DonationAlerts and displays public wallet addresses. The extension does not process payments.

---

## Repository structure

```text
yt-thumbnail-desaturator/
├── manifest.json         # WebExtension Manifest V3 (Gecko / Zen / Firefox)
├── content/
│   ├── content.css       # Thumbnail and Shorts filter rules
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
├── icons/               # Extension icons (16, 32, 48, 128 px)
├── .github/workflows/   # CI and tag-triggered release builds
├── bump_version.py      # Version updates with validation and rollback
├── package.py           # Reproducible unsigned XPI build
└── yt-thumbnail-desaturator.xpi
```

---

## Development and Git workflow

- **Development branch**: All feature development, bug fixes, refactoring and code changes are made **strictly on `dev`**.
- **Release branch `main`**: Holds verified release source. Direct commits and pushes to `main` are not allowed; server-side enforcement depends on GitHub settings.
- **Workflow steps**:
  1. Ensure your active branch is `dev`:
      ```powershell
     git checkout dev
     ```
  2. Author code changes and run the test suite:
      ```powershell
     python -m unittest discover tests
     ```
  3. Build the release package:
      ```powershell
     python package.py
     ```
   4. When preparing an update, first bump the version on `dev`; the command runs tests, rebuilds the XPI and restores the manifest and archive on failure:
      ```powershell
      python bump_version.py patch
      ```
   5. Commit only the release files and push `dev` (stage added tests and other changes separately):
      ```powershell
      git add README.md README.en.md manifest.json yt-thumbnail-desaturator.xpi
      git commit -m "chore(release): prepare next version"
     git push origin dev
     ```
   6. Merge into `main` through a PR after CI and Firefox/Zen smoke checks pass. A GitHub Release is created separately for a `v<version>` tag matching the manifest and pointing to a commit in `main`. This workflow does not upload the add-on to Mozilla.

### Release verification

Running the extension requires no Python, Node.js or npm. Packaging requires Python 3.12+; the full test suite also requires Node.js 24+. No third-party packages need to be installed. Run these commands from the root of the cloned repository:

```powershell
python -m unittest discover tests -v
node --test tests/runtime.test.cjs
python package.py
```

For additional local CSS/UI fixtures, set `THUMBNAIL_TEST_BROWSER` to the absolute path of an already installed Chromium executable and rerun the tests. These two checks are explicitly skipped without the variable. The `AGENTS.md` check is also skipped in a clean clone because it is untracked local context. Node.js tests use WebExtension API models; Chromium fixtures do not verify Gecko integration or current live YouTube markup.

Manual Firefox/Zen checks:

1. `0%` / `100%`, the slider, numeric input and presets.
2. Home, search, watch-page recommendations and dynamically loaded cards.
3. Color-preserving active video and Shorts playback, avatars and banners.
4. The master toggle, Shorts processing, hover restoration and moving hover previews.
5. Persistence after reopening the popup and reloading the page; live updates in two tabs.
6. RU / EN / Auto.

`python package.py --output <path>` writes a separate archive; its parent directory must exist. Test builds use temporary files and never overwrite the working XPI. The packager verifies required entries and ZIP integrity but does not perform Mozilla validation or sign the package.

`.gitattributes` fixes text line endings to LF so source and XPI bytes do not depend on Git's automatic line-ending conversion on Windows.

An XPI loaded as a temporary add-on in Zen/Firefox may be locked against replacement on Windows. Unload it or close the browser before rebuilding; load `manifest.json` for development. If restoration is impossible, the script explicitly reports an incomplete rollback.

---

## Installation and use

### Permanent installation

Use the published Mozilla Add-ons listing or a Mozilla-signed XPI. In Firefox, select a signed package through `about:addons` → gear menu → **Install Add-on From File…**.

The repository's `yt-thumbnail-desaturator.xpi` and GitHub Actions packages are **not signed by Mozilla**. They are intended for temporary testing and Developer Hub submission, not permanent installation in standard Firefox. Publishing on GitHub does not replace Mozilla validation and signing.

### Temporary loading in Zen / Firefox

1. Download and extract the [main branch source](https://github.com/szbackendev/yt-thumbnail-desaturator/archive/refs/heads/main.zip), or clone the repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on…** and select `manifest.json` inside the extracted project directory.
4. Open YouTube. Reload tabs that were already open when the add-on was loaded.
5. Open the extension popup and set the saturation. Disable hover restoration to inspect `0%` without colors returning under the pointer.
6. The settings button in the popup opens the RU / EN / Auto selector.

Temporary add-ons are unloaded when the browser exits. Loading one again is not equivalent to testing an update of a permanently installed add-on.

---

## Compatibility and limitations

- Target platforms are desktop Zen Browser and Mozilla Firefox. The manifest minimum is Firefox `109.0`; this does not mean every version since 109 has been tested.
- Floorp, Waterfox and other Gecko forks may support the add-on, but each fork has not been separately validated. Android and Chromium browsers are not declared supported platforms.
- YouTube markup changes and varies between site experiments. Unsupported card layouts and conflicts with third-party styles need separate investigation.
- At `document_start`, the default `30%` is applied synchronously; saved settings are read asynchronously. A transient color change cannot be ruled out.
- At startup, stored `storage.sync` keys take precedence over the local cache. If a sync write fails while older data remains readable, a later session may restore the older value.
- CSS filters avoid per-card JavaScript scanning. CPU/GPU costs depend on the browser and hardware; zero overhead is not guaranteed.

## Privacy and permissions

- `storage` saves preferences; access to `*://*.youtube.com/*` applies filters on YouTube.
- The manifest declares `data_collection_permissions.required: ["none"]`. The extension contains no analytics, telemetry or remotely loaded executable code.
- Following an external support link opens a third-party service with its own data and payment policies.

## Submitting an update to Mozilla

1. Open the **existing** add-on in [Mozilla Developer Hub](https://addons.mozilla.org/developers/) and add a new version rather than creating a new product listing.
2. Upload `yt-thumbnail-desaturator.xpi` from the verified `main` branch. Its version must exceed previously submitted versions; retain the Gecko ID: `yt-thumb-desaturator@zen.browser`.
3. Supply release notes and answer validator questions. Code is not minified; the build only packages local files. If source is requested, provide it from the matching commit together with the `python package.py` command.
4. Mozilla controls signing, review and update availability. Developer Hub is the source of publication status; passing local tests does not mean the new version has been approved.

See the [official Mozilla submission documentation](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).

