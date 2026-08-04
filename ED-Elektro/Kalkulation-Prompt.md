# ED-Elektro — Angebotskalkulation (Bau-Prompt, Fassung 2)

> **Nutzung:** Companion zum Master-Prompt. Für Kalkulations-Sitzungen zusätzlich laden. Gebaut wird **eine Stufe pro Sitzung**, K1 → K8. Die Regeln des Master-Prompts (§5 Repo-Regeln, §6 Fork-Regeln, §7 Arbeitsweise, §9 Rollen, §13 DoD) gelten unverändert.
>
> **Fassung 2** ersetzt die erste Fassung vollständig. Grundlage ist jetzt nicht mehr Marktrecherche, sondern die **verifizierte Arbeitsweise des Betriebs** aus Bildschirmfotos der laufenden Powerbird-Installation — siehe `Powerbird-Screens.md`. Wo dieses Dokument und `Powerbird-Analyse.md` sich widersprechen, gilt dieses.

---

## 1. Auftrag

Build the **Angebotskalkulation** for ED-Elektro (Klima / Elektro / Sanitär, 11 people, Wörrstadt). Three project leads must be able to write every offer of the company in it — daily, fast, without falling back to anything else.

**Decision by the owner: Powerbird is being retired.** This module replaces its offer creation and calculation. The team is trained on Powerbird, so the screen must feel familiar — but it must not inherit Powerbird's navigation, which the users themselves call *"sehr kompliziert gemacht"*. Task-oriented, not module-oriented: a PL wants one button "Neues Angebot", not a decision about which module it lives in.

## 2. Wie der Betrieb heute wirklich arbeitet (verifiziert — die Bauvorgaben)

These facts come from the running installation and were confirmed by the project lead. They override any assumption from market research.

1. **Material is entered FREELY, almost always.** In a real 30 k€ heat-pump offer: **17.010,60 € as free-entered positions ("DiverseArt") against 59,00 € from the article catalog.** The article master is effectively unused. → **Free, keyboard-fast entry is the primary path. The DATANORM import is comfort, not a prerequisite.**
2. **Material and labor are calculated separately, each with its own markup (Kalk %).** Example: a service position with material EK 9,00 at 0 % and labor EK 11,25 at 66,67 % → 9,00 + 18,75 = 27,75.
3. **Labor = Bauzeit × the VK rate of the Lohngruppe.** Bauzeit is entered as `h:mm:ss`. Example: 0:25:00 at 132,00 €/h → 55,00 €.
4. **The PL enters Bauzeit manually** (confirmed). A suggestion from historical data is a welcome addition, never a blocker.
5. **Kalk % is proposed from master data and overridden per position** (confirmed).
6. **16 Lohngruppen in two families:** "… ab 3 Std." for project work and "AW … bis 3 Std." for short assignments (higher rates). Subcontractors are their own Lohngruppen, some named after the person.
7. **Hourly rates belong to the document, not to global master data.** Proof: LG 1 runs at 90,00 €/h in the heat-pump offer and at **132,00 €/h** in the maintenance offer. Maintenance is priced substantially higher than project work.
8. **Offers start blank OR by copying an existing offer** (confirmed — both paths matter).
9. **Three offer stages on ONE offer:** Preisinfo → Beta-Angebot → finales Angebot. **Same offer number as long as it is the same project** (confirmed).
10. **Eventualpositionen** are marked and printed but excluded from the total (Powerbird shows marker `b` + values in parentheses).
11. **Of the 11 cost types only three are in real use** (Material, DiverseArt, LeistungsStd). The rest may be used later — model them, but do not build UI complexity around them.
12. The company's process runs in **monday.com** in 18 stages, the documents in Powerbird, with nothing connecting them — see `Powerbird-Screens.md` §2. The calculation is the piece that ends the double entry.

## 3. Was im Code bereits existiert (nicht neu bauen)

- `domain/Leistung` (bezeichnung, beschreibung, einheit, preis, kategorie), `domain/Artikel` with `LieferantenArtikelPreise` — catalog skeleton, empty for these trades.
- `Dokumenttyp` enum incl. `ANGEBOT`, `NACHTRAGSANGEBOT`, `RECHNUNG` …; `AusgangsGeschaeftsDokument`; `DocumentBuilder.tsx` (1150 lines) with live PDF, `{{LEISTUNGEN_TABELLE}}`, Formularwesen templates, ZUGFeRD/XRechnung, digital offer approval.
- `VerrechnungslohnService` + Controller + DTOs + `SvSatzTyp` (ADMIN-only `POST /api/verrechnungslohn/uebernehmen`) — the charge-out rate calculator.
- `analysiereKategorie()` — "Stunden pro Einheit" per Produktkategorie via regression (Metallbau-trained; advisory only).
- `Anfrage` entity with documents, notes and images; GAEB import; Vor-/Nachkalkulation from four sources; Bestellwesen with supplier prices.
- **Absent → this module:** Lohngruppen, the calculation screen, cost-type accounting, DATANORM import, Sollmengen handoff.

---

# 4. Bau-Stufen

## K1 — Lohngruppen & Stundensätze

**Goal:** labor gets a price, exactly the way the company prices it today.

- `Lohngruppe` (nummer, bezeichnung, selbstkostenSatz, gewinnProzent, vkSatz, familie ENUM('PROJEKT','KURZEINSATZ'), typ ENUM('EIGEN','SUB'), aktiv, gueltigAb, gueltigBis). `vkSatz = selbstkostenSatz × (1 + gewinnProzent/100)` — store all three, changing one recomputes the third.
- Seed with the company's real structure (names and rates come from the project lead; the current set is in `Powerbird-Screens.md` §7): Monteur / Obermonteur / Meister-Techniker-Bauleiter / Azubi-Fachhelfer, each once as `PROJEKT` ("ab 3 Std.") and once as `KURZEINSATZ` ("AW … bis 3 Std."), plus subcontractor groups.
- **Document-scoped copies — the central rule:** when a calculation is created, the currently valid Lohngruppen are **copied into it** (`KalkulationLohngruppe`). The copy is editable inside the document and is what all its positions use. Changing global master data never alters an existing calculation. This is exactly how the company works today (90 €/h in a project offer, 132 €/h in a maintenance offer for the same group number).
- Wire the existing `VerrechnungslohnService` as the source for `selbstkostenSatz`; manual override allowed.
- Admin UI for the global set (Admin/BL per §9); an editing dialog for the document copy (PL).

**Acceptance:** creating a calculation copies the groups; editing a document's rate changes only that document; editing global master data leaves existing calculations untouched; `vkSatz`/`gewinnProzent` stay consistent in both directions.

## K2 — Die Kalkulationsmaske *(das Herzstück — hier wird der Betrieb gewonnen oder verloren)*

**Goal:** a PL assembles a complete offer faster than in Powerbird. New desktop page `AngebotskalkulationEditor.tsx`.

**Structure**
- Hierarchical **Titel/Gruppen tree** with positions inside; numbering `01`, `01.001`, `02.003` (Gruppe.Position), auto-renumbering on move; drag to reorder; collapse/expand.
- Per group: **Gruppensumme and group margin** as their own row (the company reads margin at group level).
- Position types: `DIVERS` (free entry), `ARTIKEL` (from catalog), `LEISTUNG` (Stückliste + Bauzeit), `JUMBO` (bundle), `STUNDEN` (labor only), `TEXT` (Hinweis-/Ausführungstext, Unterbeschreibung), `ZUSCHLAG`, `FAHRTKOSTEN`, `AUSLOESUNG`.

**Free entry is the primary path.** A `DIVERS` position must be enterable purely by keyboard, in this order: Bezeichnung → Menge → ME → Material-EK → Kalk % → Bauzeit (`h:mm:ss`) → Lohngruppe → Enter. Nothing else may be mandatory. **Target: under 15 seconds per position.** Every other position type is a shortcut on top of this — never a detour around it.

**Per position**
- Menge + ME (St, Psch, m, kg, Std …), Bezeichnung (Kurztext) + **Langtext** (multi-line, printed; the company writes structured scopes including explicit *"Nicht enthalten: …"* sections).
- Material: EK, **Kalk %**, resulting VK; optional Rabatt %.
- Labor: **Bauzeit `h:mm:ss`**, Lohngruppe, own **Kalk %**, resulting labor VK.
- **Kalk % defaults come from master data** (Leistung, article group, or a configurable default per cost type) and are **overridable per position** — confirmed working practice.
- **Eventualposition** flag: printed, marked, and **excluded from the document total** (display convention: value in parentheses, like today).
- Optional: `festpreis` flag (fixed price overrides the calculation but keeps EK for margin).

**Speed features — these decide adoption**
- **Copy from a previous offer:** whole offer, a single Titel, or single positions, with a searchable picker (customer, project, period, Gewerk). Both entry paths — blank and copy — are equally first-class (confirmed).
- Duplicate position, multi-select delete, undo, keyboard navigation throughout, quick search over catalog + previous positions.
- **Optional Bauzeit suggestion:** where `analysiereKategorie()` has history for the Produktkategorie, show a suggested time as a hint the PL may accept with one key. Never pre-filled silently, never blocking — the PL enters the time themselves today and must stay able to.

**Totals bar (sticky):** Material, Lohn, Summe, Marge — per position, per group, per document. Margin columns respect §9 role visibility.

**Acceptance:** a 10-position offer is assembled without typing a single price twice; a free position is enterable in under 15 s keyboard-only; changing Bauzeit or Kalk % updates position, group and document totals live; an Eventualposition is visible but not in the total; copying a previous offer reproduces its positions exactly, with the *current* document's Lohngruppen applied.

## K3 — Leistungskatalog mit Stückliste und Bauzeit

**Goal:** the shortcuts that make recurring work fast.

- Extend `Leistung`: `bauzeitMinuten` (or `h:mm:ss`), `lohngruppeRef`, `kalkMaterialProzent`, `kalkLohnProzent`, plus a **Stückliste** (`LeistungArtikel`: leistungRef, artikelRef **or** free text + EK, menge). Keep the existing `preis` field working for legacy flat-price services.
- Nesting **one** level (Leistung inside Leistung) — the company uses it, deeper recursion is not needed.
- Flags mirroring today's behavior: *Stückliste drucken* (yes/no), *einzeln einfügen*, *Bauzeit aus Stückliste*, *Festpreis*, *Nur Text*.
- **Jumbo:** a bundle that prints as **one line with one price** while its components stay stored, tracked and reportable; show the split *"Material: … Lohn: …"* on the collapsed row; expandable in the editor.
- Catalog UI: search, filter by Gewerk (Klima/Elektro/Sanitär), duplicate-and-edit, favorites, usage count.
- **Seeding paths (data, not code):** the company's own catalog via **GAEB export from Powerbird → the system's existing GAEB import**; optionally KFE/ZVEH (Elektro) and TGP/SIRADOS (SHK) Leistungspositionen with normed times. Verify the upstream GAEB import's real capabilities before building anything new.

**Acceptance:** inserting a Leistung creates material + labor in one step and prices itself through K1; a Jumbo prints as one line and still reports its components; a GAEB file exported from Powerbird imports without manual repair.

## K4 — Kostenarten & Dokument-Kalkulation

**Goal:** the overview the company steers by.

- Every position carries a **Kostenart**: `MATERIAL`, `DIVERSE_ARTIKEL`, `METALLE`, `LEISTUNGS_STD`, `SONSTIGE_STD`, `FESTPREISE`, `FAHRTKOSTEN`, `AUSLOESUNGEN`, `SONSTIGES`, `ZUSATZKOSTEN`, `BEZUGSKOSTEN`, plus `FREMDLEISTUNG` reported separately. Only the first, second and fourth are in daily use — **model all of them, show the empty ones unobtrusively.**
- Document calculation view per cost type: `EK gesamt | Kalk % | VK | Marge`, plus the document total and VAT (rates 19 / 7 / 0).
- **The four key figures the company reads** (all verified against real data):
  ```
  Anzahl Std
  Wertschöpfung/Std   = (VK gesamt − Material-EK) / Anzahl Std
  Deckungsbeitrag/Std = Marge gesamt / Anzahl Std
  Ø Stundenverrechnungspreis = Lohn-VK / Anzahl Std
  ```
- Filterable **per Gruppe** as well as for the whole document.
- **Top-down steering: NOT in v1.** (Powerbird can set a markup per cost type and push it down onto the positions; the project lead does not use it.) Build the view first. If it is later wanted, it becomes: change % per cost type → preview which positions change → apply explicitly. Never silent.

**Acceptance:** the cost-type table reconciles to the position sums to the cent; the four key figures reproduce the numbers of a real reference offer exactly; the group filter sums correctly.

## K5 — Angebots-PDF

**Goal:** the document the customer receives — through the existing stack, never a second PDF path.

- Generate the `ANGEBOT` document from the calculation via `DocumentBuilder` / `{{LEISTUNGEN_TABELLE}}` / Formularwesen, attached to the Anfrage.
- Print rules: **Jumbo = one line, one price**; Eventualpositionen in a separate, clearly marked block outside the total; Titel subtotals; Langtexte in full including *"Nicht enthalten"* sections; optional print variants (with/without unit prices, with/without Stückliste).
- **Anfangstext / Endtext** as reusable Textbausteine on the document (the company works with substantial standard blocks).
- Document header data to carry: Zahlungsbedingung as a **numbered template** (default 14 Tage netto), Skonto % + *nur Material* flag, Skonto-/Nettodatum computed, Sicherheitseinbehalt, Leistungszeitraum, plus the **Kupferanteil** (Gewicht, EK, VK) if copper-bearing articles are present.
- Reuse the existing e-mail dispatch and the digital approval (snapshot hash).

**Acceptance:** position texts and totals in the PDF match the calculation exactly; a Jumbo shows one line; Eventualpositionen appear but are not in the total; regenerating an unchanged calculation produces an identical document.

## K6 — DATANORM-Import *(Komfort — bewusst nach der Maske)*

- Import DATANORM v4/v5 (articles, EK prices, discount groups) into `Artikel` + `LieferantenArtikelPreise`; dedupe by supplier + article number; import log; **idempotent** re-import; tolerant of unknown record types; decode CP850/ISO-8859-1 explicitly.
- **Preisspiegel:** for an article show the imported supplier prices side by side, cheapest highlighted, switchable per position.
- Markup rules for catalog material: article override → product group → EK-value tier → default, optional customer-group factor applied multiplicatively; seed tiers EK < 50 € → 45 %, 50–500 € → 25 %, > 500 € → 12 %, default 20 %; admin UI (Admin/BL).

**Acceptance:** golden-file test imports twice with identical result; a catalog position lands in the calculation with the correct VK and zero manual steps; free entry keeps working exactly as before.

## K7 — Sollmengen & Nachkalkulation

- On acceptance, the calculation's positions become the project's **Soll values** (quantities and Bauzeit per position).
- Feed the existing Vor-/Nachkalkulation: compare Soll vs. Ist (booked times, material, incoming invoices) **per position**.
- Deviation report per Produktkategorie and Gewerk — the data that later makes the K2 Bauzeit suggestions trustworthy.

**Acceptance:** a finished project shows estimated vs. actual minutes per position; the report filters by trade and period.

## K8 — Validierung & Umstieg

- **Offer stages:** one calculation carries `stufe ENUM('PREISINFO','BETA','FINAL')` and a version history. **The offer number stays the same as long as it is the same project** (confirmed practice). Each stage keeps its own snapshot so an earlier version stays reproducible; the PDF marks non-final stages as unverbindlich.
- **Own number range:** `AN{Jahr}-{fortlaufend}` like today, with a starting number chosen so it can never collide with the numbers Powerbird already issued.
- **Validation, time-boxed:** the project lead has a folder of **30 real offers — 10 Klima, 10 Sanitär, 10 Elektro**. Re-calculate at least 5 per trade in the new screen and compare totals **to the cent**. Every deviation is an engine defect, not rounding. Record each comparison (offer, Powerbird total, own total, deviation, cause).
- **Cutover by new business:** from the cutover date every new inquiry is calculated here; offers already running in Powerbird finish there. No offer is ever maintained in both systems.

**Acceptance:** the validation protocol exists in writing and shows two consecutive exact matches per trade; no duplicate offer number is possible; the cutover date is recorded.

---

## 5. Rechenregeln (verbindlich, deterministisch, niemals KI)

Per position:
```
Material-VK/Einheit = Material-EK × (1 + KalkMaterial% / 100) − Rabatt%
Materialsumme       = Menge × Material-VK/Einheit
Lohnkosten-EK       = (Bauzeit in Minuten × Menge ÷ 60) × Selbstkostensatz(Lohngruppe)
Lohnsumme-VK        = (Bauzeit in Minuten × Menge ÷ 60) × VK-Satz(Lohngruppe)
Positionssumme      = Materialsumme + Lohnsumme-VK
Kalk % (Anzeige)    = (VK − EK) / EK × 100
```
- **Jumbo:** sum of its children, printed as one line, split "Material / Lohn" shown on the row.
- **Zuschlagsposition:** percentage on the referenced positions or Titel.
- **Eventualposition:** calculated and displayed, **excluded** from Gruppen- and Dokumentsumme.
- **Document:** Σ positions − Dokumentrabatt = net; + VAT = gross.
- **Rounding:** `BigDecimal` throughout; round only for display and at the document total (2 decimals, HALF_UP). Never round intermediate results — the K8 validation compares to the cent.
- **Copied, not referenced:** the applied Kalk %, the Lohngruppen rates and the supplier price are **stored in the position** at entry. Later master-data changes never alter a stored calculation.
- **No LLM anywhere in the price path.** Text suggestions may be AI-assisted later; every number comes from these rules.

## 6. Datenmodell (Skizze — dem Bestandscode folgen, wo er besser passt)

```
AngebotsKalkulation   anfrageRef, angebotsNummer, stufe(PREISINFO|BETA|FINAL), version,
                      vorgaengerRef, dokumentRabatt, zahlungsbedingungRef, waehrung,
                      kupferGewichtKg, summen…
KalkulationLohngruppe kalkulationRef, nummer, bezeichnung, selbstkostenSatz,
                      gewinnProzent, vkSatz            ← dokumenteigene Kopie
AngebotsTitel         kalkulationRef, parentRef, nummer, bezeichnung, reihenfolge
AngebotsPosition      titelRef, posNr, typ, kostenart, artikelRef?, leistungRef?,
                      bezeichnung, langtext, menge, einheit,
                      materialEk, kalkMaterialProzent, rabattProzent, materialVk,
                      bauzeitMinuten, lohngruppeNr, kalkLohnProzent, lohnEk, lohnVk,
                      positionsSumme, eventual, festpreis, reihenfolge
AngebotsPositionKind  positionRef (Jumbo/Leistung children: same fields, printed inline or not)
```

## 7. Ablöse-Checkliste (vor der Powerbird-Kündigung klären)

| Powerbird-Funktion | Stand im eigenen System |
|---|---|
| Angebot → Auftrag → Rechnung | ✅ vorhanden |
| E-Rechnung (ZUGFeRD/XRechnung) | ✅ vorhanden |
| Mahnwesen | ✅ vorhanden |
| Zeiterfassung, Bautagebuch, mobil | ✅ vorhanden / besser |
| GAEB-Import | ✅ vorhanden — Tiefe prüfen |
| Kalkulation, Lohngruppen, Angebots-PDF | ⬜ **dieses Modul** |
| Leistungskatalog | ⬜ **K3** |
| Nachkalkulation je Position | ⬜ **K7** |
| DATEV-Export | ❌ fehlt — Master-Prompt F10.8 |
| Buchhaltung / offene Posten | ⚠️ teilweise — bewerten |
| Lohnabrechnung | ❌ nicht im System — externes Lohnbüro? klären |
| Bestellung beim Großhandel (UGL/IDS/OCI) | ⚠️ Bestellwesen ja, kein EDI |
| Aufmaß (REB/DA11) | ❌ nicht geplant — Bedarf klären |
| Kupfer-Tagespreise | ⬜ klein, in K5 mitgeführt |

## 8. Regeln & Verbote

- German UI throughout, trade vocabulary, no accounting jargon; **task-oriented navigation** — the users explicitly criticize Powerbird's module maze.
- Role visibility per Master-Prompt §9: EK, Kalk % and margin only for Admin/BL/PL; never for Monteur/Azubi/Sub.
- One PDF path (`DocumentBuilder`), one document chain, one number range.
- Free entry must never become slower than catalog entry.
- Every stage ships with the Master-Prompt's test bar (§5.3) and DoD (§13); migrations in the `V9xx__` range.
- Do not build: GAEB learning wizard, REB-DA11 exchange, Aufmaßblätter per Raum/Stromkreis, live wholesaler EDI, top-down markup steering (v1). Raise it if genuinely needed — never build it silently.
