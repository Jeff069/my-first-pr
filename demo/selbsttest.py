#!/usr/bin/env python3
"""Selbsttest ohne Ollama.

Startet einen nachgebauten Ollama, laesst extract.py dagegen laufen und prueft,
dass Anfrage und Antwort stimmen. Testet alles ausser der Qualitaet des Modells.

    python3 selbsttest.py

Nuetzlich, wenn etwas nicht geht: Laeuft der Selbsttest durch, liegt der Fehler
am Modell oder an Ollama - nicht am Ablauf.
"""

import json
import subprocess
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

HIER = Path(__file__).parent

ANTWORT = {
    "belegart": "Rechnung",
    "rechnungsnummer": "2026-0417",
    "datum": "2026-03-12",
    "lieferant": {"name": "Elektro Sauer GmbH", "adresse": "Ringstrasse 14, 34117 Kassel",
                  "ust_id": "DE 812 345 678"},
    "betrag_netto": 2253.25, "umsatzsteuer": 428.12, "steuersatz": 19,
    "betrag_brutto": 2681.37, "waehrung": "EUR", "zahlungsziel": "2026-03-26",
    "positionen": [{"bezeichnung": "Montage Verteilerschrank", "menge": 1,
                    "einzelpreis": 890.0, "gesamt": 890.0}],
    "sicherheit": "hoch", "pruefen": [],
}

fehler: list[str] = []


class Nachbau(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"models":[]}')

    def do_POST(self):
        anfrage = json.loads(self.rfile.read(int(self.headers["Content-Length"])))

        pruefungen = [
            (anfrage.get("format") == "json", "format=json fehlt"),
            (anfrage.get("stream") is False, "stream muss aus sein"),
            (anfrage.get("options", {}).get("temperature") == 0, "temperature muss 0 sein"),
            (bool(anfrage.get("model")), "kein Modell angegeben"),
            ("Elektro Sauer GmbH" in anfrage.get("prompt", ""), "Belegtext fehlt im Prompt"),
            ("belegart" in anfrage.get("prompt", ""), "Schema fehlt im Prompt"),
            ("{{INHALT}}" not in anfrage.get("prompt", ""), "Platzhalter nicht ersetzt"),
        ]
        for erfuellt, meldung in pruefungen:
            if not erfuellt:
                fehler.append(meldung)

        # Absichtlich in Text eingepackt - prueft die JSON-Bergung in extract.py.
        nutzlast = json.dumps({"response": "Hier das Ergebnis:\n" + json.dumps(ANTWORT)})
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(nutzlast.encode())

    def log_message(self, *_):
        pass


def main() -> None:
    try:
        server = HTTPServer(("127.0.0.1", 11434), Nachbau)
    except OSError:
        sys.exit("Port 11434 ist belegt - laeuft dort schon ein echtes Ollama?\n"
                 "Dann brauchst du diesen Test nicht, nimm gleich extract.py.")

    threading.Thread(target=server.serve_forever, daemon=True).start()

    lauf = subprocess.run(
        [sys.executable, "extract.py", "--vorlage", "beleg", "beispiele/beleg.txt"],
        cwd=HIER, capture_output=True, text=True, timeout=60,
    )
    server.shutdown()

    if lauf.returncode != 0:
        print(lauf.stdout)
        sys.exit(f"extract.py brach ab:\n{lauf.stderr}")

    try:
        ergebnis = json.loads(lauf.stdout)
    except json.JSONDecodeError:
        sys.exit(f"Ausgabe war kein JSON:\n{lauf.stdout[:400]}")

    if ergebnis.get("rechnungsnummer") != "2026-0417":
        fehler.append("Ergebnis kam nicht unveraendert durch")

    if fehler:
        for eintrag in fehler:
            print(f"  FEHLER  {eintrag}")
        sys.exit(1)

    print("Selbsttest bestanden.")
    print("  Vorlage geladen, Platzhalter ersetzt, Anfrage korrekt,")
    print("  eingepacktes JSON sauber geborgen, Ausgabe vollstaendig.")
    print("\nWenn es mit echtem Ollama trotzdem klemmt, liegt es dort - nicht am Ablauf.")


if __name__ == "__main__":
    main()
