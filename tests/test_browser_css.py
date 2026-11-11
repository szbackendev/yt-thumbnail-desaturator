"""Optional real-engine CSS fixtures, using a supplied Chromium executable only."""
from html import unescape
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class BrowserCssTests(unittest.TestCase):
    @unittest.skipUnless(os.environ.get('THUMBNAIL_TEST_BROWSER'),
                         'Set THUMBNAIL_TEST_BROWSER to run actual UI smoke fixtures')
    def test_actual_pages_initialize_without_errors_or_horizontal_overflow(self):
        for page_name in ['popup', 'options', 'donate']:
            with self.subTest(page=page_name), tempfile.TemporaryDirectory() as directory:
                source = ROOT / page_name / f'{page_name}.html'
                html = source.read_text(encoding='utf-8')
                html = re.sub(r'(src|href)="(?!https:|#)([^"]+)"',
                              lambda match: f'{match[1]}="{(source.parent / match[2]).resolve().as_uri()}"', html)
                html = html.replace('</head>', '''<script>
                  window.testErrors = [];
                  window.addEventListener('error', event => testErrors.push(event.message));
                  window.addEventListener('unhandledrejection', event => testErrors.push(String(event.reason)));
                </script></head>''')
                html = html.replace('</body>', '''<pre id="smoke-results"></pre><script>
                  setTimeout(() => {
                    const before = document.body.scrollWidth;
                    const width = document.body.clientWidth;
                    const result = {errors: testErrors, language: document.documentElement.lang,
                      overflow: before > width, title: document.title};
                    document.getElementById('smoke-results').textContent = JSON.stringify(result);
                  }, 50);
                </script></body>''')
                fixture = Path(directory) / 'page.html'
                fixture.write_text(html, encoding='utf-8')
                result = subprocess.run([
                    os.environ['THUMBNAIL_TEST_BROWSER'], '--headless', '--disable-extensions',
                    '--no-first-run', '--disable-background-networking', '--lang=en-US',
                    '--virtual-time-budget=300', f'--user-data-dir={Path(directory) / "profile"}',
                    '--dump-dom', fixture.as_uri(),
                ], capture_output=True, text=True, encoding='utf-8', timeout=60)
                self.assertEqual(result.returncode, 0, result.stderr)
                match = re.search(r'<pre id="smoke-results">(.*?)</pre>', result.stdout, re.S)
                self.assertIsNotNone(match, result.stdout + result.stderr)
                data = json.loads(unescape(match.group(1)))
                self.assertEqual(data['errors'], [])
                self.assertEqual(data['language'], 'en')
                self.assertFalse(data['overflow'], data)

    @unittest.skipUnless(os.environ.get('THUMBNAIL_TEST_BROWSER'),
                         'Set THUMBNAIL_TEST_BROWSER to run real-engine CSS fixtures')
    def test_filters_apply_once_and_protect_other_media(self):
        css = (ROOT / 'content' / 'content.css').read_text(encoding='utf-8')
        # Explicit hover markers exercise rule scope independently of headless mouse position.
        css = css.replace(':hover', '[data-test-hover]')
        fixture = '''<!doctype html><html data-yt-sat-enabled="true"
          data-yt-sat-shorts="true" data-yt-sat-hover="false"><head><style>CSS</style></head><body>
          <ytd-thumbnail><img id="normal"></ytd-thumbnail>
          <ytd-reel-item-renderer><yt-image><img id="short"></yt-image></ytd-reel-item-renderer>
          <ytm-shorts-lockup-view-model-v2 data-test-hover><yt-image><img id="short-v2"></yt-image></ytm-shorts-lockup-view-model-v2>
          <ytd-video-preview><div id="movie_player"><video class="html5-main-video" id="active"></video></div></ytd-video-preview>
          <ytd-thumbnail><ytd-moving-thumbnail-renderer><video id="moving"></video></ytd-moving-thumbnail-renderer></ytd-thumbnail>
          <yt-lockup-view-model><yt-avatar-shape><img id="avatar"></yt-avatar-shape></yt-lockup-view-model>
          <ytm-shorts-lockup-view-model-v2><yt-avatar-shape><img id="short-avatar"></yt-avatar-shape></ytm-shorts-lockup-view-model-v2>
          <yt-image><img id="community"></yt-image>
          <div class="ytp-ce-channel"><div class="ytp-ce-covering-image" id="end-avatar"></div></div>
          <pre id="results"></pre><script>
          const results = [];
          function filtered(id) {
            let node = document.getElementById(id), count = 0;
            while (node) {
              const filter = getComputedStyle(node).filter;
              if (filter !== 'none' && filter !== 'saturate(1)') count++;
              node = node.parentElement;
            }
            return count;
          }
          function check(name, actual, expected) { results.push({name, actual, expected}); }
          check('regular thumbnail filtered once', filtered('normal'), 1);
          check('Shorts thumbnail filtered once', filtered('short'), 1);
          check('active video has no filtered ancestor', filtered('active'), 0);
          check('moving preview filtered once', filtered('moving'), 1);
          check('avatar preserved', filtered('avatar'), 0);
          check('avatar inside Shorts preserved', filtered('short-avatar'), 0);
          check('community image untouched', filtered('community'), 0);
          check('end-screen channel avatar untouched', filtered('end-avatar'), 0);
          document.documentElement.dataset.ytSatShorts = 'false';
          check('Shorts toggle bypasses all filters', filtered('short'), 0);
          document.documentElement.dataset.ytSatShorts = 'true';
          document.documentElement.dataset.ytSatHover = 'true';
          check('v2 Shorts hover restores color', filtered('short-v2'), 0);
          document.documentElement.dataset.ytSatEnabled = 'false';
          check('master toggle bypasses filters', filtered('normal'), 0);
          document.getElementById('results').textContent = JSON.stringify(results);
          </script></body></html>'''.replace('CSS', css)
        with tempfile.TemporaryDirectory() as directory:
            page = Path(directory) / 'fixture.html'
            page.write_text(fixture, encoding='utf-8')
            result = subprocess.run([
                os.environ['THUMBNAIL_TEST_BROWSER'], '--headless', '--disable-extensions',
                '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
                f'--user-data-dir={Path(directory) / "profile"}', '--dump-dom', page.as_uri(),
            ], capture_output=True, text=True, encoding='utf-8', timeout=60)
            self.assertEqual(result.returncode, 0, result.stderr)
            match = re.search(r'<pre id="results">(.*?)</pre>', result.stdout, re.S)
            self.assertIsNotNone(match, result.stdout + result.stderr)
            checks = json.loads(unescape(match.group(1)))
            self.assertEqual(len(checks), 11)
            for check in checks:
                with self.subTest(name=check['name']):
                    self.assertEqual(check['actual'], check['expected'])