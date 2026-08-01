# Playbook — Wissen über das Prüfen selbst

Hier lernt das Orchester über sich. Gepflegt vom `archivar`, gelesen von allen
Agenten vor dem Start.

## Stufen

| Stufe | Bedeutung | Beispiel |
|-------|-----------|----------|
| S1 | kritisch — Datenverlust, Absturz, Sicherheitsloch | ungeprüfte Eingabe geht in eine SQL-Abfrage |
| S2 | hoch — falsches Verhalten für echte Nutzer | Summe im Dashboard zählt gelöschte Einträge mit |
| S3 | mittel — Wartbarkeit, Uneinheitlichkeit | derselbe Block viermal kopiert |
| S4 | kosmetisch | Tippfehler in einem Kommentar |

## Feste Regeln (aus Erfahrung)

1. Kein Befund ohne `datei:zeile`.
2. Kein Bug-Befund ohne konkreten Auslöser („wenn X, dann Y").
3. Jeder S1/S2-Befund wird einmal von einem frischen Agenten zu widerlegen versucht.
4. Was nicht geprüft werden konnte, wird namentlich genannt. Schweigen ist
   schlimmer als eine Lücke.
5. Geschmack wird als **Vorschlag** markiert, nie als Befund.
6. Kein Agent ändert Code. Erst Bericht, dann entscheidet der Nutzer.
7. Nur der `archivar` schreibt in Gedächtnis und Playbook — und nur allein.

## Lehren aus den Durchläufen
_(wird vom Archivar gefüllt)_
