"""
Creates a verified .zip / .xpi package of the extension.
Usage: python package.py
"""
import os
import sys
import zipfile

FILES_TO_PACK = [
    'manifest.json',
    'README.md',
    'README.en.md',
    'content/content.css',
    'content/content.js',
    'popup/popup.html',
    'popup/popup.css',
    'popup/popup.js',
    'options/options.html',
    'options/options.css',
    'options/options.js',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png'
]

archive_name = 'yt-thumbnail-desaturator.xpi'

missing = []
for f in FILES_TO_PACK:
    if not os.path.isfile(f):
        missing.append(f)

if missing:
    print(f"Error: Required package files are missing:\n  " + "\n  ".join(missing), file=sys.stderr)
    sys.exit(1)

if os.path.exists(archive_name):
    try:
        os.remove(archive_name)
    except OSError:
        pass

with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in FILES_TO_PACK:
        z.write(f, arcname=f)
        print(f'Added: {f}')

# Verify archive integrity
with zipfile.ZipFile(archive_name, 'r') as z:
    corrupt = z.testzip()
    if corrupt:
        print(f"Error: Corrupted entry detected in {archive_name}: {corrupt}", file=sys.stderr)
        sys.exit(1)
    file_list = z.namelist()

print(f'\nPackage verified successfully ({len(file_list)} files packed): {archive_name}')
sys.exit(0)
