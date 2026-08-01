# Das Orchester

Ein hierarchisches Prüf-Ensemble aus Agenten, das dein Projekt einmal gründlich
durchgeht — **und erst losläuft, wenn du das GO gibst.**

## Starten

```
/orchester
```

Der Dirigent verschafft sich einen Überblick, legt dir die **Besetzung** vor
(wer würde laufen, worüber, was kostet es ungefähr) — und wartet.
Erst dein **GO** setzt das Orchester in Bewegung.

Du kannst die Besetzung vorher kürzen: „nur Design und Bugs" oder
„nur der Ordner `src/dashboard`".

## Aufbau

| Ebene | Wer | Aufgabe |
|-------|-----|---------|
| 0 | **Dirigent** (`/orchester`) | GO-Sperre, Besetzung, Takt, Zusammenführung |
| 1 | `lead-code`, `lead-funktion`, `lead-oberflaeche` | Sektionen einteilen und verdichten |
| 2 | `pruefer-code`, `pruefer-bugs`, `pruefer-funktionen`, `pruefer-dashboard`, `pruefer-design` | die eigentliche Prüfung |
| 3 | Ad-hoc-Spezialisten | von den Prüfern selbst angefordert, wenn es tiefer geht |
| — | `archivar` | läuft zuletzt und allein, schreibt das Gelernte fort |

Der Dirigent spricht nur mit Ebene 1, Ebene 1 nur mit Ebene 2. So bleibt jeder
Kontext klein genug, um wirklich gründlich zu sein.

## Wie das Orchester dazulernt

Nach jedem Durchlauf verdichtet der `archivar` zwei Dateien:

- **`gedaechtnis.md`** — Wissen über *dein Projekt*: Eigenheiten, Fallen,
  wackelige Stellen, und was du als „so gewollt" bestätigt hast (wird dann nie
  wieder gemeldet).
- **`playbook.md`** — Wissen über *das Prüfen selbst*: was Befunde brachte, was
  Leerlauf war, welche Falschmeldung woran lag, welcher Zuschnitt zu groß war.

Beide werden vor dem nächsten Durchlauf gelesen. Durchlauf 3 ist deshalb
deutlich schärfer als Durchlauf 1.

Braucht das Orchester dreimal denselben Ad-hoc-Spezialisten, legt der Archivar
einen fertigen Entwurf unter `vorschlaege/` ab — **fest ins Ensemble aufgenommen
wird er nur von dir.**

## Hausregeln

1. Kein Befund ohne `datei:zeile`.
2. Kein Bug ohne konkreten Auslöser („wenn X, dann Y").
3. Jeder S1/S2-Befund wird einmal aktiv zu widerlegen versucht — das hält
   plausibel klingende Falschmeldungen draußen.
4. Was nicht geprüft werden konnte, wird namentlich genannt.
5. Geschmack wird als Vorschlag markiert, nie als Fehler.
6. **Kein Agent ändert Code.** Erst der Bericht, dann entscheidest du.

## Mögliche weitere Agenten

Noch nicht angelegt — sag Bescheid, welche du willst.

**Wenn echte Nutzer dranhängen:**

| Agent | Prüft |
|-------|-------|
| `pruefer-sicherheit` | Eingaben, Rechte, Geheimnisse im Code, Abhängigkeiten mit bekannten Lücken |
| `pruefer-daten` | Datenbank-Schema, Migrationen, Indizes, Datenverlust-Risiken, Backups |
| `pruefer-performance` | langsame Abfragen, N+1, Ladezeit, Speicherlecks, Bundle-Größe |
| `pruefer-barrierefreiheit` | Tastaturbedienung, Screenreader, Kontrast, Fokus |
| `pruefer-tests` | Abdeckung an den *wichtigen* Stellen, wackelige Tests, Tests die nichts prüfen |

**Wenn andere mitarbeiten:**

| Agent | Prüft |
|-------|-------|
| `pruefer-doku` | stimmt die README noch? Ist Setup nachvollziehbar? Doku vs. Code |
| `pruefer-abhaengigkeiten` | veraltete/verwaiste Pakete, Lizenzen, doppelte Bibliotheken |
| `pruefer-ci` | Build, Pipeline, Deployment, ob rote Tests wirklich blockieren |
| `pruefer-api` | Schnittstellenverträge, Versionierung, brechende Änderungen |

**Wenn es ums Produkt geht:**

| Agent | Prüft |
|-------|-------|
| `pruefer-texte` | Beschriftungen, Fehlermeldungen, Tonfall, Verständlichkeit |
| `pruefer-nutzerreise` | Erstnutzung, leerer Zustand, kann man sich verirren, wie viele Klicks |
| `pruefer-recht` | DSGVO, Cookies, Impressum, welche Daten wirklich gespeichert werden |
| `pruefer-kosten` | API-/Infrastrukturkosten, teure Schleifen, unnötige Aufrufe |
| `pruefer-i18n` | fest verdrahtete Texte, Datums-/Zahlenformate, lange Übersetzungen |

**Rollen statt Prüfgebiete** (die interessantesten):

| Agent | Rolle |
|-------|-------|
| `advocatus-diaboli` | versucht jeden Befund der anderen zu **widerlegen** — hält den Bericht ehrlich |
| `pruefer-vollstaendigkeit` | fragt am Ende nur: *was wurde nicht geprüft?* Sein Ergebnis ist die nächste Runde |
| `neuer-entwickler` | tut, als sähe er das Projekt zum ersten Mal, und stolpert dort, wo alle anderen betriebsblind sind |
| `chaos-agent` | macht absichtlich alles falsch: falsche Eingaben, doppelte Klicks, Verbindung kappen |
| `richter` | bekommt widersprüchliche Befunde zweier Sektionen und entscheidet, wer recht hat |

Ein Hinweis aus Erfahrung: mehr Agenten sind nicht automatisch besser. Ein
Durchlauf mit fünf gründlichen Prüfern schlägt einen mit zwanzig oberflächlichen.
Nimm die dazu, die zu deinem Projekt passen — der `archivar` sagt dir nach ein
paar Durchläufen selbst, welche fehlen.
