# Development and maintenance

> **Language / Язык:** [Русский](CONTRIBUTING.md) | **English**

For the product description and installation, see [README.en.md](README.en.md). This document covers development, testing and releases.

## Structure and architecture

- `manifest.json` — WebExtension MV3, Gecko minimum `109.0`, ID `yt-thumb-desaturator@zen.browser`.
- `content/` — CSS filters and early initialization at `document_start`; do not add per-card scanning or per-element MutationObservers.
- `shared/settings.js` — normalization, `storage.sync` and `storage.local` reads, changed-key writes to both stores and live events.
- `popup/`, `options/`, `donate/` — saturation controls, language and optional project support.
- `tests/` — assets, runtime, CSS/UI, documentation and release-tool checks.
- `.github/workflows/` — CI for `dev`/`main`/PRs and a separate tag-triggered release build.

Apply filters to preview media leaves, not their ancestors. Active video, avatars and banners must retain their colors. Check static and moving previews separately.

At startup, stored `storage.sync` keys take precedence over the local cache. After a sync-write failure, a later session may read an older value; no durable conflict-resolution protocol is implemented. Defaults apply before asynchronous settings reads, so a transient frame cannot be ruled out.

## Working branch

Make all changes on `dev`. Direct commits and pushes to `main` are prohibited; promote through a PR after validation. Server-side enforcement depends on GitHub settings.

Run commands from the clone root:

```powershell
git checkout dev
```

Preserve `.gitattributes`: text uses LF, and PNG/XPI files are binary. Canonical line endings make packages consistent across checkouts.

## Tests and packaging

Packaging requires Python 3.12+; the full suite also requires Node.js 24+. No third-party packages are needed. The installed extension requires none of these tools.

```powershell
python -m unittest discover tests -v
node --test tests/runtime.test.cjs
python package.py
```

Two extra CSS/UI checks run when `THUMBNAIL_TEST_BROWSER` contains an absolute path to an already installed Chromium executable. They are explicitly skipped without it. The local `AGENTS.md` check is skipped in a clean clone because the file is untracked. Chromium fixtures and Node.js API models do not replace live Gecko/YouTube testing.

`python package.py --output <path>` creates a separate archive; its parent directory must exist. The packager only archives local files and validates the ZIP; it does not perform Mozilla validation or sign the add-on. Both READMEs are included in the XPI, so rebuild after changing them. Test builds use temporary files.

On Windows, the browser may lock a loaded XPI. Load `manifest.json` for development; unload an add-on or close the browser before replacing its loaded archive. Never terminate browser processes automatically.

### Manual checks

1. `0%` / `100%`, slider, numeric input and presets.
2. Home, search, watch recommendations and dynamically loaded cards.
3. Color-preserving active video and Shorts playback, avatars and banners.
4. Master toggle, Shorts processing, hover restoration and moving previews.
5. Persistence after reopening the popup/reloading the page, and live changes in two tabs.
6. RU / EN / Auto.

Record the browser version and scope; one successful profile check does not validate every Gecko version or YouTube layout.

## Preparing a release

A new Mozilla submission must exceed previously submitted versions. Keep the Gecko ID unchanged.

```powershell
python bump_version.py patch
```

This runs only on `dev`, executes tests and rebuilds the XPI. Failure restores the previous manifest and archive bytes; unchanged files are not rewritten. Restoration errors are explicitly reported as incomplete rollback.

Before committing, inspect the diff, stage specific changed files and the rebuilt XPI, then push `origin dev`. Open a PR to `main`, wait for CI and complete manual checks. A clean clone must pass tests and build an archive matching its source.

A GitHub Release is triggered separately by pushing a `v<version>` tag matching the manifest and pointing to a commit in `main`. The workflow does not upload to Mozilla.

## Mozilla submission — maintainers only

1. Open the existing add-on in [Developer Hub](https://addons.mozilla.org/developers/) and add a new version.
2. Upload the XPI from the verified `main` commit; supply release notes and validator answers.
3. Code is not minified and needs no compilation. If source is requested, provide the matching commit and `python package.py` command.
4. Mozilla controls signing, review and update availability. Local tests and GitHub CI do not mean the new version has been approved.

Do not replace a version's package after submission: subsequent changes need a new version. See the [official Mozilla submission documentation](https://extensionworkshop.com/documentation/publish/submitting-an-add-on/).