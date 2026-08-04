# Powerbird-Analyse — Blaupause für die ED-Elektro-Angebotskalkulation

*Recherche-Stand: August 2026. Quellen: powerbird.de, hausmannwynen.de, offizielle Versions-Release-Notes (V10–V27), Schulungskatalog, Fachpresse (Computern im Handwerk, GEBÄUDEDIGITAL, elektro.net, IKZ), Elektromeisterforum, Vergleichsportale. Einschränkung: Viele Seiten waren nur über Suchauszüge lesbar, nicht im Volltext — Details vor Übernahme im eigenen Powerbird gegenprüfen (ihr habt es ja laufen).*

---

## 1. Was Powerbird ist

Handwerkersoftware von **Hausmann & Wynen** (Monheim am Rhein, seit 1983; bis 2006 „HW Elektro plus"). Reine Branchenfokussierung: **Elektro, SHK, Klima/Lüftung, Solar** — exakt eure Gewerke. 5.200+ Kunden, jährliche Versionen (~150–250 Neuerungen/Jahr), Anwenderbeirat aus 10 Kundenbetrieben. Wird an der BFE-Meisterschule Oldenburg gelehrt — deshalb kennen viele Elektromeister die Kalkulationsmaske aus der Ausbildung. Modular lizenziert, keine öffentlichen Preise; Portale schätzen **~10.000–20.000 € Kauf** für 5–10 Plätze bzw. **~70–150 €/Nutzer/Monat** Miete. Forum-Urteil: ideal „ab 10 Mann", für Kleinstbetriebe zu teuer und einarbeitungsintensiv — ihr seid mit 11 Leuten genau die Zielgruppe.

## 2. So funktioniert die Powerbird-Angebotskalkulation (das Muster)

1. **Dokumentkopf:** Kunde, Dokumentrabatt, Standard-Lohnart.
2. **Hierarchischer Positionsbaum** (Titel/Gruppen, mehrere Ebenen — das LV-Denken aus der Ausschreibungswelt). Fehlende Zwischenebenen legt das System selbst an.
3. **Positionsarten gemischt im selben Baum:**
   - **Artikelposition** (aus dem Datanorm-Artikelstamm)
   - **Leistungsposition** — Bündel aus eingebetteten Artikeln **+ Lohnminuten**; Leistungen können wieder Leistungen enthalten („Leistung in Leistung")
   - **„Jumbo"** — Set, das auf dem Ausdruck als **eine** Position mit **einem** Preis erscheint, intern aber alle Einzelartikel für Bestellung und Nachkalkulation weiterführt
   - **Zuschlagsposition**, **Textposition/Textbausteine**, Alternativ-/Eventualpositionen (GAEB-üblich)
4. **Preisrechnung je Position:** EK über Rabattgruppe des Großhändlers → Zuschlag → plus **Lohnminuten × Stundensatz der Lohnart** (mehrere Lohnarten/Lohngruppen, z. B. Meister/Geselle/Azubi). Eine „Preisdetails"-Ansicht zeigt den kompletten Rechenweg.
5. **Bestpreisfindung („Sparschwein"):** Ein Klick fragt alle hinterlegten Großhändler gleichzeitig an und zeigt in <20 Sekunden Preis + Verfügbarkeit je Artikel — der Nutzer entscheidet zeilenweise, wer liefert.
6. **Angebot = Soll-Vorgabe:** Mengen und Stunden des Angebots werden zu **Sollmengen** des Auftrags; mitlaufende Kalkulation vergleicht laufend Soll/Ist (Monteurstunden, Material, Aufmaße), Nachkalkulation am Ende zeigt Abweichungen und nicht berechnete Zusatzleistungen.
7. **Kette:** Angebot → Auftrag → Lieferschein → Abschlags-/Schlussrechnung, GAEB rein und raus, Preisanfrage/Bestellung per UGL/IDS direkt aus dem Vorgang.

## 3. Woher die Lohnminuten kommen (die Branchen-Antwort)

- **Elektro:** **KFE-Kalkulationshilfe des ZVEH** — 14.000+ Leistungspositionen, jede mit normiertem Text, **Arbeitszeitwert in Lohnminuten** und Materialliste; Import in Branchensoftware über ZVEH-/Datanorm-Formate.
- **SHK:** Arbeitswerte/Arbeitszeitrichtwerte, Standardwerke **SIRADOS**, in Powerbird über die **TGP-Datenbank**.
- **Das Kalkulationsschema aus der Meisterschule** (so denken deine Kollegen): Materialeinzelkosten + Materialgemeinkosten (~12 %) → Fertigungslöhne + Fertigungsgemeinkosten (~80 %) → = Herstellkosten + Verwaltung (~8 %) + Vertrieb (~5 %) → = Selbstkosten + Gewinn (3–8 %) → Angebotspreis. Typischer Netto-Stundenverrechnungssatz Elektro/SHK 2024: **60–75 €**.
- Stundensatz-Herleitung: Heckner-Stundensatztool (Gemeinkostenzuschläge, produktive Stunden) — entspricht funktional eurem **Verrechnungslohn-Rechner**, der im System schon existiert.

## 4. Was Nutzer wirklich loben (und was nicht)

**Loben:** Bestpreisfindung, GAEB-Assistent mit Lernfunktion (einmal bepreiste Positionen werden in Folge-LVs automatisch wiedergefunden), Jumbos/Stücklistenarchiv als tägliche Zeitsparer, Mobile-Apps (Einarbeitung Monteure: Stunden statt Wochen).
**Kritisieren:** Preis, Einarbeitungsaufwand im Büro (Tage bis Wochen), Support-Wartezeiten (15-Minuten-Slots).
**Für euch heißt das:** Die Maske muss sich für Powerbird-gewohnte PLs sofort vertraut anfühlen (Baum, Positionsarten, Lohnminuten) — aber ohne den Ballast von 40 Jahren Modulgeschichte.

## 5. Blaupause für F7 — was wir übernehmen, was bewusst nicht

**ÜBERNEHMEN (steht jetzt so im Master-Prompt F7):**
- Titel-/Gruppenbaum mit gemischten Positionsarten (Artikel, Leistung mit Artikeln + Lohnminuten, Jumbo/Set mit Ein-Preis-Druck, Text, Zuschlag; Alternativ-/Eventual-Flag)
- Je Position: EK (günstigster Lieferantenpreis, wechselbar) × Zuschlagsregeln + Lohnminuten × Lohnart-Satz; „Preisdetails"-Aufklappung mit Rechenweg
- **2–3 konfigurierbare Lohnarten**, Sätze aus dem Verrechnungslohn-Rechner
- Laufende Summen + Marge je Position und gesamt (Sichtbarkeit nach Rollenmatrix)
- **Preisspiegel light:** Lieferantenvergleich aus den importierten Datanorm-Preisen (mehrere Großhändler nebeneinander, günstigster markiert) — ohne Live-Shop-Abfrage
- Dokumentrabatt; Positionen aus Alt-Angeboten kopieren (Stücklistenarchiv-Gefühl)
- **Sollmengen-Übergabe:** Kalkulationspositionen werden Soll-Werte des Projekts → vorhandene Vor-/Nachkalkulation vergleicht Soll/Ist je Position
- PDF über den vorhandenen DocumentBuilder (Jumbo = eine Zeile, ein Preis)

**BEWUSST WEGLASSEN (bei 11 Leuten Ballast):** GAEB-Assistent mit Lernfunktion (GAEB-Import existiert im System — manuell bepreisen reicht erstmal), REB-DA11-Aufmaßtausch, Aufmaßblätter je Raum/Stromkreis, Misch-Kalkulationsblätter, Skribble (digitale Freigabe per Snapshot-Hash existiert schon), Live-B2B-EDI zu Sonepar/Obeta (IDS-Stub reicht), OCI/SHK-Connect/Edifact.

## 6. Der Migrationsweg aus eurem Powerbird (der eigentliche Schatz)

1. **Artikelstamm:** nicht aus Powerbird ziehen, sondern **frisch per Datanorm von euren Großhändlern** — sauberer und tagesaktuell (F7-Import).
2. **Leistungen/Jumbos und Alt-Angebote:** Powerbird **exportiert GAEB** (90/2000/XML) — und euer System **hat GAEB-Import**. Damit lassen sich eure gepflegten Leistungspakete und alte LVs als GAEB-Dateien herübertragen. Vor der Migration: im eigenen Powerbird testen, welche Exporte eure Lizenz hergibt.
3. **Lohnminuten-Katalog:** KFE-Daten (ZVEH) für Elektro lizenzieren und importieren; für SHK SIRADOS/Arbeitswerte prüfen. Alternativ: mit den eigenen Powerbird-Leistungen starten (Zeiten stecken da schon drin).
4. **Alt-Angebote zusätzlich als PDF exportieren** → Futter für die 30-Angebote-Analyse und später den RAG-Angebotsentwurf (F9d).

## 7. Einordnung fürs Chef-Gespräch

Powerbird kostet euch laufend Geld (Größenordnung laut Portalen: 70–150 €/Nutzer/Monat bzw. fünfstellige Kauflizenz + Wartung). Das eigene System ersetzt Powerbird **nicht morgen** — aber jede F7-Stufe (Datanorm → Kalkulationsmaske → Sollmengen/Nachkalkulation) verringert die Abhängigkeit, und die Monteur-/Azubi-Funktionen (F1, F2, F6) hat Powerbird in dieser Form gar nicht. Realistisches Ziel: erst parallel fahren, nach einem Jahr Bilanz ziehen.
