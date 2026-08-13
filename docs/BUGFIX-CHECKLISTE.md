# Bugfix-Checkliste (für jeden einzelnen Fix)

> Eine Seite. Gilt für **jeden** Bug, ohne Ausnahme. Die Langfassung mit Begründungen
> steht im [Stabilitäts-Playbook](../STABILITAETS-PLAYBOOK.md).

## Vor dem Fix

- [ ] **1. Reproduziert?** Exakte Schritte + Testdaten notiert. Ohne Reproduktion wird nicht gefixt.
- [ ] **2. Wirkungsbereich geklärt?** Alle Aufrufer/Verwender der Stelle gesucht
      (Find Usages / `grep -rn "funktionsname"`). Betroffene Module aufgeschrieben.
      Existiert dieselbe Logik noch an anderer Stelle (Kopien)?
- [ ] **3. Test geschrieben, der den Bug zeigt?** Der Test ist jetzt **rot**.

## Der Fix

- [ ] **4. Minimaler Fix.** Nur der Bug. Kein Aufräumen, kein Umbenennen, keine
      „wo ich schon mal hier bin"-Änderungen → dafür eigenes Issue anlegen.

## Nach dem Fix

- [ ] **5. Alle Tests grün?** Der neue Test **und** alle bestehenden (v. a. die Kettentests).
- [ ] **6. Kette manuell geprüft?** Die in Schritt 2 notierten Stellen einmal durchgeklickt.
- [ ] **7. Eigener Branch, kleiner Commit, CI abgewartet.** Ein Bug = ein Branch = ein Merge.
- [ ] **8. Erst bei grüner CI mergen.** Issue schließen mit Verweis auf den Commit.

## Sonderfall: Die Stelle ist zu verfilzt für einen minimalen Fix

1. Erst ein **eigener, verhaltensneutraler** Refactoring-Commit, abgesichert durch einen
   Charakterisierungstest (Ist-Verhalten festnageln, dann umbauen).
2. Dann der eigentliche Fix als **zweiter** Commit.
3. Löst der Umbau eine Kaskade aus: alles zurückrollen, Voraussetzung notieren,
   zuerst die Voraussetzung bauen (Mikado-Methode).
