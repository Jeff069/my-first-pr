## Was wurde geändert?

<!-- Ein Satz: Welcher Bug / welches Verhalten? Verweis auf das Issue: Fixes #123 -->

## Wirkungsbereich

<!-- Welche Module/Prozessketten sind betroffen? (Ergebnis von Schritt 2 der Checkliste) -->

## Checkliste (siehe docs/BUGFIX-CHECKLISTE.md)

- [ ] Bug reproduziert, Schritte dokumentiert
- [ ] Alle Aufrufer/Verwender der geänderten Stelle geprüft, Kopien derselben Logik gesucht
- [ ] Test geschrieben, der den Bug zeigt (war rot, ist jetzt grün)
- [ ] Nur der minimale Fix — kein Refactoring, keine Drive-by-Änderungen in diesem PR
- [ ] Alle bestehenden Tests grün (inkl. Kettentests)
- [ ] Betroffene Kette manuell durchgeklickt
- [ ] Weniger als ~200 geänderte Zeilen (sonst aufteilen)
