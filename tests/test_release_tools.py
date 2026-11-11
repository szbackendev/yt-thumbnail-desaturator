"""Release tool regressions; all builds and version edits use temporary files."""
from pathlib import Path
import contextlib
import io
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

ROOT = Path(__file__).resolve().parents[1]


class ReleaseToolTests(unittest.TestCase):
    def test_packager_works_outside_repository_and_accepts_output(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'extension.xpi'
            result = subprocess.run(
                [sys.executable, str(ROOT / 'package.py'), '--output', str(output)],
                cwd=directory, capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertTrue(output.is_file())
            with zipfile.ZipFile(output) as archive:
                self.assertIsNone(archive.testzip())
                for name in archive.namelist():
                    self.assertEqual(archive.read(name), (ROOT / name).read_bytes())

    def test_packaging_is_reproducible(self):
        with tempfile.TemporaryDirectory() as directory:
            outputs = [Path(directory) / f'{number}.xpi' for number in range(2)]
            for output in outputs:
                result = subprocess.run(
                    [sys.executable, str(ROOT / 'package.py'), '--output', str(output)],
                    cwd=ROOT, capture_output=True, text=True,
                )
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertTrue(output.is_file(), '--output must not overwrite the repository archive')
            self.assertEqual(outputs[0].read_bytes(), outputs[1].read_bytes())

    def test_invalid_versions_are_rejected(self):
        import bump_version
        for current, mode in [('1.0.0.1', 'patch'), ('1.0.0', '2.0.0\n'),
                              ('1.0.0', '65536.0.0'), ('1.0.65535', 'patch'),
                              ('1.0.0', '01.0.0'), ('1.0.0', '1.0.0'), ('2.0.0', '1.0.0')]:
            with self.subTest(current=current, mode=mode):
                with self.assertRaises(ValueError):
                    bump_version.calculate_next_version(current, mode)

    def test_failed_release_restores_manifest_and_archive_bytes(self):
        import bump_version
        for return_codes in [(1,), (0, 1)]:
            codes = list(return_codes)
            with self.subTest(codes=codes), tempfile.TemporaryDirectory() as directory:
                manifest = Path(directory) / 'manifest.json'
                archive = Path(directory) / 'yt-thumbnail-desaturator.xpi'
                original = b'{"version":"1.0.0"}\n'
                manifest.write_bytes(original)
                archive.write_bytes(b'previous release')

                def run(*args, **kwargs):
                    if args[0][0] == 'git':
                        return subprocess.CompletedProcess(args[0], 0, stdout='dev\n')
                    archive.write_bytes(b'partial build')
                    return subprocess.CompletedProcess(args[0], codes.pop(0))

                with patch.object(bump_version, 'PROJECT_ROOT', directory), \
                     patch.object(bump_version, 'MANIFEST_PATH', str(manifest)), \
                     patch.object(sys, 'argv', ['bump_version.py', 'patch']), \
                     patch.object(bump_version.subprocess, 'run', side_effect=run), \
                     contextlib.redirect_stdout(io.StringIO()), \
                     contextlib.redirect_stderr(io.StringIO()):
                    try:
                        result = bump_version.main()
                    except SystemExit as error:
                        result = error.code
                self.assertEqual(result, 1)
                self.assertEqual(manifest.read_bytes(), original)
                self.assertEqual(archive.read_bytes(), b'previous release')

    def test_release_guidance_does_not_push_directly_to_main(self):
        source = (ROOT / 'bump_version.py').read_text(encoding='utf-8')
        self.assertNotIn('git push origin main', source)

    def test_version_bump_refuses_main_before_editing_files(self):
        import bump_version
        with patch.object(bump_version.subprocess, 'run', return_value=
                          subprocess.CompletedProcess([], 0, stdout='main\n')), \
             patch.object(bump_version, 'get_current_version') as read_version, \
             contextlib.redirect_stderr(io.StringIO()):
            self.assertEqual(bump_version.main(), 1)
            read_version.assert_not_called()

    def test_missing_asset_preserves_previous_package(self):
        import package
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'extension.xpi'
            output.write_bytes(b'previous build')
            with self.assertRaises(FileNotFoundError):
                package.build_package(output, source_root=directory)
            self.assertEqual(output.read_bytes(), b'previous build')

    def test_release_is_tagged_and_does_not_claim_unsigned_xpi_is_installable(self):
        source = (ROOT / '.github/workflows/release.yml').read_text(encoding='utf-8')
        self.assertIn('tags:', source)
        self.assertIn('actions/setup-node@', source)
        self.assertIn('unsigned', source.lower())
        self.assertNotIn('Ready-to-install', source)

    def test_ci_validates_dev_and_pull_requests_with_node(self):
        workflow = ROOT / '.github' / 'workflows' / 'ci.yml'
        self.assertTrue(workflow.is_file(), 'dev and pull requests need a pre-merge validation gate')
        source = workflow.read_text(encoding='utf-8')
        for required in ['pull_request:', 'dev', 'actions/setup-node@', 'unittest discover tests', 'python package.py']:
            self.assertIn(required, source)