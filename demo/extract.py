#!/usr/bin/env python3
"""Lokale Extraktion: unstrukturierter Text rein, strukturierte Daten raus.

Laeuft vollstaendig auf diesem Rechner gegen Ollama. Kein Byte verlaesst das Geraet
- das ist der Punkt, den du im Kundengespraech zeigst.

Beispiele:
    python3 extract.py --vorlage beleg    beispiele/beleg.txt
    python3 extract.py --vorlage angebot  beispiele/angebot.txt
    python3 extract.py --vorlage pflege   beispiele/pflege.txt --modell llama3.1:8b

Nur Standardbibliothek, keine Installation noetig.
"""

import argparse
import json
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import hardware
import pruefer

OLLAMA_URL = "http://localhost:11434/api/generate"
VORLAGEN_DIR = Path(__file__).parent / "vorlagen"


def text_einlesen(pfad: Path) -> str:
    """Liest .txt direkt, .pdf ueber pdftotext (poppler-utils)."""
    if pfad.suffix.lower() == ".pdf":
        try:
            ergebnis = subprocess.run(
                ["pdftotext", "-layout", str(pfad), "-"],
                capture_output=True, text=True, check=True, timeout=60,
            )
            return ergebnis.stdout
        except FileNotFoundError:
            sys.exit("pdftotext fehlt. Installieren: apt install poppler-utils "
                     "(Linux) / brew install poppler (macOS)")
        except subprocess.CalledProcessError as fehler:
            sys.exit(f"PDF konnte nicht gelesen werden: {fehler.stderr.strip()}")
    return pfad.read_text(encoding="utf-8", errors="replace")


def modell_fragen(modell: str, prompt: str, zeitlimit: int) -> str:
    """Ein Aufruf an das lokale Modell. format=json zwingt zu gueltigem JSON."""
    anfrage = urllib.request.Request(
        OLLAMA_URL,
        data=json.dumps({
            "model": modell,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0},
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(anfrage, timeout=zeitlimit) as antwort:
            return json.loads(antwort.read())["response"]
    except urllib.error.URLError:
        sys.exit("Ollama nicht erreichbar auf localhost:11434.\n"
                 "  Laeuft es?   ollama serve\n"
                 f"  Modell da?   ollama pull {modell}")
    except TimeoutError:
        sys.exit(f"Zeitlimit von {zeitlimit}s ueberschritten. Kleineres Modell "
                 "probieren oder --zeitlimit erhoehen.")


def json_bergen(rohtext: str) -> dict:
    """Auch mit format=json packen kleine Modelle die Ausgabe manchmal ein."""
    try:
        return json.loads(rohtext)
    except json.JSONDecodeError:
        pass
    treffer = re.search(r"\{.*\}", rohtext, re.DOTALL)
    if treffer:
        try:
            return json.loads(treffer.group(0))
        except json.JSONDecodeError:
            pass
    sys.exit(f"Modell lieferte kein gueltiges JSON:\n{rohtext[:400]}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("datei", type=Path, help="Eingabe (.txt oder .pdf)")
    parser.add_argument("--vorlage", required=True,
                        help="Name in vorlagen/ ohne Endung, z. B. beleg")
    parser.add_argument("--modell", default=None,
                        help="Standard: passend zur Hardware automatisch gewaehlt")
    parser.add_argument("--zeitlimit", type=int, default=180, help="Sekunden")
    parser.add_argument("--ausgabe", type=Path, help="JSON zusaetzlich hierhin schreiben")
    args = parser.parse_args()

    if not args.datei.is_file():
        sys.exit(f"Datei nicht gefunden: {args.datei}")

    modell = args.modell or hardware.waehlen()[0]

    vorlage_pfad = VORLAGEN_DIR / f"{args.vorlage}.md"
    if not vorlage_pfad.is_file():
        vorhanden = ", ".join(sorted(p.stem for p in VORLAGEN_DIR.glob("*.md"))) or "keine"
        sys.exit(f"Vorlage '{args.vorlage}' fehlt. Vorhanden: {vorhanden}")

    inhalt = text_einlesen(args.datei).strip()
    if not inhalt:
        sys.exit("Eingabe ist leer - bei PDFs meist ein Scan ohne Texterkennung. "
                 "Dann vorher OCR laufen lassen (ocrmypdf).")

    prompt = vorlage_pfad.read_text(encoding="utf-8").replace("{{INHALT}}", inhalt)
    daten = json_bergen(modell_fragen(modell, prompt, args.zeitlimit))
    daten = pruefer.alles_pruefen(daten, inhalt)

    ausgabe = json.dumps(daten, ensure_ascii=False, indent=2)
    print(ausgabe)

    if not daten["pruefung"]["bestanden"]:
        print(f"\nPruefung: {len(daten['pruefung']['warnungen'])} Auffaelligkeit(en) "
              "- siehe Feld 'pruefung'.", file=sys.stderr)

    if args.ausgabe:
        args.ausgabe.write_text(ausgabe + "\n", encoding="utf-8")
        print(f"\nGeschrieben nach {args.ausgabe}", file=sys.stderr)


if __name__ == "__main__":
    main()
