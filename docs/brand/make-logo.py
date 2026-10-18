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
def mark(tx=0, ty=0, scale=1):
    r = 'fill="none" stroke-linecap="round"'
    return f'''<g transform="translate({tx} {ty}) scale({scale})">
  <rect width="64" height="64" rx="16" fill="{BG}"/>
  <path d="M22 50.5 V27 Q22 18.5 30.5 18.5 H47.5" {r} stroke="{A}" stroke-width="9.5"/>
  <path d="M13.5 35 H39" {r} stroke="{BG}" stroke-width="16"/>
  <path d="M13.5 35 H39" {r} stroke="{C}" stroke-width="9.5"/>
  <circle cx="45.5" cy="47" r="5" fill="{O}"/>
</g>'''

open(f"{out}/formweave-mark.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="formweave">{mark()}</svg>\n')
d, w = word("formweave", 38, 78, 45, tracking=-0.005)
W = int(w + 4)
for name, ink in (("formweave-logo", "#141a1c"), ("formweave-logo-dark", "#f4f1ec")):
    open(f"{out}/{name}.svg", "w").write(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 64" role="img" aria-label="formweave">{mark()}<path d="{d}" fill="{ink}"/></svg>\n')
print("width", W)
