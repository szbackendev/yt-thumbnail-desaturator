# Release readiness review

## Scope and evidence

- Baseline: local `main` at `afed789`; development HEAD: `cade473` on `dev`, plus the reviewed working-tree changes.
- Requirements: documented thumbnail behavior, Gecko MV3 support and local architectural rules. No separate issue specification was supplied.
- Review is a single-agent assessment, not an independent peer approval.
- Existing suite: 15 passing tests before corrections. Added runtime regressions initially failed in 27 of 37 scenarios; CSS fixtures initially failed seven checks.
- Runtime verification executes the production scripts in Node VM contexts with strict Promise-only and callback-only API contracts. It is not a live Firefox API test.

## Verification results (2026-11-11)

- Full local suite: 32 Python tests passed with both browser checks enabled; the runtime wrapper executes 52 passing Node.js scenarios.
- Browser checks: 11 CSS cascade/filter invariants and smoke initialization of the actual popup, options and donation HTML/CSS/JS pages in installed headless Chromium. Hover is represented by explicit fixture markers; actual pointer behavior requires the live smoke gate.
- Clean temporary copy of tracked and new files, excluding ignored local context: suite passed with three explicit skips (two opt-in browser checks and absent `AGENTS.md`); packaging passed.
- JavaScript and Python syntax checks passed; both workflow YAML files parsed; `git diff --check` passed.
- `python package.py` built a 31,470-byte unsigned XPI with 19 entries, valid ZIP integrity and exact source-byte parity. Reproducible-build tests passed.
- Archive SHA-256: `77b7557a422ef3c3730133bdecfbd8f0133c607b676fc90d61ee928ad78e8933`.
- Manifest remains `1.0.0`. No commit, push, merge, release tag or installed-browser profile modification was performed.

## Standards

| Severity | Original finding | Resolution |
| --- | --- | --- |
| High | Storage helpers mixed Promise/callback signatures and duplicated inconsistent error handling in four controllers. | Shared API-contract-aware helper, explicit fallback, normalized settings and independent dual-writes. |
| High | `bump_version.py` instructed direct push to protected `main`. | Version edits restricted to `dev`; guidance directs promotion through a PR. |
| Medium | Tests required an ignored `AGENTS.md`, failing a normal checkout. | Local-only context test is explicitly skipped when absent. |
| Medium | Tests overwrote the tracked release archive. | All test builds use temporary output files. |
| Low | Keyboard focus and English document language were incomplete. | Focus-visible styles, disabled controls, translated accessible names and reduced-motion support. |

Standards summary: five findings addressed; highest original severity: High.

## Spec / documented behavior

| Severity | Original finding | Resolution |
| --- | --- | --- |
| High | CSS filtered preview ancestors; child exclusions could not protect active video. Shorts and moving previews were filtered twice. | Filter only media leaves; browser fixtures verify ancestor filters and single application. |
| High | Late startup reads and local-change re-reads could restore stale sync values. Whole-object writes could overwrite another control's preferences. | Initial events overlay the startup snapshot; live updates consume changed keys directly; writes contain only modified keys. |
| Medium | Empty sync masked local values; synchronous sync exceptions and donation reads missed fallback. | Read raw keys from both areas, merge local cache with sync taking precedence, then normalize. |
| Medium | Saturation parsing lost string `0` and admitted non-finite/unbounded values. | Unified finite-number validation, clamping and integer normalization. |
| Medium | Options lacked live language updates; failed saves and clipboard operations reported success. | Live observer on every page; localized, outcome-dependent statuses. |
| Medium | Shorts specificity overrode avatar exclusions in nested cards. | Strengthened grouped avatar exclusions; reproduced and verified by a browser fixture. |
| Medium | Packager depended on working directory; release failures left modified metadata or stale archives. | Source-root-aware deterministic atomic packaging; exact-byte rollback of both release files. |
| Medium | CI ran after main promotion only; repeated pushes could update an existing version's release. | Pre-merge CI; tag-driven release with version and stable-branch checks. |
| Low | README claimed zero CPU/FOUC and release text claimed an unsigned XPI was ready for installation. | Documentation distinguishes early defaults, asynchronous saved state, rendering cost and Mozilla signing. |

Spec summary: nine findings addressed; highest original severity: High.

## Release gates

- Automated code checks and local fixtures are required before promotion.
- Live Firefox/Zen + YouTube smoke validation remains required: Home/Search/Watch/Shorts, lazy loading, hover previews, active playback, avatars/banners, storage persistence, two-tab updates and language switching.
- Mozilla signing / AMO validation is not performed by the packager or this test suite.
- CI workflow files are reviewed locally; actual hosted execution and branch-protection settings are not verified.
- Stored sync values remain authoritative at startup. If sync writes fail but stale values remain readable, a subsequent session can prefer those older sync values. No durable last-write conflict protocol is implemented.
- YouTube markup variants can introduce selectors absent from local fixtures. Unsupported variants require browser evidence before adding broad selectors.
- Manifest version is intentionally not bumped by the review. A published update must use a new version and a matching tag.

Decision: suitable for a development PR after automated validation; stable-release promotion remains conditional on the live Gecko smoke gate. Direct push to `main` is prohibited.