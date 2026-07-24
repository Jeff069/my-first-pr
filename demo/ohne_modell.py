#!/usr/bin/env python3
"""Belegerkennung ohne Sprachmodell - reine Mustererkennung.

Warum das existiert:
  1. Es laeuft sofort, ohne Ollama, ohne Download, ohne Installation.
  2. Es erfindet grundsaetzlich nichts: Jeder Wert wird woertlich aus dem Text
     genommen. Was nicht dasteht, bleibt leer.
  3. Bei sauberen deutschen Rechnungen ist es dem kleinen Modell ueberlegen.

Grenzen: Ungewoehnliche Layouts, Fliesstext und Fremdsprachen kann es nicht.
Dafuer gibt es das Modell. Beides zusammen ergibt die verlaessliche Loesung -
Mustererkennung fuer den Normalfall, Modell fuer den Rest.

    python3 ohne_modell.py beispiele/beleg.txt
"""

import json
import re
import sys
from pathlib import Path

# --- Bausteine --------------------------------------------------------------

BETRAG = r"-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d{1,3}(?:,\d{3})*\.\d{2}"
DATUM = r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})"

MARKER = {
    "betrag_netto": [r"zwischensumme", r"netto(?:betrag|summe)?", r"summe\s+netto",
                     r"gesamt\s+netto"],
    "umsatzsteuer": [r"(?:umsatz|mehrwert)steuer", r"\bust\b(?!-?id)", r"\bmwst\b",
                     r"\d{1,2}\s*%\s*(?:ust|mwst|umsatzsteuer|mehrwertsteuer)?"],
    "betrag_brutto": [r"brutto(?:betrag)?", r"gesamtbetrag", r"rechnungsbetrag",
                      r"endbetrag", r"zu\s+zahlen", r"gesamtsumme"],
}


def _zahl(text: str) -> float | None:
    text = text.strip()
    if re.fullmatch(r"-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}", text):
        return float(text.replace(".", "").replace(",", "."))
    if re.fullmatch(r"-?\d{1,3}(?:,\d{3})*\.\d{2}", text):
        return float(text.replace(",", ""))
    return None


def _betraege_der_zeile(zeile: str) -> list[float]:
    return [z for z in (_zahl(t) for t in re.findall(BETRAG, zeile)) if z is not None]


# --- Einzelne Felder --------------------------------------------------------

def lieferant(zeilen: list[str]) -> str | None:
    """Erste sinnvolle Zeile - bei deutschen Rechnungen fast immer der Absender."""
    for zeile in zeilen[:6]:
        sauber = zeile.strip()
        if len(sauber) < 3:
            continue
        if re.search(r"rechnung|quittung|gutschrift|beleg|datum|seite", sauber, re.I):
            continue
        return sauber
    return None


def rechnungsnummer(text: str) -> str | None:
    muster = [
        r"rechnung(?:s)?[\s\-]*(?:nr\.?|nummer)\s*[:.]?\s*([A-Za-z0-9][A-Za-z0-9\-/_.]{2,})",
        r"\bre[\s\-]*nr\.?\s*[:.]?\s*([A-Za-z0-9][A-Za-z0-9\-/_.]{2,})",
        r"\brechnung\s+nr\.?\s*([A-Za-z0-9][A-Za-z0-9\-/_.]{2,})",
        r"\brechnung\s+([A-Z]{1,4}[\-/]?\d[A-Za-z0-9\-/_.]*)",
        r"\b(?:bon|beleg|quittung)s?[\s\-]*(?:nr\.?|nummer)\s*[:.]?\s*([A-Za-z0-9\-/_.]{3,})",
    ]
    for eintrag in muster:
        treffer = re.search(eintrag, text, re.I)
        if treffer:
            return treffer.group(1).rstrip(".,;")
    return None


def _datum_normal(treffer: re.Match) -> str | None:
    tag, monat, jahr = (int(g) for g in treffer.groups())
    if jahr < 100:
        jahr += 2000
    if not (1 <= tag <= 31 and 1 <= monat <= 12 and 1990 <= jahr <= 2100):
        return None
    return f"{jahr:04d}-{monat:02d}-{tag:02d}"


def datum(text: str) -> str | None:
    beschriftet = re.search(rf"(?:rechnungs)?datum\s*[:.]?\s*{DATUM}", text, re.I)
    if beschriftet:
        return _datum_normal(beschriftet)
    erster = re.search(DATUM, text)
    return _datum_normal(erster) if erster else None


def zahlungsziel(text: str) -> str | None:
    for zeile in text.splitlines():
        if re.search(r"zahlbar|f[äa]llig|zahlungsziel|bis\s+zum|ohne\s+abzug", zeile, re.I):
            treffer = re.search(DATUM, zeile)
            if treffer:
                return _datum_normal(treffer)
    return None


def ust_id(text: str) -> str | None:
    treffer = re.search(r"\b(DE)\s?(\d{3})\s?(\d{3})\s?(\d{3})\b", text)
    if treffer:
        original = treffer.group(0)
        return original if original.strip() else None
    return None


def steuersatz(text: str) -> float | None:
    treffer = re.findall(r"(\d{1,2})\s*%", text)
    saetze = [float(t) for t in treffer if float(t) in (7.0, 19.0, 5.0, 16.0, 0.0)]
    return max(saetze) if saetze else None


def kleinunternehmer(text: str) -> bool:
    """§ 19 UStG: keine Umsatzsteuer - Netto und Brutto sind identisch."""
    return bool(re.search(r"§\s*19\s*ustg|kleinunternehmer", text, re.I))


def betraege(text: str) -> dict[str, float]:
    """Beschriftete Summen einsammeln, aber nur aus Zeilen mit Schluesselwort."""
    gefunden: dict[str, float] = {}
    for zeile in text.splitlines():
        werte = _betraege_der_zeile(zeile)
        if not werte:
            continue
        for feld, marker in MARKER.items():
            if feld in gefunden:
                continue
            if any(re.search(eintrag, zeile, re.I) for eintrag in marker):
                gefunden[feld] = werte[-1]
                break
    return gefunden


def _betraege_ergaenzen(werte: dict[str, float]) -> dict[str, float]:
    """Fehlt genau ein Wert, ergibt er sich aus den anderen beiden."""
    netto, steuer, brutto = (werte.get(f) for f in
                             ("betrag_netto", "umsatzsteuer", "betrag_brutto"))
    if netto is not None and steuer is not None and brutto is None:
        werte["betrag_brutto"] = round(netto + steuer, 2)
    elif netto is not None and brutto is not None and steuer is None:
        werte["umsatzsteuer"] = round(brutto - netto, 2)
    elif steuer is not None and brutto is not None and netto is None:
        werte["betrag_netto"] = round(brutto - steuer, 2)
    return werte


def positionen(text: str) -> list[dict]:
    """Nur bei erkennbarer Positionstabelle - lieber leer als geraten."""
    zeilen = text.splitlines()
    start = next((i for i, z in enumerate(zeilen)
                  if re.search(r"^\s*(pos\.?|position|menge|bezeichnung)", z, re.I)), None)
    if start is None:
        return []

    gefunden = []
    for zeile in zeilen[start + 1:]:
        if re.search(r"netto|zwischensumme|brutto|gesamtbetrag|ust|mwst", zeile, re.I):
            break
        werte = _betraege_der_zeile(zeile)
        if not werte:
            continue
        bezeichnung = re.sub(r"^\s*\d+\s+", "", zeile)
        bezeichnung = re.sub(rf"({BETRAG}|\s{{2,}}).*$", "", bezeichnung).strip()
        if not bezeichnung:
            continue
        gefunden.append({
            "bezeichnung": bezeichnung,
            "menge": None,
            "einzelpreis": werte[-2] if len(werte) >= 2 else None,
            "gesamt": werte[-1],
        })
    return gefunden


# --- Zusammenbau ------------------------------------------------------------

def auslesen(text: str) -> dict:
    zeilen = text.splitlines()
    werte = betraege(text)

    if kleinunternehmer(text):
        summe = werte.get("betrag_brutto") or werte.get("betrag_netto")
        if summe is not None:
            werte = {"betrag_netto": summe, "umsatzsteuer": 0.0, "betrag_brutto": summe}
    else:
        werte = _betraege_ergaenzen(werte)

    daten = {
        "belegart": ("Quittung" if re.search(r"\bbon\b|kassenbon|quittung", text, re.I)
                     else "Rechnung" if re.search(r"rechnung", text, re.I) else "unbekannt"),
        "rechnungsnummer": rechnungsnummer(text),
        "datum": datum(text),
        "lieferant": {
            "name": lieferant(zeilen),
            "adresse": None,
            "ust_id": ust_id(text),
        },
        "betrag_netto": werte.get("betrag_netto"),
        "umsatzsteuer": werte.get("umsatzsteuer"),
        "steuersatz": 0.0 if kleinunternehmer(text) else steuersatz(text),
        "betrag_brutto": werte.get("betrag_brutto"),
        "waehrung": "EUR",
        "zahlungsziel": zahlungsziel(text),
        "positionen": positionen(text),
        "verfahren": "mustererkennung",
        "sicherheit": "hoch",
        "pruefen": [],
    }

    fehlend = [f for f in ("rechnungsnummer", "datum", "betrag_brutto") if not daten[f]]
    if fehlend:
        daten["sicherheit"] = "mittel"
        daten["pruefen"].append("nicht gefunden: " + ", ".join(fehlend))
    return daten


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit("Aufruf: python3 ohne_modell.py <datei>")
    pfad = Path(sys.argv[1])
    if not pfad.is_file():
        sys.exit(f"Datei nicht gefunden: {pfad}")

    import pruefer
    text = pfad.read_text(encoding="utf-8", errors="replace")
    print(json.dumps(pruefer.alles_pruefen(auslesen(text), text),
                     ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
