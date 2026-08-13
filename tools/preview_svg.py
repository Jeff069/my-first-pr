#!/usr/bin/env python3
"""Erzeugt eine SVG-Vorschau aus der .excalidraw-Datei (Layout-Kontrolle)."""

import json
import sys
from xml.sax.saxutils import escape

src = sys.argv[1] if len(sys.argv) > 1 else "ED_WorkOS_Stufenplan.excalidraw"
dst = sys.argv[2] if len(sys.argv) > 2 else "ED_WorkOS_Stufenplan_preview.svg"

doc = json.load(open(src, encoding="utf-8"))
els = doc["elements"]

M = 40
xs = [e["x"] for e in els] + [e["x"] + e["width"] for e in els]
ys = [e["y"] for e in els] + [e["y"] + e["height"] for e in els]
minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
W, H = maxx - minx + 2 * M, maxy - miny + 2 * M

FAM = {1: "Segoe Print, Comic Sans MS, cursive", 2: "Nunito, Helvetica, Arial, sans-serif"}

out = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W:.0f}" height="{H:.0f}" '
    f'viewBox="{minx - M:.0f} {miny - M:.0f} {W:.0f} {H:.0f}">',
    f'<rect x="{minx - M:.0f}" y="{miny - M:.0f}" width="{W:.0f}" height="{H:.0f}" fill="#ffffff"/>',
]

for e in els:
    t, op = e["type"], e.get("opacity", 100) / 100
    fill = e.get("backgroundColor", "transparent")
    stroke = e.get("strokeColor", "#1e1e1e")
    sw = e.get("strokeWidth", 1)
    dash = ' stroke-dasharray="8 6"' if e.get("strokeStyle") == "dashed" else ""
    if t == "rectangle":
        r = 8 if e.get("roundness") else 0
        out.append(
            f'<rect x="{e["x"]:.1f}" y="{e["y"]:.1f}" width="{e["width"]:.1f}" '
            f'height="{e["height"]:.1f}" rx="{r}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="{sw}" opacity="{op}"{dash}/>'
        )
    elif t == "diamond":
        cx, cy = e["x"] + e["width"] / 2, e["y"] + e["height"] / 2
        pts = f'{cx},{e["y"]} {e["x"] + e["width"]},{cy} {cx},{e["y"] + e["height"]} {e["x"]},{cy}'
        out.append(f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
    elif t == "arrow":
        (x0, y0), (x1, y1) = e["points"][0], e["points"][-1]
        ax, ay = e["x"] + x0, e["y"] + y0
        bx, by = e["x"] + x1, e["y"] + y1
        out.append(
            f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" '
            f'stroke="{stroke}" stroke-width="{sw}"/>'
        )
        if e.get("endArrowhead"):
            out.append(
                f'<polygon points="{bx:.1f},{by:.1f} {bx - 10:.1f},{by - 5:.1f} '
                f'{bx - 10:.1f},{by + 5:.1f}" fill="{stroke}"/>'
            )
    elif t == "text":
        fs = e["fontSize"]
        fam = FAM.get(e.get("fontFamily", 2))
        anchor = "middle" if e.get("textAlign") == "center" else "start"
        tx = e["x"] + (e["width"] / 2 if anchor == "middle" else 0)
        for i, line in enumerate(e["text"].split("\n")):
            ly = e["y"] + (i + 0.82) * fs * e.get("lineHeight", 1.25)
            out.append(
                f'<text x="{tx:.1f}" y="{ly:.1f}" font-family="{fam}" font-size="{fs}" '
                f'fill="{stroke}" text-anchor="{anchor}" xml:space="preserve">{escape(line)}</text>'
            )

out.append("</svg>")
open(dst, "w", encoding="utf-8").write("\n".join(out))
print(f"{dst}  {W:.0f}x{H:.0f}")
