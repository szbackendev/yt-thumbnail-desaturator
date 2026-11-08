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
    parts = current.split('.')
    while len(parts) < 3:
        parts.append('0')

    try:
        major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
    except ValueError:
        raise ValueError(f"Cannot parse current version: {current}")

    if mode == 'patch':
        patch += 1
    elif mode == 'minor':
        minor += 1
        patch = 0
    elif mode == 'major':
        major += 1
        minor = 0
        patch = 0
    elif re.match(r'^\d+\.\d+(\.\d+)?$', mode):
        return mode
    else:
        raise ValueError(f"Unknown bump mode: {mode}. Use 'patch', 'minor', 'major', or explicit version.")

    return f"{major}.{minor}.{patch}"


def update_manifest_version(new_version, manifest_data):
    manifest_data['version'] = new_version
    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    print(f"Updated manifest.json: version -> {new_version}")


def main():
    mode = sys.argv[1].lower() if len(sys.argv) > 1 else 'patch'

    curr_ver, manifest_data = get_current_version()
    next_ver = calculate_next_version(curr_ver, mode)
    print(f"Bumping version: {curr_ver} -> {next_ver}")

    update_manifest_version(next_ver, manifest_data)

    print("\nRunning automated test suite...")
    test_res = subprocess.run([sys.executable, '-m', 'unittest', 'discover', 'tests'], cwd=PROJECT_ROOT)
    if test_res.returncode != 0:
        print("Error: Test suite failed! Reverting manifest.json...", file=sys.stderr)
        manifest_data['version'] = curr_ver
        update_manifest_version(curr_ver, manifest_data)
        sys.exit(1)

    print("\nRebuilding release package...")
    pkg_res = subprocess.run([sys.executable, 'package.py'], cwd=PROJECT_ROOT)
    if pkg_res.returncode != 0:
        print("Error: Package build failed!", file=sys.stderr)
        sys.exit(1)

    print(f"\nSuccessfully bumped version to v{next_ver} and rebuilt yt-thumbnail-desaturator.xpi!")
    print("\nNext Git steps to promote to main:")
    print(f"  git commit -am \"chore(release): bump version to {next_ver}\"")
    print("  git push origin dev")
    print("  git checkout main")
    print("  git merge dev")
    print("  git push origin main")
    print("  git checkout dev")


if __name__ == '__main__':
    main()
