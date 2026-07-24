#!/usr/bin/env python3
"""Prueft die Modellausgabe gegen den Originaltext - ohne Modell, rein rechnerisch.

Der Grund: Ein Sprachmodell erfindet gelegentlich Zahlen, die plausibel aussehen.
In einer Steuerkanzlei ist genau das der Ausschlussgrund. Diese Pruefungen fangen
den Grossteil davon ab, weil sie nachrechnen und im Originaltext nachschlagen.

Zwei Arten von Pruefung:
  1. Rechnerisch  - passen Netto, Steuer und Brutto zusammen?
  2. Belegt       - steht der Wert ueberhaupt im Original oder ist er erfunden?
"""

import re
from datetime import date, datetime
from typing import Any

TOLERANZ = 0.02  # Rundungsdifferenzen in Euro durchgehen lassen


def _zahlen_im_text(text: str) -> set[str]:
    """Alle Zahlen aus dem Text, normalisiert auf '1234.56'."""
    gefunden = set()
    for roh in re.findall(r"\d[\d.,]*", text):
        roh = roh.rstrip(".,")
        if "," in roh:                      # deutsches Format: 2.253,25
            normal = roh.replace(".", "").replace(",", ".")
        elif roh.count(".") == 1 and len(roh.split(".")[1]) == 2:
            normal = roh                    # 2253.25
        else:
            normal = roh.replace(".", "")   # 2.253 -> 2253
        try:
            gefunden.add(f"{float(normal):.2f}")
        except ValueError:
            continue
    return gefunden


def _als_zahl(wert: Any) -> float | None:
    if isinstance(wert, (int, float)):
        return float(wert)
    if isinstance(wert, str):
        try:
            return float(wert.replace(".", "").replace(",", "."))
        except ValueError:
            return None
    return None


def betraege_pruefen(daten: dict) -> list[str]:
    """Rechnet nach, statt dem Modell zu glauben."""
    warnungen = []
    netto = _als_zahl(daten.get("betrag_netto"))
    steuer = _als_zahl(daten.get("umsatzsteuer"))
    brutto = _als_zahl(daten.get("betrag_brutto"))
    satz = _als_zahl(daten.get("steuersatz"))

    if None not in (netto, steuer, brutto):
        if abs(netto + steuer - brutto) > TOLERANZ:
            warnungen.append(
                f"Betraege passen nicht: {netto:.2f} + {steuer:.2f} "
                f"= {netto + steuer:.2f}, angegeben ist {brutto:.2f}")

    if None not in (netto, steuer, satz) and satz > 0:
        erwartet = netto * satz / 100
        if abs(erwartet - steuer) > max(TOLERANZ, netto * 0.001):
            warnungen.append(
                f"Steuerbetrag passt nicht zu {satz:.0f} %: erwartet "
                f"{erwartet:.2f}, angegeben {steuer:.2f}")

    positionen = daten.get("positionen")
    if isinstance(positionen, list) and netto is not None and positionen:
        summe = sum(z for z in (_als_zahl(p.get("gesamt")) for p in positionen
                                if isinstance(p, dict)) if z is not None)
        if summe > 0 and abs(summe - netto) > max(TOLERANZ, netto * 0.005):
            warnungen.append(
                f"Positionen ergeben {summe:.2f}, Netto ist mit {netto:.2f} angegeben "
                "- fehlt eine Position?")
    return warnungen


def datum_pruefen(daten: dict) -> list[str]:
    warnungen = []
    for feld in ("datum", "zahlungsziel"):
        wert = daten.get(feld)
        if not isinstance(wert, str) or not wert:
            continue
        try:
            erkannt = datetime.strptime(wert, "%Y-%m-%d").date()
        except ValueError:
            warnungen.append(f"'{feld}' ist kein Datum im Format YYYY-MM-DD: {wert}")
            continue
        if erkannt.year < 1990 or erkannt > date.today().replace(year=date.today().year + 2):
            warnungen.append(f"'{feld}' liegt ausserhalb eines plausiblen Zeitraums: {wert}")
    return warnungen


def belege_pruefen(daten: dict, quelltext: str) -> list[str]:
    """Steht ueberhaupt im Original, was das Modell behauptet?"""
    warnungen = []
    zahlen = _zahlen_im_text(quelltext)
    text_kompakt = re.sub(r"\s+", "", quelltext).lower()

    for feld in ("betrag_netto", "umsatzsteuer", "betrag_brutto", "summe_netto"):
        wert = _als_zahl(daten.get(feld))
        # Eine echte Null steht selten als Zahl im Text (z. B. § 19 UStG,
        # keine Umsatzsteuer) - das ist keine Erfindung.
        if wert not in (None, 0.0) and f"{wert:.2f}" not in zahlen:
            warnungen.append(f"'{feld}' ({wert:.2f}) steht so nicht im Original")

    for feld in ("rechnungsnummer", "ust_id"):
        wert = daten.get(feld) or (daten.get("lieferant") or {}).get(feld)
        if isinstance(wert, str) and wert:
            if re.sub(r"[\s.\-/]", "", wert).lower() not in re.sub(r"[.\-/]", "", text_kompakt):
                warnungen.append(f"'{feld}' ({wert}) steht so nicht im Original")

    name = (daten.get("lieferant") or {}).get("name")
    if isinstance(name, str) and name:
        if re.sub(r"\s+", "", name).lower() not in text_kompakt:
            warnungen.append(f"Lieferantenname '{name}' steht so nicht im Original")
    return warnungen


def vollstaendigkeit_pruefen(daten: dict) -> list[str]:
    """Leere Felder sind der gefaehrlichste Fall: Sie widersprechen nichts und
    rutschen sonst als 'ok' durch. Ein Beleg ohne Betrag ist kein Beleg."""
    if "betrag_brutto" not in daten:      # andere Vorlage, andere Felder
        return []

    pflicht = {"rechnungsnummer": daten.get("rechnungsnummer"),
               "datum": daten.get("datum"),
               "betrag_brutto": daten.get("betrag_brutto")}
    fehlend = [name for name, wert in pflicht.items() if wert in (None, "")]

    if len(fehlend) == len(pflicht):
        return ["als Beleg nicht erkannt - weder Nummer noch Datum noch Betrag gefunden"]
    if fehlend:
        return [f"nicht gefunden: {', '.join(fehlend)}"]
    return []


def alles_pruefen(daten: dict, quelltext: str) -> dict:
    """Haengt einen Pruefblock an die Daten an. Aendert die Werte selbst nie."""
    warnungen = (betraege_pruefen(daten) + datum_pruefen(daten)
                 + belege_pruefen(daten, quelltext) + vollstaendigkeit_pruefen(daten))

    daten["pruefung"] = {
        "bestanden": not warnungen,
        "warnungen": warnungen,
        "hinweis": ("Rechnerisch und gegen den Originaltext geprueft."
                    if not warnungen else
                    "Auffaelligkeiten gefunden - vor der Verbuchung ansehen."),
    }

    # Feld aus den Vorlagen mitfuellen, damit alles an einer Stelle steht.
    if isinstance(daten.get("pruefen"), list):
        for warnung in warnungen:
            if warnung not in daten["pruefen"]:
                daten["pruefen"].append(warnung)

    if warnungen:
        daten["sicherheit"] = "niedrig"
    return daten
