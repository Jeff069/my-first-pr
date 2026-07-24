#!/usr/bin/env python3
"""Selbsttest ohne Ollama.

Ersetzt das Modell durch einen Nachbau und prueft alles, was nicht vom Modell
abhaengt: Vorlagen, Anfrageformat, JSON-Bergung, Rechenpruefung, Stapellauf, CSV.

    python3 selbsttest.py

Laeuft der Selbsttest durch und der echte Lauf nicht, liegt das Problem bei
Ollama oder am Modell - nicht am Ablauf.
"""

import csv
import json
import subprocess
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import ohne_modell
import pruefer

HIER = Path(__file__).parent
BELEG = HIER / "beispiele" / "beleg.txt"

ANTWORT = {
    "belegart": "Rechnung", "rechnungsnummer": "2026-0417", "datum": "2026-03-12",
    "lieferant": {"name": "Elektro Sauer GmbH", "adresse": "Ringstrasse 14, 34117 Kassel",
                  "ust_id": "DE 812 345 678"},
    "betrag_netto": 2253.25, "umsatzsteuer": 428.12, "steuersatz": 19,
    "betrag_brutto": 2681.37, "waehrung": "EUR", "zahlungsziel": "2026-03-26",
    "positionen": [
        {"bezeichnung": "Montage Verteilerschrank", "menge": 1, "einzelpreis": 890.0, "gesamt": 890.0},
        {"bezeichnung": "Elektroinstallation Backstube", "menge": 14.5, "einzelpreis": 72.5, "gesamt": 1051.25},
        {"bezeichnung": "Kabel NYM-J 5x2,5", "menge": 80, "einzelpreis": 3.9, "gesamt": 312.0},
    ],
    "sicherheit": "hoch", "pruefen": [],
}

anfrage_fehler: list[str] = []


class Nachbau(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"models":[]}')

    def do_POST(self):
        anfrage = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        for erfuellt, meldung in [
            (anfrage.get("format") == "json", "format=json fehlt"),
            (anfrage.get("stream") is False, "stream muss aus sein"),
            (anfrage.get("options", {}).get("temperature") == 0, "temperature muss 0 sein"),
            (bool(anfrage.get("model")), "kein Modell angegeben"),
            ("{{INHALT}}" not in anfrage.get("prompt", ""), "Platzhalter nicht ersetzt"),
            ("belegart" in anfrage.get("prompt", ""), "Schema fehlt im Prompt"),
        ]:
            if not erfuellt:
                anfrage_fehler.append(meldung)
        # Absichtlich in Text eingepackt - prueft die JSON-Bergung.
        nutzlast = json.dumps({"response": "Hier das Ergebnis:\n" + json.dumps(ANTWORT)})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(nutzlast.encode())

    def log_message(self, *_):
        pass


def test_einzellauf() -> list[str]:
    lauf = subprocess.run([sys.executable, "extract.py", "--vorlage", "beleg",
                           "beispiele/beleg.txt"],
                          cwd=HIER, capture_output=True, text=True, timeout=60)
    if lauf.returncode != 0:
        return [f"extract.py brach ab: {lauf.stderr.strip()}"]
    try:
        ergebnis = json.loads(lauf.stdout)
    except json.JSONDecodeError:
        return [f"Ausgabe war kein JSON: {lauf.stdout[:200]}"]

    fehler = list(anfrage_fehler)
    if ergebnis.get("rechnungsnummer") != "2026-0417":
        fehler.append("Ergebnis kam nicht unveraendert durch")
    if not ergebnis.get("pruefung", {}).get("bestanden"):
        fehler.append(f"Pruefung schlug bei korrekten Daten an: "
                      f"{ergebnis.get('pruefung', {}).get('warnungen')}")
    return fehler


def test_pruefer() -> list[str]:
    quelle = BELEG.read_text(encoding="utf-8")
    fehler = []

    sauber = pruefer.alles_pruefen(json.loads(json.dumps(ANTWORT)), quelle)
    if not sauber["pruefung"]["bestanden"]:
        fehler.append(f"korrekte Daten faelschlich beanstandet: "
                      f"{sauber['pruefung']['warnungen']}")

    faelle = {
        "erfundener Betrag": {"betrag_brutto": 3681.37},
        "erfundener Lieferant": {"lieferant": {"name": "Ganz Andere GmbH"}},
        "falsches Datumsformat": {"datum": "12.03.2026"},
        "Steuer passt nicht zum Satz": {"umsatzsteuer": 100.00, "betrag_brutto": 2353.25},
        "fehlende Position": {"positionen": [{"bezeichnung": "Montage", "gesamt": 890.0}]},
    }
    for name, aenderung in faelle.items():
        daten = json.loads(json.dumps(ANTWORT))
        daten.update(aenderung)
        if pruefer.alles_pruefen(daten, quelle)["pruefung"]["bestanden"]:
            fehler.append(f"nicht erkannt: {name}")
    return fehler


def test_stapel() -> list[str]:
    with tempfile.TemporaryDirectory() as ordner:
        pfad = Path(ordner)
        (pfad / "gut.txt").write_text(BELEG.read_text(encoding="utf-8"), encoding="utf-8")
        (pfad / "abweichend.txt").write_text(
            BELEG.read_text(encoding="utf-8").replace("Elektro Sauer GmbH", "Ganz Andere GmbH"),
            encoding="utf-8")
        (pfad / "leer.txt").write_text("", encoding="utf-8")

        csv_pfad = pfad / "ergebnis.csv"
        subprocess.run([sys.executable, "stapel.py", str(pfad), "--csv", str(csv_pfad)],
                       cwd=HIER, capture_output=True, text=True, timeout=120)

        if not csv_pfad.is_file():
            return ["keine CSV erzeugt"]
        with csv_pfad.open(encoding="utf-8-sig") as datei:
            zeilen = list(csv.DictReader(datei, delimiter=";"))

        fehler = []
        if len(zeilen) != 2:
            fehler.append(f"erwartet 2 Zeilen (leere Datei uebersprungen), bekommen {len(zeilen)}")
        nach_datei = {z["datei"]: z for z in zeilen}
        if nach_datei.get("gut.txt", {}).get("geprueft") != "ok":
            fehler.append("korrekter Beleg wurde beanstandet")
        if nach_datei.get("abweichend.txt", {}).get("geprueft") != "PRUEFEN":
            fehler.append("abweichender Beleg wurde nicht beanstandet")
        return fehler


def test_ohne_modell() -> list[str]:
    """Mustererkennung gegen vier verschiedene Belegarten - ganz ohne Modell."""
    erwartet = {
        "beleg.txt":               ("2026-0417",   2681.37, 3),
        "v1_kleinunternehmer.txt": ("RE-2026/338",  780.00, 0),
        "v2_kassenbon.txt":        ("004512",        56.88, 0),
        "v3_dienstleister.txt":    ("2026-K-0091", 3388.53, 3),
    }
    fehler = []
    for name, (nummer, brutto, anzahl) in erwartet.items():
        pfad = HIER / "beispiele" / name
        if not pfad.is_file():
            fehler.append(f"{name} fehlt")
            continue
        text = pfad.read_text(encoding="utf-8")
        daten = pruefer.alles_pruefen(ohne_modell.auslesen(text), text)

        if daten.get("rechnungsnummer") != nummer:
            fehler.append(f"{name}: Nummer {daten.get('rechnungsnummer')} statt {nummer}")
        if daten.get("betrag_brutto") != brutto:
            fehler.append(f"{name}: Brutto {daten.get('betrag_brutto')} statt {brutto}")
        if len(daten.get("positionen") or []) != anzahl:
            fehler.append(f"{name}: {len(daten.get('positionen') or [])} Positionen statt {anzahl}")
        if not daten["pruefung"]["bestanden"]:
            fehler.append(f"{name}: Pruefung beanstandet: {daten['pruefung']['warnungen']}")

    # Kein Beleg darf nicht als 'ok' durchrutschen.
    kein_beleg = "Notiz vom Kundentermin, Bad neu fliesen, Muster kommt noch."
    geprueft = pruefer.alles_pruefen(ohne_modell.auslesen(kein_beleg), kein_beleg)
    if geprueft["pruefung"]["bestanden"]:
        fehler.append("Text ohne Belegmerkmale wurde als geprueft durchgewunken")
    return fehler


def main() -> None:
    try:
        server = HTTPServer(("127.0.0.1", 11434), Nachbau)
    except OSError:
        sys.exit("Port 11434 ist belegt - laeuft dort schon ein echtes Ollama?\n"
                 "Dann brauchst du diesen Test nicht, nimm gleich extract.py.")
    threading.Thread(target=server.serve_forever, daemon=True).start()

    tests = [
        ("Einzellauf   ", test_einzellauf),
        ("Pruefungen   ", test_pruefer),
        ("Stapel + CSV ", test_stapel),
        ("Ohne Modell  ", test_ohne_modell),
    ]

    alle_fehler = []
    for name, test in tests:
        fehler = test()
        print(f"  {name} {'ok' if not fehler else 'FEHLER'}")
        for eintrag in fehler:
            print(f"                 - {eintrag}")
        alle_fehler += fehler

    server.shutdown()

    if alle_fehler:
        print(f"\n{len(alle_fehler)} Fehler.")
        sys.exit(1)

    print("\nSelbsttest bestanden.")
    print("Vorlagen, Anfrageformat, JSON-Bergung, Rechenpruefung, Stapellauf, CSV")
    print("und die modellfreie Erkennung arbeiten korrekt.")
    print("Ungeprueft bleibt nur, wie gut das echte Modell liest.")


if __name__ == "__main__":
    main()
