# ED-Elektro — Angebotskalkulation (eigenständiger Bau-Prompt)

> **Nutzung:** Companion zum Master-Prompt. Für Kalkulations-Sitzungen diesen Prompt zusätzlich laden (`Read Kalkulation-Prompt.md`). Gebaut wird **eine Stufe pro Sitzung**, K1 → K8, in dieser Reihenfolge. Die Regeln des Master-Prompts (§5 Repo-Regeln, §6 Fork-Regeln, §7 Arbeitsweise, §9 Rollen, §13 DoD) gelten unverändert weiter.

---

## 1. Auftrag

Build the **Angebotskalkulation** for ED-Elektro: the module with which the company writes its offers — search articles, enter quantities, enter technician labor per position, get a priced offer and a PDF.

**Decision by the owner: Powerbird (the current commercial software) is being retired.** This module is its replacement for offer creation and calculation, not a complement. It must therefore be complete enough that three project leads can write every offer of an 11-person Klima/Elektro/Sanitär business in it — comfortably, daily, without falling back to anything else.

The reference workflow is Powerbird's, because the team is trained on it — see `Powerbird-Analyse.md` in this folder for the researched pattern. Familiarity is a feature: a PL who knows Powerbird must recognize this screen.

## 2. Was im Code bereits existiert (verifiziert — nicht neu bauen)

- `domain/Leistung` (bezeichnung, beschreibung, einheit, **preis**, kategorie) and `domain/Artikel` with `LieferantenArtikelPreise` (per supplier + article number) — the catalog skeleton exists but is **empty for Klima/Elektro/Sanitär** (system originates from a Metallbau company).
- `Dokumenttyp` enum with `ANGEBOT`, `NACHTRAGSANGEBOT`, `AUFTRAGSBESTAETIGUNG`, `RECHNUNG`, `TEILRECHNUNG`, `ABSCHLAGSRECHNUNG`, `SCHLUSSRECHNUNG`, `STORNORECHNUNG`; `AusgangsGeschaeftsDokument`; `DocumentBuilder.tsx` (1150 lines) with live PDF preview, `{{LEISTUNGEN_TABELLE}}` placeholder, Formularwesen templates, ZUGFeRD/XRechnung via Mustang, digital offer approval via snapshot hash.
- `VerrechnungslohnService` + `VerrechnungslohnController` + DTOs + `SvSatzTyp`, ADMIN-only `POST /api/verrechnungslohn/uebernehmen` — the charge-out hourly rate calculator is largely built.
- `analysiereKategorie()`: linear regression over past projects giving **"Stunden pro Einheit" per Produktkategorie** — the source for labor-time suggestions (trained on Metallbau data; advisory until own trade data accumulates).
- GAEB import; Vor-/Nachkalkulation from four sources (times, material, articles, incoming invoices); `Anfrage` entity with documents/notes; Bestellwesen with supplier prices.
- **Absent, and therefore this module's job:** markup/Zuschlag engine, DATANORM import, Lohnarten, the calculation screen itself, Sollmengen handoff.

## 3. Bau-Stufen (eine pro Sitzung)

### K1 — Preisfindungs- und Zuschlags-Engine (backend only, no UI)
**Goal:** one deterministic service that answers "what is the VK of this article for this customer?" — no AI, ever.
- `Zuschlagsregel` entity + admin CRUD: level ENUM('ARTIKEL','WARENGRUPPE','EK_STAFFEL','STANDARD'), key, faktor, gueltigAb.
- Resolution order, strictly: article override → product group → EK-value tier → default. Then the optional customer-group factor (Privat/Gewerbe/Stammkunde) applied **multiplicatively on top**: `VK = EK × faktor × kundengruppenFaktor` (default 1.0).
- Seed rows: EK < 50 € → 1.45; 50–500 € → 1.25; > 500 € → 1.12; default 1.20. The company adjusts them in the admin UI.
- **EK selection:** when several supplier prices exist for an article, EK = lowest current price; the caller may pin a specific supplier. Always return *which* supplier price was used.
- Optional Rabattgruppen per supplier (volume/condition discounts on list price) if the DATANORM data carries them.
**Acceptance:** unit tests over every resolution level, tie-breaks, missing-price and zero-price cases; a price is reproducible and explainable (return the calculation path, not just the number).

### K2 — DATANORM-Import
**Goal:** the article master fills itself from the wholesalers.
- Import DATANORM v4/v5 (`DATANORM.001`, price/discount files) into `Artikel` + `LieferantenArtikelPreise`; support Preisänderungsdienst updates.
- Dedupe by supplier + article number; import log (file, date, counts, skipped/unknown record types); **idempotent** — the same file twice creates no duplicates.
- Tolerant parsing: unknown record types are logged, never fatal. Encoding: DATANORM is typically CP850/ISO-8859-1 — decode explicitly, do not assume UTF-8.
- Admin import UI with dry-run preview (how many new / changed / unchanged).
**Acceptance:** golden-file test with a real wholesaler file, run twice → identical state; umlauts correct; 10k+ articles import without timeout.

### K3 — Lohnarten & Stundensätze
**Goal:** labor gets a price.
- `Lohnart` entity (bezeichnung e.g. Meister/Geselle/Azubi/Monteur, stundensatz, aktiv, standard) + admin CRUD (Admin/BL only per §9).
- Wire the existing `VerrechnungslohnService` as the source for the rates: its computed charge-out rate pre-fills a Lohnart's Stundensatz; the rate can be overridden manually.
- Document-level default Lohnart; per-position override.
**Acceptance:** changing a Lohnart's rate does not retroactively change stored calculations (rates are copied into the position at entry, not referenced live).

### K4 — Leistungskatalog mit Lohnminuten
**Goal:** the catalog that makes calculating fast — this is the module's real substance.
- Extend `Leistung`: `arbeitszeitMinuten`, `lohnartRef`, plus embedded articles (`LeistungArtikel`: leistungRef, artikelRef, menge) so a Leistung = material + time in one catalog entry. Keep the existing `preis` field working for legacy free-price services.
- Nesting one level (Leistung containing Leistungen) — enough for practice, do not build arbitrary recursion.
- **Import paths (data, not code — plan them here):**
  - KFE/ZVEH Kalkulationshilfe for Elektro (14 000+ positions with normed texts, Arbeitszeitwerte in Lohnminuten, material lists; delivered via ZVEH/Datanorm formats)
  - TGP / SIRADOS Arbeitswerte for SHK
  - the company's own service catalog exported from the outgoing Powerbird installation via **GAEB** into the existing GAEB import
- Catalog UI: search, categorize by Gewerk (Klima/Elektro/Sanitär), duplicate-and-edit, mark favorites.
**Acceptance:** a Leistung "Steckdose UP setzen" yields material + minutes and prices itself through K1+K3 without manual entry; import of a KFE/GAEB sample file works.

### K5 — Die Kalkulationsmaske
**Goal:** the screen the project leads live in. New desktop page `AngebotskalkulationEditor.tsx`.
- **Hierarchical Titel/Gruppen tree** (multi-level), positions inside titles, drag to reorder, collapse/expand.
- **Position types in one tree:** `ARTIKEL` (from article master), `LEISTUNG` (material + Lohnminuten), `JUMBO`/set (prints as ONE line with ONE price, contained articles tracked internally for purchasing and Nachkalkulation), `TEXT` (Textbausteine), `ZUSCHLAG` (percentage on referenced positions). Flags `alternativ` / `eventual` — excluded from the document total, printed separately.
- **Per position:** quantity + unit, labor minutes (pre-filled from `analysiereKategorie()` where the category has history — always overridable), Lohnart, chosen supplier, discount, note.
- **Live calculation** — see §4 for the exact formula. Collapsible **"Preisdetails"** per position showing the full path (EK, supplier, factor level applied, labor rate, sums).
- **Preisspiegel:** for the selected article, show all imported supplier prices side by side with the cheapest highlighted; one click switches the position's supplier.
- **Totals bar** (sticky): material, labor, sum, margin — margin only for roles permitted by §9.
- **Speed features (these decide whether it gets used):** article quick-search with keyboard-only flow, copy positions/titles from previous calculations, duplicate position, multi-select delete, Dokumentrabatt, undo.
**Acceptance:** a PL assembles a 10-position offer without typing a single price by hand; keyboard-only entry of a position takes < 15 seconds; changing a position's minutes updates all totals live; margin column invisible for roles that must not see it.

### K6 — Angebots-PDF
**Goal:** the finished offer document — through the existing stack, never a second PDF path.
- Generate the `ANGEBOT` document from the calculation via `DocumentBuilder` / `{{LEISTUNGEN_TABELLE}}` / the Formularwesen templates, attached to the Anfrage.
- Print variants: with/without unit prices, Jumbo as one line, alternative positions in a separate block, Titel subtotals, optional Zahlungsbedingungen/Textbausteine.
- Reuse the existing e-mail dispatch and the digital approval (snapshot hash) — the customer accepts the offer as before.
**Acceptance:** the PDF's position texts and totals match the calculation exactly; a Jumbo shows one line and one price; regenerating produces a byte-identical document unless the calculation changed.

### K7 — Sollmengen & Nachkalkulation
**Goal:** close the loop that makes every future offer better.
- On offer acceptance, the calculation's positions become the project's **Soll values** (quantities and labor minutes per position).
- Feed the existing Vor-/Nachkalkulation: compare Soll vs. Ist (booked times, consumed material, incoming invoices) **per position**, not just per project.
- Deviation view: which positions were systematically under-estimated, per Produktkategorie and Gewerk — this is what improves `analysiereKategorie()` suggestions over time.
**Acceptance:** a finished project shows estimated vs. actual minutes per position; the deviation report is filterable by trade and period.

### K8 — Migration & Umstieg
**Goal:** get off Powerbird without losing history or writing anything twice.
- Import the company's catalog from Powerbird via GAEB export → existing GAEB import (verify what the Powerbird licence exports before building anything).
- Import/attach historical offers as PDF for reference and as RAG source for later AI drafting.
- **Own number range** for offer numbers, chosen so it can never collide with the numbers Powerbird already issued (e.g. new prefix or a high offset) — old numbers stay readable in the archive.
- **Cutover by new business:** from the cutover date every new Anfrage is calculated here; offers already running in Powerbird finish there. No offer is ever maintained in both systems.
- **Validation before cutover (time-boxed):** re-calculate 5–10 real past Powerbird offers in the new screen and compare totals to the cent. Every deviation is an engine defect to fix — not rounding. When two consecutive offers match exactly, validation ends and Powerbird is no longer used for new offers.
**Acceptance:** the validation protocol (offer, Powerbird total, own total, deviation, cause) exists in writing; the cutover date is recorded; no duplicate number is possible.

## 4. Rechenregeln (verbindlich, deterministisch, niemals KI)

Per position:
```
Material-EK      = supplier price (lowest current, or pinned supplier)
Material-VK/unit = EK × Zuschlagsfaktor (K1 resolution) × Kundengruppenfaktor
Materialsumme    = Menge × Material-VK/unit − Positionsrabatt
Lohnsumme        = (Lohnminuten × Menge ÷ 60) × Stundensatz(Lohnart)
Positionssumme   = Materialsumme + Lohnsumme
```
- **Jumbo:** sum of its children; printed as one line, stored with children intact.
- **Zuschlagsposition:** percentage on the referenced positions/title.
- **Document:** Σ positions (excluding `alternativ`/`eventual`) − Dokumentrabatt = net; + VAT = gross.
- **Rounding:** calculate with `BigDecimal`, round only for display and at document total (2 decimals, HALF_UP). Never round intermediate results.
- **Stored, not referenced:** the applied factor, the used supplier price and the labor rate are copied into the position at entry. Later master-data changes never alter a stored calculation.
- **Cross-check against the trade's Zuschlagskalkulation** (what the Meister learned: MEK + MGK → Fertigungslöhne + FGK → Herstellkosten + VwGK/VtGK → Selbstkosten + Gewinn): the K1 factors are the compressed form of that schema. Provide an overhead/profit breakdown in the totals view so the numbers can be reconciled with the chamber's schema.

## 5. Ablöse-Checkliste — was Powerbird sonst noch macht

Before Powerbird can actually be cancelled, each line must have an answer. Bring this list to the owner; it is not this module's job to solve them all, but nobody may be surprised on switch-off day.

| Powerbird function | Status in ED-Elektro |
|---|---|
| Angebot → Auftrag → Rechnung chain | ✅ exists upstream |
| E-Rechnung (ZUGFeRD/XRechnung) | ✅ exists (Mustang) |
| Mahnwesen | ✅ exists (`/api/mahnwesen/lauf`) |
| Zeiterfassung, Bautagebuch, mobile | ✅ exists / better in own system |
| GAEB-Ausschreibungen lesen | ✅ import exists — verify depth |
| Artikel-/Leistungskataloge | ⬜ **this module (K2, K4)** |
| Kalkulation & Angebots-PDF | ⬜ **this module (K1, K3, K5, K6)** |
| Nachkalkulation je Position | ⬜ **this module (K7)** |
| DATEV-Export für den Steuerberater | ❌ missing — Master-Prompt F10.8 |
| Buchhaltung / offene Posten | ⚠️ partly upstream (Kasse/Buchhaltung, offene Posten) — assess |
| Lohnabrechnung | ❌ not in system — clarify: external payroll office? |
| Bestellung beim Großhandel (UGL/IDS) | ⚠️ Bestellwesen exists, no EDI — IDS stays stubbed |
| Aufmaß (REB/DA11) | ❌ not planned — clarify whether needed for VOB jobs |
| Revisionssichere Archivierung | ✅ GoBD pattern exists upstream |

## 6. Regeln & Verbote

- **Never an LLM in the price path.** Suggestions for texts or position selection may be AI-assisted later; every number comes from K1/K3. A model-generated price is a defect.
- German UI throughout, trade vocabulary, no accounting jargon.
- Role visibility per Master-Prompt §9: EK, margin and overhead only for Admin/BL/PL; never for Monteur/Azubi/Sub.
- One PDF path (`DocumentBuilder`), one document chain, one number range.
- Every stage ships with the Master-Prompt's test bar (§5.3) and Definition of Done (§13); migrations in the `V9xx__` range.
- Do not build Powerbird's heavy machinery: GAEB learning wizard, REB-DA11 exchange, Aufmaßblätter per Raum/Stromkreis, Misch-Kalkulationsblätter, live wholesaler EDI. If one of them turns out to be genuinely needed, raise it — do not build it silently.
