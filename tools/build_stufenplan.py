#!/usr/bin/env python3
"""Generiert die Excalidraw-Stufenplanung für ED WorkOS.

Quelle: ED_WorkOS_Excalidraw_Stufenplan (Stufen 0-10).
Ausgabe: ED_WorkOS_Stufenplan.excalidraw  (import via excalidraw.com -> Datei öffnen)
"""

import json
import random

random.seed(20260813)

# ---------------------------------------------------------------- Inhalte ----

PHASES = [
    ("Phase A  -  Fundament", [0, 1, 2], "#dbe4ff", "#4a9eed", "#a5d8ff"),
    ("Phase B  -  Kernplattform", [3, 4, 5], "#e5dbff", "#8b5cf6", "#d0bfff"),
    ("Phase C  -  Auswertung & Automatisierung", [6, 7, 8], "#fff3bf", "#f59e0b", "#ffd8a8"),
    ("Phase D  -  Einführung", [9, 10], "#d3f9d8", "#22c55e", "#b2f2bb"),
]

STAGES = [
    {
        "nr": "0",
        "titel": "IST-Analyse",
        "ziel": "Verstehen, welche Funktionen im Unternehmen wirklich gebraucht werden.",
        "aufgaben": [
            "monday.com erfassen: Boards, Aufgaben, Status, Dashboards, Automationen, Auswertungen",
            "Kraaft erfassen: Baustellen-Chats, Fotos, Dokumente, Berichte, Aufgaben",
            "Doppelte Eingaben, Medienbrüche und häufige Tool-Wechsel dokumentieren",
        ],
        "ergebnis": "Muss-Funktionen, Kann-Funktionen und nicht benötigte Funktionen",
        "abh": "Start - keine Vorstufe",
    },
    {
        "nr": "1",
        "titel": "ED Datenmodell",
        "ziel": "Eine gemeinsame Datenbasis für Büro und Baustelle definieren.",
        "aufgaben": [
            "Grundobjekte: Kunden, Projekte, Baustellen, Mitarbeiter, Aufgaben, Termine",
            "Dokumente, Fotos, Berichte und Kosten ergänzen",
            "Festlegen, welche Informationen miteinander verknüpft sind",
            "Eindeutige Projektakte als zentrale Datenquelle vorsehen",
        ],
        "ergebnis": "Datenmodell als Grundlage für Datenbank und API",
        "abh": "setzt Stufe 0 voraus",
    },
    {
        "nr": "2",
        "titel": "Benutzer & Rechte",
        "ziel": "Jeder Benutzer sieht nur die für seine Arbeit relevanten Informationen.",
        "aufgaben": [
            "Rollen: Geschäftsführung, Finanz & Controlling, Bereichsleiter, Projektleiter, Monteur",
            "Lese-, Schreib-, Freigabe- und Administrationsrechte definieren",
            "Mobile Oberfläche für operative Mitarbeiter möglichst einfach halten",
        ],
        "ergebnis": "Rollen- und Rechtekonzept",
        "abh": "setzt Stufe 1 voraus",
    },
    {
        "nr": "3",
        "titel": "Projektzentrale",
        "ziel": "Alle wichtigen Projektinformationen auf einer zentralen Seite bündeln.",
        "aufgaben": [
            "Projektübersicht mit Status, Verantwortlichen, Terminen, offenen Punkten",
            "Register: Übersicht, Aufgaben, Baustelle, Mitarbeiter, Dokumente",
            "Register: Fotos, Berichte, Finanzen und Verlauf",
            "Änderungen und wichtige Ereignisse nachvollziehbar darstellen",
        ],
        "ergebnis": "Single Source of Truth für jedes Projekt",
        "abh": "setzt Stufe 1 + 2 voraus",
    },
    {
        "nr": "4",
        "titel": "Büro-Modul",
        "ziel": "Projektsteuerung und tägliche Büroarbeit vereinfachen.",
        "aufgaben": [
            "Dashboard für laufende Projekte und kritische Punkte",
            "Aufgaben, Zuständigkeiten, Prioritäten, Termine und Projektstatus",
            "Filter nach Bereich, Verantwortlichem und Projekt",
        ],
        "ergebnis": "Die heute in monday.com genutzten Kernabläufe in eigener Oberfläche",
        "abh": "setzt Stufe 3 voraus",
    },
    {
        "nr": "5",
        "titel": "Baustellen-Modul",
        "ziel": "Informationen von der Baustelle direkt in die zentrale Projektakte bringen.",
        "aufgaben": [
            "Mobile Ansicht mit 'Meine Baustelle' und 'Meine Aufgaben'",
            "Fotos aufnehmen und direkt dem Projekt bzw. Vorgang zuordnen",
            "Nachrichten, Dokumente, Berichte und Mängel erfassen",
        ],
        "ergebnis": "Die operativen Abläufe, die heute über Kraaft laufen",
        "abh": "setzt Stufe 3 voraus",
    },
    {
        "nr": "6",
        "titel": "Finanz & Controlling",
        "ziel": "Projektfortschritt und wirtschaftliche Kennzahlen zusammenführen.",
        "aufgaben": [
            "Budget, Soll/Ist, Kosten und relevante Projektkennzahlen darstellen",
            "Auswertungen pro Projekt, Bereich oder Zeitraum",
            "Warnungen bei Abweichungen oder fehlenden Informationen vorbereiten",
        ],
        "ergebnis": "Management- und Controlling-Dashboard ohne Tool-Wechsel",
        "abh": "setzt Stufe 3 + 4 voraus",
    },
    {
        "nr": "7",
        "titel": "n8n Automation",
        "ziel": "Wiederkehrende Arbeit im Hintergrund automatisieren.",
        "aufgaben": [
            "Kette: Baustellenbericht > Verarbeitung > Projekt aktualisieren",
            "Kette weiter: Aufgabe erzeugen > Verantwortlichen informieren",
            "E-Mail, Dokumentenablage, Benachrichtigungen und Systeme anbinden",
            "Automationen transparent und nachvollziehbar aufbauen",
        ],
        "ergebnis": "Weniger manuelle Übertragung und weniger doppelte Eingabe",
        "abh": "setzt Stufe 3 - 5 voraus",
    },
    {
        "nr": "8",
        "titel": "KI / Paperclip",
        "ziel": "Vorhandene Projektinformationen intelligenter nutzbar machen.",
        "aufgaben": [
            "Projektverläufe und Berichte zusammenfassen",
            "Dokumente analysieren und relevante Informationen extrahieren",
            "Fragen zu Projekten auf Basis der vorhandenen Daten beantworten",
            "Auffälligkeiten und fehlende Informationen markieren",
        ],
        "ergebnis": "Assistenzfunktionen ergänzen die stabile Basisplattform",
        "abh": "setzt Stufe 6 + 7 voraus",
    },
    {
        "nr": "9",
        "titel": "Pilotprojekt",
        "ziel": "Das System unter realen Bedingungen testen, bevor Werkzeuge ersetzt werden.",
        "aufgaben": [
            "Eine geeignete echte Baustelle auswählen",
            "Büro und Baustelle arbeiten im Pilotumfang mit ED WorkOS",
            "Fehler, fehlende Funktionen und unnötige Schritte dokumentieren",
        ],
        "ergebnis": "Entscheidung: bereit für den breiteren Einsatz - ja oder nein",
        "abh": "setzt Stufe 4 + 5 voraus",
    },
    {
        "nr": "10",
        "titel": "Migration & Rollout",
        "ziel": "Bestehende Systeme kontrolliert ablösen und das System einführen.",
        "aufgaben": [
            "Bestandsdaten übernehmen, soweit technisch und rechtlich möglich",
            "Mitarbeiter nach Rollen schulen",
            "Schrittweise Einführung statt sofortiger Komplettabschaltung",
            "monday.com / Kraaft erst kündigen, wenn Abläufe nachweislich laufen",
        ],
        "ergebnis": "Eine zentrale Plattform für Büro, Controlling, Leitung und Baustelle",
        "abh": "setzt Stufe 9 voraus",
    },
]

MEILENSTEINE = [
    ("M1", "Fundament steht", "nach Stufe 2", 2),
    ("M2", "Plattform nutzbar", "nach Stufe 5", 5),
    ("M3", "Steuerung & Automation", "nach Stufe 8", 8),
    ("M4", "Go-Live", "nach Stufe 10", 10),
]

# --------------------------------------------------------------- Geometrie ---

COL_W = 360
COL_GAP = 44
PITCH = COL_W + COL_GAP
PAD = 16

HEAD_Y = 150
HEAD_H = 104
CARD_GAP = 16

FS_BODY = 16
FS_LABEL = 14
LINE_H = 1.25

FONT_HAND = 1   # Excalifont
FONT_SANS = 2   # Nunito / Helvetica

# grobe Zeichenbreiten je Font
CW = {FONT_HAND: 0.56, FONT_SANS: 0.51}

elements = []
_id = [0]


def nid(prefix="e"):
    _id[0] += 1
    return f"{prefix}{_id[0]:04d}"


def base(el):
    el.setdefault("angle", 0)
    el.setdefault("strokeColor", "#1e1e1e")
    el.setdefault("backgroundColor", "transparent")
    el.setdefault("fillStyle", "solid")
    el.setdefault("strokeWidth", 1)
    el.setdefault("strokeStyle", "solid")
    el.setdefault("roughness", 1)
    el.setdefault("opacity", 100)
    el.setdefault("groupIds", [])
    el.setdefault("frameId", None)
    el.setdefault("roundness", None)
    el.setdefault("seed", random.randint(1, 2 ** 31))
    el.setdefault("version", 1)
    el.setdefault("versionNonce", random.randint(1, 2 ** 31))
    el.setdefault("isDeleted", False)
    el.setdefault("boundElements", None)
    el.setdefault("updated", 1)
    el.setdefault("link", None)
    el.setdefault("locked", False)
    elements.append(el)
    return el


def wrap(text, max_px, font, fs):
    """Bricht Text auf die Kartenbreite um."""
    limit = max(8, int(max_px / (fs * CW[font])))
    lines, cur = [], ""
    for word in text.split():
        cand = word if not cur else cur + " " + word
        if len(cand) <= limit:
            cur = cand
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def text_h(n_lines, fs):
    return round(n_lines * fs * LINE_H)


def text_el(x, y, lines, fs=FS_BODY, font=FONT_SANS, color="#1e1e1e", align="left", group=None):
    txt = "\n".join(lines)
    width = max((len(l) for l in lines), default=1) * fs * CW[font]
    el = {
        "type": "text",
        "id": nid("t"),
        "x": x,
        "y": y,
        "width": round(width, 2),
        "height": text_h(len(lines), fs),
        "strokeColor": color,
        "text": txt,
        "originalText": txt,
        "fontSize": fs,
        "fontFamily": font,
        "textAlign": align,
        "verticalAlign": "top",
        "containerId": None,
        "lineHeight": LINE_H,
        "autoResize": True,
        "groupIds": group or [],
    }
    return base(el)


def box(x, y, w, h, fill="transparent", stroke="#1e1e1e", sw=1, round_=True,
        opacity=100, style="solid", group=None):
    el = {
        "type": "rectangle",
        "id": nid("r"),
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "backgroundColor": fill,
        "strokeColor": stroke,
        "strokeWidth": sw,
        "strokeStyle": style,
        "opacity": opacity,
        "roundness": {"type": 3} if round_ else None,
        "groupIds": group or [],
    }
    return base(el)


def labeled_box(x, y, w, h, label_lines, fill, stroke, fs=20, font=FONT_HAND,
                sw=2, color="#1e1e1e", group=None):
    """Rechteck mit gebundenem, zentriertem Text."""
    rect = box(x, y, w, h, fill=fill, stroke=stroke, sw=sw, group=group)
    txt = "\n".join(label_lines)
    width = max(len(l) for l in label_lines) * fs * CW[font]
    th = text_h(len(label_lines), fs)
    t = {
        "type": "text",
        "id": nid("t"),
        "x": x + (w - width) / 2,
        "y": y + (h - th) / 2,
        "width": round(width, 2),
        "height": th,
        "strokeColor": color,
        "text": txt,
        "originalText": txt,
        "fontSize": fs,
        "fontFamily": font,
        "textAlign": "center",
        "verticalAlign": "middle",
        "containerId": rect["id"],
        "lineHeight": LINE_H,
        "autoResize": False,
        "groupIds": group or [],
    }
    base(t)
    rect["boundElements"] = [{"id": t["id"], "type": "text"}]
    return rect


def arrow(x, y, dx, dy, stroke="#1e1e1e", sw=2, start=None, end=None,
          style="solid", head="arrow", group=None):
    el = {
        "type": "arrow",
        "id": nid("a"),
        "x": x,
        "y": y,
        "width": abs(dx),
        "height": abs(dy),
        "strokeColor": stroke,
        "strokeWidth": sw,
        "strokeStyle": style,
        "points": [[0, 0], [dx, dy]],
        "lastCommittedPoint": None,
        "startBinding": ({"elementId": start, "focus": 0, "gap": 4} if start else None),
        "endBinding": ({"elementId": end, "focus": 0, "gap": 4} if end else None),
        "startArrowhead": None,
        "endArrowhead": head,
        "elbowed": False,
        "roundness": {"type": 2},
        "groupIds": group or [],
    }
    return base(el)


def bind(rect, arrow_el):
    rect["boundElements"] = (rect.get("boundElements") or []) + [
        {"id": arrow_el["id"], "type": "arrow"}
    ]


# -------------------------------------------------------- Karten vorbereiten -

inner = COL_W - 2 * PAD

prep = []
for s in STAGES:
    ziel = wrap(s["ziel"], inner, FONT_SANS, FS_BODY)
    aufg = []
    for a in s["aufgaben"]:
        w = wrap(a, inner - 14, FONT_SANS, FS_BODY)
        aufg.append(["- " + w[0]] + ["  " + l for l in w[1:]])
    erg = wrap(s["ergebnis"], inner, FONT_SANS, FS_BODY)
    abh = wrap(s["abh"], inner, FONT_SANS, FS_LABEL)
    prep.append({"ziel": ziel, "aufg": aufg, "erg": erg, "abh": abh})

TITLE_H = 24  # Höhe der Karten-Überschrift ("Ziel" usw.)

ziel_h = max(TITLE_H + text_h(len(p["ziel"]), FS_BODY) + 2 * PAD for p in prep)
aufg_h = max(
    TITLE_H + text_h(sum(len(b) for b in p["aufg"]), FS_BODY) + 4 * (len(p["aufg"]) - 1) + 2 * PAD
    for p in prep
)
erg_h = max(TITLE_H + text_h(len(p["erg"]), FS_BODY) + 2 * PAD for p in prep)
abh_h = max(text_h(len(p["abh"]), FS_LABEL) + 20 for p in prep)

ZIEL_Y = HEAD_Y + HEAD_H + 26
AUFG_Y = ZIEL_Y + ziel_h + CARD_GAP
ERG_Y = AUFG_Y + aufg_h + CARD_GAP
ABH_Y = ERG_Y + erg_h + CARD_GAP
BAND_BOTTOM = ABH_Y + abh_h + 22

TOTAL_W = len(STAGES) * COL_W + (len(STAGES) - 1) * COL_GAP


def col_x(i):
    return i * PITCH


# -------------------------------------------------------------- Zeichnen -----

# 1) Phasenbänder (Hintergrund, zuerst = ganz hinten)
phase_of = {}
for name, idxs, zone, accent, fill in PHASES:
    x0 = col_x(idxs[0]) - 18
    x1 = col_x(idxs[-1]) + COL_W + 18
    box(x0, HEAD_Y - 62, x1 - x0, BAND_BOTTOM - (HEAD_Y - 62),
        fill=zone, stroke=accent, sw=1, opacity=30)
    text_el(x0 + 18, HEAD_Y - 54, [name], fs=18, font=FONT_HAND, color=accent)
    for i in idxs:
        phase_of[i] = (accent, fill)

# 2) Titelblock
text_el(0, -110, ["ED WorkOS  -  Stufenplanung"], fs=44, font=FONT_HAND, color="#1e1e1e")
text_el(0, -52, [
    "Ziel: monday.com und Kraaft langfristig durch eine zentrale interne Arbeitsplattform ergänzen bzw. ersetzen.",
], fs=20, font=FONT_SANS, color="#495057")
text_el(0, -22, [
    "Lesart: jede Stufe = ein Arbeitspaket mit Ziel, Aufgaben, Ergebnis und Abhängigkeit. Reihenfolge von links nach rechts.",
], fs=16, font=FONT_SANS, color="#757575")

# 3) Stufen-Spalten
heads = []
for i, s in enumerate(STAGES):
    accent, fill = phase_of[i]
    x = col_x(i)
    p = prep[i]
    grp = [f"stufe-{s['nr']}"]

    # Kopf: Nummernbadge + Titel
    head = labeled_box(x, HEAD_Y, COL_W, HEAD_H,
                       ["STUFE " + s["nr"], s["titel"]],
                       fill=fill, stroke=accent, fs=22, font=FONT_HAND, sw=2, group=grp)
    heads.append(head)

    # Ziel
    box(x, ZIEL_Y, COL_W, ziel_h, fill="#fff3bf", stroke="#f59e0b", sw=1, group=grp)
    text_el(x + PAD, ZIEL_Y + PAD - 4, ["ZIEL"], fs=FS_LABEL, font=FONT_HAND, color="#b45309", group=grp)
    text_el(x + PAD, ZIEL_Y + PAD + TITLE_H - 6, p["ziel"], fs=FS_BODY, color="#1e1e1e", group=grp)

    # Aufgaben
    box(x, AUFG_Y, COL_W, aufg_h, fill="#ffffff", stroke="#868e96", sw=1, group=grp)
    text_el(x + PAD, AUFG_Y + PAD - 4, ["AUFGABEN"], fs=FS_LABEL, font=FONT_HAND, color="#495057", group=grp)
    yy = AUFG_Y + PAD + TITLE_H - 6
    for bullet in p["aufg"]:
        text_el(x + PAD, yy, bullet, fs=FS_BODY, color="#1e1e1e", group=grp)
        yy += text_h(len(bullet), FS_BODY) + 4

    # Ergebnis
    box(x, ERG_Y, COL_W, erg_h, fill="#d3f9d8", stroke="#22c55e", sw=1, group=grp)
    text_el(x + PAD, ERG_Y + PAD - 4, ["ERGEBNIS"], fs=FS_LABEL, font=FONT_HAND, color="#15803d", group=grp)
    text_el(x + PAD, ERG_Y + PAD + TITLE_H - 6, p["erg"], fs=FS_BODY, color="#1e1e1e", group=grp)

    # Abhängigkeit
    box(x, ABH_Y, COL_W, abh_h, fill="#f1f3f5", stroke="#adb5bd", sw=1, style="dashed", group=grp)
    text_el(x + PAD, ABH_Y + 10, p["abh"], fs=FS_LABEL, color="#495057", group=grp)

# 4) Flusspfeile zwischen den Stufenkoepfen
for i in range(len(STAGES) - 1):
    x = col_x(i) + COL_W
    a = arrow(x + 6, HEAD_Y + HEAD_H / 2, COL_GAP - 12, 0,
              stroke="#495057", sw=2, start=heads[i]["id"], end=heads[i + 1]["id"])
    bind(heads[i], a)
    bind(heads[i + 1], a)

# 5) Meilensteine unter der Zeitachse
MS_Y = BAND_BOTTOM + 60
axis = arrow(0, MS_Y, TOTAL_W, 0, stroke="#adb5bd", sw=2, head=None)
text_el(0, MS_Y - 34, ["Meilensteine"], fs=20, font=FONT_HAND, color="#495057")
for code, name, hint, after in MEILENSTEINE:
    cx = col_x(after) + COL_W / 2
    d = {
        "type": "diamond",
        "id": nid("d"),
        "x": cx - 17,
        "y": MS_Y - 17,
        "width": 34,
        "height": 34,
        "backgroundColor": "#ffd8a8",
        "strokeColor": "#f59e0b",
        "strokeWidth": 2,
    }
    base(d)
    text_el(cx - 100, MS_Y + 28, [f"{code}  {name}"], fs=FS_BODY, font=FONT_HAND, color="#b45309")
    text_el(cx - 100, MS_Y + 50, [hint], fs=FS_LABEL, color="#757575")

# 6) Planungsprinzip / Leitplanken
PR_Y = MS_Y + 110
pr_lines = wrap(
    "Nicht monday.com und Kraaft vollständig nachbauen. Zuerst die tatsächlich genutzten "
    "Kernfunktionen identifizieren und daraus ein schlankes ED-System entwickeln.",
    760, FONT_SANS, 18)
box(0, PR_Y, 800, text_h(len(pr_lines), 18) + 70, fill="#ffc9c9", stroke="#ef4444", sw=2)
text_el(20, PR_Y + 16, ["Planungsprinzip"], fs=20, font=FONT_HAND, color="#b91c1c")
text_el(20, PR_Y + 48, pr_lines, fs=18, color="#1e1e1e")

rules = [
    "Reihenfolge einhalten: Daten und Rechte vor Oberflächen, Oberflächen vor Automation.",
    "Jede Stufe hat ein abnehmbares Ergebnis - erst dann startet die nächste.",
    "Automation (7) und KI (8) erst, wenn die Basisprozesse stabil laufen.",
    "Altsysteme erst kündigen, wenn Stufe 9 den Nachweis erbracht hat.",
]
rl = []
for r in rules:
    rl.extend(wrap("- " + r, 760, FONT_SANS, 16))
box(860, PR_Y, 800, text_h(len(rl), 16) + 70, fill="#e7f5ff", stroke="#4a9eed", sw=2)
text_el(880, PR_Y + 16, ["Leitplanken für die Umsetzung"], fs=20, font=FONT_HAND, color="#1864ab")
text_el(880, PR_Y + 48, rl, fs=16, color="#1e1e1e")

# 7) Legende
LG_X = 1720
box(LG_X, PR_Y, 560, 180, fill="#ffffff", stroke="#adb5bd", sw=1)
text_el(LG_X + 20, PR_Y + 16, ["Legende"], fs=20, font=FONT_HAND, color="#495057")
legend = [
    ("#fff3bf", "#f59e0b", "Ziel der Stufe"),
    ("#ffffff", "#868e96", "Aufgaben / Arbeitspakete"),
    ("#d3f9d8", "#22c55e", "Ergebnis (Abnahmekriterium)"),
    ("#f1f3f5", "#adb5bd", "Abhängigkeit / Voraussetzung"),
]
ly = PR_Y + 50
for fill, stroke, label in legend:
    box(LG_X + 20, ly, 28, 20, fill=fill, stroke=stroke, sw=1)
    text_el(LG_X + 58, ly + 1, [label], fs=FS_BODY, color="#1e1e1e")
    ly += 30

# ------------------------------------------------------------------ Datei ----

doc = {
    "type": "excalidraw",
    "version": 2,
    "source": "ED WorkOS Stufenplanung",
    "elements": elements,
    "appState": {
        "gridSize": None,
        "gridStep": 5,
        "gridModeEnabled": False,
        "viewBackgroundColor": "#ffffff",
    },
    "files": {},
}

out = "ED_WorkOS_Stufenplan.excalidraw"
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

print(f"{out}: {len(elements)} Elemente, Canvas {TOTAL_W}x{int(PR_Y + 260)}")
