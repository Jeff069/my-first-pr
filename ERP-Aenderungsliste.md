# ERP-Umbau — Änderungsliste

**Basis:** Handwerkerprogramm (Open-Source-ERP, Java 23/Spring Boot + React + MariaDB), eigener Entwickler-Clone
**Betrieb:** Familienbetrieb Klima / Elektro / Sanitär — 1× GF, 1× Finanz & Controlling, 1× Bereichsleiter, 3× Projektleiter, 1× Azubi, 4× Monteure, zeitweise Subunternehmer
**Stand:** 31.07.2026 — zusammengefasst aus dem Planungsgespräch

---

## 0. Grundsätze (gelten für alles)

- Erweitern statt umbauen: Änderungen additiv (neue Services/Controller/Seiten), Original-Repo als `upstream`-Remote behalten
- Eigener Flyway-Nummernkreis (z. B. ab `V900__`), damit Upstream-Migrationen nie kollidieren
- Entwicklung nur gegen eine Datenbank-Kopie, nie gegen echte Firmendaten
- **Regel vor KI:** Alles, was als Wenn-Dann-Regel oder Formel beschreibbar ist, wird fest einprogrammiert; KI nur, wo Text, Bilder oder Zusammenhänge verstanden werden müssen
- **Preise kommen immer aus dem Artikelstamm — nie vom KI-Modell** (Modell schlägt nur Positionen, Mengen, Texte vor)
- KI-Vorschläge laufen durch eine Prüf-Queue (Mensch gibt frei); jede Automatik wird geloggt
- KI-API: bezahlter Gemini-Key mit No-Training-Policy; OpenRouter-Free-Modelle nur zum Testen (20 Anfragen/min, 50/Tag; Anbieter dürfen ggf. auf Eingaben trainieren → DSGVO-Risiko bei Kundendaten)
- Lizenz (AGPL v3): intern alles erlaubt; sobald Externe (z. B. Subs mit Login) übers Netz zugreifen, muss der Quellcode des Forks auf Nachfrage angeboten werden können

## 1. Rollen & Rechte (Spring Security erweitern + Admin-Seite)

- Sechs feste Rollen-Vorlagen statt Einzelrechte: **Admin (GF, F&C), Bereichsleitung, Projektleitung, Monteur, Azubi, Subunternehmer**
- GF und F&C vergeben Rechte selbst (Admin-Oberfläche)
- Einkaufspreise, Margen, Löhne: nur Admin + BL — Monteure sehen keine Preise
- Subunternehmer: nur eigene Projekte, keine Preise, keine Kundenhistorie, Zugang mit Ablaufdatum
- Vertretungsregelung für Urlaub/Krankheit (z. B. Rechnungsfreigabe, wenn F&C fehlt)
- Jede Rechteänderung landet selbst in der Historie

## 2. Anfragen-Board mit Verteilung

- Ein Eingangskorb für alle Kanäle: Website-Leads (vorhanden), E-Mail, telefonisch manuell erfasst
- KI-Triage: Gewerk erkennen (Klima/Elektro/Sanitär), Dringlichkeit einschätzen, Kundendaten extrahieren, Zuweisungsvorschlag
- Zuweisung an PL/BL durch BL oder GF — Monteure und Azubis ausgenommen
- SLA-Timer: 48 h unangetastet → Eskalation an BL (Spring `@Scheduled`-Job)
- Statuskette: Neu → Zugewiesen → Besichtigung → Angebot → Gewonnen/Verloren
- Pflichtfeld **Verlustgrund** (zu teuer / keine Kapazität / zu spät) für spätere Auswertung

## 3. Historie / Änderungslog

- Änderungsprotokoll auf Projekten, Anfragen, Angeboten: wer, wann, welches Feld, alt → neu (technisch: **Hibernate Envers** prüfen — fast ohne Eigencode)
- Append-only, nachträglich unveränderbar; keine Voll-Versionierung
- Aktivitäten-Feed je Objekt mit Kommentaren und @-Erwähnungen

## 4. Monteur-PWA ausbauen (erweitern, nicht neu bauen)

- Startansicht **„Mein Tag"**: heutige Einsätze mit Adresse, Navigation, Ansprechpartner, benötigtem Material
- **Digitale Kundenunterschrift** auf dem Handy (Arbeitsnachweis / Abnahme)
- Gewerke-Protokolle als Formulare:
  - Klima: Kältemittel-Logbuch + Dichtheitsprüfung (F-Gase-Verordnung, Pflicht)
  - Elektro: Mess- und Prüfprotokolle (DIN VDE)
  - Sanitär: Druckprobe- und Spülprotokolle
- Sprachnotiz statt Tippen: Bautagebuch, Mängel, Material — Aufnahme in der PWA (MediaRecorder-API), KI strukturiert
- Materialmeldung mit Folge: „Fehlt: …" → wird automatisch Bestellvorschlag beim PL
- Bedienung: große Buttons, wenig Text (Handschuhe, Baustelle)

## 5. Wartungsmodul (neu — größte fachliche Lücke, System kommt aus dem Metallbau)

- Anlagenverwaltung je Kunde: Splitgeräte, Thermen, Verteiler … mit Stammdaten
- Wartungsintervalle + automatische Terminvorschläge und Erinnerungen (Klima: Pflicht-Dichtheitskontrollen; E-Check; Sanitär-Wartung)
- Wartungsverträge = planbarer, wiederkehrender Umsatz (Winterauslastung)
- **QR-Anlagen-Akte**: Aufkleber auf jeder Anlage; Scan in der PWA → komplette Historie, Unterlagen/Schaltplan, verbautes Material, letzte Einsätze (Gold beim Notdienst)

## 6. Kalkulation & Einkauf

- **Datanorm-Import** vom Großhandel: Artikelstamm + EK-Preise + Rabattgruppen (wichtigste Schnittstelle; später IDS-Connect zum Großhändler-Shop)
- Material-Aufschlag als feste Kalkulationsregel — **kein Agent**:
  - Zuschlag je Warengruppe (z. B. Kleinmaterial 40–50 %, Rohre/Kabel ~25 %, Großgeräte 10–15 % — Sätze legt ihr fest)
  - Staffel nach EK-Wert (billige Artikel → höherer Prozentsatz)
  - optional je Kundengruppe (Privat / Gewerbe / Stammkunde)
  - vorher prüfen, was die vorhandene Kalkulation im Angebotswesen schon kann
- **Kalkulations-Check (KI) vor Angebotsversand**: Marge unter Schwelle? Anfahrt/Entsorgung/Kleinmaterial vergessen? Stundensatz weicht ab? Position ohne Aufschlag?

## 7. KI-Funktionen

Gemeinsame Kernfähigkeit zuerst bauen: **„Sprache rein, Struktur raus"** (Audio → Gemini → strukturiertes JSON) — bedient Diktier-Aufmaß, Sprachnotizen und Berichtsheft gleichzeitig.

- **Sofort, ohne Code** (vor der Chef-Demo): die letzten 30 Angebote anonymisiert analysieren lassen — Stundensätze konsistent? Regelmäßig vergessene Positionen? Unklare Formulierungen? Unterschiede zwischen den Gewerken?
- **Angebots-Entwurf mit RAG**: bei neuer Anfrage die 3–5 ähnlichsten Alt-Angebote als Vorlage; Modell schlägt Positionen/Mengen/Texte vor, Preise aus dem Artikelstamm
- **Diktier-Aufmaß (PL)**: nach der Besichtigung 2 Minuten ins Handy sprechen → strukturierte Projektnotiz + Positionsvorschlag fürs Angebot
- **Nachtrags-Wächter**: Bautagebuch laufend gegen Angebotspositionen abgleichen → „nicht im Angebot — Nachtrag stellen?"
- **Berichtsheft-Generator (Azubi)**: Wochenbericht-Entwurf aus Zeiterfassung + Bautagebuch, Azubi überarbeitet, Ausbilder zeichnet digital ab (PDF über vorhandenes OpenPDF)
- **Erklär-Modus (Azubi)**: vorhandenen Fach-Chat als Lernwerkzeug nutzen
- **Montagmorgen-Bericht (GF)**: wöchentliche Klartext-Zusammenfassung — Auftragseingang, Angebotsquote, Forderungen > 30 Tage, Projekte mit Kalkulationsdrift > 10 %, Auslastung, offene Reklamationen

## 8. Auswertungen & Werkzeuge je Rolle

- **GF:** Forderungs-Ampel — offene Posten mit Mahnstufen nach festen Fristen (Regel), Erinnerungstexte als KI-Entwurf
- **F&C:** Skonto-Wächter (Skontofrist aus OCR, Erinnerung 2 Tage vorher); 3-Wege-Abgleich Bestellung ↔ Lieferschein ↔ Eingangsrechnung inkl. Konditionsprüfung gegen Rabattgruppen; Lohnvorbereitungs-Export aus der Zeiterfassung (Überstunden/Zuschläge nach festen Regeln); DATEV-Export prüfen, ggf. ergänzen
- **BL:** Kapazitätsansicht „Wann können wir?" (verplante vs. verfügbare Stunden je Gewerk, 6–8 Wochen); Eskalations-Cockpit (liegengebliebene Anfragen, Kalkulationsdrift, offene Reklamationen, Angebote ohne Rückmeldung > 2 Wochen)
- **PL:** automatische Terminbestätigung an Kunden per Mail/SMS bei Einplanung (reine Regel)
- **Disposition:** Plantafel — Wochenansicht, Monteure + Subs als Zeilen, Drag & Drop, freigehaltener Havarie-Slot
- **Subunternehmer:** Nachweis-Verwaltung mit Ablaufdaten (Freistellungsbescheinigung §48b EStG, Betriebshaftpflicht, Kälteschein Kat. I) — ohne gültige Nachweise keine Einplanung möglich; digitaler Leistungsnachweis (Sub reicht Stunden ein → PL gibt frei → Sub-Rechnung wird dagegen geprüft)

## 9. Geparkt (bewusst später)

- **Server + Backups**: wartet bis nach der Chef-Demo — Pflicht spätestens vor Echtbetrieb mit Kundendaten bzw. vor jeder NAS-Anbindung (nächtlicher MariaDB-Dump + Datei-Backup, Wiederherstellung einmal testen)
- **NAS-Integration** (braucht Go vom Chef), dann in drei Schichten:
  1. Ordner-Sync nach festem Schema `/Kunden/<Kundennummer>_<Name>/…` — reine Regel, Kundennummer als stabiler Anker
  2. Scan-Eingangsordner: KI ordnet Dokumente Kunde/Projekt/Typ zu, bei Unsicherheit Prüf-Queue
  3. Semantische Suche über indexierte NAS-Dokumente („hol mir den Wartungsvertrag von Kunde X")
  - Regeln: NAS-Zugriff respektiert ERP-Rollen; Agent legt nur an und kopiert, löscht/verschiebt nie; alles wird geloggt; Rechnungen bleiben im ERP führend (GoBD)

## 10. Bau-Reihenfolge (Entwickler-Sicht)

1. Erstes additives Feature zum Kennenlernen der Codebasis: **Berichtsheft-Generator** oder **„Mein Tag"** (nur lesend, risikolos, demo-tauglich)
2. **Rollen & Rechte** (Security-Kern — als zweites Projekt, nicht als erstes)
3. **Anfragen-Board** + SLA + Verlustgrund
4. **Historie** (Envers)
5. **PWA-Ausbau**: Unterschrift, Gewerke-Protokolle, Sprachnotizen
6. **Kalkulationsregeln + Datanorm**
7. **Wartungsmodul + QR-Anlagen-Akte**
8. Übrige **KI-Features** (Nachtrags-Wächter, Angebots-RAG, Montagsbericht …)

**Für die Chef-Demo:** Ergebnisse der 30-Angebote-Analyse mitbringen, Kalkulations-Check zeigen, Berichtsheft-Generator vorführen.
