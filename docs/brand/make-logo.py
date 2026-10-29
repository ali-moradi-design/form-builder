import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

font_path, out = sys.argv[1], sys.argv[2]
f = TTFont(font_path)
gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f["head"].unitsPerEm

def word(text, size, x0, baseline, tracking=-0.02):
    s = size / upm
    x, d = x0, []
    for ch in text:
        g = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, baseline)))
        d.append(pen.getCommands())
        x += gs[g].width * s + tracking * size
    return " ".join(d), x - tracking * size

BG, A, O, C = "#5f0f40", "#fb8b24", "#e36414", "#fff4e8"
# Pointer drawn at the origin; the plum outline separates it from the "F".
ARROW = "M0 0 L0 19 L4.6 14.6 L8.2 22.4 L12 20.6 L8.4 13 L14.6 13 Z"

def mark(tx=0, ty=0, scale=1):
    return f'''<g transform="translate({tx} {ty}) scale({scale})">
  <rect width="64" height="64" rx="16" fill="{BG}"/>
  <rect x="13" y="13" width="34" height="9.5" rx="4.75" fill="{A}"/>
  <rect x="13" y="13" width="9.5" height="38" rx="4.75" fill="{A}"/>
  <rect x="13" y="28.5" width="25" height="9.5" rx="4.75" fill="{C}"/>
  <path transform="translate(39.5 38) scale(0.92)" d="{ARROW}" fill="{O}" stroke="{BG}" stroke-width="3.2" stroke-linejoin="round" paint-order="stroke"/>
</g>'''

open(f"{out}/formcanvas-mark.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="formcanvas">{mark()}</svg>\n')
d, w = word("formcanvas", 38, 78, 45, tracking=-0.005)
W = int(w + 4)
for name, ink in (("formcanvas-logo", "#141a1c"), ("formcanvas-logo-dark", "#f4f1ec")):
    open(f"{out}/{name}.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 64" role="img" aria-label="formcanvas">{mark()}<path d="{d}" fill="{ink}"/></svg>\n')
print("width", W)
