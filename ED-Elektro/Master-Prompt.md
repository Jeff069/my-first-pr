# ED-Elektro — Master Implementation Prompt (v2, exhaustive edition)

> **How to use this prompt:** Save this file in the root of your ED-Elektro clone (or paste it as project instructions for your coding agent, e.g. into `CLAUDE.local.md`). Start a session and say: *"Read the master prompt. Implement Feature F1."* Work through the features strictly in order, **one feature per session and per branch**. Never ask the agent to implement more than one feature at a time. Feature specs contain data-model and API **sketches** — they show intent and conventions; where the real codebase suggests a better-fitting shape, follow the codebase and say so in your plan.

---

# PART I — CONTEXT & GROUND TRUTH

## 1. Mission

You are an expert full-stack developer (Java 23 / Spring Boot 3.2.5, React + TypeScript, MariaDB/MySQL) working on **ED-Elektro** — a privately maintained fork of the open-source ERP "Handwerkerprogramm" (upstream: `Winfo2024Kuhn/ERP-System-fuer-Handwerksbetriebe`, AGPL v3). You extend it for a small German family craft business, and you work carefully: this system will run the company's daily operations — offers, invoices, dispatch, payroll preparation, legally required protocols.

The person instructing you is a **project lead at the company and a part-time developer**. Explain what you are doing in plain language, propose before you build when a decision is ambiguous, and keep every change small and reviewable. You are building for real colleagues, not for a demo: a Monteur on a ladder with gloves, a finance person who hates typing, an apprentice who hates paperwork.

## 2. The company (drives every product decision)

- German family business, three trades: **HVAC/air-conditioning (Klima), electrical (Elektro), plumbing (Sanitär/SHK)**. Customers: private households and small commercial clients, regional.
- Team of 11 + occasional subcontractors:

| Person(s) | Role | Daily reality the software must serve |
|---|---|---|
| 1× Geschäftsführer (GF) | managing director | Wants overview without clicking through software: weekly plain-language numbers, who owes us money, which project is bleeding margin. Decides pricing, hiring, and who may see what. |
| 1× Finanz & Controlling (F&C) | finance | Writes/checks invoices, chases payments, prepares payroll for the external payroll office, feeds the tax advisor. Biggest time sinks: typing supplier invoices, checking wholesaler conditions, missing cash-discount deadlines. |
| 1× Bereichsleiter (BL) | division lead | Allocates capacity, answers "when can we?", handles escalations, approves things. Needs problems to come to him instead of searching for them. |
| 3× Projektleiter (PL) | project leads | Site visits, offers (typed in the evening — the pain point), ordering material, coordinating technicians, change orders, acceptance, triggering invoices. One of them is the developer of this fork. |
| 4× Monteure | technicians | On site all day. Document badly not from unwillingness but because typing with gloves on a ladder is impossible. Need: today's jobs, navigation, photos, protocols, signature, voice instead of keyboard. |
| 1× Azubi | apprentice | Works alongside technicians; must keep a weekly IHK/HWK training report (Berichtsheft) — universally hated paperwork the system's data can largely write for him. |
| Subcontractors (Subs) | external | Sometimes brought in per project. Legally sensitive: without a valid §48b EStG Freistellungsbescheinigung the company must withhold 15 % Bauabzugsteuer and is liable for mistakes. Access must be minimal and expiring. |

- **All user-facing UI text, PDFs, and emails are in German.** Keep the language simple for craftspeople — the upstream docs explicitly forbid SAP-style accounting jargon ("Keine kryptischen buchhalterischen Begriffe wie in SAP").
- Seasonality matters: Klima peaks in summer (plus emergency calls when ACs die in a heat wave), heating work peaks before winter, water-damage emergencies (Havarie) happen year-round. The dispatch design reserves capacity for that.

## 3. German ↔ English domain glossary (use the German terms in code and UI, as the codebase does)

| German (codebase/UI) | English | Notes |
|---|---|---|
| Angebot | offer/quote | has `betrag`; lifecycle flag `abgeschlossen` |
| Anfrage | inquiry/lead | new entity (F4) |
| Auftrag / Auftragsbestätigung | order / order confirmation | document type |
| Rechnung / Abschlagsrechnung / Schlussrechnung | invoice / progress invoice / final invoice | GoBD-locked once booked |
| Mahnung | dunning letter | existing document type |
| Nachtrag | change order | out-of-scope work found on site (F9e) |
| Aufmaß | site survey / measurement | dictated in F9c |
| Bautagebuch | site diary | exists; photos + timestamps |
| Plantafel / Einsatz | dispatch board / job assignment | F10 / minimal version in F2 |
| Berichtsheft / Ausbildungsnachweis | apprentice training report | F1; IHK/HWK requirement |
| Wartung / Wartungsvertrag / Anlage | maintenance / maintenance contract / installed asset | F8 |
| Havarie | emergency breakdown | reserved dispatch slot |
| Skonto | cash discount | early-payment discount on supplier invoices |
| EK / VK | purchase price / sales price | Einkaufspreis / Verkaufspreis |
| Zuschlag | markup | F7 rule engine |
| Verrechnungslohn / Stundenverrechnungssatz | charge-out hourly rate | half-built calculator in upstream docs |
| Lieferant / Lieferantenpreise | supplier / supplier prices | live in Bestellwesen |
| Bestellwesen / Bestellung / Lieferschein | purchasing / purchase order / delivery note | exists |
| Eingangsrechnung | incoming (supplier) invoice | AI-analyzed via `/analyze-upload` |
| Offene Posten | open items / receivables | endpoint exists |
| Zeiterfassung / stempeln | time tracking / clock in-out | PWA core |
| Monteur / Geselle / Azubi | technician / journeyman / apprentice | |
| Gewerk | trade | Klima / Elektro / Sanitär |
| Freistellungsbescheinigung (§48b EStG) | exemption certificate from construction withholding tax | Sub requirement |
| Kälteschein (Kat. I) | refrigerant handling certificate | legally required for refrigerant work |
| GoBD | German bookkeeping compliance rules | immutability of booked records |
| DATANORM | German wholesale article/price exchange format | F7 import |
| IDS-Connect | wholesale shop deep-link interface | F7 stub |
| DSGVO | GDPR | |

## 4. The codebase you are working in (research findings — items flagged below need in-code verification)

### 4.1 Stack

Java 23, Spring Boot 3.2.5, Flyway, MariaDB 11 (one doc says MySQL 8 — **check the datasource config**), React + TypeScript + Vite on both frontends (docs say React 18; `package.json` pins React 19.x — **trust `package.json`**), Tailwind 3.4 on `react-pc-frontend/` (desktop), Tailwind 4 via Vite plugin on `react-zeiterfassung/` (mobile PWA). Google Gemini API (`gemini-flash-latest`, key in properties), optional Qdrant RAG behind `ai.rag.enabled`. Desktop frontend additionally ships Tiptap (rich text), Chart.js, `@dnd-kit` (drag & drop — relevant for the F10 Plantafel), DOMPurify. The PWA ships `html5-qrcode` + `jscanify` (scanning), `jspdf`, `idb` (IndexedDB) — reuse these for QR and document features instead of adding new libraries.

### 4.2 Backend architecture

Root package `org.example.kalkulationsprogramm`, strict layering **Controller → Service → Repository → Domain**. Sub-packages: `controller/` (plus `controller/advice/RestExceptionHandler` — hook new exception types there, no per-controller try/catch), `service/`, `repository/` (sub-package per larger sub-domain, e.g. `repository/miete/`), `domain/` (JPA entities; `domain/converter/` for attribute converters), `dto/{Module}/`, `mapper/`, `config/`. Email code lives separately in `org.example.email` (`EmailService`, `ImapAppendService`). Rules: **never expose JPA entities through the API — always DTO + Mapper**; business logic never in controllers; constructor injection only (Lombok `@AllArgsConstructor` allowed); parameterized `@Query` only, no string concatenation.

### 4.3 REST conventions (imitate exactly)

German plural resources under `/api/…` (`/api/angebote`, `/api/projekte`, `/api/kunden`, `/api/lieferanten`, `/api/rechnungen`, `/api/bestellungen`, `/api/offene-posten`, `/api/mitarbeiter`, `/api/abwesenheit`, `/api/urlaubsantraege`, nested sub-domains like `/api/miete/mietobjekte`), `{Domain}Controller` naming, GET collection at base path, GET/PUT/DELETE `/{id}`, nested lookups like `/projekt/{projektId}`, German action verbs as POST endpoints (`/buchen`, `/storno`, `/stempeln`), change/deletion reasons as query params (`?begruendung=…`). Filters like `Jahr`/`Monat`/`Suche` as query params. Backend port: docs disagree (8080 vs 8082) — **check `application.properties`**.

### 4.4 What already exists (do NOT rebuild — extend or reuse)

- **Documents & invoicing:** block-based offer/invoice editor with live PDF preview; seven document types (Angebot … Storno, incl. Mahnung); template-based `DokumentGeneratorController` (`/api/dokument-generator`: POST `/pdf`, `/preview`, `/zugferd-pdf`) with placeholders (`{{DOKUMENTNUMMER}}`, `{{KUNDENNAME}}`, `{{LEISTUNGEN_TABELLE}}`); ZUGFeRD 2.0/Factur-X/XRechnung via Mustang (`ZugferdErstellService` / `ZugferdExtractorService` / `ZugferdConverterService`); GAEB import; digital offer approval via snapshot hash; offer lifecycle: acceptance sets `abgeschlossen` and creates a Projekt, re-assigning the offer's `AusgangsGeschaeftsDokumente` to it; document chains with predecessor/successor links (Angebot→Auftrag→Rechnung).
- **GoBD:** booked invoices lock (only `/storno`); audit via immutable snapshot entities (e.g. `ZeitbuchungAudit`). Consult `docs/GOBD_COMPLIANCE.md` and `docs/DOKUMENTEN_LIFECYCLE.md` before touching any document lifecycle.
- **Purchasing:** four-stage chain (Anfrage → Bestellung → Eingangsrechnung → Zuordnung); supplier article prices (Lieferantenpreise) managed in Bestellwesen; kilogram-based material calculations; invoice split across projects/cost centers.
- **AI (Gemini):** `GeminiDokumentAnalyseService` (document analysis pattern to copy); incoming-invoice recognition: ZUGFeRD-XML parse → AI-OCR fallback (`POST /analyze-upload`, `/import-upload`); supplier auto-assignment; `POST /zugferd/extract-ai`; email `POST /beautify`; AI chat `KiHilfeController` (`/api/ki-hilfe`) with RAG (`QdrantRagService`, docker-compose Qdrant, `ai.rag.enabled`); Naive-Bayes spam filter (40 % rules + 60 % Bayes) on the lead pipeline; Ollama listed as optional local AI.
- **Email:** IMAP import every 60 s, attachment analysis, auto-assignment to customers/suppliers/projects/orders.
- **Lead pipeline:** website → spam filter → customer dedupe → confirmation email → web-push to responsible employees (this is the feed for the F4 inquiry board).
- **Time tracking & PWA:** offline-first (IndexedDB write queue, chronological replay on reconnect — 4xx discarded, 5xx retried; active session in localStorage; user identified by a plain `token`); endpoints `/api/zeiterfassung` (`/stempeln` or `/start`,`/stop`,`/pause` — docs show both, verify in code; plus `/aktiv`, `/buchungen`), `/api/zeitverwaltung` (per-employee month/balances, team month), `/api/zeitkonto-korrektur`; logs work per Projekt/Produktkategorie/Arbeitsgang; Soll/Ist balances, overtime, Bavarian public holidays; vacation requests with approval workflow; site diary with photos; delivery-note scan with perspective correction; complaints (Reklamationen); team calendar.
- **Calculation & controlling:** real-time pre/post calculation from four sources (times, material, articles, incoming invoices); hierarchical product categories ("Dach > Flachdach") with units; `analysiereKategorie()` computes "Stunden pro Einheit" via linear regression over past projects (trained on the previous owner's **Metallbau** data — treat its outputs as advisory for your trades until ~a year of own data exists); controlling dashboard (profit, revenue, material/labor costs, offer conversion, top-10 customers, regional heatmap); `MonatsSaldo` cache pattern (Flyway cache table V204-style + `MonatsSaldoWarmupService` at startup) — copy this pattern for any expensive aggregation.
- **Misc:** form designer (Canva-like WYSIWYG, 12 element types, multi-page templates — candidate base for F6 protocol forms); CAD/Excel network-storage integration (`openfile://` protocol); rental management module (not your business — leave untouched).

### 4.5 Critical gaps the research confirmed

- **No real authentication.** Upstream issue #72 (labels: backend, frontend, size L): the mobile chain runs without authentication; only a department-based access scheme exists (`AbteilungBerechtigungController`, `/api/abteilungen` — e.g. Abt. 2 Buchhaltung sees only approved documents, Abt. 3 Büro has approval rights). No Spring Security/JWT documented. This is why F3 exists and why the SECURITY GATE below is absolute.
- **No price/markup engine.** An `Angebot` carries a single `betrag`; no documented EK/VK markup logic anywhere. The natural insertion point for F7 is between Bestellwesen's Lieferantenpreise and the offer positions / `{{LEISTUNGEN_TABELLE}}` rendering.
- **No DATANORM import.**
- **No dispatch/assignment mechanism** (who works where on which day) — F2 introduces a minimal one, F10 the full Plantafel.
- A **Verrechnungslohn calculator** is planned in `docs/PLAN_VERRECHNUNGSLOHN_RECHNER.md` — phase 1 (backend basics) done, phases 2–3 (service + interactive margin dialog) open. F7 finishes it.
- The system's **origin is a Metallbau company** (HiCAD/Tenado integration, kg-based profile calculations). Master data, categories, and the regression model reflect that trade — your Klima/Elektro/Sanitär master data must be built up via F7 (DATANORM) and F8 (assets).

### 4.6 Verify in code before relying on it (docs conflict)

| Question | Docs say | Action |
|---|---|---|
| DB engine | MariaDB 11 (README) vs MySQL 8 (BUSINESS_CASES) | read datasource config |
| Max Flyway version | "63" vs "207+" | list `src/main/resources/db/migration/` |
| Backend port | 8080 vs 8082 | read `application.properties` |
| Time-tracking endpoints | `/stempeln` vs `/start`,`/stop`,`/pause` | read the Zeiterfassung controller |
| DATEV export | not mentioned | search code before building payroll exports (F10) |
| Abschlags-/Schlussrechnung cumulative accounting | produced, depth unknown | read invoice services before F10 billing-adjacent work |
| Spring Security on classpath | not documented | check `pom.xml` before F3 design |

## 5. Repo-native rules — the fork ships its own AI-development machinery. Obey it.

1. **Read `.claude/CLAUDE.md` at session start.** The repo enforces a **doc-read hook** (PowerShell, `.claude/hooks/check-doc-read.ps1`): before editing `*.java` read `docs/agent instructions/docs/BACKEND_ARCH.md` (locate by filename if the path differs); before frontend files read `FRONTEND_UI.md` **and** invoke one of the design skills shipped in `.claude/skills/`; before test files read `TESTING_SECURITY.md`. Repo commands exist for common flows: `.claude/commands/{feature,bugfix,new-page,pre-merge,review-and-ship,security-audit,sync-docs}.md`.
2. **Graphify-first research:** query the code graph (`graphify query/path/explain`, `graphify-out/wiki`, `GRAPH_REPORT.md`) before falling back to grep/glob; run `graphify update .` after code changes.
3. **Testing bar (mandatory):** JUnit 5 + Mockito service tests (≥80 % coverage), `@WebMvcTest` + MockMvc for every new endpoint (happy path AND error cases), `@DataJpaTest`/H2 for repositories, colocated Vitest `*.test.tsx` for frontend, 100 % on utilities. Coverage measured with the build's existing tooling (check the POM for JaCoCo; if absent, report it — do not add build plugins unasked). **Per-endpoint security checklist:** SQL injection (`'; DROP TABLE x; --`), XSS (`<script>alert(1)</script>`), invalid IDs (negative, zero, `Long.MAX_VALUE`), input limits (required fields, reject >10 000 chars), file-op safety (path traversal `../../etc/passwd`, block `.exe/.bat/.js` uploads).
4. **Frontend design system:** rose/slate palette, primary `#dc2626` ("rose-600"); primary buttons `bg-rose-600 text-white border border-rose-600 hover:bg-rose-700`, secondary `border-rose-300 text-rose-700 hover:bg-rose-50`; default `size="sm"`; Lucide icons `w-4 h-4` left of text; mandatory page-header pattern (uppercase rose category label, 3xl bold title, description, actions right); flat `pages/` with German PascalCase names (`{Entity}Editor.tsx` on desktop, `{Name}Page.tsx` in the PWA). **Reuse shipped components** (`select-custom.tsx`, `datepicker.tsx`, `image-viewer.tsx`, `DetailLayout`, `EmailHistory`, `DocumentPreviewModal`, `GoogleMapsEmbed`) before building new ones. Run `npm run build` after every frontend change (fail-fast). Never `dangerouslySetInnerHTML` without `EmailHtmlSanitizer`; always `encodeURIComponent()` URL params.
5. **Secrets & GDPR:** config only in gitignored `application-local.properties`; commit blocklist `*.env`, `uploads/`, `*.key/pem/p12`; check `git diff --staged` before every commit; rotate leaked keys immediately. Employee/time/customer data is personal data — tests use only dummy data ("Max Mustermann"); anonymize logs and dumps.
6. **Strategic Refactoring Rule:** when reuse opportunities emerge, pause and ask before extracting shared components/hooks/services.
7. Finish every code change with the repo's **`review-and-ship` flow** (`.claude/commands/review-and-ship.md` → `erp-code-reviewer` agent reviews quality, architecture, security, GDPR, secrets) and fix findings until green.
8. **Fallback clause:** if any of this machinery is missing in your clone (graphify, hooks, commands, skills), note it in your plan and substitute: grep/glob for graphify (skip `graphify update`), read the nearest docs you can find, and replace review-and-ship with a self-review against §13. **Do not block on absent tooling.**

## 6. Fork rules (ED-Elektro specific, non-negotiable)

1. **Additive, not invasive.** New features live in new services/controllers/entities/pages. Touch upstream files only when unavoidable and keep those diffs minimal — the fork must stay mergeable. Keep the original repo configured as the `upstream` git remote; your additive layout is what makes later upstream merges survivable. *(F3 is the one sanctioned exception: cross-cutting security changes may touch upstream files; keep them mechanical and isolated — filters/interceptors — to preserve mergeability.)*
2. **Own Flyway range `V9xx__`** (start `V900__`) so upstream's sequential versions never collide — verify the current upstream max version first; if upstream ever approaches V900, move the fork range to `V9000__`. Never edit an applied migration. "Idempotent" means safe to re-run against a wiped dev DB (`IF NOT EXISTS` guards) — versioned migrations still run once in Flyway's model. Java enums map to **native ENUM columns with exact uppercase values matching the Java constants** or startup validation fails. German snake-case descriptions (`V900__berichtsheft_tabellen.sql`). Demo/seed data goes in a dev-profile-only mechanism (e.g. `CommandLineRunner` behind a profile), never in prod migrations.
3. **Never develop against real data.** Work against an anonymized dump in a dev database (`mysqldump` from prod → dev DB via docker-compose). Never write code that assumes it may freely mutate or delete production rows.
4. **Rules before AI (the Excel test).** If a task can be written down as an if-then rule or a formula — markup calculation, folder naming, dunning deadlines, SLA timers, appointment confirmations — it is implemented as plain deterministic code, never as an LLM call. AI is reserved for understanding text, images, audio, and fuzzy context.
5. **Prices never come from an AI model.** LLMs may propose positions, quantities, and wording; every price resolves from the article master / F7 rule engine at render time. A model-invented number in an offer is a defect, full stop.
6. **Human in the loop.** Every AI-generated artifact (offer draft, triage suggestion, report draft, transcribed note) lands in a review state; an explicit human action makes it real. Auto-send toward customers or any external party is forbidden. *(Sole exemption: internal scheduled reports to internal recipients — e.g. the F9b Monday report — may send automatically but must be clearly marked as AI-generated.)*
7. **Log every automation** (who/what/when/input-ref/output-ref). Automations that touch files or send messages must be traceable a year later.
8. **Permissions enforced server-side** on every endpoint per §9 — **from F3 onward**. F1/F2 ship without new access control: do NOT build interim auth and do NOT wire into the legacy Abteilung scheme; mark every F1/F2 endpoint with a `// TODO(F3): enforce roles` annotation so F3's retrofit finds them. The LAN-only SECURITY GATE (§10) is the compensating control until then. UI hiding is never sufficient once F3 exists.
9. **GoBD stays intact:** no code path mutates a booked invoice; corrections go through the existing `/storno` flows; follow the snapshot-audit house pattern for anything financially or legally relevant.
10. **AGPL v3:** internal use is unrestricted, but as soon as external users (e.g. subcontractor logins in F3/F10) access the system over the network, the fork's source code must be offerable on request — keep the fork in a publishable state at all times (no embedded secrets, no customer data in the repo).

## 7. Working method (every feature, same session protocol)

1. **Start:** read the upstream docs closest to the feature (plus the §5 mandatory docs); query graphify for the involved domains.
2. **Locate the nearest existing pattern** (similar entity/service/controller/page) and mirror its structure and naming.
3. **Present a short plan:** entities + migration, endpoints, UI pages, role rules, test approach, and what you will NOT do. Proceed unless something is genuinely ambiguous; the specs below pre-answer the known ambiguities.
4. **Build backend first** (entity → migration → repository → service → controller → tests), then frontend, then role checks (from F3 onward), then dev-profile seed data.
5. **Prove it works:** unit tests for every rule/calculation; `@WebMvcTest` per endpoint; plus a short German manual-test script for the project lead ("Klicke hier, erwarte das").
6. **One feature = one branch = one reviewable changeset.** German commit messages, imperative, feature ID prefix (`F4: Anfragen-Board Grundgerüst`).
7. **Runtime resources:** the project lead provides `application-local.properties` (incl. the paid Gemini key) and the anonymized dump out-of-band. If either is absent, implement against mocks, make the AI-disabled degradation path your executable proof, and hand timed acceptance checks to the manual-test script.
8. **End:** `npm run build` on touched frontends, full backend test run, review-and-ship (or §5.8 fallback), commit.

## 8. Boss-demo milestone

Before any of this is pitched to the GF, two things must be true:

1. **The no-code 30-offers analysis has been run.** Export the last 30 offers as PDF, pseudonymize customer names, feed them to an AI chat, and ask exactly: (a) Are our hourly rates consistent across offers? (b) Which positions do we regularly forget (Anfahrt, Entsorgung, Kleinmaterial, Gerüst, Kernbohrung)? (c) Which wording is unclear or legally shaky? (d) How do the three trades differ in offer quality? Bring the results as a handout — AI value demonstrated with zero code.
2. **F1 (Berichtsheft) and F9a (calculation check) are the two live-demo features** — both instantly understandable to a non-technical GF ("the AI noticed the Anfahrt is missing" / "the apprentice's report writes itself").

The demo also pitches the §9 permission decision that needs the GF's blessing: PLs see EK prices and project margins (with the calculated-hourly-rate trick hiding real wages). Recommendation to present: open it — a PL who cannot see margin cannot steer, and the F9a check would have no audience.

---

# PART II — PRODUCT MODEL

## 9. Role & permission model (target state)

Six fixed role templates — **role templates, not per-user custom ACLs**; with 11 people, a free-form rights matrix becomes an unmaintainable thicket. GF and F&C (Admin) assign roles themselves via the F3 admin UI.

| Capability | Admin (GF, F&C) | BL | PL | Monteur | Azubi | Sub |
|---|---|---|---|---|---|---|
| Assign roles / manage users / deputies | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wages / payroll data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company-wide financial reports (revenue, receivables, liquidity, PL comparison) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EK + VK prices, project margin & post-calculation | ✅ | ✅ | ✅ all projects¹ | ❌ | ❌ | ❌ |
| Markup rules (F7 admin UI) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Inquiry board: assign | ✅ | ✅ | ❌ (receive/accept only) | ❌ | ❌ | ❌ |
| Offer/project editing | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Project execution data (site diary, times, photos, protocols) | ✅ | ✅ | ✅ | own jobs | own jobs | own jobs only |
| Customer contact history | ✅ | ✅ | ✅ | job-relevant only | job-relevant only | ❌ |
| Berichtsheft (F1) | ✅ | sign-off | ❌ | ❌ | own (create/edit) | ❌ |
| Maintenance module (F8) | ✅ | ✅ | ✅ | execute assigned services | execute assigned | ❌ |
| Dispatch board (F10) | ✅ | ✅ | ✅ (read + propose) | own row read | own row read | own row read |
| Dunning / Skonto / 3-way match / payroll export (F10) | ✅ | read | ❌ | ❌ | ❌ | ❌ |
| PWA (time tracking, My Day, forms) | ✅ | ✅ | ✅ | ✅ | ✅ | restricted (own jobs, expiring account) |

¹ PL sees margin on **all** projects (not just their own) because the three PLs cover for each other during vacation/sickness; post-calculation labor costs are always shown as the **calculated hourly rate (Verrechnungssatz), never real individual wages** — that is the trick that makes margin transparency possible in a small family business without exposing what colleagues earn.

**Additional rules:**
- **Deputy mechanism** for vacation coverage — configurable per user, time-boxed, incl. invoice approval when F&C is absent. With 11 people, every function is a single point of failure.
- Every permission change is itself audit-logged (F5 feed).
- Subcontractor accounts always carry an **expiry date**; they see no prices, no customer history, only their own projects, and their PWA is restricted.
- Monteure and Azubis never see any price anywhere — enforced at the serializer/DTO level (price-free DTO variants), not by hiding UI columns.

## 10. SECURITY GATE (absolute until F3 ships)

Until F3 is complete, the system must not be reachable beyond the trusted LAN/VPN — **no Cloudflare tunnel, no port forwarding, no public exposure**. Upstream issue #72 confirms the mobile chain is currently unauthenticated; anyone reaching the API can read and write. Tailscale/VPN for remote access is acceptable in the interim. This gate also blocks giving subcontractors any access before F3.

---

# PART III — FEATURE ROADMAP (implement strictly in this order)

Deliberate ordering decision: two low-risk warm-up features (F1, F2) come before the security core (F3) so the developer learns the codebase on additive work first; F2 may be swapped to after F3 if desired. F4–F10 assume F3 exists.

## F1 — Apprentice report-book generator (Berichtsheft)
*(first feature: additive; reads existing data, writes only its own new entities; demo feature #1)*

**Why:** Apprentices must keep weekly IHK/HWK training reports; everyone hates writing them. The data — where he was (Zeiterfassung), what was done (Bautagebuch) — already exists. Cheapest possible AI feature with the biggest sympathy effect, and a recruiting argument ("the modern apprenticeship in the region").

**Data model sketch:**
- `AzubiProfil` (mitarbeiterRef, ausbildungsberuf, ausbildungsbeginn, ausbilderRef, kammer ENUM('IHK','HWK')) — minimal apprentice metadata the report header needs; an ERP does not hold this today.
- `Berichtsheft` (id, azubiProfilRef, kalenderwoche, jahr, status ENUM('ENTWURF','ZUR_PRUEFUNG','SIGNIERT','ABGELEHNT'), version, vorgaengerRef, ablehnungsKommentar, signiertVon, signiertAm, pdfDokumentRef) — one row per week per version.
- `BerichtsheftTag` (berichtsheftRef, datum, taetigkeiten TEXT, stunden DECIMAL) — one row per day, editable.

**Behavior:**
- Week = ISO calendar week Mon–Sun; any past week selectable; a week with no entries still generates (empty days hand-editable — Berufsschule days are typed in manually in F1; school-day automation is explicitly out of scope).
- Generation: service collects the apprentice's time entries (Projekt/Produktkategorie/Arbeitsgang) + site-diary entries of jobs he was booked on that week; **one Gemini call** (reuse the `GeminiDokumentAnalyseService` plumbing) drafts German daily activity texts into `BerichtsheftTag` drafts — the apprentice edits before submitting.
- As part of F1, build the **shared AI foundations** in minimal form, reused by all later AI features: one `V9xx` AI-call log table (feature, model, tokens, duration, outcome) and per-feature config flags (kill switch + system prompt in config, German). The budget alarm is deferred to F9.
- Status flow: `ENTWURF → ZUR_PRUEFUNG → SIGNIERT` or `ABGELEHNT (→ ENTWURF, with mandatory trainer comment)` — rejection-with-comment is the single most common real-world Berichtsheft interaction; do not omit it. `SIGNIERT` is immutable; corrections create a new version referencing the old (snapshot house pattern).
- Sign-off = an explicit button click by the trainer (GF/BL), recorded as signer name + timestamp in the audit trail and rendered as a signature block (name, date) on the PDF. **No drawn or cryptographic signature in F1** — chambers accept simple electronic confirmation.
- Identity pre-F3: pass `mitarbeiterId` as an explicit request parameter; record the signer as a selected Mitarbeiter reference + timestamp; accept that this is honor-system until F3 and design DTOs so the parameter can later be replaced by the authenticated principal **without changing response shapes**.
- Target format: weekly Ausbildungsnachweis layout — confirm IHK vs. HWK with the project lead before rendering (a Handwerksbetrieb is normally **HWK**).
- UI: apprentice edit page in the **desktop frontend** (`BerichtsheftEditor.tsx`); trainer sign-off is an action on the same page. The PWA is out of scope for F1.
- PDF via the existing document-generator stack; store the signed PDF the way project documents are stored, keyed to the Mitarbeiter — if no employee-document pattern exists, add a minimal document reference on the report entity itself.

**API sketch:** `BerichtsheftController` at `/api/berichtshefte` — GET `?mitarbeiterId=&jahr=`, POST `/generieren` (week + mitarbeiterId), PUT `/{id}` (edit days), POST `/{id}/einreichen`, POST `/{id}/signieren`, POST `/{id}/ablehnen?kommentar=…`, GET `/{id}/pdf`. All marked `// TODO(F3): enforce roles`.

**Acceptance:** a week generates in <1 min; trainer sign-off locks the report; rejection returns it to draft with a comment; a new version supersedes a signed one without altering it; PDF archived; degrades to a raw activity list with AI disabled; `@WebMvcTest` covers happy + error paths for every endpoint.

## F2 — Technician PWA: "My Day" start screen

**Why:** A technician should open the PWA and see today's jobs — nothing else. Address, phone, material. Everything else is friction.

**Requirements:**
- **Assignment source pre-F10:** upstream has no dispatch mechanism — add a minimal manual assignment as part of F2, designed so the F10 Plantafel can reuse it unchanged: `Einsatz` (id, mitarbeiterRef, datum, zeitVon/zeitBis nullable, projektRef, notiz, reihenfolge, typ ENUM('NORMAL','HAVARIE')) + a simple admin list view (desktop) to create/edit assignments. F10 later replaces the admin UI, not the entity.
- `MeinTagPage.tsx` in the PWA (flat-pages convention, Tailwind 4): today's assignments ordered by `reihenfolge` — customer name, address (tap → navigation app), phone (tap → call), planned material list, job notes; pull-to-refresh; big-button UI (≥48 px targets, minimal text — gloves on a ladder).
- Offline via the existing IndexedDB pattern: cache on sync, render from cache when offline.
- API: `EinsatzController` at `/api/einsaetze` — GET `?mitarbeiterId=&datum=`, CRUD for the admin view. `// TODO(F3): enforce roles`.

**Acceptance:** loads in <2 s on mid-range Android; fully usable offline with last-synced data; an assignment created in the admin view appears on the technician's My Day after sync; Vitest tests colocated.

## F3 — Authentication + roles & permissions
*(expanded scope — closes upstream issue #72; the sanctioned exception to the additive rule)*

**Why:** There is no login. Nothing customer-facing, nothing external, no subcontractor access, no exposure beyond the LAN until this ships. Also the foundation for every "who did what" feature (F5) and every role rule (§9).

**Requirements:**
- **Token-based authentication** (short-lived JWT + refresh token; device-friendly for the offline PWA queue — queued writes replay with a refreshed token after reconnect) for desktop frontend, PWA, and all REST endpoints; replace the plain time-tracking `token` identity with the authenticated principal.
- Check `pom.xml` for Spring Security first; introduce it if absent. A `LoginPage.tsx` exists in the desktop frontend per research — verify what it actually does today before building.
- **Role model per §9:** role enum/entities, server-side enforcement on ALL endpoints (new and existing — sweep the `TODO(F3)` markers from F1/F2); method-level or filter-based checks; price-free DTO variants for Monteur/Azubi/Sub so prices never serialize for them.
- **Existing Abteilung scheme** (`/api/abteilungen`): read its code, then either map departments onto the six roles or cleanly supersede it — prefer mapping; document the decision in the plan.
- **Admin UI** (Admin only): user↔role assignment, deputy configuration (time-boxed), sub-account expiry date; migration assigning sensible default roles to existing users; every permission change audit-logged.
- Password handling for 11 users can be admin-driven (Admin sets initial/reset passwords) — no self-service email reset flow needed at this size.

**Acceptance:** automated role×endpoint test matrix (every §9 row exercised against representative endpoints); a Monteur account never receives a price field in any API response (serializer-level test, not just UI); PWA offline queue replays correctly after token refresh; expired Sub accounts are rejected with a clear German message.

## F4 — Inquiry board (Anfragen-Board)

**Why:** Inquiries arrive via website, email, and phone and today live in heads and inboxes. Untouched inquiries are the quietest way a craft business loses revenue. One inbox, explicit assignment, an SLA timer, and a mandatory loss reason turn "we should call back" into a managed pipeline.

**Data model sketch:** `Anfrage` (id, kanal ENUM('WEBSITE','EMAIL','TELEFON'), eingangsZeit, kundeRef nullable + free-text contact fields, gewerk ENUM('KLIMA','ELEKTRO','SANITAER','UNKLAR'), dringlichkeit ENUM, status ENUM('NEU','ZUGEWIESEN','BESICHTIGUNG','ANGEBOT','GEWONNEN','VERLOREN'), zugewiesenAn nullable, slaDeadline, verlustgrund ENUM('ZU_TEUER','KEINE_KAPAZITAET','ZU_SPAET','SONSTIGES') + verlustKommentar, angebotRef nullable).

**Requirements:**
- Feeds: existing website-lead pipeline (hook where leads are persisted), the 60-s email import (emails matching inquiry heuristics create an `Anfrage` in `NEU`), and a quick manual-entry form for phone calls.
- **AI triage on creation** (suggestion object, never auto-applied): detect trade, estimate urgency, extract customer data (name, address, phone, concern), suggest an assignee — applied only when BL/GF confirms. Customer dedupe against the existing base before creating duplicates (the lead pipeline already dedupes — reuse it).
- **Assignment is performed only by BL/GF (Admin); assignees are PL or BL; PL accept/decline — Monteure and Azubis are never assignees.**
- **SLA:** `@Scheduled` job — untouched 48 h → escalation notification to BL; visible SLA badge on cards (green/amber/red).
- Board UI (desktop): kanban columns per status, drag between columns where the transition is legal (illegal transitions rejected server-side); closing as `VERLOREN` requires the loss reason. Simple statistics view: won/lost per trade and per loss reason over time — after a year this answers *where* the company actually loses business (price? capacity? speed?).
- Wire the "won" transition to the existing offer lifecycle (Angebot `abgeschlossen` → Projekt creation): winning an Anfrage links it to its Angebot/Projekt chain.

**Acceptance:** an emailed inquiry appears on the board within one polling cycle; SLA escalation fires in a time-warped test; illegal status transitions rejected server-side; loss reasons aggregate per trade; AI triage suggestions are visibly marked and require confirmation.

## F5 — Audit history & activity feed

**Why:** The original requirement from the very first planning session: on projects, inquiries, and offers there must always be a history — who last touched it and what changed. Also carries permission-change logging (§9) and automation logging (§6.7).

**Requirements:**
- **Field-level change log** (who, when, entity, field, old → new). Follow the house pattern first (immutable snapshot/audit entities like `ZeitbuchungAudit`); evaluate Hibernate Envers only if the house pattern scales poorly — decide in the plan, not ad hoc. Append-only audit table with **no UPDATE/DELETE path in code**; no full entity versioning (change log + comments covers 95 % at a fraction of the cost).
- **Activity feed** per record combining change entries + manual comments; comments support **@mentions** (@mention → notification via the existing web-push/notification mechanism).
- History tab on project/inquiry/offer detail pages (desktop); newest first; filter by user.

**Acceptance:** an offer price edit shows a history row in the same request cycle; comments notify mentioned users; audit rows are immutable (no endpoint can alter them); permission changes from F3 appear in the feed.

## F6 — Technician PWA: signature, trade protocols, voice notes, material report

**Why:** Signed work reports end invoice disputes; trade-specific protocols are legally required; voice beats keyboard on a ladder; material shortages currently die in WhatsApp.

**Requirements:**
- **Customer signature:** canvas capture on work reports/acceptance (Abnahme); embed in the PDF; store on the project; record signer name + timestamp + device. A signature captured offline syncs with the queued entry.
- **Trade-specific protocol forms** — one per trade first, built on the existing form/document-generator stack, each rendering a clean German PDF:
  - **Klima:** refrigerant logbook entry + leak-test protocol — refrigerant type, quantity (kg), GWP, computed CO₂ equivalent, test method, result, next check due. The F-gas regulation mandates recurring leak checks; intervals derive from CO₂e thresholds (order of magnitude: ≥5 t → 12 months, ≥50 t → 6, ≥500 t → 3; halved with leak-detection systems — **verify the current EU 2024/573 thresholds before hard-coding**).
  - **Elektro:** measurement/test protocol (DIN VDE 0100-600 style fields: insulation resistance, loop impedance, RCD trip current/time, visual inspection checklist).
  - **Sanitär:** pressure-test / flush protocol (medium, test pressure, duration, result).
- **Voice notes:** build **ONE shared speech-to-structure service** (audio upload → Gemini transcription → validated structured JSON) as a reusable backend component — F6 voice notes, F9c dictated survey, and any future audio feature must all consume it; never build parallel one-off audio pipelines. PWA side: MediaRecorder capture → upload (queued offline) → structured draft entry (site diary / defect / material) in review state; the Monteur confirms or edits — a voice note never becomes a final record by itself.
- **Material shortage report:** "Fehlt: …" (voice or typed, with quantity) → auto-creates a purchase proposal for the responsible PL in Bestellwesen, linked to the project; PL sees new proposals on the desktop.

**Acceptance:** a complete job (photos + protocol + signature) can be documented fully offline and syncs later; each protocol renders as a clean German PDF via the document stack; a voice note becomes an editable draft, never a final record; the speech-to-structure service has its own tests with a mocked Gemini client.

## F7 — Calculation rules & DATANORM
*(greenfield — no markup engine exists upstream)*

**Why:** Wholesale prices in, correct sales prices out, deterministically. Today every offer position is typed and priced by hand. This encodes the explicit decision from the planning sessions: **the material markup is a rule, not an AI agent** — an LLM doing arithmetic on offers is slower, non-deterministic, and occasionally wrong.

**Requirements:**
- **DATANORM import** (v4/v5 files from the company's wholesalers): articles, EK prices, discount groups → into the supplier-price data Bestellwesen already manages. Dedupe by supplier + article number; import log (file, date, counts, skipped records); idempotent re-import (same file twice = no duplicates); tolerant of unknown record types (log, don't crash).
- **Markup rule engine** (pure code, no AI): `VK = EK × factor`, factor resolved in strict order — article override → product group → EK-value tier (Staffel: cheap articles get higher percentages) → default; optional customer-group factor (Privat/Gewerbe/Stammkunde). Seed the rule table with the discussed starting values (Kleinmaterial 40–50 %, Rohre/Kabel ~25 %, Großgeräte 10–15 %) — the company adjusts them in the admin UI (Admin/BL only, per §9).
- Offer editor and `{{LEISTUNGEN_TABELLE}}` rendering resolve prices **through the engine** — a catalog position lands in an offer with the correct VK and zero manual steps. Rule changes affect new pricing only; already-sent offers never silently reprice.
- **Labor pricing:** combine `analysiereKategorie()` hours-per-unit forecasts with configurable hourly rates. **Complete phases 2–3 of `docs/PLAN_VERRECHNUNGSLOHN_RECHNER.md`** (a `VerrechnungslohnService` computing the minimum billable hourly rate from payroll costs + overhead ÷ billable hours, retrospective and current-year modes, plus the interactive margin-slider dialog with one-click application) — this becomes the baseline the F9a check compares against. Treat regression forecasts as advisory until ~a year of own-trade time data exists (the training data is Metallbau).
- **IDS-Connect:** stub the interface (deep link to wholesaler shop, cart return) for later; do not implement the full round-trip now.

**Acceptance:** golden-file DATANORM import test is idempotent; markup unit tests cover every resolution level and tie-breaks; changing a rule re-prices new offers but never alters existing sent offers; the Verrechnungslohn dialog reproduces the plan doc's phase-2/3 spec; all price-bearing endpoints respect §9 visibility.

## F8 — Maintenance module & QR asset files

**Why:** The system's Metallbau origin means it has no maintenance concept — but for Klima, recurring leak checks are a legal duty, and maintenance contracts are planable recurring revenue that fills the winter trough. The asset file also makes the 22:00 Havarie call survivable: scan the sticker, see everything.

**Data model sketch:** `Anlage` (id, kundeRef, typ, hersteller, modell, seriennummer, einbauDatum, standortNotiz, kaeltemittelTyp nullable, fuellmengeKg nullable, gwp nullable, co2eTonnen computed, qrCode UUID, dokumente); `Wartungsvertrag` (id, kundeRef, anlagenRefs, intervallMonate, umfang TEXT, preis, aktiv, naechsteFaelligkeit).

**Requirements:**
- Asset registry per customer; documents/protocols/photos attach to the asset; F6 protocols link to the asset they were performed on.
- Contract scheduler (`@Scheduled`): generates due-service proposals into the dispatch pipeline; due-date derivation includes F-gas leak-check intervals computed from CO₂e where applicable; German reminder emails to customers (template + placeholders — transactional reminders, rule-based).
- **QR asset file:** per-asset QR sticker; a printable PDF sheet of QR labels (reuse the PDF stack); PWA scan (reuse `html5-qrcode`) opens the asset file: master data, history, protocols, documents, installed material, past jobs.
- Due-service list filterable by trade and region (PLZ) for tour planning.

**Acceptance:** a contract yields future due-dates; QR scan on a phone opens the asset in <3 s; an F6 leak-test protocol updates the asset's next-check date; the label sheet PDF prints correctly.

## F9 — AI assistants
*(build only after F1–F8 data exists; reuse the Gemini plumbing, the F1 AI-call log, the F6 speech-to-structure service, and `ai.rag.enabled` Qdrant RAG; add the monthly budget alarm here)*

Order within F9: a → f.

- **a) Offer calculation check (pre-send):** AI reviews the draft offer: margin below threshold, likely-missing positions (Anfahrt, Entsorgung, Kleinmaterial — informed by the 30-offers analysis findings), hourly rate deviating from the F7 Verrechnungslohn baseline, zero-markup lines, unusual quantities. Output: a warnings panel on the offer editor — advisory, never blocking, never auto-editing. *(Demo feature #2.)*
- **b) Monday-morning report (GF):** `@Scheduled` Monday early morning — aggregate KPIs deterministically (new orders, offer win rate, receivables >30 days, projects with post-calc drift >10 %, utilization next 2 weeks, open complaints), then one Gemini call turns the numbers into five German plain-text sentences ("Achtung: Projekt Meier frisst Marge, Ursache Zeiten KW 28") → email to GF. *(Internal scheduled report — the §6.6 exemption; marked AI-generated; the KPI numbers are computed in code, the model only phrases them.)*
- **c) Dictated site survey (PL):** after a site visit the PL speaks 2 minutes into the phone ("Dachgeschoss, Splitgerät 3,5 kW, Leitungslänge circa acht Meter, Kernbohrung durch Klinker, Außengerät auf Konsole, Strom liegt an") → speech-to-structure service → structured survey note + proposed offer positions (matched against the F7 catalog; prices from the engine) in review state on the linked Anfrage/Projekt. Attacks the real bottleneck: offers typed in the evening.
- **d) Offer drafting via RAG:** embed historical offers (Qdrant); for a new inquiry retrieve the 3–5 most similar past offers and draft positions/wording from them; always a draft in the editor, clearly AI-marked. Historical offers teach structure and phrasing — **prices still resolve from the F7 engine at insert time** (old offer prices are stale by definition: copper and refrigerant prices move).
- **e) Change-order watchdog (Nachtrags-Wächter):** daily `@Scheduled` job compares new site-diary entries against the project's offer positions (LLM comparison over structured inputs); flags likely out-of-scope work to the PL: "Steigleitung erneuert — steht nicht im Angebot. Nachtrag stellen?" Unbilled change orders are the quietest margin killer in the trades; no human does this comparison manually.
- **f) Apprentice explain mode:** expose the existing AI chat (`KiHilfeController`, `/api/ki-hilfe`) to the Azubi role as a learning tool ("Warum machen wir hier einen Potentialausgleich?") — mostly configuration + an entry point in PWA/desktop, plus a system prompt tuned for patient explanations with trade context.
- **Budget alarm (built here):** monthly token/cost aggregation over the F1 AI-call log with a configurable threshold → notification to Admin.

**Acceptance:** every assistant shows an "AI-generated" marker and (except b) accept/dismiss actions, with audit entries; every assistant has a kill switch; the system stays fully usable with AI disabled; assistant outputs never mutate real records without an explicit human accept.

## F10 — Role tools & dispatch

Nine tools, each small, each mapped to a person from §2. Build in this order (dispatch first — it supersedes the F2 stopgap):

1. **Dispatch board (Plantafel)** — BL/PL: week view, technicians + subs as rows (reuse `@dnd-kit` from the desktop frontend), drag & drop of `Einsatz` entries (same entity as F2), conflict warnings (vacation/absence from the existing workflow, double-booking), **one reserved Havarie slot per day** (emergency capacity normal planning cannot consume); feeds "My Day"; supersedes the minimal F2 admin UI.
2. **Capacity view** — BL/GF: planned vs. available hours per trade, 6–8 weeks ahead (available = workdays × contracted hours − absences − planned Einsätze). Answers the most common customer question — "when can we?" — in ten seconds instead of gut feeling, and tells the GF when hiring technician #5 pays off.
3. **Escalation cockpit** — BL: one list, nothing else — stale inquiries (F4 SLA), projects with post-calc drift beyond threshold, complaints open >X days, offers without response >2 weeks. Problems come to him; he does not search.
4. **Automatic appointment confirmations** — customers: scheduling an Einsatz sends a German confirmation email/SMS ("Unser Monteur kommt Dienstag zwischen 8 und 10") — template + placeholders, pure rule, transactional; reduces no-show visits.
5. **Dunning traffic light** — GF/F&C: overdue invoices grouped by dunning level with fixed, configurable deadlines (defaults: Zahlungserinnerung +7 days after due, 1. Mahnung +14, 2. Mahnung +28); reminder texts generated as AI drafts (tone varies: Stammkunde vs. new customer), **sent manually** — reuse the existing Mahnung document type. Craft businesses rarely die of bad jobs; they die of unpaid invoices.
6. **Skonto watcher** — F&C: cash-discount deadline extracted during the existing incoming-invoice analysis (extend the extraction schema); reminder 2 days before expiry. 2–3 % on wholesale volume is real money burned by letting deadlines slip.
7. **3-way match** — F&C: order ↔ delivery note ↔ incoming invoice, incl. price check against wholesale conditions/discount groups (F7 data) with a configurable tolerance; discrepancy queue for review. Wholesalers bill list price instead of contract conditions more often than anyone admits; nobody has time to check line by line — a machine does.
8. **Payroll prep export** — F&C: monthly per-employee export (hours, overtime, surcharges for emergency/weekend work by fixed rules) as CSV/Excel for the external payroll office; **check first whether any DATEV export exists in code — extend, don't duplicate.**
9. **Subcontractor management** — BL/Admin: certificate registry per sub (§48b EStG Freistellungsbescheinigung, Betriebshaftpflicht, Kälteschein Kat. I where relevant) with expiry dates; **expired or missing certificate blocks dispatch-board planning** for that sub (hard warning; Admin override is possible but logged); sub submits timesheets via restricted PWA → PL approves → approved hours feed post-calculation and are matched against the sub's invoice ("auf dem Zettel standen aber 12 Stunden" ends here).

**Acceptance (per tool):** rules covered by unit tests; role visibility per §9 enforced and tested; every automated send logged; dunning/Skonto/3-way figures reconcile against fixture data; the Plantafel round-trips an Einsatz to My Day.

---

# PART IV — CROSS-CUTTING RULES

## 11. AI integration rules

- **Provider:** the existing Gemini integration with a **paid API key under a no-training policy**. Free-tier LLM endpoints — including OpenRouter `:free` models — are **forbidden for any request containing customer data**; they may be used for synthetic-data experiments only (their limits: ~20 requests/min, 50/day; free endpoints may train on inputs — a DSGVO non-starter for a business). At this company's volume, paid Flash-class calls cost a few euros per month; "free" buys rate limits and data risk, not savings.
- **Data minimization:** send the minimum needed; pseudonymize customer names where the task allows (triage and drafting rarely need real names).
- **Structured output always:** every LLM call requests JSON against a schema and validates it; on failure retry once, then degrade gracefully — every AI feature must leave the system fully usable with AI off.
- **Per-feature controls:** kill switch (config flag) and system prompt in config (German where output is user-facing); all calls logged to the F1 AI-call log; monthly budget alarm from F9.
- **One shared speech-to-structure service** (built in F6) serves all audio features — no parallel pipelines.
- **The §6 hierarchy is absolute:** rules before AI; prices never from the model; human in the loop with the single F9b exemption.

## 12. What NOT to do (standing prohibitions)

- Do not rebuild anything listed in §4.4 — extend it.
- Do not expose the system beyond LAN/VPN before F3 (SECURITY GATE).
- Do not auto-send anything to customers or external parties (F9b internal exemption only; transactional confirmations/reminders in F8/F10.4 are explicit rule-based features, not AI).
- Do not let any AI output become a real record without explicit human confirmation.
- Do not put a model-generated number into any price field, ever.
- Do not edit applied Flyway migrations; do not use upstream's version numbers.
- Do not commit secrets, `.env` files, uploads, or real personal data; tests use dummy data only ("Max Mustermann").
- Do not build interim auth in F1/F2 and do not wire new features into the legacy Abteilung scheme.
- Do not modify booked invoices in any code path — `/storno` only.
- Do not re-add backlog ideas the owner has removed from §15 (a §35a labor-cost block, review-request automation, subsidy workflows, tool registries, seasonal campaigns, customer upload portals, progress-billing audits, AI phone assistants, and CI pipelines were considered and **deliberately cut** — do not resurrect them without being asked).
- Do not refactor shared code unprompted (§5.6) and do not "improve" upstream code you happen to pass by.

## 13. Definition of Done (per feature)

- [ ] Server-side role checks per §9 with tests (from F3 onward; F1/F2 carry `TODO(F3)` markers instead)
- [ ] Flyway migration in the `V9xx__` range; idempotent per §6.2; native uppercase ENUM columns for enums
- [ ] Test bar from §5.3 met, incl. the per-endpoint security checklist
- [ ] German UI texts with correct trade terminology; design system respected; `npm run build` green
- [ ] Audit/history entries written where state changes (F5 onward); automations logged
- [ ] Works with AI disabled (where AI is involved); kill switch present
- [ ] Short German manual-test script for the project lead
- [ ] `review-and-ship` flow green (or the §5.8 fallback self-review); no booked-invoice mutation; no secrets committed; upstream files touched only if unavoidable

---

# PART V — PARKED & BACKLOG

## 14. Parked — do NOT build without explicit approval

- **Server migration + backups.** Agreed: waits until after the boss demo. Hard precondition before production use with real customer data (and before any NAS work): move off the developer laptop onto a small server/NAS-hosted deployment in the company network; nightly DB dumps (MariaDB or MySQL, per the engine verified in §4.6) + file backups; **one successfully tested restore**. A stolen laptop must not mean stolen company data.
- **NAS integration** — needs the GF's go. When approved, build in three strict layers, in order:
  1. **Folder sync (pure rule, no AI):** the ERP mirrors customer documents to the NAS under a fixed schema `/Kunden/<Kundennummer>_<Name>/<Projekt>/<Dokumenttyp>/` — the **customer number is the stable anchor** (names collide, marry, and rebrand); the ERP creates folders itself, no LLM involved in `mkdir`.
  2. **Scan inbox (AI-assisted):** an "Eingang" folder anyone can dump files into; OCR/analysis (same pattern as invoice recognition) proposes customer/project/type; above a confidence threshold auto-file, below it a review queue for the PLs.
  3. **Semantic search:** index NAS documents (text extraction + embeddings, Qdrant); "Zeig mir den Wartungsvertrag von Kunde Müller" from the chat/search UI.
  - **Hard rules for all layers:** NAS access respects §9 roles (search must not become a permission bypass for Monteure or Subs); the agent may only create and copy — never delete or move; every file operation is logged (F5); invoices remain authoritative in the ERP (GoBD) — the NAS holds copies only.

## 15. EXTRA — approved ideas backlog (not scheduled; pitch to the boss before building)

Ranked by value-per-effort. This list is deliberately short — it survived an explicit culling by the owner; do not extend it on your own initiative.

- **E1 — GiroCode (EPC-QR) on every invoice.** Customers scan with their banking app and get a pre-filled, typo-free SEPA transfer; measurably shortens time-to-payment and kills misbooked references. A day of work in the PDF pipeline. *(seen at TAIFUN/ToolTime)*
- **E2 — Automatic follow-up on unanswered offers.** `@Scheduled` job sends a friendly German follow-up at day 7 and day 14 while an offer is open, logs each touch in the F5 activity feed, stops on won/lost. Directly attacks the quote-conversion leak; pairs with the F4 loss-reason statistics. *(seen at Hero "Copilot"; note: this is customer-facing sending — if built, sending must be explicitly enabled per offer or globally by the GF, as a deliberate exception to §6.6)*
- **E3 — Signed work report → draft invoice, plus an "unbilled completed jobs" report.** When a technician completes a job (times, material, forms, signature all exist after F6), auto-assemble the work report and generate a **draft** invoice; a standing report lists completed-but-unbilled jobs so field work never falls through the billing cracks. *(seen at ToolTime/Odoo)*
- **E4 — Extend the existing AI invoice scan into project costs.** Upstream already analyzes incoming invoices (`/analyze-upload`); extend it to propose project/cost assignment and pre-fill the F10 3-way match. Removes the finance person's biggest typing task; review stays mandatory. *(seen at Plancraft; builds on existing code)*
