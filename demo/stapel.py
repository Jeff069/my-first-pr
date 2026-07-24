#!/usr/bin/env python3
"""Ganzen Ordner verarbeiten und als CSV ausgeben.

Aus der Vorfuehrung wird hier ein Werkzeug: Belegordner rein, Tabelle raus,
die in die Buchhaltung importiert werden kann.

    python3 stapel.py ./belege
    python3 stapel.py ./belege --vorlage beleg --csv maerz.csv --json-ordner ./ergebnisse

Belege, bei denen die Pruefung anschlaegt, landen in der Spalte 'pruefen' und
zusaetzlich in einer Zusammenfassung am Ende - nichts verschwindet still.
"""

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

import extract
import hardware
import ohne_modell
import pruefer

ENDUNGEN = {".txt", ".pdf", ".md"}

SPALTEN = [
    "datei", "belegart", "rechnungsnummer", "datum", "lieferant", "ust_id",
    "betrag_netto", "umsatzsteuer", "steuersatz", "betrag_brutto", "waehrung",
    "zahlungsziel", "geprueft", "pruefen",
]


def zeile_bauen(datei: Path, daten: dict) -> dict:
    lieferant = daten.get("lieferant") or {}
    pruefung = daten.get("pruefung") or {}
    return {
        "datei": datei.name,
        "belegart": daten.get("belegart") or "",
        "rechnungsnummer": daten.get("rechnungsnummer") or "",
        "datum": daten.get("datum") or "",
        "lieferant": lieferant.get("name") or "",
        "ust_id": lieferant.get("ust_id") or "",
        "betrag_netto": daten.get("betrag_netto") if daten.get("betrag_netto") is not None else "",
        "umsatzsteuer": daten.get("umsatzsteuer") if daten.get("umsatzsteuer") is not None else "",
        "steuersatz": daten.get("steuersatz") if daten.get("steuersatz") is not None else "",
        "betrag_brutto": daten.get("betrag_brutto") if daten.get("betrag_brutto") is not None else "",
        "waehrung": daten.get("waehrung") or "EUR",
        "zahlungsziel": daten.get("zahlungsziel") or "",
        "geprueft": "ok" if pruefung.get("bestanden") else "PRUEFEN",
        "pruefen": " | ".join(pruefung.get("warnungen") or []),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("ordner", type=Path)
    parser.add_argument("--vorlage", default="beleg")
    parser.add_argument("--modell", default=None)
    parser.add_argument("--csv", type=Path, default=Path("ergebnis.csv"))
    parser.add_argument("--json-ordner", type=Path, default=None,
                        help="Einzelergebnisse zusaetzlich als JSON ablegen")
    parser.add_argument("--zeitlimit", type=int, default=180)
    parser.add_argument("--ohne-modell", action="store_true",
                        help="nur Mustererkennung, ohne Ollama")
    args = parser.parse_args()

    if not args.ordner.is_dir():
        sys.exit(f"Kein Ordner: {args.ordner}")

    dateien = sorted(p for p in args.ordner.iterdir()
                     if p.is_file() and p.suffix.lower() in ENDUNGEN)
    if not dateien:
        sys.exit(f"Keine verwertbaren Dateien in {args.ordner} "
                 f"(erwartet: {', '.join(sorted(ENDUNGEN))})")

    modell = args.modell or hardware.waehlen()[0]
    vorlage_pfad = extract.VORLAGEN_DIR / f"{args.vorlage}.md"
    if not vorlage_pfad.is_file():
        sys.exit(f"Vorlage '{args.vorlage}' fehlt")
    vorlage = vorlage_pfad.read_text(encoding="utf-8")

    if args.json_ordner:
        args.json_ordner.mkdir(parents=True, exist_ok=True)

    print(f"{len(dateien)} Datei(en), Modell {modell}\n", file=sys.stderr)

    zeilen, auffaellig, gescheitert = [], [], []
    ohne_modell_hinweis = False

    for nummer, datei in enumerate(dateien, 1):
        print(f"  [{nummer}/{len(dateien)}] {datei.name} ... ", end="", flush=True, file=sys.stderr)
        try:
            inhalt = extract.text_einlesen(datei).strip()
            if not inhalt:
                raise ValueError("kein Text lesbar (Scan ohne OCR?)")
            if args.ohne_modell:
                roh = ohne_modell.auslesen(inhalt)
            else:
                try:
                    antwort = extract.modell_fragen(
                        modell, vorlage.replace("{{INHALT}}", inhalt), args.zeitlimit)
                    roh = extract.json_bergen(antwort)
                except ConnectionError:
                    if not ohne_modell_hinweis:
                        print("\n  (Ollama nicht erreichbar - Mustererkennung)",
                              file=sys.stderr)
                        ohne_modell_hinweis = True
                    roh = ohne_modell.auslesen(inhalt)
            daten = pruefer.alles_pruefen(roh, inhalt)
        except SystemExit as fehler:
            print("FEHLER", file=sys.stderr)
            gescheitert.append((datei.name, str(fehler)))
            continue
        except (ValueError, OSError, subprocess.SubprocessError) as fehler:
            print("FEHLER", file=sys.stderr)
            gescheitert.append((datei.name, str(fehler)))
            continue

        zeile = zeile_bauen(datei, daten)
        zeilen.append(zeile)
        if zeile["geprueft"] != "ok":
            auffaellig.append(zeile)
        print("ok" if zeile["geprueft"] == "ok" else "PRUEFEN", file=sys.stderr)

        if args.json_ordner:
            ziel = args.json_ordner / f"{datei.stem}.json"
            ziel.write_text(json.dumps(daten, ensure_ascii=False, indent=2) + "\n",
                            encoding="utf-8")

    if zeilen:
        with args.csv.open("w", newline="", encoding="utf-8-sig") as datei:
            schreiber = csv.DictWriter(datei, fieldnames=SPALTEN, delimiter=";")
            schreiber.writeheader()
            schreiber.writerows(zeilen)

    print(f"\nFertig: {len(zeilen)} verarbeitet, {len(auffaellig)} zum Pruefen, "
          f"{len(gescheitert)} fehlgeschlagen", file=sys.stderr)
    if zeilen:
        print(f"Tabelle: {args.csv}", file=sys.stderr)

    for name, warnungen in ((z["datei"], z["pruefen"]) for z in auffaellig):
        print(f"  PRUEFEN  {name}: {warnungen}", file=sys.stderr)
    for name, grund in gescheitert:
        print(f"  FEHLER   {name}: {grund}", file=sys.stderr)

    sys.exit(1 if gescheitert else 0)


if __name__ == "__main__":
    main()
