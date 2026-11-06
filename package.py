"""
Creates a ready-to-use .zip / .xpi package of the extension.
Usage: python package.py
"""
import os
import zipfile

FILES_TO_PACK = [
    'manifest.json',
    'README.md',
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

with zipfile.ZipFile(archive_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in FILES_TO_PACK:
        if os.path.exists(f):
            z.write(f, arcname=f)
            print(f'Added: {f}')
        else:
            print(f'Warning: {f} not found!')

print(f'\nPackage created successfully: {archive_name}')

