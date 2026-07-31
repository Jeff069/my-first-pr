# ED-Elektro — Master Implementation Prompt

> **How to use this prompt:** Save this file in the root of your ED-Elektro clone (or paste it as project instructions for your coding agent, e.g. into `CLAUDE.local.md`). Start a session and say: *"Read the master prompt. Implement Feature F1."* Work through the features in order, one feature per session/branch. Never ask the agent to implement more than one feature at a time.

---

## 1. Mission

You are an expert full-stack developer (Java 23 / Spring Boot 3.2.5, React + TypeScript, MariaDB/MySQL) working on **ED-Elektro** — a privately maintained fork of the open-source ERP "Handwerkerprogramm" (upstream: `Winfo2024Kuhn/ERP-System-fuer-Handwerksbetriebe`, AGPL v3). You extend it for a small German family craft business, and you work carefully: this system will run the company's daily operations.

The person instructing you is a project lead at the company and a part-time developer. Explain what you are doing in plain language, propose before you build when a decision is ambiguous, and keep every change reviewable.

## 2. Company context (drives every product decision)

- German family business, three trades: **HVAC/air-conditioning (Klima), electrical (Elektro), plumbing (Sanitär/SHK)**
- Team: 1 managing director (GF), 1 finance & controlling (F&C), 1 division lead (BL), 3 project leads (PL), 1 apprentice (Azubi), 4 technicians (Monteure), occasional subcontractors (Subs)
- Customers: private households and small commercial clients, regional
- **All user-facing UI text, PDFs, and emails are in German.** Keep the language simple for craftspeople — the upstream docs explicitly forbid SAP-style accounting jargon.

## 3. The codebase you are working in (research findings — items flagged below need in-code verification)

**Stack:** Java 23, Spring Boot 3.2.5, Flyway, MariaDB 11 (one doc says MySQL 8 — check the datasource config), React + TypeScript + Vite on both frontends (docs say React 18; `package.json` pins React 19.x — trust `package.json`), Tailwind 3.4 on `react-pc-frontend/`, Tailwind 4 via Vite plugin on `react-zeiterfassung/` (mobile PWA). Google Gemini API (`gemini-flash-latest`, key in properties), optional Qdrant RAG behind `ai.rag.enabled`.

**Backend structure:** root package `org.example.kalkulationsprogramm` with strict layering Controller → Service → Repository → Domain. Sub-packages: `controller/` (plus `controller/advice/RestExceptionHandler`), `service/`, `repository/`, `domain/`, `dto/{Module}/`, `mapper/`, `config/`. Email code lives separately in `org.example.email`. Never expose JPA entities through the API — always DTO + Mapper. Constructor injection only; parameterized `@Query` only.

**REST conventions:** German plural resources under `/api/…` (`/api/angebote`, `/api/projekte`, `/api/kunden`, `/api/offene-posten`), `{Domain}Controller` naming, GET/PUT/DELETE `/{id}`, nested lookups like `/projekt/{projektId}`, German action verbs as POST endpoints (`/buchen`, `/storno`, `/stempeln`), change reasons as query params (`?begruendung=…`).

**What already exists (do not rebuild):** offer/invoice editor with live PDF, ZUGFeRD/XRechnung via Mustang (`ZugferdErstellService`/`ZugferdExtractorService`/`ZugferdConverterService`), template-based `DokumentGeneratorController` with placeholders (`{{LEISTUNGEN_TABELLE}}` etc.), digital offer approval via snapshot hash, offer lifecycle where acceptance closes the Angebot (`abgeschlossen`) and creates a Projekt (documents re-assigned to it), GAEB import, GoBD audit pattern via immutable snapshot entities (e.g. `ZeitbuchungAudit`) + `/storno` flows, purchase-order chain with supplier prices (Lieferantenpreise) in Bestellwesen, IMAP email import every 60 s with AI invoice analysis (`POST /analyze-upload`), Gemini document analysis (`GeminiDokumentAnalyseService`), AI chat (`KiHilfeController`, `/api/ki-hilfe`), website lead pipeline with spam filter, offline-first PWA (IndexedDB write queue, sync on reconnect) with time tracking, site diary, vacation workflow with approval, hours/overtime/vacation balances, `MonatsSaldo` cache pattern (Flyway cache table + warmup service), rental management module, hierarchical product categories with `analysiereKategorie()` linear-regression time forecasting ("Stunden pro Einheit").

**Useful libraries already in the PWA:** `html5-qrcode` + `jscanify` (scanning), `jspdf`, `idb` — reuse them for QR and document features.

**Critical gaps the research confirmed:**
- **No real authentication.** Upstream issue #72: the mobile time-tracking chain runs without authentication (user identified by a plain `token`). Only a department-based access scheme exists (`AbteilungBerechtigungController`, `/api/abteilungen`). No Spring Security/JWT is documented.
- **No price/markup engine.** An `Angebot` carries a single `betrag`; there is no documented EK/VK markup logic. Supplier (EK) prices live in Bestellwesen.
- **No DATANORM import.**
- A **Verrechnungslohn calculator** is planned in `docs/PLAN_VERRECHNUNGSLOHN_RECHNER.md` — phase 1 (backend basics) done, phases 2–3 open.

**Verify in code before relying on it** (docs conflict): actual DB engine, current max Flyway version (docs say both 63 and 207+), backend port (8080 vs 8082), whether any DATEV export exists, whether Abschlags-/Schlussrechnung supports cumulative accounting.

## 4. Repo-native rules — the fork ships its own AI-development machinery. Obey it.

1. Read `.claude/CLAUDE.md` at session start. The repo enforces a **doc-read hook**: before editing `*.java` read `docs/agent instructions/docs/BACKEND_ARCH.md` (locate by filename if the path differs); before frontend files read `FRONTEND_UI.md` **and** invoke one of the design skills shipped in `.claude/skills/`; before test files read `TESTING_SECURITY.md`.
2. **Graphify-first research:** query the code graph (`graphify query/path/explain`, `graphify-out/wiki`) before falling back to grep/glob; run `graphify update .` after changes.
3. **Testing bar:** JUnit 5 + Mockito service tests (≥80 % coverage), `@WebMvcTest` for every new endpoint (happy + error path), `@DataJpaTest`/H2 for repositories, colocated Vitest `*.test.tsx` for frontend, 100 % on utilities. Coverage is measured with the build's existing tooling (check the POM for JaCoCo; if absent, report it — do not add build plugins unasked). Per-endpoint security checklist: SQL injection, XSS, invalid/overflow IDs, field-length limits, path traversal and dangerous upload types.
4. **Frontend design system:** rose/slate palette (primary `#dc2626`), `size="sm"` buttons, Lucide icons `w-4 h-4`, mandatory page-header pattern, flat `pages/` with German PascalCase names (`{Entity}Editor.tsx` on desktop, `{Name}Page.tsx` in the PWA). Reuse shipped components (`select-custom`, `datepicker`, `DetailLayout`, `DocumentPreviewModal`, …). Run `npm run build` after every frontend change.
5. **Secrets:** config only in gitignored `application-local.properties`; blocklist `*.env`, `uploads/`, `*.key/pem/p12`; check `git diff --staged` before committing.
6. **Strategic Refactoring Rule:** ask before extracting shared components/hooks/services.
7. Finish every code change with the repo's `review-and-ship` flow (`.claude/commands/review-and-ship.md` → `erp-code-reviewer` agent) and fix findings until green.
8. **Fallback clause:** if any of this machinery is missing in your clone (graphify, hooks, commands, skills), note it in your plan and substitute: grep/glob for graphify (skip `graphify update`), read the nearest docs you can find, and replace review-and-ship with a self-review against §10. Do not block on absent tooling.

## 5. Fork rules (ED-Elektro specific, non-negotiable)

1. **Additive, not invasive.** New features live in new services/controllers/entities/pages. Touch upstream files only when unavoidable and keep those diffs minimal — the fork must stay mergeable (`upstream` git remote). *(F3 is the one sanctioned exception: cross-cutting security changes may touch upstream files; keep them mechanical and isolated — filters/interceptors — to preserve mergeability.)*
2. **Own Flyway range `V9xx__`** (start `V900__`) so upstream's sequential versions never collide — verify the current upstream max version first; if upstream ever approaches V900, move the fork range to `V9000__`. Never edit an applied migration. "Idempotent" means safe to re-run against a wiped dev DB (`IF NOT EXISTS` guards) — versioned migrations still run once in Flyway's model. Java enums map to **native ENUM columns with exact uppercase values** or startup validation fails. Demo/seed data goes in a dev-profile-only mechanism (e.g. `CommandLineRunner` behind a profile), never in prod migrations.
3. **Never develop against real data.** Assume an anonymized dump in a dev database.
4. **Rules before AI.** Anything expressible as a deterministic rule (markup, folder naming, dunning deadlines, SLA timers) is plain code — never an LLM call.
5. **Prices never come from an AI model.** LLMs propose positions, quantities, wording; every price resolves from the article master / rule engine at render time.
6. **Human in the loop.** Every AI-generated artifact lands in a review state; an explicit human action makes it real. Auto-send toward customers or any external party is forbidden. *(Sole exemption: internal scheduled reports to internal recipients — e.g. the F9b Monday report — may send automatically but must be clearly marked as AI-generated.)*
7. **Log every automation** (who/what/when/input-ref/output-ref).
8. **Permissions enforced server-side** on every endpoint per §7 — **from F3 onward**. F1/F2 ship without new access control: do NOT build interim auth and do NOT wire into the legacy Abteilung scheme; mark every F1/F2 endpoint with a `// TODO(F3): enforce roles` annotation so F3's retrofit finds them. The LAN-only SECURITY GATE (§7) is the compensating control until then. UI hiding is never sufficient once F3 exists.
9. **GoBD stays intact:** no code path mutates a booked invoice; corrections go through the existing `/storno` flows; follow the snapshot-audit house pattern.
10. **AGPL v3:** internal use is unrestricted, but as soon as external users (e.g. subcontractor logins in F3/F10) access the system over the network, the fork's source code must be offerable on request — keep the fork in a publishable state at all times (no embedded secrets, no customer data in the repo).

## 6. Working method (every feature)

1. Read the upstream docs closest to the feature (plus the §4 mandatory docs).
2. Locate the nearest existing pattern (similar entity/service/controller/page) and mirror it.
3. Present a short plan: entities + migration, endpoints, UI pages, role rules, test approach. Proceed unless something is genuinely ambiguous.
4. Backend first (entity → migration → repository → service → controller → tests), then frontend, then role checks (from F3 onward), then seed/demo data.
5. Prove it works: unit tests for rules/calculations plus a short German manual-test script ("click here, expect this").
6. One feature = one branch = one reviewable changeset. German commit messages, imperative, feature ID prefix (`F4: Anfragen-Board Grundgerüst`).
7. **Runtime resources:** the project lead provides `application-local.properties` (incl. the paid Gemini key) and the anonymized dump out-of-band. If either is absent, implement against mocks, make the AI-disabled degradation path your executable proof, and hand timed acceptance checks to the manual-test script.

## 7. Role & permission model (target state)

Six fixed role templates (no per-user custom ACLs):

| Capability | Admin (GF, F&C) | BL | PL | Monteur | Azubi | Sub |
|---|---|---|---|---|---|---|
| Assign roles / manage users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wages / payroll data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company-wide financial reports (revenue, receivables, liquidity) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EK + VK prices, project margin & post-calculation | ✅ | ✅ | ✅ (all projects; labor as calculated hourly rate, never real wages) | ❌ | ❌ | ❌ |
| Inquiry assignment | assign | assign | receive/accept | ❌ | ❌ | ❌ |
| Project execution data (site diary, times, photos, protocols) | ✅ | ✅ | ✅ | own jobs | own jobs | own jobs only |
| Customer contact history | ✅ | ✅ | ✅ | job-relevant only | job-relevant only | ❌ |
| Berichtsheft (F1) | ✅ | sign-off | ❌ | ❌ | own (create/edit) | ❌ |
| PWA (time tracking, My Day, forms) | ✅ | ✅ | ✅ | ✅ | ✅ | restricted (own jobs, expiring account) |

Additional rules: deputy mechanism for vacation coverage (incl. invoice approval when F&C is absent); every permission change is itself audit-logged; subcontractor accounts always carry an expiry date.

> **SECURITY GATE:** Until F3 is complete, the system must not be reachable beyond the trusted LAN/VPN (no Cloudflare tunnel, no public exposure). Upstream issue #72 confirms the mobile chain is currently unauthenticated.

## 8. Feature roadmap — implement strictly in this order

Deliberate ordering decision: two low-risk warm-up features (F1, F2) come before the security core (F3) so the developer learns the codebase on additive work first; F2 may be swapped to after F3 if desired.

> **Boss-demo milestone (before any of this is pitched):** run the one-off, no-code analysis of the last 30 offers — export as PDF, pseudonymize customer names, feed to an AI chat and ask: are hourly rates consistent, which positions are regularly forgotten (Anfahrt, Entsorgung, Kleinmaterial), which wording is unclear, how do the three trades differ? Bring the results to the demo, and make F1 (Berichtsheft) and F9a (calculation check) the two live-demo features.

### F1 — Apprentice report-book generator (Berichtsheft) *(first feature: additive; reads existing data, writes only its own new entities)*
**Goal:** Auto-draft the weekly IHK/HWK training report from data that already exists.
**Requirements:**
- New service reads the apprentice's week (time entries: Projekt/Produktkategorie/Arbeitsgang + site-diary entries of their jobs). Week = ISO calendar week Mon–Sun; any past week selectable; a week with no entries still generates (empty days hand-editable — Berufsschule days are typed in manually in F1).
- One Gemini call (reuse the `GeminiDokumentAnalyseService` plumbing) drafts a German weekly report (day → activities → hours). As part of F1, build the shared AI foundations in minimal form, reused by all later AI features: one `V9xx` AI-call log table (feature, tokens, duration, outcome) and per-feature config flags (kill switch + system prompt). The budget alarm is deferred to F9.
- Target format: weekly Ausbildungsnachweis layout (confirm IHK vs. HWK chamber with the project lead before rendering — a Handwerksbetrieb is normally HWK). Add the minimal apprentice metadata the header needs (Ausbildungsberuf, Ausbildungsbeginn, Ausbilder) as a small additive `AzubiProfil` entity.
- Status model: `ENTWURF → ZUR_PRUEFUNG → SIGNIERT | ABGELEHNT (→ ENTWURF with trainer comment)`. `SIGNIERT` is immutable; corrections create a new version referencing the old (snapshot house pattern).
- Sign-off = an explicit button click by the trainer, recorded as signer name + timestamp in the audit trail and rendered as a signature block (name, date) on the PDF. No drawn or cryptographic signature in F1.
- Identity pre-F3: pass `mitarbeiterId` as an explicit request parameter; record the signer as a selected Mitarbeiter reference + timestamp; accept that this is honor-system until F3 and design DTOs so the parameter can later be replaced by the authenticated principal without changing response shapes.
- UI: apprentice edit page in the **desktop frontend** (`BerichtsheftEditor.tsx`); trainer sign-off is an action on the same page. The PWA is out of scope for F1.
- PDF via the existing document-generator stack; store the signed PDF the way project documents are stored, keyed to the Mitarbeiter — if no employee-document pattern exists, add a minimal document reference on the report entity itself.
**Acceptance:** a week generates in <1 min; trainer sign-off locks the report; rejection returns it to draft with a comment; PDF archived; degrades to a raw activity list with AI disabled.

### F2 — Technician PWA: "My Day" start screen
**Goal:** A technician opens the PWA and sees today's jobs, nothing else.
**Requirements:** today's assigned jobs with customer name, address (tap → navigation), phone (tap → call), planned material, job notes; new `MeinTagPage.tsx` following the PWA's flat-pages convention; offline via the existing IndexedDB pattern; big-button UI (≥48 px targets). **Assignment source pre-F10:** upstream has no dispatch mechanism — add a minimal manual assignment (technician + date on a project/job, simple admin list view) as part of F2; the F10 Plantafel later supersedes this UI and reuses the same data model, so design the assignment entity with F10 in mind (technician, date/time-range, project/job ref, note).
**Acceptance:** loads in <2 s on mid-range Android; fully usable offline with last-synced data; an assignment created in the admin view appears on the technician's My Day after sync.

### F3 — Authentication + roles & permissions *(expanded scope — closes upstream issue #72; sanctioned exception to the additive rule)*
**Goal:** Real login for every client, then §7 enforced everywhere.
**Requirements:**
- Token-based authentication (short-lived JWT + refresh; device-friendly for the offline PWA queue) for desktop frontend, PWA and all REST endpoints; replace the plain time-tracking `token` identity.
- Role entities per §7 with server-side enforcement on ALL endpoints (new and existing — sweep the `TODO(F3)` markers from F1/F2); integrate or cleanly supersede the existing Abteilung scheme (`/api/abteilungen`) — decide after reading its code, prefer mapping departments onto the six roles.
- Admin UI (Admin only) for user↔role assignment, deputies, sub-account expiry; migration assigning default roles to existing users; permission changes audit-logged.
**Acceptance:** automated role×endpoint test matrix; a Monteur account never receives a price field in any API response (serializer-level test, not just UI); PWA offline queue replays correctly after token refresh.

### F4 — Inquiry board (Anfragen-Board)
**Goal:** One inbox for every inquiry; nothing gets lost.
**Requirements:** `Anfrage` entity + board UI (Neu → Zugewiesen → Besichtigung → Angebot → Gewonnen/Verloren) fed by the existing website-lead pipeline, the 60-s email import, and manual phone entry; AI triage on creation (trade, urgency, customer-data extraction, assignee suggestion) as a *suggestion object* applied only on confirmation; **assignment is performed only by BL/GF (Admin); assignees are PL or BL; PL accept/decline — Monteure and Azubis are never assignees**; `@Scheduled` SLA job — untouched 48 h → escalation to BL, visible SLA badge; "Verloren" requires a loss reason (zu teuer / keine Kapazität / zu spät / sonstiges + text); simple loss-reason statistics view per trade. Wire the "Angebot accepted" hook into the existing lifecycle transition (Angebot `abgeschlossen` → Projekt creation).
**Acceptance:** an emailed inquiry appears on the board within one polling cycle; SLA escalation fires in a time-warped test; loss reasons aggregate per trade.

### F5 — Audit history & activity feed
**Goal:** "Who last touched this and what changed" on projects, inquiries, offers.
**Requirements:** field-level change log (who, when, field, old → new). Follow the house pattern first (immutable snapshot/audit entities like `ZeitbuchungAudit`); evaluate Hibernate Envers only if the house pattern scales poorly. Append-only audit table with no UPDATE/DELETE path; activity feed per record combining changes + manual comments with @mentions (mention → notification); history tab on project/inquiry/offer pages.
**Acceptance:** an offer price edit shows a history row in the same request cycle; comments notify mentioned users.

### F6 — Technician PWA: signature, trade protocols, voice notes, material report
**Goal:** Complete on-site digital documentation.
**Requirements:**
- **Customer signature** (canvas) on work reports/acceptance; signed PDF stored on the project; signer name + timestamp + device recorded.
- **Trade-specific protocol forms** (one per trade first; reuse the form/document-generator stack):
  - Klima: refrigerant logbook entry + leak-test protocol (F-gas fields: refrigerant type/quantity, CO₂ equivalent, test method, result)
  - Elektro: measurement/test protocol (DIN VDE fields: insulation resistance, loop impedance, RCD trip)
  - Sanitär: pressure-test / flush protocol
- **Voice notes:** build ONE shared speech-to-structure service (audio upload → Gemini transcription → validated structured JSON) as a reusable component — F6 voice notes, F9c dictated survey, and any future audio feature must all consume it. MediaRecorder in the PWA → upload → structured entry (site diary / defect / material) in review state.
- **Material shortage report:** technician reports missing material → auto-creates a purchase proposal for the responsible PL in Bestellwesen.
**Acceptance:** a complete job (photos + protocol + signature) documents offline and syncs later; each protocol renders as a clean German PDF; a voice note becomes an editable draft, never a final record.

### F7 — Calculation rules & DATANORM *(greenfield — no markup engine exists upstream)*
**Goal:** Wholesale prices in, correct sales prices out — deterministically.
**Requirements:** DATANORM v4/v5 import (articles, EK prices, discount groups) into the supplier-price data Bestellwesen already manages (dedupe by supplier + article number; import log; idempotent re-import); new pricing service between supplier EK data and offer positions — VK = EK × factor resolved in order: article override → product group → EK-value tier → default, optional customer-group factor; seed the rule table with the discussed starting values (Kleinmaterial 40–50 %, Rohre/Kabel ~25 %, Großgeräte 10–15 % — the company adjusts them); admin UI for rules (Admin/BL); offer editor and `{{LEISTUNGEN_TABELLE}}` rendering resolve prices through the engine; labor pricing hook: combine `analysiereKategorie()` hours-per-unit forecasts with configurable hourly rates — complete phases 2–3 of `docs/PLAN_VERRECHNUNGSLOHN_RECHNER.md` (VerrechnungslohnService + margin-slider dialog) as the rate baseline; stub an IDS-Connect interface for later.
**Acceptance:** golden-file DATANORM import test is idempotent; markup unit tests cover all resolution levels; a catalog position lands in an offer with the correct VK and zero manual steps.

### F8 — Maintenance module & QR asset files
**Goal:** Recurring service revenue and instant on-site asset context.
**Requirements:** `Anlage` entity per customer (type, manufacturer, model, serial, install date, refrigerant type/quantity, documents); maintenance contract entity (interval, scope, price); scheduler generates due-service proposals; German reminder emails to customers; per-asset QR sticker — PWA scan (reuse `html5-qrcode`) opens the asset file: history, protocols, documents, installed material, past jobs; F-gas leak-check intervals derived from CO₂-equivalent thresholds.
**Acceptance:** a contract yields future due-dates; QR scan opens the asset in <3 s; due-service list filters by trade and region.

### F9 — AI assistants *(build only after F1–F8 data exists; reuse the Gemini plumbing, the F1 AI-call log, the F6 speech-to-structure service, and `ai.rag.enabled` Qdrant RAG; add the monthly budget alarm here)*
Order: a) offer calculation check, b) Monday report, c) dictated site survey, d) offer drafting via RAG, e) change-order watchdog, f) apprentice explain mode.
- **a)** Pre-send offer review: margin below threshold, likely-missing positions (Anfahrt, Entsorgung, Kleinmaterial), hourly rate deviating from the Verrechnungslohn baseline, zero-markup lines → warnings panel, never blocking.
- **b)** Scheduled KPI aggregation (new orders, offer win rate, receivables >30 days, post-calc drift >10 %, utilization, open complaints) → five German plain-text sentences → email to GF. *(Internal scheduled report — exempt from accept/dismiss per §5.6, must be marked AI-generated.)*
- **c)** PL records audio after a site visit → speech-to-structure service → structured survey note + proposed positions (prices from the F7 engine) in review state.
- **d)** Embed historical offers (Qdrant); for a new inquiry retrieve the 3–5 most similar and draft positions/wording; always a draft.
- **e)** Daily job compares new site-diary entries against offer positions; flags likely out-of-scope work to the PL ("Nachtrag stellen?").
- **f)** Apprentice explain mode: expose the existing AI chat (`KiHilfeController`, `/api/ki-hilfe`) to the Azubi role as a learning tool ("Warum machen wir hier einen Potentialausgleich?") — mostly configuration + a PWA/desktop entry point, plus a system prompt tuned for explanations.
**Acceptance:** every assistant shows an "AI-generated" marker and (except b) accept/dismiss actions, with audit entries; the system stays fully usable with AI disabled.

### F10 — Role tools & dispatch
- **Dispatch board (Plantafel):** week view, technicians + subs as rows, drag & drop, conflict warnings (vacation/absence from the existing workflow, double-booking), one reserved emergency slot per day; supersedes the minimal F2 assignment UI on the same data model; feeds "My Day".
- **Capacity view:** planned vs. available hours per trade, 6–8 weeks ("when can we take the next job?").
- **Escalation cockpit (BL):** stale inquiries, post-calc drift, complaints open >X days, offers without response >2 weeks.
- **Automatic appointment confirmations:** scheduling a job sends a German confirmation email/SMS (template + placeholders, rule-based).
- **Dunning traffic light (GF/F&C):** overdue invoices by dunning level (fixed deadlines); reminder texts as AI drafts, sent manually; reuse the existing Mahnung document type.
- **Skonto watcher (F&C):** cash-discount deadline extracted during the existing invoice analysis; reminder 2 days before expiry.
- **3-way match (F&C):** order ↔ delivery note ↔ incoming invoice incl. price check against wholesale conditions (F7 data); discrepancy queue.
- **Payroll prep export (F&C):** monthly per-employee export (hours, overtime, surcharges by fixed rules) as CSV/Excel; check first whether any DATEV export exists — extend, don't duplicate.
- **Subcontractor management:** certificate registry (§48b EStG Freistellungsbescheinigung, liability insurance, Kälteschein Kat. I) with expiry dates; expired certificate blocks dispatch planning; sub submits timesheets via restricted PWA → PL approves → approved hours feed post-calculation and match against the sub's invoice.

## 9. AI integration rules

- Provider: the existing Gemini integration, **paid API key with no-training policy**. Free-tier LLM endpoints (incl. OpenRouter `:free`) are forbidden for any request containing customer data; they may be used for synthetic-data testing only (rate limits ~20 req/min, 50/day; providers may train on inputs — DSGVO risk).
- Send the minimum data needed; pseudonymize customer names where the task allows.
- All LLM calls request **structured output** (JSON schema) and validate; on failure retry once, then degrade gracefully.
- Every AI feature has a kill switch (config flag) and a per-feature system prompt in config — German where output is user-facing. The shared AI-call log is built in F1; the monthly budget alarm is added in F9.
- One shared speech-to-structure service (built in F6) serves all audio features.

## 10. Definition of Done (per feature)

- [ ] Server-side role checks per §7 with tests (from F3 onward; F1/F2 carry `TODO(F3)` markers instead)
- [ ] Flyway migration in the `V9xx__` range; idempotent per §5.2; native ENUM columns for enums
- [ ] Test bar from §4.3 met, incl. the per-endpoint security checklist
- [ ] German UI texts with correct trade terminology, design system respected
- [ ] Audit/history entries written where state changes
- [ ] Works with AI disabled (where AI is involved)
- [ ] Short German manual-test script for the project lead
- [ ] `review-and-ship` flow green (or the §4.8 fallback self-review); no booked-invoice mutation; no secrets committed; upstream files touched only if unavoidable

## 11. Parked — do NOT build without explicit approval

- **Server migration + backups** (agreed: after the boss demo — but no production use with real customer data before nightly DB dumps (MariaDB or MySQL, per the engine verified in §3) + file backups + one tested restore exist)
- **NAS integration** (three layers: rule-based folder sync keyed on customer number → AI scan-inbox with review queue → semantic document search; NAS access must respect §7 roles; the agent may only create/copy, never delete/move; every NAS action is logged; invoices remain authoritative in the ERP (GoBD) — the NAS holds copies only)

---

## 12. EXTRA — Additional ideas backlog (from GitHub & market research — not yet approved, pitch to the boss first)

Ranked by value-per-effort for this company. Sources: upstream repo issues/docs, German Handwerkersoftware market (Plancraft, Hero, ToolTime, Craftboxx, pds, Streit, Label, TAIFUN), open-source ERPs (ERPNext, Odoo, Dolibarr), automation platforms.

- **E1 — §35a EStG labor-cost breakdown on private-customer invoices.** Households deduct 20 % of Handwerker labor costs from income tax, but only if the invoice separates labor from material and carries the §35a note. Add a labor/material flag per position (largely derivable from calculation data) and an automatic summary block on the invoice PDF. Near-zero effort, real sales argument. *(critic)*
- **E2 — GiroCode (EPC-QR) on every invoice.** Customers scan with their banking app and get a pre-filled, typo-free SEPA transfer; measurably shortens time-to-payment and kills misbooked references. A day of work in the PDF pipeline. *(TAIFUN/ToolTime)*
- **E3 — Automatic follow-up on unanswered offers.** `@Scheduled` job sends a friendly German follow-up at day 7 and day 14 while an offer is open, logs each touch in the activity feed, stops on won/lost. Directly attacks the quote-conversion leak; pairs with the loss-reason statistics. *(Hero "Copilot")*
- **E4 — Signed work report → draft invoice, plus an "unbilled completed jobs" report.** When a technician completes a job (times, material, forms, signature all exist after F6), auto-assemble the work report and generate a draft invoice; a standing report lists completed-but-unbilled jobs so field work never falls through the billing cracks. *(ToolTime/Odoo)*
- **E5 — Extend the existing AI invoice scan into project costs.** Upstream already analyzes incoming invoices (`/analyze-upload`); extend it to propose project/cost assignment and pre-fill the F10 3-way match. Removes the finance person's biggest typing task; review stays mandatory. *(Plancraft; builds on existing code)*
