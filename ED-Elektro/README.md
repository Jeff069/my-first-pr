# ED-Elektro — Projektunterlagen

Planungsunterlagen für den Umbau des Handwerker-ERP (Fork von
`Winfo2024Kuhn/ERP-System-fuer-Handwerksbetriebe`) für unseren Betrieb
mit den Gewerken Klima, Elektro und Sanitär.

## Inhalt

| Datei | Zweck | Für wen |
|---|---|---|
| [`Master-Prompt.md`](./Master-Prompt.md) | Englischer Arbeitsauftrag für den Coding-Agenten: Codebasis-Fakten, Regeln, Rollenmodell, Features F1–F11, Definition of Done, Ideen-Backlog | Entwicklung — ins ED-Elektro-Clone legen (z. B. als `CLAUDE.local.md`) |
| [`Aenderungsliste.md`](./Aenderungsliste.md) | Deutsche Stichpunktliste aller beschlossenen Änderungen, Grundsätze und geparkten Themen | Abstimmung mit GF / Bereichsleitung |
| [`Kalkulation-Prompt.md`](./Kalkulation-Prompt.md) | Eigenständiger Bau-Prompt für die Angebotskalkulation (Powerbird-Ablösung): Stufen K1–K8 von der Zuschlags-Engine über Datanorm-Import und Leistungskatalog bis Kalkulationsmaske, PDF, Nachkalkulation und Umstieg — inkl. Ablöse-Checkliste | Entwicklung; Ablöse-Checkliste auch fürs GF-Gespräch |
| [`Powerbird-Analyse.md`](./Powerbird-Analyse.md) | Recherche-Dossier zur bisherigen Software als Vorbild: Kalkulationsmuster, Positionsarten, Lohnminuten-Quellen (KFE/ZVEH, SIRADOS), Migrationsweg | Grundlage des Kalkulations-Prompts |
| [`Audit-Prompt.md`](./Audit-Prompt.md) | Gesamtprüfung des vorhandenen Codes gegen den Master-Prompt (Regel-Compliance, Feature-Abgleich, Risiko-Tiefenprüfung) — prüft nur, repariert nichts | Nach größeren Bau-Läufen |
| [`Kopiervorlagen.md`](./Kopiervorlagen.md) | Kurze Kopierblöcke: ein Block pro Sitzung für F1–F11 plus Sitzungsstart/-ende und Abbruch | Täglicher Gebrauch |
| [`QS-Security-Prompt.md`](./QS-Security-Prompt.md) | Englischer Companion-Prompt für Qualitätssicherung & Cyber-Security: Normen-Stand (ISO 27001:2022, 27701:2025, 42001, OWASP 2025), Bedrohungsmodell, Sicherheitsregeln je Baustein, vierteljährlicher Security-Check-up, Zertifizierungs-Treppe (CyberRisikoCheck → VdS 10000) | Entwicklung + Vorlage fürs GF-Gespräch zu Zertifizierungen |

## Nutzung

1. `Master-Prompt.md` in das ED-Elektro-Clone kopieren.
2. Session starten mit: *"Read the master prompt. Implement Feature F1."*
3. Features strikt in der Reihenfolge F1 → F11 abarbeiten, ein Feature pro Branch.

## Vor der Chef-Demo

- Analyse der letzten 30 Angebote (anonymisiert, ohne Code) durchführen und Ergebnisse mitbringen
- F1 (Berichtsheft-Generator) und F9a (Kalkulations-Check) als Live-Demo vorbereiten

## Wichtiger Hinweis

Bis Feature F3 (Login + Rechte) fertig ist, darf das System **nicht** über das
Firmennetz/VPN hinaus erreichbar sein — die mobile Zeiterfassung des Upstream-Projekts
läuft ohne Authentifizierung (Upstream-Issue #72).
