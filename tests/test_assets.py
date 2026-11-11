"""HTML references, script order, image metadata and offline/security invariants."""
from html.parser import HTMLParser
import json
from pathlib import Path
import struct
import unittest

ROOT = Path(__file__).resolve().parents[1]


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []

    def handle_starttag(self, tag, attrs):
        self.tags.append((tag, dict(attrs)))


class AssetTests(unittest.TestCase):
    def test_html_assets_are_local_and_shared_script_loads_first(self):
        for page in ['popup', 'options', 'donate']:
            with self.subTest(page=page):
                html = ROOT / page / f'{page}.html'
                parser = AssetParser()
                parser.feed(html.read_text(encoding='utf-8'))
                scripts = []
                ids = []
                for tag, attrs in parser.tags:
                    if 'id' in attrs:
                        ids.append(attrs['id'])
                    self.assertFalse(any(key.startswith('on') for key in attrs), 'No inline event handlers')
                    if tag not in ['script', 'link', 'img']:
                        continue
                    reference = attrs.get('src') or attrs.get('href')
                    self.assertIsNotNone(reference)
                    asset = (html.parent / reference).resolve()
                    self.assertTrue(asset.is_relative_to(ROOT))
                    self.assertTrue(asset.is_file(), str(asset))
                    if tag == 'script':
                        scripts.append(reference)
                self.assertEqual(len(ids), len(set(ids)), 'DOM IDs must be unique')
                self.assertEqual(scripts, ['../shared/settings.js', f'{page}.js'])

    def test_icon_dimensions_match_manifest(self):
        manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        for size, name in manifest['icons'].items():
            image = (ROOT / name).read_bytes()
            self.assertEqual(image[:8], b'\x89PNG\r\n\x1a\n')
            self.assertEqual(struct.unpack('>II', image[16:24]), (int(size), int(size)))
        self.assertEqual(manifest['icons'], manifest['action']['default_icon'])

    def test_only_youtube_and_storage_permissions(self):
        manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
        self.assertEqual(manifest['permissions'], ['storage'])
        self.assertEqual(manifest['host_permissions'], ['*://*.youtube.com/*'])
        self.assertEqual(manifest['content_scripts'][0]['js'], ['shared/settings.js', 'content/content.js'])

    def test_no_remote_execution_or_telemetry(self):
        for directory in ['content', 'popup', 'options', 'donate', 'shared']:
            for script in (ROOT / directory).glob('*.js'):
                code = script.read_text(encoding='utf-8')
                for forbidden in ['eval(', 'new Function(', 'fetch(', 'XMLHttpRequest', 'sendBeacon(']:
                    self.assertNotIn(forbidden, code, str(script))

    def test_keyboard_focus_and_reduced_motion_are_supported(self):
        for page in ['popup', 'options', 'donate']:
            css = (ROOT / page / f'{page}.css').read_text(encoding='utf-8')
            self.assertIn(':focus-visible', css)
            self.assertIn('prefers-reduced-motion', css)