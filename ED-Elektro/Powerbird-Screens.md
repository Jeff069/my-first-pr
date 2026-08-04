# Powerbird & monday bei ED-Elektro — verifiziert aus Screenshots

*Grundlage: Bildschirmfotos aus der laufenden Installation, August 2026. Alle Zahlen nachgerechnet und über mehrere Masken hinweg konsistent. Ersetzt die Recherche-Vermutungen in `Powerbird-Analyse.md`, wo sie sich widersprechen.*

---

## 1. Systemlandschaft heute

| System | Wofür | Wer |
|---|---|---|
| **Powerbird** (Hausmann & Wynen) | Kunden, Angebote, Kalkulation, Aufträge, Rechnungen | PLs / Büro |
| **monday.com** (`ed-elektro.monday.com`, Board „Vertrieb \| Kundenanfragen") | Anfragen-Eingang, Prozessverfolgung, Überblick | Chef (GF), 2 Nutzer |
| **Verbindung dazwischen** | — keine, Daten werden abgetippt | — |

Firma: ED-Elektro GmbH & Co. KG, Wörrstadt. Gewerke laut Anfragen: Klimaanlage (Split/Multisplit), Wärmepumpe/Heizung, Lüftung, Sanitär, Wartung.

## 2. Der Geschäftsprozess — 18 Stufen (monday-Status, farbcodiert)

```
Anfrage neu → PL zuweisen → Aufmaß vor Ort
→ Preisinfo versenden → Preisinfo nachfassen
→ Beta AN erstellen → Beta AN nachfassen
→ AN final erstellen → AN final nachfassen → AB versenden
→ Zahlungsplan erstellen → Material bestellen → AT vorb. erl.
→ AT Beschr. versenden → Terminplan abstimmen
→ AT Ausführung → AT Rechnung erstellen → Rechnung versenden
```
Abkürzungen: **AN** = Angebotsnummer · **AB** = Angebot · **AT** = Auftrag.
Kernpunkte: **drei Angebotsstufen** (Preisinfo → Beta → final) und **Nachfassen als fester Prozessschritt** (dreimal).

**monday-Spalten** (das Vorbild für das Anfragen-Board): Kundenname · Telefon · E-Mail · *Angaben zum geplanten Vorhaben* (O-Ton des Kunden) · Dateien (Fotos) · Mehrfachauswahl Gewerk (Wärmepumpe/Klimaanlage/Lüftungsinstallation/Wartung/Sonstiges) · Fälligkeitsdatum (mit Überfällig-Marker) · Vorhaben Kurzbeschreibung · Adresse BVH · Letztes Update (wer + wann) · Status (18 Farbstufen) · Priorität (Kritisch/Hoch/Mittel/Niedrig) · Verantwortlicher · Zeitleiste. Dazu eine **Formular-Ansicht** für die Aufnahme und 3 Automatisierungen.

## 3. Dokumentkonventionen

- **Angebotsnummer:** `AN2026-1395`, `AN2026-1400` → `AN{Jahr}-{fortlaufend 4-stellig}`
- **Fenstertitel:** `AN2026-1395 - Bilali GbR - 06732 - #Wärmepumpe Buderus 7KW, #Heizung #Saulheim`
  → Nummer · Kunde · Kennung · Kurzbeschreibung · **#Gewerk #Ort** (eigene Tag-Konvention)
- **Positionsnummern:** `01`, `01.001`, `02.003` → Gruppe.Position

## 4. Positionsarten (12, aus dem „Neu"-Menü)

`Artikel` · `Aufschläge` · `Stunden` · `Gruppe` · `Jumbo` · `Leistung` · `Hinweistext` · `Ausführung Anfang` · `Ausführung Text` · `Unterbeschreibung` · `Auslösung` · `Fahrtkosten`

Kürzel in der Art-Spalte: **G** Gruppe · **L** Leistung · **J** Jumbo · **H** Hinweistext · **Dr** diverser Artikel (frei erfasst, ohne Katalognummer, Händler „Divers")

**Eventualposition:** Marker **`b`** in der zweiten Spalte + Werte in Klammern → **zählt nicht in die Endsumme**.
Beleg: 27,75 + 155,00 = 182,75 Endsumme, die eingeklammerte Position (31,50) fehlt darin.

**Jumbo:** druckt als *eine* Zeile mit *einem* Preis, klappt intern zu seinen Komponenten auf, zeigt im Kurztext die Aufteilung „Material: 18.082,71 Lohn: 3.150,00" (= 21.232,71 Gesamt).

**Leistung:** enthält eine **Stückliste** (eingebettete Artikel) **plus Bauzeit**. Schalter: „einzeln einfügen", „Stückliste drucken", „Bauzeit a. Stückliste", „Objektabhängig", „Festpreis", „Nur Text".

## 5. Rechenmodell je Position (nachgerechnet)

**Reine Lohnposition** (Wartung Innengerät):
```
Bauzeit 0:25:00 · LGr 1 · Vk/Std 132,00  →  EinzelVk 55,00
EK 26,25 (= 63,00 €/h)  →  Kalk 109,52 %
Menge 2  →  Gesamt-VK 110,00
```
**Leistung mit Stückliste** (EL0076 Fahrtkostenpauschale):
```
Material:  EK  9,00 · Kalk  0,00 %  →  VK  9,00
Lohn:      EK 11,25 · Kalk 66,67 %  →  VK 18,75   (Bauzeit 0:15:00)
                                        Summe 27,75
Rabatt:    BasisVk 35,25 − 21,28 %  →  27,75
```
→ **Material und Lohn werden getrennt kalkuliert, jeweils mit eigenem Kalk-%.**
Bauzeit wird als `h:mm:ss` erfasst.

## 6. Dokument-Kalkulation nach Kostenarten (Dialog „Dokument-Eigenschaften", Reiter *Kalk*)

Elf Kostenarten + Fremdleistung, je Zeile: `Ek Gesamt | Basis-Kalk % | Vk ohne Auf. | + Aufschläge | Dokument GesamtVk | Gesamt-Kalk % | Marge`

| Kostenart | EK | Kalk % | VK | Marge |
|---|---|---|---|---|
| Material | 59,00 | 0,00 | 59,00 | 0,00 |
| Metalle | 0,00 | | 0,00 | |
| **DiverseArt** | 17.010,60 | 35,81 | 23.102,31 | 6.091,71 |
| **LeistungsStd** | 3.972,00 | 87,50 | 7.447,50 | 3.475,50 |
| sonstige Std · FestPreise · Fahrtkosten · Auslösungen · sonstiges · ZusKosten · Bezugsk. | 0,00 | | | |
| **Summe** | **21.041,60** | **45,47** | **30.608,81** | **9.567,21** |

+ 19 % USt (5.815,67) = **36.424,48 €**
Gegenprobe: Gruppensummen 396,50 + 30.212,31 = 30.608,81 ✓

**Kennzahlen unten (alle nachgerechnet):**
```
Anzahl Std                             82,75
Wertschöpfung/Std   = (VK − Material-EK)/Std   163,62
Deckungsbeitrag/Std = Marge/Std                115,62
Durchschn. Stundenverrechnungspreis             90,00
```
Der Dialog lässt sich per Feld „Gruppe" auch **je Gruppe** auswerten. Weitere Reiter: Grundeinst., Druck, **Aufschlag**, Konten, Fremdl./Aufm., **DB**, ZusKosten, GAEB.

## 7. Lohngruppen (Dialog „Stunden-Mischkalkulation")

16 Gruppen (LG 0–15), je mit Selbstkostensatz, % Gewinn und VK-Satz:

| LG | Bezeichnung | SK | % Gewinn | VK |
|---|---|---|---|---|
| 1 | Stundensatz Monteur **ab 3 Std.** | 48,00 | 87,50 | 90,00 |
| 2 | Obermonteur ab 3 Std. | 48,00 | 62,50 | 78,00 |
| 3 | Meister/Techniker/Bauleiter 3h | 48,00 | 62,50 | 78,00 |
| 5 | Azubi/Fachhelfer ab 3 Std. | 16,00 | 118,7 | 35,00 |
| 6 | **AW** Monteur **bis 3 Std.** | 16,00 | 437,5 | 86,00 |
| 7 | **AW** Obermonteur | 28,00 | 278,5 | 106,00 |
| 8 | **AW** Meister/Techniker/Bauleiter | 28,00 | 318,5 | 117,20 |
| 10 | **AW** Azubi/Fachhelfer | 29,00 | 72,41 | 50,00 |
| 11 | Sub Sani | 24,00 | 166,6 | 64,00 |
| 12 / 13 | Sub (namentlich, je Person eine Gruppe) | 0,00 | 0,00 | 40,00 / 35,00 |
| 15 | Elektro Projekte Sub kalk. | 42,15 | 30,49 | 55,00 |
| 4 / 9 / 14 | Reserve | | | |

- **Zwei Satzfamilien:** Einsätze **ab 3 Std.** (Projektarbeit) gegen **AW … bis 3 Std.** (Kurzeinsatz, höhere Sätze). Passt zum eigenen Vorgangstyp „Kleinaufträge" im Hauptmenü.
- **Subunternehmer sind eigene Lohngruppen**, teils personenbezogen.
- Unten getrennt ausgewiesen: Festpreisleistungen · Festpreisjumbos · Fremdleistungen; Haken „FestpreisStd. in 0–15 enthalten".
- **Die Sätze hängen am Dokument, nicht global:** Im Wartungsangebot rechnet LG 1 mit **132 €/h**, im Wärmepumpen-Angebot mit **90 €/h**. Wartung wird also deutlich höher bepreist als Projektarbeit.

## 8. Dokumentkopf (13 Reiter + Knopf „Positionen")

`Haupt · Seite 2 · Adressen · Stamm · Einstellungen · Eigene Felder · Anfangstext · Endtext · Vertrag · Termine · Buchung · Summen · Vorgänge`

**Seite 2 — Zahlungskonditionen:** ZB-Nummer (nummerierte Vorlagen), Skto %, Haken **„nur Mat."**, Skontofälligkeit, **Nettofälligkeit 14 Tage**, errechnetes Skonto-/Nettodatum, Zahlart (Überweisung), SEPA-Mandat, **Sicherheitseinbehalt**, Lieferzeitraum von/bis (\* = Leistungsdatum), Steuercode „Inland".
Zusätzlich: **Kupfergewicht (kg) · Gesamt-Vk Kupfer · Gesamt-Ek Kupfer**.

**Stamm — dokumenteigene Stammdaten:** Metallpreise (nur **Kupfer 1.100**, Stand 17.04.26; alle anderen 0), die 15 Stundensätze EK/VK, **MwSt 19/7/0**, **Preisstufe Artikel/Leistung 1/1**, Haken „Lohnarten/-grp Gültigkeit berücksichtigen", „Mit Basispreisen kalkulieren".

## 9. Powerbird-Hauptmenü

10 Reiter (Start-Center, Artikelbereich, Stammdaten, Druckeinrichtung, Kasse, Administration, Finanzen, Ablage, Auswertungen, Zusatz), 12 Baumbereiche, Kacheln u. a.: Kunden/Mitarbeiter/Lieferanten · Artikel/Leistungen/Werkzeugverwaltung/**Rohstoff-Tagespreise** · Angebote/Aufträge/Rechnungen/Bürgschaften/Lieferscheine/Gutschriften/Sammelbuchungen · Preisanfrage/Bestellungen · **Kleinaufträge**/Geräteverwaltung/Zeiterfassung · Projektverwaltung/Zeiterfassung · Vorgänge/Termine/**Onlineshop-Login (OCI)**.

**Nutzerurteil (wörtlich): „sehr kompliziert gemacht".** → Gestaltungsvorgabe fürs eigene System: aufgabenorientiert statt modulorientiert.

## 10. Beobachtungen mit Folgen für den Nachbau

1. **Material wird fast ausschließlich frei erfasst.** Im Wärmepumpen-Angebot: 17.010,60 € „DiverseArt" gegen 59,00 € Katalog-„Material". Der Artikelstamm ist praktisch ungenutzt → die Maske muss **freies Erfassen erstklassig können**, der Datanorm-Import ist Komfort, nicht Voraussetzung.
2. **Langtexte sind ausführlich und strukturiert** (Leistungsumfang in 8 nummerierten Punkten) und enthalten bewusst **Abgrenzungen** („Nicht enthalten: …"). Textbausteine sind zentral.
3. **Marge wird auf drei Ebenen beobachtet:** je Position, je Gruppe, je Kostenart/Dokument.
4. **Wartung ≠ Projekt:** eigene Stundensätze, eigener Vorgangstyp (Kleinauftrag), eigene AW-Lohngruppen.
5. **Kupfer** wird als einziges Metall mitgeführt (Tagespreis + Gewicht + EK/VK-Anteil je Dokument).

## 11. Offene Punkte (vor dem Prompt-Umbau zu klären)

1. Wird Material bewusst frei erfasst, oder fehlt nur ein gepflegter Artikelstamm?
2. Preisinfo / Beta-AN / finales AN — drei getrennte Dokumente oder Versionen eines Vorgangs?
3. Kleinauftrag als eigener Vorgangstyp mit AW-Sätzen — wie häufig gegenüber normalen Aufträgen?
4. Kalk-Dialog: nur Anzeige oder **Top-down-Steuerung** (Prozentsatz ändern → „Übernehmen" → Positionen rechnen neu)?
5. Bedeutung von **„AW"** in den Lohngruppen.
6. Welche Powerbird-Bereiche werden täglich genutzt, welche nie?
7. Wie gelangt eine monday-Anfrage heute nach Powerbird?
8. Zahlungsbedingungen: nur „14 Tage netto" oder mehrere Vorlagen? Skonto „nur Material"?
