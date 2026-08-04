# Kopiervorlagen — ein Block pro Sitzung

Voraussetzung: Der Master-Prompt liegt als `CLAUDE.local.md` im Repo-Wurzelverzeichnis (lädt automatisch).
Ablauf: **einen** Block kopieren → einfügen → arbeiten lassen → nächste Sitzung, nächster Block.

**Zuerst der Audit** (`Audit-Prompt.md`). Erst danach steht fest, welche der folgenden Blöcke du überhaupt noch brauchst — vieles ist eventuell schon brauchbar, anderes braucht Nacharbeit statt Neubau.

---

## Sitzungsstart (immer voranstellen, wenn du unsicher bist)

```
Read CLAUDE.local.md completely before you start. Follow §7 (working method): read the relevant docs, mirror the nearest existing pattern, present a short plan, then build backend → frontend → tests. Stop and wait for my go if anything is genuinely ambiguous.
```

## Sitzungsende (wenn ein Feature fertig ist)

```
Run the repo's review-and-ship flow, fix findings until green, then commit with a German message prefixed by the feature ID. Write me the German manual-test script for this feature. Do not start the next feature.
```

---

# Feature-Blöcke

## F1 — Berichtsheft-Generator
```
Implement Feature F1 from the master prompt, and only F1. Watch out for: the AI foundations (AI-call log + per-feature config flags) are built here once and reused by all later features — get that right. Sign-off is a button click with name + timestamp, not a drawn signature. The rejection path (ABGELEHNT with trainer comment) must exist. Stop when F1's Definition of Done (§13) holds. Do not start F2.
```

## F2 — Monteur-PWA „Mein Tag"
```
Implement Feature F2 from the master prompt, and only F2. Watch out for: the Einsatz entity you create here must be reusable unchanged by the F10 Plantafel — design it accordingly. Offline behaviour follows the existing IndexedDB pattern; do not invent a second sync mechanism. Stop when F2's Definition of Done holds. Do not start F3.
```

## F3 — Anmeldung & Rechte  ← das wichtigste Feature
```
Implement Feature F3 from the master prompt, and only F3. This is the security core — take your time. Watch out for: sweep every TODO(F3) marker from F1/F2; enforce roles server-side on ALL endpoints including the existing upstream ones; prove with a role×endpoint test matrix; verify at serializer level that Monteur/Azubi/Sub responses contain no price fields. When you are done, list every endpoint that is still reachable unauthenticated. Stop after F3.
```

## F4 — Anfragen-Board
```
Implement Feature F4 from the master prompt, and only F4. NOTE: the F4 spec was rewritten after seeing the company's real monday.com board — if an earlier build used the placeholder five-stage chain, rework it to the 18 real stages. Watch out for: extend the EXISTING Anfrage entity, do not create a new one; status is a configurable entity with colours, not a hard-coded enum; Gewerk is multi-select; the board must show offer value and margin next to each inquiry. The AI triage produces suggestions only; assignment stays a human action by Admin/BL. Stop after F4.
```

## F5 — Historie & Aktivitäts-Feed
```
Implement Feature F5 from the master prompt, and only F5. Watch out for: follow the repo's existing snapshot-audit pattern first and only evaluate Envers if that scales poorly. The audit table must have no UPDATE or DELETE path anywhere in the code. Stop after F5.
```

## F6 — PWA: Unterschrift, Protokolle, Sprachnotizen
```
Implement Feature F6 from the master prompt, and only F6. Watch out for: build ONE shared speech-to-structure service (audio → transcription → validated JSON) that F9c will reuse — no parallel audio pipelines. Verify the current F-gas leak-check intervals before hard-coding them. Everything must work fully offline and sync later. Stop after F6.
```

## F7 — Kalkulation & DATANORM
```
Implement Feature F7 from the master prompt, and only F7. This decides your margins — no guessing. Watch out for: the markup resolution order and the multiplicative customer-group factor exactly as specified; EK = lowest current supplier price with the used supplier stored per position; the DATANORM import must be idempotent (prove it with a golden-file test); no price value may ever come from an LLM. Build the Angebotskalkulation screen last, after engine and import work — it must generate its PDF through the existing DocumentBuilder stack, never a second PDF path. Stop after F7.
```

## F8 — Wartungsmodul & QR-Anlagenakte
```
Implement Feature F8 from the master prompt, and only F8. Watch out for: reuse html5-qrcode from the PWA rather than adding a scanning library; leak-check due dates derive from the CO₂-equivalent calculation; an F6 protocol must update the asset's next-check date. Stop after F8.
```

## F9 — KI-Assistenten
```
Implement Feature F9 from the master prompt, in the order a → f, and only F9. Watch out for: every assistant is advisory with an accept/dismiss action and a kill switch; the Monday report is the only automatic send and must be marked AI-generated; the KPI numbers are computed in code, the model only phrases them; prices in drafted positions come from the F7 engine. Add the monthly budget alarm here. Stop after F9.
```

## F10 — Rollenwerkzeuge & Plantafel
```
Implement Feature F10 from the master prompt, and only F10 — build its nine tools in the listed order, starting with the Plantafel. Watch out for: the Plantafel reuses the F2 Einsatz entity and supersedes only its admin UI; check for an existing DATEV export before building the payroll export; an expired subcontractor certificate blocks planning absolutely, with no override. Stop after F10.
```

## F11 — Persönlicher KI-Assistent
```
Implement Feature F11 from the master prompt, and only F11. Watch out for: a new additive AssistentController at /api/assistent — leave the upstream KiHilfeController untouched so the Azubi keeps the F9f explain mode; permissions enforced in the tool layer, never in the prompt; read-only tools only; the model never emits URLs — the backend builds deep links from typed entity references. Stop after F11.
```

---

## Wenn etwas schiefgeht

```
Stop. Do not fix anything yet. Explain in German what went wrong, what you already changed, and give me two options with their consequences. Wait for my decision.
```

## Wenn du unterbrechen musst

```
Stop here. Commit the current state to a WIP branch with a German message describing exactly where you stopped and what is missing. Write me a three-line German summary of where we are.
```

---

# Kalkulations-Stufen (eigener Prompt: `Kalkulation-Prompt.md`)

Powerbird wird abgelöst — die Angebotskalkulation hat einen eigenen Bau-Prompt. Eine Stufe pro Sitzung, K1 → K8.

```
Read Kalkulation-Prompt.md and CLAUDE.local.md. Implement stage K1 (Lohngruppen & Stundensätze), and only K1. Stop when its acceptance criteria hold.
```
Für die weiteren Stufen dieselbe Zeile mit **K2** (Kalkulationsmaske — das Herzstück), **K3** (Leistungskatalog mit Stückliste und Bauzeit), **K4** (Kostenarten & Dokument-Kalkulation), **K5** (Angebots-PDF), **K6** (Datanorm-Import), **K7** (Sollmengen & Nachkalkulation), **K8** (Validierung & Umstieg).
