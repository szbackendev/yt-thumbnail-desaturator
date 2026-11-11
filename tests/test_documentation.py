"""Keep public READMEs user-facing and maintainer instructions separate."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


class DocumentationTests(unittest.TestCase):
    def setUp(self):
        self.readmes = [(ROOT / name).read_text(encoding='utf-8')
                        for name in ['README.md', 'README.en.md']]

    def test_bilingual_readmes_have_matching_structure_and_links(self):
        headings = [re.findall(r'^#{2,3} ', text, re.M) for text in self.readmes]
        self.assertTrue(headings[0])
        self.assertEqual(headings[0], headings[1])
        links = [{target.replace('CONTRIBUTING.en.md', 'CONTRIBUTING.md')
                  for target in re.findall(r'\]\((https://[^)]+)\)', text)}
                 for text in self.readmes]
        self.assertEqual(links[0], links[1])

    def test_local_documentation_links_resolve_in_repository(self):
        guides = [(ROOT / name).read_text(encoding='utf-8')
                  for name in ['CONTRIBUTING.md', 'CONTRIBUTING.en.md']]
        for text in self.readmes + guides:
            for target in re.findall(r'\]\(([^)]+)\)', text):
                if target.startswith(('https://', '#')):
                    continue
                with self.subTest(target=target):
                    path = (ROOT / target).resolve()
                    self.assertTrue(path.is_relative_to(ROOT))
                    self.assertTrue(path.is_file())

    def test_readmes_cover_product_installation_and_support(self):
        for text in self.readmes:
            for required in ['0%', '30%', '100%', 'Zen', 'Firefox', 'Shorts',
                             'RU / EN / Auto', 'manifest.json',
                             'about:debugging#/runtime/this-firefox',
                             'https://addons.mozilla.org/firefox/addon/youtube-thumbnail-desaturator/',
                             'archive/refs/heads/main.zip', '/issues']:
                with self.subTest(required=required):
                    self.assertIn(required, text)
        self.assertIn('не подписан Mozilla', self.readmes[0])
        self.assertIn('not signed by Mozilla', self.readmes[1])

    def test_readmes_do_not_embed_maintainer_workflows(self):
        for text in self.readmes:
            self.assertLessEqual(len(text.splitlines()), 100)
            self.assertNotIn('```', text, 'Installation must not require shell commands')
            for forbidden in ['Developer Hub', 'bump_version.py', 'storage.sync',
                              'storage.local', 'THUMBNAIL_TEST_BROWSER', 'AGENTS.md',
                              'git push', 'git commit', 'unittest', '## Repository structure',
                              '## Структура проекта']:
                with self.subTest(forbidden=forbidden):
                    self.assertNotIn(forbidden, text)

    def test_contributor_guides_retain_build_instructions(self):
        guides = []
        for name in ['CONTRIBUTING.md', 'CONTRIBUTING.en.md']:
            with self.subTest(guide=name):
                guide = ROOT / name
                self.assertTrue(guide.is_file())
                text = guide.read_text(encoding='utf-8')
                guides.append(text)
                for required in ['python -m unittest discover tests -v',
                                 'python package.py', 'python bump_version.py patch',
                                 'THUMBNAIL_TEST_BROWSER',
                                 'yt-thumb-desaturator@zen.browser', 'storage.sync',
                                 'storage.local', 'AGENTS.md']:
                    self.assertIn(required, text)
                self.assertNotIn('git push origin main', text)
        self.assertEqual(len(guides), 2)
        self.assertEqual(re.findall(r'```powershell\n(.*?)```', guides[0], re.S),
                         re.findall(r'```powershell\n(.*?)```', guides[1], re.S))

    def test_public_documentation_has_no_mozilla_submission_guide(self):
        names = ['README.md', 'README.en.md', 'CONTRIBUTING.md',
                 'CONTRIBUTING.en.md', 'REVIEW.md']
        forbidden = ['Developer Hub', 'addons.mozilla.org/developers',
                     'submitting-an-add-on', 'Mozilla submission',
                     'Отправка в Mozilla', 'отправка в Mozilla',
                     'Загрузите XPI', 'Upload the XPI']
        for name in names:
            text = (ROOT / name).read_text(encoding='utf-8')
            for phrase in forbidden:
                with self.subTest(document=name, phrase=phrase):
                    self.assertTrue(phrase not in text,
                                    f'{name} must not include owner-only publication instructions')