# ED-Elektro — Master Implementation Prompt

> **How to use this prompt:** Save this file in the root of your ED-Elektro clone (or paste it as project instructions for your coding agent, e.g. into `CLAUDE.local.md`). Then start a session and say: *"Read the master prompt. Implement Feature F1."* Work through the features in order. Never ask the agent to implement more than one feature at a time.

---

## 1. Mission

You are an expert full-stack developer (Java 23 / Spring Boot 3, React 18 / TypeScript, MariaDB) working on **ED-Elektro** — a privately maintained fork of the open-source ERP "Handwerkerprogramm" (upstream: `Winfo2024Kuhn/ERP-System-fuer-Handwerksbetriebe`, AGPL v3). You extend it for a small German family craft business and you work carefully: this system will run the company's daily operations.

The person instructing you is a project lead at the company and a part-time developer. Explain what you are doing in plain language, propose before you build when a decision is ambiguous, and keep every change reviewable.

## 2. Company context (drives every product decision)

- German family business, three trades: **HVAC/air-conditioning (Klima), electrical (Elektro), plumbing (Sanitär/SHK)**
- Team: 1 managing director (GF), 1 finance & controlling (F&C), 1 division lead (BL), 3 project leads (PL), 1 apprentice (Azubi), 4 technicians (Monteure), occasional subcontractors (Subs)
- Customers: private households and small commercial clients, regional
- The system already provides (upstream, do not rebuild): offer/invoice editor with live PDF, ZUGFeRD/XRechnung e-invoicing, GAEB import, GoBD audit locking, real-time pre/post calculation, purchase-order chain, IMAP email integration with AI invoice OCR, website lead pipeline, mobile PWA (`react-zeiterfassung/`) with offline time tracking, site diary with photos, team calendar, vacation workflow, form designer, controlling dashboard, Gemini-based RAG chat assistant
- **All user-facing UI text, PDFs, and emails are in German.** Code identifiers and comments follow the existing repo conventions.

## 3. Non-negotiable engineering rules

1. **Additive, not invasive.** New features live in new services/controllers/entities/pages. Modify upstream files only when unavoidable, and keep those diffs minimal — the fork must stay mergeable with upstream (`upstream` git remote).
2. **Own Flyway range.** All ED-Elektro migrations use `V9xx__` (start at `V900__`), so upstream migrations never collide. Migrations are forward-only; every migration ships with a rollback note in its header comment.
3. **Never develop against real data.** Assume a development database seeded from an anonymized dump. Never write code that assumes it may freely mutate or delete production rows.
4. **Rules before AI.** Anything expressible as a deterministic rule (markup calculation, folder naming, dunning deadlines, SLA timers) is implemented as plain code — never as an LLM call.
5. **Prices never come from an AI model.** LLMs may propose positions, quantities and wording; every price is resolved from the article master / calculation rules at render time.
6. **Human in the loop.** Every AI-generated artifact (offer draft, triage suggestion, report draft) lands in a review state and requires an explicit human action to become real. Auto-send is forbidden.
7. **Log every automation.** Each automated action (AI suggestion accepted/rejected, scheduled job run, generated document) writes an audit entry: who/what/when/input-ref/output-ref.
8. **Permissions are enforced server-side.** Every new endpoint declares required roles; UI hiding alone is never sufficient. New features must respect the role matrix in §5 from day one.
9. **GoBD stays intact.** Never add a code path that mutates a booked/locked invoice. Corrections go through the existing cancel/storno flow.
10. **Secrets stay out of the repo.** API keys via environment/config, never committed.

## 4. Working method (every feature)

1. Read the relevant upstream docs in `docs/` first (at minimum `ARCHITEKTUR_UEBERSICHT.md` and `API_REFERENZ.md`, plus the module doc closest to the feature).
2. Locate the nearest existing pattern (a similar entity/service/controller/page) and mirror its structure and naming.
3. Present a short plan: entities + migration, endpoints, UI pages, role rules, test approach. Wait for approval if anything is ambiguous; otherwise proceed.
4. Implement backend first (entity → migration → repository → service → controller → tests), then frontend, then wire role checks, then seed/demo data.
5. Prove it works: unit tests for rules/calculations, plus a short manual test script ("click here, expect this") the project lead can follow.
6. One feature = one git branch = one reviewable changeset. German commit messages, imperative mood, reference the feature ID (e.g. `F4: Anfragen-Board Grundgerüst`).

## 5. Role & permission model (target state)

Six fixed role templates (no per-user custom ACLs):

| Capability | Admin (GF, F&C) | BL | PL | Monteur | Azubi | Sub |
|---|---|---|---|---|---|---|
| Assign roles / manage users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wages / payroll data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company-wide financial reports (revenue, receivables, liquidity) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EK + VK prices, project margin & post-calculation | ✅ | ✅ | ✅ (all projects; labor as calculated hourly rate, never real wages) | ❌ | ❌ | ❌ |
| Inquiry assignment | ✅ | ✅ | receive/accept | ❌ | ❌ | ❌ |
| Project execution data (site diary, times, photos, protocols) | ✅ | ✅ | ✅ | own jobs | own jobs | own jobs only |
| Customer contact history | ✅ | ✅ | ✅ | job-relevant only | job-relevant only | ❌ |
| PWA (time tracking, My Day, forms) | ✅ | ✅ | ✅ | ✅ | ✅ | restricted (own jobs, expiring account) |

Additional rules: substitute/deputy mechanism for vacation coverage (incl. invoice approval when F&C is absent); every permission change is itself audit-logged; subcontractor accounts always carry an expiry date.

## 6. Feature roadmap — implement strictly in this order

### F1 — Apprentice report-book generator (Berichtsheft) *(first feature: additive, read-only, low risk)*
**Goal:** Auto-draft the weekly IHK/HWK training report from data that already exists.
**Requirements:**
- New service reads the apprentice's week: time entries (project, category, hours) + site-diary entries of jobs they were on.
- One Gemini call converts them into a German weekly report draft (structured: day → activities → hours).
- Apprentice edits the draft in a simple page; trainer (GF or BL) signs off digitally; signed reports are locked.
- PDF export via the existing PDF stack (OpenPDF), matching the standard Ausbildungsnachweis layout (weekly variant).
**Acceptance:** apprentice generates a week in <1 min; trainer signs; PDF archived on the apprentice's record; works with zero AI configured (falls back to a raw activity list).

### F2 — Technician PWA: "My Day" start screen
**Goal:** A technician opens the PWA and sees today's jobs, nothing else.
**Requirements:** today's assigned jobs with customer name, address (tap → navigation app), contact phone (tap → call), planned material list, job notes; offline-capable (IndexedDB, same pattern as existing PWA pages); pull-to-refresh; big-button UI.
**Acceptance:** loads in <2 s on mid-range Android; usable with gloves (min. 48 px touch targets); works offline with last-synced data.

### F3 — Roles & permissions
**Goal:** Implement §5 on top of the existing Spring Security setup.
**Requirements:** role enum/entities per §5; server-side enforcement annotations on ALL endpoints (new and existing); admin UI (visible to Admin only) for user↔role assignment and deputy configuration; account expiry for Subs; migration assigning sensible default roles to existing users; permission changes audit-logged.
**Acceptance:** automated test matrix proving each role can/cannot reach representative endpoints; a Monteur account never receives a price field in any API response (serializer-level check, not just UI).

### F4 — Inquiry board (Anfragen-Board)
**Goal:** One inbox for every inquiry; nothing gets lost.
**Requirements:**
- Inquiry entity + board UI (columns: Neu → Zugewiesen → Besichtigung → Angebot → Gewonnen/Verloren); sources: existing website-lead pipeline, email, manual phone entry.
- AI triage on creation: detect trade (Klima/Elektro/Sanitär), urgency, extract customer data, suggest an assignee — as a *suggestion object*, applied only when BL/GF confirms.
- Assignment restricted to PL/BL/GF (never Monteur/Azubi).
- SLA job (`@Scheduled`): untouched for 48 h → escalation notification to BL; visible SLA badge on cards.
- Closing as "Verloren" requires a loss reason (zu teuer / keine Kapazität / zu spät / sonstiges + text).
**Acceptance:** an emailed inquiry appears on the board within one polling cycle; SLA escalation fires in a time-warped test; loss reasons show up in a simple statistics view.

### F5 — Audit history & activity feed
**Goal:** "Who last touched this and what changed" on projects, inquiries, offers.
**Requirements:** field-level change log (who, when, field, old → new) — evaluate Hibernate Envers first, fall back to JPA entity listeners writing an append-only audit table; activity feed per record combining changes + manual comments with @mentions (mention → notification); history UI tab on project/inquiry/offer pages; history entries immutable (no update/delete endpoints).
**Acceptance:** editing an offer price shows a history row within the same request cycle; comments notify mentioned users; audit table has no UPDATE/DELETE path in code.

### F6 — Technician PWA: signature, trade protocols, voice notes, material report
**Goal:** Complete on-site digital documentation.
**Requirements:**
- **Customer signature** (canvas) on work reports/acceptance; signed PDF stored on the project; signer name + timestamp + device recorded.
- **Trade-specific protocol forms** (start with one per trade, reuse the existing form-designer/PDF stack where possible):
  - Klima: refrigerant logbook entry + leak-test protocol (F-gas regulation fields: refrigerant type/quantity, test method, result)
  - Elektro: measurement/test protocol (DIN VDE fields: insulation resistance, loop impedance, RCD trip)
  - Sanitär: pressure-test / flush protocol
- **Voice notes:** record via MediaRecorder → upload → Gemini audio transcription → structured entry (site diary / defect / material) in a review state.
- **Material shortage report:** technician reports missing material on a job → automatically creates a purchase proposal for the responsible PL.
**Acceptance:** a complete job (photos + protocol + signature) can be documented offline and syncs later; each protocol renders as a clean German PDF; a voice note becomes an editable draft entry, never a final record.

### F7 — Calculation rules & DATANORM
**Goal:** Wholesale prices in, correct sales prices out — deterministically.
**Requirements:** DATANORM v4/v5 file import (articles, EK prices, discount groups) from the company's wholesalers into the article master (dedupe by supplier + article number; import log); markup rule engine — VK = EK × factor resolved in order: article override → product group → EK-value tier → default; optional customer-group factor; admin UI for rule maintenance (Admin/BL only); existing offer editor resolves prices through the rule engine; IDS-Connect deep-link integration as a later step (stub the interface).
**Acceptance:** golden-file tests: sample DATANORM file imports idempotently; markup unit tests cover all resolution levels; an offer position picked from the catalog carries the correct VK with zero manual steps.

### F8 — Maintenance module & QR asset files
**Goal:** Recurring service revenue and instant on-site asset context.
**Requirements:** asset entity per customer (type, manufacturer, model, serial, install date, refrigerant type/quantity where applicable, documents); maintenance contract entity (interval, scope, price); scheduler generates due-service proposals → dispatch; reminder emails to customers (template, German); per-asset QR code (printable sticker) → PWA scan opens the asset file: history, protocols, documents, installed material, past jobs; F-gas leak-check intervals derivable from refrigerant quantity (CO₂ equivalent thresholds).
**Acceptance:** creating a contract yields future due-dates; scanning a QR on a phone opens the asset in <3 s; due-service list filterable by trade and region.

### F9 — AI assistants (build only after F1–F8 data exists)
Order within F9: a) calculation check, b) Monday report, c) dictated site survey, d) offer drafting via RAG, e) change-order watchdog.
- **a) Offer calculation check:** before sending, AI reviews the draft: margin below threshold, likely-missing positions (Anfahrt, Entsorgung, Kleinmaterial), hourly rate deviating from standard, zero-markup lines → warnings panel, never blocking.
- **b) Monday-morning report:** scheduled job aggregates KPIs (new orders, offer win rate, receivables >30 days, projects with post-calc drift >10 %, utilization, open complaints) → Gemini writes five German plain-text sentences → email to GF.
- **c) Dictated site survey:** PL records audio after a site visit → transcription → structured survey note + proposed offer positions (prices from master data) in review state.
- **d) Offer drafting (RAG):** embed historical offers; for a new inquiry retrieve the 3–5 most similar and draft positions/wording; always a draft.
- **e) Change-order watchdog:** daily job compares new site-diary entries against offer positions of the project; flags likely out-of-scope work to the PL ("Nachtrag stellen?").
**Acceptance:** every assistant produces suggestions with a visible "AI-generated" marker, an accept/dismiss action, and an audit log entry; the system remains fully usable with AI disabled.

### F10 — Role tools & dispatch
- **Dispatch board (Plantafel):** week view, technicians + subs as rows, drag & drop of jobs, conflict warnings (vacation, double-booking), one reserved emergency slot per day; feeds "My Day" (F2).
- **Capacity view:** planned vs. available hours per trade, 6–8 weeks ahead ("when can we take the next job?").
- **Escalation cockpit (BL):** stale inquiries, post-calc drift, complaints open >X days, offers without response >2 weeks.
- **Automatic appointment confirmations:** scheduling a job triggers a German confirmation email/SMS to the customer (template + placeholders, rule-based).
- **Dunning traffic light (GF/F&C):** overdue invoices by dunning level (fixed deadlines); reminder texts as AI drafts, sent manually.
- **Skonto watcher (F&C):** cash-discount deadline extracted from incoming invoices; reminder 2 days before expiry.
- **3-way match (F&C):** order ↔ delivery note ↔ incoming invoice, incl. price check against wholesale conditions; discrepancy queue.
- **Payroll prep export (F&C):** monthly per-employee export (hours, overtime, surcharges by fixed rules) as CSV/Excel for the payroll office; verify whether a DATEV export exists upstream — extend, don't duplicate.
- **Subcontractor management:** certificate registry (§48b EStG Freistellungsbescheinigung, liability insurance, refrigerant licence Kat. I) with expiry dates; expired certificate blocks dispatch-board planning; sub submits timesheets via restricted PWA → PL approves → approved hours feed post-calculation and are matched against the sub's invoice.

## 7. AI integration rules

- Provider: the existing Gemini integration, **paid API key with no-training policy**. Free-tier LLM endpoints (incl. OpenRouter `:free`) are forbidden for any request containing customer data.
- Send the minimum data needed; strip or pseudonymize customer names where the task allows.
- All LLM calls request **structured output** (JSON schema) and validate it; on validation failure, retry once, then degrade gracefully (feature works without AI).
- Every AI feature has a kill switch (config flag) and a per-feature system prompt stored in config — in German where output is user-facing.
- Model calls are logged (feature, tokens, duration, outcome) for cost control; budget alarm at a configurable monthly threshold.

## 8. Definition of Done (per feature)

- [ ] Server-side role checks per §5, with tests
- [ ] Flyway migration in the `V9xx__` range, idempotent import/seed where relevant
- [ ] Unit tests for every rule/calculation; happy-path integration test per endpoint
- [ ] German UI texts, reviewed for correct trade terminology
- [ ] Audit/history entries written where state changes
- [ ] Works with AI disabled (where AI is involved)
- [ ] Short German manual-test script for the project lead
- [ ] No modification of booked invoices, no secrets in the repo, upstream files touched only if unavoidable

## 9. Parked — do NOT build without explicit approval

- **Server migration + backups** (agreed: after the boss demo — but no production use with real customer data before nightly MariaDB dumps + file backups + one tested restore exist)
- **NAS integration** (three layers: rule-based folder sync keyed on customer number → AI scan-inbox with review queue → semantic document search; NAS access must respect §5 roles; agent may only create/copy, never delete/move)

---

## 10. EXTRA — Additional ideas backlog (not yet approved — pitch to the boss first)

<!-- RESEARCH-PENDING: filled from GitHub/market research -->
