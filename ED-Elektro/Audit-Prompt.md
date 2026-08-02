# Audit-Prompt: Gesamtprüfung gegen den Master-Prompt

> Diesen Text komplett ins VS-Code-Terminal (Claude Code) einfügen. Er prüft nur — er repariert nichts.

---

You are auditing work that was produced in an earlier session of this repository. Features of the master prompt were implemented in a single uninterrupted run instead of one feature per session as the prompt requires. Your job is a **full compliance audit against the entire master prompt** — every rule, every feature, every prohibition — not just a feature checklist.

**Read first:** the master prompt (`CLAUDE.local.md` or wherever it lives in this repo) — completely, all parts — and `.claude/CLAUDE.md` plus the agent instructions under `docs/`.

**Your stance for this whole session:** You are a skeptical external auditor, not the author. Assume the previous run cut corners under time pressure — that is the normal outcome of implementing many features in one go. Look for **evidence**, never for intent. If something cannot be verified, write "nicht verifiziert" — never assume it works because it looks plausible or because a commit message says so.

**Hard rules for this session:**
- **Do NOT change, fix, refactor, or "improve" any code.** Not even small things. Not even obvious bugs — write them down instead.
- The only writes you may perform are: the safety tag/branch in Phase 0, and the final report file.
- No destructive git commands, ever: no `reset --hard`, no `checkout .`, no branch deletion, no force-push. If uncommitted changes exist, commit them to the current branch — never discard them.
- Report in **German**. Technical terms may stay English.

---

## Phase 0 — Stand sichern (before anything else)

1. `git status` — if there are uncommitted changes, commit them with message `WIP: Stand vor Audit gesichert`.
2. Create a safety tag and branch: `git tag stand-vor-audit` and `git branch backup/stand-vor-audit`.
3. Confirm both exist. Do not push anything.

## Phase 1 — Bestandsaufnahme (facts only, no judgment yet)

- Commit history of the run: how many commits, one giant blob or per-feature steps? Which branches exist?
- **Which features were actually attempted?** Go through F1 to F11 and classify each as: implemented / partially implemented / not started. Do not trust commit messages — check for the actual artifacts.
- Which files were added vs. **modified**. List every **upstream file** that was modified.
- Flyway: list `src/main/resources/db/migration/`. Which migrations are new? All in the fork's `V9xx__` range? Any collision with upstream numbering? Any *edited* rather than added? Do enum columns use native uppercase ENUMs?
- New backend artifacts (entities, repositories, services, controllers) and new frontend pages/components, grouped per feature.
- Tests: how many new test classes exist, and for which new artifacts do tests exist **at all**? Name the untested ones explicitly.
- Configuration: what was added to properties files? Any secret, key, or password committed anywhere — also check `git log -p` for secrets that were committed and later removed.

## Phase 2 — Regel-Compliance gegen den Master-Prompt

This phase is about the **rules**, not the features. Rule violations are structural and change how everything else must be read. Go through each block and give a verdict per rule: `eingehalten` / `verletzt` / `nicht verifizierbar`, each with concrete evidence (file paths, code references).

**§5 Repo-eigene Regeln:**
- Layering Controller → Service → Repository → Domain respected? Business logic in controllers anywhere?
- **Are JPA entities exposed through the API anywhere** (the repo forbids this — DTO + Mapper mandatory)?
- Constructor injection only? Any string-concatenated queries instead of parameterized `@Query`?
- Testing bar: service tests with Mockito, `@WebMvcTest` per endpoint (happy + error), `@DataJpaTest`, colocated Vitest — reality vs. requirement, quantified.
- Per-endpoint security checklist applied to new endpoints (input limits, upload types, path traversal, invalid IDs)?
- Frontend: design system respected (palette, page-header pattern, naming conventions, reused shipped components)? `npm run build` green?
- Were build plugins added to the POM that nobody asked for?

**§6 Fork-Regeln:**
- **Additive statt invasiv:** how large is the diff on upstream files, and was each modification unavoidable? (F3 is the sanctioned exception — everything else needs justification.)
- Flyway `V9xx__` range respected, no applied migration edited?
- Any sign the run worked against **real production data** instead of an anonymized dump?
- **Regeln vor KI:** is anything implemented as an LLM call that the prompt requires as deterministic code (markup calculation, SLA timers, dunning deadlines, folder naming, appointment confirmations)?
- **Preise nie vom Modell:** search the code explicitly — does any price value originate from an LLM response?
- **Human in the loop:** does any AI-generated artifact become a real record or get sent without explicit human confirmation? Any auto-send to customers beyond the permitted rule-based transactional sends?
- Automation logging present (who/what/when/input/output)?
- Permissions enforced server-side; GoBD intact (no code path mutating booked invoices — `/storno` only)?
- AGPL publishable state: no secrets, no customer data in the repo?

**§7 Arbeitsweise:** one feature per branch/changeset — document how far reality deviates, and whether plans/tests/manual-test scripts exist per feature.

**§9 Rollenmodell:** is the six-role model implemented as specified, incl. deputies, sub-account expiry, and the price-visibility rules? Compare the implemented matrix against the prompt's table row by row and list every deviation.

**§10 SECURITY GATE:** was anything configured that exposes the system beyond LAN/VPN (Cloudflare tunnel, port forwarding, public base URL, CORS wide open)? This is a critical finding if yes.

**§11 KI-Regeln:** paid Gemini endpoint only (no free-tier endpoint receiving customer data)? Structured output with schema validation and graceful degradation? Per-feature kill switch and system prompts in config? AI-call log implemented? One shared speech-to-structure service rather than parallel audio pipelines?

**§12 Verbotsliste:** go through it item by item. Especially: was anything built that the prompt explicitly forbids — interim auth in F1/F2, wiring into the legacy Abteilung scheme, **CI pipelines / GitHub Actions / Dependabot**, or any of the deliberately cut backlog ideas (§35a labor-cost block, review-request automation, subsidy workflow, tool registry, seasonal campaigns, customer upload portal, progress-billing audit, AI phone assistant)?

**§13 Definition of Done:** per implemented feature, tick the DoD list and report which boxes genuinely hold.

**§14 Geparkte Themen:** was anything built that is explicitly parked and needs approval — NAS integration, folder sync, document scan inbox, semantic document search, backup/server automation? Building parked items is a finding, not a bonus.

## Phase 3 — Feature-Abgleich

For **each** feature that Phase 1 found implemented or partially implemented, compare the master prompt's requirements and **acceptance criteria** against the code. Per feature: what is implemented, what is missing, which acceptance criteria you verified, which you could not, which clearly fail. Cite file paths — "implementiert" without a file reference is not an answer.

## Phase 4 — Risiko-Tiefenprüfung (this is the core of the audit)

**F3 (Anmeldung & Rechte) — highest risk:**
- Real authentication or a placeholder? Password hashing algorithm? Token lifetime, refresh, revocation?
- Were the `TODO(F3): enforce roles` markers from F1/F2 actually swept, or do they still sit in the code?
- **Enumerate every REST endpoint in the codebase and state per endpoint whether an authorization check exists. Name every endpoint still reachable unauthenticated.** This list is the single most important output of the audit.
- Does the role×endpoint test matrix exist and run green?
- Do Monteur/Azubi/Sub responses really contain no price fields (DTO/serializer level, not hidden UI columns)? Verify by reading the mapping or a test.
- Sub accounts: expiry enforced? Own-jobs-only scoping enforced server-side (reason about ID manipulation)?

**F7 (Preise & Kalkulation) — money risk:**
- Markup resolution order as specified (article override → product group → EK tier → default), customer-group factor multiplicative on top?
- EK selection rule when several supplier prices exist — implemented and deterministic?
- DATANORM import idempotent (same file twice → no duplicates)? Test proving it?
- Are calculations covered by unit tests, or only by manual clicking?
- Do rule changes leave already-sent offers untouched?

**Weitere implementierte Features:** for each, name the one thing that would hurt most if it is wrong, and check that one thing specifically.

## Phase 5 — Technische Verifikation (run it, don't guess)

- Backend build + tests (`.\mvnw.cmd test` on Windows) — record pass/fail and the actual failure output, not a summary.
- Both frontends: `npm run build` — record pass/fail.
- Does the application start and do the Flyway migrations apply against a **clean** database? If you cannot verify this safely, say so rather than claiming it.
- If `gitleaks`, `trivy` or `semgrep` are installed, run them over the repo and report findings. If not installed, report "nicht ausgeführt — Werkzeug fehlt". Do not install anything.

## Phase 6 — Bericht

Write the report to `docs/audit/AUDIT_<YYYY-MM-DD>.md` **in German**, structured as:

1. **Gesamturteil in drei Sätzen** — the honest summary a project lead can read to his boss.
2. **Regel-Compliance-Tabelle** (Phase 2): per rule block `eingehalten` / `verletzt` / `nicht verifizierbar` with evidence. Violations of §6 (fork rules), §10 (security gate), §12 (prohibitions) and §14 (parked) go first.
3. **Ampel-Tabelle je Feature**: `Brauchbar` / `Nacharbeit nötig` / `Neu bauen` — with 1–3 concrete reasons and file references per feature.
4. **Liste ungeschützter Endpoints** — or the explicit statement that none exist.
5. **Kritische Befunde**, most severe first: authentication, prices, GoBD, committed secrets, anything exposing the system externally.
6. **Priorisierte Maßnahmenliste**: what must be fixed before anything else, what can wait, what should be rebuilt rather than patched — with a rough effort estimate per item (hours/days).
7. **Die Kernfrage, klar beantwortet:** *„Darf dieses System in seinem jetzigen Zustand im Firmennetz mit echten Daten laufen — ja oder nein, und warum?"* If no, state exactly what is missing to make it yes.
8. **Was NICHT geprüft werden konnte** und warum.

Then stop. Do not propose or start any fix in this session — the report is the deliverable. Wait for my decision on what to tackle first.
