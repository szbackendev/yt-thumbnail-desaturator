"""
Creates a verified .zip / .xpi package of the extension.
Usage: python package.py
"""
import argparse
import os
from pathlib import Path
import sys
import tempfile
import zipfile

FILES_TO_PACK = [
    'manifest.json',
    'README.md',
    'README.en.md',
    'content/content.css',
    'content/content.js',
    'shared/settings.js',
    'popup/popup.html',
    'popup/popup.css',
    'popup/popup.js',
    'options/options.html',
    'options/options.css',
    'options/options.js',
    'donate/donate.html',
    'donate/donate.css',
    'donate/donate.js',
    'icons/icon-16.png',
    'icons/icon-32.png',
    'icons/icon-48.png',
    'icons/icon-128.png'
]

PROJECT_ROOT = Path(__file__).resolve().parent


def build_package(output, source_root=PROJECT_ROOT):
    """Build reproducibly and atomically; a failed build preserves the previous archive."""
    source_root = Path(source_root)
    output = Path(output).resolve()
    missing = [name for name in FILES_TO_PACK if not (source_root / name).is_file()]
    if missing:
        raise FileNotFoundError('Required package files are missing: ' + ', '.join(missing))

    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, suffix='.xpi', delete=False) as file:
            temporary = Path(file.name)
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            for name in FILES_TO_PACK:
                info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, (source_root / name).read_bytes(),
                                 compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
        with zipfile.ZipFile(temporary) as archive:
            corrupt = archive.testzip()
            if corrupt:
                raise ValueError(f'Corrupted archive entry: {corrupt}')
            if archive.namelist() != FILES_TO_PACK:
                raise ValueError('Package file list mismatch')
        os.replace(temporary, output)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=PROJECT_ROOT / 'yt-thumbnail-desaturator.xpi')
    args = parser.parse_args()
    try:
        output = build_package(args.output)
    except (OSError, ValueError, zipfile.BadZipFile) as error:
        print(f'Error: {error}', file=sys.stderr)
        return 1
    print(f'Package verified successfully ({len(FILES_TO_PACK)} files packed): {output}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
