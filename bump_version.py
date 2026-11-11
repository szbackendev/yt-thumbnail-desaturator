"""
Automated Version Bumper for YouTube Thumbnail Desaturator.
Usage:
  python bump_version.py         # bumps patch: 1.0.0 -> 1.0.1
  python bump_version.py minor   # bumps minor: 1.0.0 -> 1.1.0
  python bump_version.py major   # bumps major: 1.0.0 -> 2.0.0
  python bump_version.py 1.0.2   # sets explicit version
"""

import json
import os
from pathlib import Path
import re
import subprocess
import sys

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
MANIFEST_PATH = os.path.join(PROJECT_ROOT, 'manifest.json')


def get_current_version():
    with open(MANIFEST_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('version', '1.0.0'), data


def calculate_next_version(current, mode='patch'):
    def parse(version):
        if not re.fullmatch(r'(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){1,2}', version):
            raise ValueError(f'Invalid release version: {version!r}')
        parts = tuple(int(part) for part in version.split('.'))
        if any(part > 65535 for part in parts):
            raise ValueError('Version components must not exceed 65535')
        return parts + (0,) * (3 - len(parts))

    current_parts = parse(current)
    major, minor, patch = current_parts

    if mode == 'patch':
        patch += 1
    elif mode == 'minor':
        minor += 1
        patch = 0
    elif mode == 'major':
        major += 1
        minor = 0
        patch = 0
    else:
        if parse(mode) <= current_parts:
            raise ValueError('Release version must be greater than the current version')
        return mode

    version = f"{major}.{minor}.{patch}"
    parse(version)
    return version


def update_manifest_version(new_version, manifest_data):
    manifest_data['version'] = new_version
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"Updated manifest.json: version -> {new_version}")


def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else 'patch'

    try:
        branch = subprocess.run(['git', 'branch', '--show-current'], cwd=PROJECT_ROOT,
                                capture_output=True, text=True, check=True).stdout.strip()
        if branch != 'dev':
            raise ValueError('Version changes are allowed only on dev')
        curr_ver, manifest_data = get_current_version()
        next_ver = calculate_next_version(curr_ver, mode)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    print(f"Bumping version: {curr_ver} -> {next_ver}")

    manifest_path = Path(MANIFEST_PATH)
    archive_path = Path(PROJECT_ROOT) / 'yt-thumbnail-desaturator.xpi'
    original_manifest = manifest_path.read_bytes()
    original_archive = archive_path.read_bytes() if archive_path.exists() else None
    try:
        update_manifest_version(next_ver, manifest_data)
        print("\nRunning automated test suite...")
        test_res = subprocess.run([sys.executable, '-m', 'unittest', 'discover', 'tests'], cwd=PROJECT_ROOT)
        if test_res.returncode != 0:
            raise RuntimeError('Test suite failed')
        print("\nRebuilding release package...")
        pkg_res = subprocess.run([sys.executable, 'package.py'], cwd=PROJECT_ROOT)
        if pkg_res.returncode != 0:
            raise RuntimeError('Package build failed')
    except (OSError, RuntimeError, KeyboardInterrupt) as error:
        manifest_path.write_bytes(original_manifest)
        if original_archive is None:
            archive_path.unlink(missing_ok=True)
        else:
            archive_path.write_bytes(original_archive)
        print(f'Error: {error}. Previous manifest and archive restored.', file=sys.stderr)
        return 1

    print(f"\nSuccessfully bumped version to v{next_ver} and rebuilt yt-thumbnail-desaturator.xpi!")
    print("\nNext Git steps to promote to main:")
    print(f"  git commit -am \"chore(release): bump version to {next_ver}\"")
    print("  git push origin dev")
    print("  Open a pull request from dev to main after CI and browser smoke checks pass.")
    return 0


if __name__ == '__main__':
    sys.exit(main())
