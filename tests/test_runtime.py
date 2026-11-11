"""Execute actual extension scripts against both WebExtension API contracts."""
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]


class RuntimeTests(unittest.TestCase):
    def test_javascript_runtime(self):
        node = shutil.which('node')
        self.assertIsNotNone(node, 'Node.js 24+ is required for JavaScript runtime tests')
        result = subprocess.run(
            [node, '--test', str(ROOT / 'tests' / 'runtime.test.cjs')],
            cwd=ROOT, capture_output=True, text=True, encoding='utf-8', timeout=60,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)