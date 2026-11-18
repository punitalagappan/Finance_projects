"""Strip alpha channels and install the icon + splash into the Xcode asset catalogs (Apple rejects icons with alpha)."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
store = root / 'store'
assets = root / 'ios/App/App/Assets.xcassets'

def flat(src, dst, size=None):
    im = Image.open(src).convert('RGBA')
    bg = Image.new('RGB', im.size, (11, 13, 16))
    bg.paste(im, mask=im.split()[3])
    if size:
        bg = bg.resize((size, size), Image.LANCZOS)
    bg.save(dst, 'PNG')
    print('wrote', dst.relative_to(root), bg.mode, bg.size)

flat(store / 'icon-1024.png', store / 'icon-1024.png')
if assets.exists():
    flat(store / 'icon-1024.png', assets / 'AppIcon.appiconset/AppIcon-512@2x.png')
    for name in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
        flat(store / 'splash-2732.png', assets / 'Splash.imageset' / name)
for jpg in sorted((store / 'screenshots').rglob('*.jpg')):
    with Image.open(jpg) as im:
        print('screenshot', jpg.relative_to(root), im.mode, im.size)
