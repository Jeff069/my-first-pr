# Audit-Prompt: Zustand nach dem F1–F8-Durchlauf

> Diesen Text komplett ins VS-Code-Terminal (Claude Code) einfügen. Er prüft nur — er repariert nichts.

---

You are auditing work that was produced in an earlier session of this repository, where features F1–F8 of the master prompt were implemented in a single uninterrupted run instead of one feature per session as the prompt requires.

**Read first:** the master prompt (`CLAUDE.local.md` or wherever it lives in this repo), the QS/Security prompt if present, and `.claude/CLAUDE.md`.

**Your stance for this whole session:** You are a skeptical external auditor, not the author. Assume the previous run cut corners under time pressure — that is the normal outcome of implementing 8 features in one go. Look for **evidence**, never for intent. If something cannot be verified, write "nicht verifiziert" — never assume it works because it looks plausible or because a commit message says so.

**Hard rules for this session:**
- **Do NOT change, fix, refactor, or "improve" any code.** Not even small things. Not even obvious bugs — write them down instead.
- The only writes you may perform are: the safety tag/branch in Phase 0, and the final report file.
- No destructive git commands, ever: no `reset --hard`, no `checkout .`, no branch deletion, no force-push. If uncommitted changes exist, commit them to the backup branch — never discard them.
- Report in **German**. Technical terms may stay English.

---

## Phase 0 — Stand sichern (before anything else)

1. `git status` — if there are uncommitted changes, commit them on the current branch with message `WIP: Stand vor Audit gesichert`.
2. Create a safety tag and branch so nothing can be lost:
   `git tag durchlauf-f1-f8` and `git branch backup/f1-f8`
3. Confirm both exist. Do not push anything.

## Phase 1 — Bestandsaufnahme (facts only, no judgment yet)

Collect and record:
- Commit history of the run: how many commits, one giant blob or per-feature steps? Branch structure?
- Which files were added vs. **modified**. List every **upstream file** that was modified (the master prompt's fork rule allows this only where unavoidable, F3 excepted) — this is a key finding either way.
- Flyway: list `src/main/resources/db/migration/`. Which migrations are new? Are they all in the fork's `V9xx__` range? Any that collide with upstream numbering? Any that were *edited* rather than added?
- New backend artifacts: entities, repositories, services, controllers — list them per feature.
- New frontend pages/components in both frontends.
- Tests: how many new test classes/files exist, and for which of the new artifacts do tests exist **at all**? Name the untested ones explicitly.
- Configuration: what was added to properties files? Any secret, key, or password committed anywhere (also check `git log -p` for accidentally committed and later removed secrets)?

## Phase 2 — Abgleich gegen die Spezifikation

For **each** feature F1 through F8, compare what the master prompt specifies (requirements + acceptance criteria) against what actually exists in the code. Per feature, produce:
- what is implemented,
- what is missing or only partially implemented,
- which of the feature's **acceptance criteria** you could verify, which you could not, and which clearly fail.

Be specific and cite file paths. "Implementiert" without a file reference is not an answer.

## Phase 3 — Risiko-Tiefenprüfung (in this order — this is the core of the audit)

**F3 (Anmeldung & Rechte) — highest risk:**
- Is there real authentication, or a placeholder? How are passwords stored (hashing algorithm)? Are tokens short-lived, is there a refresh/revocation path?
- Were the `TODO(F3): enforce roles` markers from F1/F2 actually swept, or do they still sit there?
- **Enumerate every REST endpoint in the codebase and state per endpoint whether an authorization check exists.** Name every endpoint that is still reachable unauthenticated. This list is the single most important output of the audit.
- Does the role×endpoint test matrix exist and run green?
- Do Monteur/Azubi/Sub responses really contain no price fields (serializer/DTO level, not just hidden in the UI)? Verify with a test or by reading the DTO mapping.
- Sub accounts: expiry enforced? own-jobs-only scoping enforced server-side (try to reason about ID manipulation)?

**F7 (Preise & Kalkulation) — money risk:**
- Markup resolution order as specified (article override → product group → EK tier → default)? Customer-group factor applied multiplicatively on top?
- EK selection when several supplier prices exist — is the rule implemented and deterministic?
- Is the DATANORM import idempotent (same file twice → no duplicates)? Is there a test proving it?
- **Does any price anywhere originate from an LLM call?** Search for it explicitly. This would be a critical defect.
- Are calculations covered by unit tests, or only by manual clicking?

**Cross-cutting:**
- GoBD: is there any code path that mutates a booked/locked invoice instead of going through `/storno`?
- AI: do any calls send customer data to a free-tier endpoint? Is every AI feature behind a kill switch and does the system still work with AI disabled? Is the AI-call log implemented?
- Do the new endpoints follow the repo's per-endpoint security checklist (input limits, upload types, path traversal)?

## Phase 4 — Technische Verifikation (run it, don't guess)

- Backend build + tests (`.\mvnw.cmd test` on Windows) — record pass/fail and the actual failure output, not a summary.
- Both frontends: `npm run build` — record pass/fail.
- Does the application start and do the Flyway migrations apply against a **clean** database? If you cannot verify this safely, say so rather than claiming it.
- If `gitleaks`, `trivy` or `semgrep` are installed: run them over the repo and report findings. If they are not installed, report "nicht ausgeführt — Werkzeug fehlt". Do not install anything.

## Phase 5 — Bericht

Write the report to `docs/audit/AUDIT_F1-F8_<YYYY-MM-DD>.md` **in German**, structured as:

1. **Ampel-Tabelle je Feature F1–F8** with verdict: `Brauchbar` / `Nacharbeit nötig` / `Neu bauen` — plus 1–3 concrete reasons with file references per feature.
2. **Liste ungeschützter Endpoints** (from Phase 3) — or the explicit statement that none exist.
3. **Kritische Befunde**, most severe first: anything touching authentication, prices, GoBD, or committed secrets.
4. **Priorisierte Maßnahmenliste**: what must be fixed before anything else, what can wait, what should be rebuilt from scratch rather than patched. Give a rough effort estimate per item (hours/days).
5. **Die eine Kernfrage, klar beantwortet:** *„Darf dieses System in seinem jetzigen Zustand im Firmennetz mit echten Daten laufen — ja oder nein, und warum?"* Answer honestly. If the answer is no, say exactly what is missing to make it yes.
6. **Was NICHT geprüft werden konnte** und warum.

Then stop. Do not propose or start any fix in this session — the report is the deliverable. Wait for my decision on what to tackle first.
