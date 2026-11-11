"""Keep bilingual release instructions consistent and grounded in shipped assets."""
from pathlib import Path
import re
from textwrap import dedent
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DocumentationTests(unittest.TestCase):
    def setUp(self):
        self.readmes = [(ROOT / name).read_text(encoding='utf-8')
                        for name in ['README.md', 'README.en.md']]

    def test_bilingual_readmes_have_matching_commands_and_links(self):
        commands = [[dedent(block).strip() for block in
                     re.findall(r'```powershell\n(.*?)^[ \t]*```', text, re.S | re.M)]
                    for text in self.readmes]
        self.assertEqual(len(commands[0]), 6)
        self.assertEqual(commands[0], commands[1])
        links = [set(re.findall(r'\]\((https://[^)]+)\)', text)) for text in self.readmes]
        self.assertEqual(links[0], links[1])

    def test_local_documentation_links_resolve_in_repository(self):
        for text in self.readmes:
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if target.startswith(('https://', '#')):
                    continue
                with self.subTest(target=target):
                    path = (ROOT / target).resolve()
                    self.assertTrue(path.is_relative_to(ROOT))
                    self.assertTrue(path.is_file())

    def test_readmes_cover_storage_browser_and_submission_limits(self):
        for text in self.readmes:
            for required in ['30%', 'storage.sync', 'storage.local', '109.0',
                             'THUMBNAIL_TEST_BROWSER', 'Developer Hub',
                             'yt-thumb-desaturator@zen.browser',
                             'python bump_version.py patch', 'AGENTS.md']:
                with self.subTest(required=required):
                    self.assertIn(required, text)
            self.assertNotIn('git push origin main', text)
            self.assertNotIn('git add .\n', text)
        self.assertIn('не подписаны Mozilla', self.readmes[0])
        self.assertIn('not signed by Mozilla', self.readmes[1])