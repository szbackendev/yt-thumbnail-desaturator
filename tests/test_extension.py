"""
Automated Test Suite for YouTube Thumbnail Desaturator WebExtension.
Verifies Manifest V3 compliance, DOM/i18n parity, CSS rules, JS safety, and packaging.
"""

import json
import os
import re
import unittest
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class ManifestTests(unittest.TestCase):
    """Manifest V3 compliance and asset reference tests."""

    def setUp(self):
        self.manifest_path = os.path.join(PROJECT_ROOT, 'manifest.json')
        self.assertTrue(os.path.isfile(self.manifest_path), "manifest.json must exist")
        with open(self.manifest_path, 'r', encoding='utf-8') as f:
            self.manifest = json.load(f)

    def test_manifest_version(self):
        self.assertEqual(self.manifest.get('manifest_version'), 3, "Must target Manifest V3")

    def test_gecko_id_declaration(self):
        gecko_settings = self.manifest.get('browser_specific_settings', {}).get('gecko', {})
        self.assertEqual(
            gecko_settings.get('id'),
            'yt-thumb-desaturator@zen.browser',
            "Gecko ID must be fixed for persistent storage isolation in Zen Browser"
        )
        self.assertTrue(float(gecko_settings.get('strict_min_version', 0)) >= 109.0)
        data_perms = gecko_settings.get('data_collection_permissions', {})
        self.assertEqual(
            data_perms.get('required'),
            ['none'],
            "Mozilla AMO requires data_collection_permissions.required: ['none'] when no data is collected"
        )

    def test_permissions(self):
        permissions = self.manifest.get('permissions', [])
        self.assertIn('storage', permissions, "Must declare 'storage' permission")
        host_perms = self.manifest.get('host_permissions', [])
        self.assertTrue(any('youtube.com' in h for h in host_perms), "Must include youtube.com host permission")

    def test_referenced_files_exist(self):
        """All file paths declared in manifest must exist on disk."""
        # Icons
        for size, icon_rel in self.manifest.get('icons', {}).items():
            full_path = os.path.join(PROJECT_ROOT, icon_rel)
            self.assertTrue(os.path.isfile(full_path), f"Icon {size} ({icon_rel}) not found on disk")

        # Action popup
        action = self.manifest.get('action', {})
        popup = action.get('default_popup')
        self.assertTrue(os.path.isfile(os.path.join(PROJECT_ROOT, popup)), f"Popup {popup} not found")

        # Options UI
        options = self.manifest.get('options_ui', {})
        options_page = options.get('page')
        self.assertTrue(os.path.isfile(os.path.join(PROJECT_ROOT, options_page)), f"Options page {options_page} not found")

        # Content scripts
        for script_entry in self.manifest.get('content_scripts', []):
            for css in script_entry.get('css', []):
                self.assertTrue(os.path.isfile(os.path.join(PROJECT_ROOT, css)), f"Content CSS {css} not found")
            for js in script_entry.get('js', []):
                self.assertTrue(os.path.isfile(os.path.join(PROJECT_ROOT, js)), f"Content JS {js} not found")
            self.assertEqual(script_entry.get('run_at'), 'document_start', "Content script must run at document_start for Zero-FOUC")


class ContentCssTests(unittest.TestCase):
    """CSS filter selectors, protected elements, and override rules."""

    def setUp(self):
        css_path = os.path.join(PROJECT_ROOT, 'content', 'content.css')
        with open(css_path, 'r', encoding='utf-8') as f:
            self.css = f.read()

    def test_css_variables(self):
        self.assertIn('--yt-thumb-sat', self.css)
        self.assertIn('--yt-thumb-transition', self.css)

    def test_shorts_toggle_override_exists(self):
        """Disabling Shorts desaturation must explicitly reset filter to none."""
        self.assertIn('data-yt-sat-shorts="false"', self.css)
        self.assertIn('filter: none !important;', self.css)

    def test_hover_restoration_rules(self):
        """Hover rules must restore saturation to 100%."""
        self.assertIn('data-yt-sat-hover="true"', self.css)
        self.assertIn('filter: saturate(100%) !important;', self.css)
        self.assertIn('ytd-thumbnail:hover video', self.css)

    def test_protected_selectors_present(self):
        """Active video players, avatars, and channel banners must be protected."""
        protected = [
            '.html5-main-video',
            '#movie_player video',
            'ytd-player video',
            'ytd-shorts video',
            'yt-avatar-shape img',
            '#channel-thumbnail img',
            'ytd-channel-banner-renderer img'
        ]
        for sel in protected:
            self.assertIn(sel, self.css, f"Protected selector {sel} must be in content.css")


class DomAndI18nTests(unittest.TestCase):
    """Popup & Options DOM IDs and i18n dictionary consistency."""

    def test_popup_dom_ids_and_i18n(self):
        popup_html_path = os.path.join(PROJECT_ROOT, 'popup', 'popup.html')
        popup_js_path = os.path.join(PROJECT_ROOT, 'popup', 'popup.js')

        with open(popup_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        with open(popup_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        required_ids = [
            'enabled-toggle',
            'saturation-slider',
            'saturation-num',
            'shorts-toggle',
            'hover-toggle',
            'controls',
            'options',
            'txt-title',
            'txt-switch-label',
            'txt-label-thumbnails',
            'txt-preset-bw',
            'txt-opt-shorts',
            'txt-opt-hover',
            'btn-options'
        ]
        for el_id in required_ids:
            self.assertIn(f'id="{el_id}"', html, f"Element #{el_id} missing in popup.html")
            self.assertIn(el_id, js, f"Element #{el_id} missing in popup.js")

        # Check i18n parity
        ru_keys = set(re.findall(r'(\w+):\s*"[^"]+"', js[js.find('ru: {'):js.find('en: {')]))
        en_keys = set(re.findall(r'(\w+):\s*"[^"]+"', js[js.find('en: {'):js.find('DEFAULT_SETTINGS')]))
        self.assertEqual(ru_keys, en_keys, "Popup i18n RU and EN dictionaries must have identical keys")

    def test_options_dom_ids_and_i18n(self):
        options_html_path = os.path.join(PROJECT_ROOT, 'options', 'options.html')
        options_js_path = os.path.join(PROJECT_ROOT, 'options', 'options.js')

        with open(options_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        with open(options_js_path, 'r', encoding='utf-8') as f:
            js = f.read()

        required_ids = [
            'opt-page-title',
            'opt-lang-title',
            'opt-lang-desc',
            'opt-lang-auto',
            'opt-lang-auto-desc',
            'opt-lang-ru-desc',
            'opt-lang-en-desc',
            'opt-sync-title',
            'opt-sync-desc',
            'save-status'
        ]
        for el_id in required_ids:
            self.assertIn(f'id="{el_id}"', html, f"Element #{el_id} missing in options.html")
            self.assertIn(el_id, js, f"Element #{el_id} missing in options.js")

        # Check i18n parity
        ru_keys = set(re.findall(r'(\w+):\s*"[^"]+"', js[js.find('ru: {'):js.find('en: {')]))
        en_keys = set(re.findall(r'(\w+):\s*"[^"]+"', js[js.find('en: {'):js.find('const radios')]))
        self.assertEqual(ru_keys, en_keys, "Options i18n RU and EN dictionaries must have identical keys")


class DocumentationAndAgentsTests(unittest.TestCase):
    """Verify documentation limits and bilingual cross-linking."""

    def test_agents_md_strict_under_200_lines(self):
        agents_path = os.path.join(PROJECT_ROOT, 'AGENTS.md')
        self.assertTrue(os.path.isfile(agents_path), "AGENTS.md must exist")
        with open(agents_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        line_count = len(lines)
        self.assertLessEqual(
            line_count,
            200,
            f"AGENTS.md must strictly stay under 200 lines (current: {line_count})"
        )

    def test_readme_bilingual_cross_linking(self):
        readme_ru_path = os.path.join(PROJECT_ROOT, 'README.md')
        readme_en_path = os.path.join(PROJECT_ROOT, 'README.en.md')

        self.assertTrue(os.path.isfile(readme_ru_path), "README.md must exist")
        self.assertTrue(os.path.isfile(readme_en_path), "README.en.md must exist")

        with open(readme_ru_path, 'r', encoding='utf-8') as f:
            ru_lines = f.readlines()
        with open(readme_en_path, 'r', encoding='utf-8') as f:
            en_lines = f.readlines()

        # Both must cross-link in the first 20 lines (first half of document)
        ru_header = "".join(ru_lines[:20])
        en_header = "".join(en_lines[:20])

        self.assertIn("README.en.md", ru_header, "README.md must link to README.en.md in the first 20 lines")
        self.assertIn("README.md", en_header, "README.en.md must link to README.md in the first 20 lines")


class PackagingTests(unittest.TestCase):
    """Test package.py and xpi archive creation."""

    def test_package_creation_and_integrity(self):
        package_script = os.path.join(PROJECT_ROOT, 'package.py')
        self.assertTrue(os.path.isfile(package_script))

        # Run packaging logic directly
        import subprocess
        res = subprocess.run(['python', 'package.py'], cwd=PROJECT_ROOT, capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"package.py failed with: {res.stderr}")

        archive_path = os.path.join(PROJECT_ROOT, 'yt-thumbnail-desaturator.xpi')
        self.assertTrue(os.path.isfile(archive_path), "yt-thumbnail-desaturator.xpi must be generated")

        with zipfile.ZipFile(archive_path, 'r') as z:
            corrupt = z.testzip()
            self.assertIsNone(corrupt, "ZIP archive contains corrupted files")
            namelist = z.namelist()
            self.assertIn('manifest.json', namelist)
            self.assertIn('README.md', namelist)
            self.assertIn('README.en.md', namelist)
            self.assertIn('content/content.css', namelist)
            self.assertIn('content/content.js', namelist)
            self.assertIn('popup/popup.html', namelist)
            self.assertIn('popup/popup.js', namelist)
            self.assertIn('options/options.html', namelist)
            self.assertIn('options/options.js', namelist)


if __name__ == '__main__':
    unittest.main()

