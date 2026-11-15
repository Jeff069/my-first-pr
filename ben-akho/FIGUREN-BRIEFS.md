# Figuren-Briefs – Ben und Kevin

Methode aus dem Skill `character-consistency` (NIGO Studio, MIT): Je genauer die Figur beschrieben ist, desto stabiler bleibt sie. Was nicht im Text steht, existiert für das Modell nicht.

**Ablauf pro Figur**
1. **Nahaufnahme** erzeugen (Brustbild, frontal, kühles Grau), mehrere Versionen, die beste wird „die Figur".
2. **3-Felder-Sheet** im Querformat mit der Nahaufnahme als einzigem Referenzbild.
3. In jedem späteren Prompt die **Rollen-Zeile** verwenden und die Merkmale in Worten wiederholen.

**Modelle (Website, Unlimited prüfen):** Nahaufnahme mit **Nano Banana 2** (für Comic-Figuren empfohlen), Sheet mit **Seedream 5.0 Pro** (für Charakter-Sheets empfohlen) oder ebenfalls Nano Banana 2.

**Wichtig:** Im Sheet steckt nur der **Zeichenstil**, keine Szenen-Stimmung (kein Neon, keine Nacht). Ein neutrales Sheet passt in jede Szene.

---

## Ben Akho

```text
NAME:        Ben Akho
AGE / BUILD: man in his mid-20s, average height, solid athletic build, relaxed upright posture
FACE:        warm medium-brown skin; dark brown eyes with slightly heavy lids that give a calm, unimpressed look;
             thick dark straight eyebrows; straight nose; small mole on the left cheek;
             full black beard, neatly trimmed with a sharp cheek line, connected moustache
HAIR:        short tight black curls on top, skin fade on the sides
OUTFIT:      black crew-neck cotton sweatshirt, slightly oversized, with "069 Frankfurt" in off-white gothic
             blackletter on the chest; brown leather belt with a gold buckle; straight dark-washed blue jeans,
             slightly faded at the thighs; red-and-white retro running sneakers without logos;
             one white cigarette tucked behind his right ear
PROP:        blue-silver energy drink can, always held in his right hand
EXPRESSION:  calm and slightly bored, lips closed, one eyebrow a little raised
```

### Nahaufnahme (9:16 oder 3:4, keine Referenz)
```
Chest-up portrait of Ben Akho, a man in his mid-20s, front view facing the camera, plain cool grey background, even soft studio light.
EYES: dark brown eyes with slightly heavy lids, calm and unimpressed look, thick dark straight eyebrows, one brow slightly raised.
SKIN: warm medium-brown skin, straight nose, small mole on the left cheek.
BEARD AND HAIR: full black beard, neatly trimmed with a sharp cheek line, connected moustache; short tight black curls on top, skin fade on the sides; one white cigarette tucked behind his right ear.
EXPRESSION: calm, slightly bored, lips closed.
CLOTHING: black crew-neck sweatshirt with "069 Frankfurt" in off-white gothic blackletter on the chest.
Style: urban graphic novel, hand-drawn with clean dark outlines, controlled textures, soft finely graded shading, believable adult proportions, muted colors. Sharp focus on the eyes.
```

### 3-Felder-Sheet (16:9, Referenz = beste Nahaufnahme)
```
Character reference sheet of the same person, 16:9 landscape, three panels side by side on one seamless cool grey studio background.
Left panel (about 45% of the width): bust-up portrait, front view, facing camera.
Center panel: full body standing straight, front view, arms relaxed, feet visible.
Right panel: full body standing straight, rear view from directly behind, heels visible.
Even studio light, identical appearance in all three panels.
IDENTITY: warm medium-brown skin, dark brown calm eyes, thick dark eyebrows, small mole on the left cheek, full neatly trimmed black beard, short tight black curls with skin fade, white cigarette tucked behind his right ear; black crew-neck sweatshirt with "069 Frankfurt" in off-white gothic blackletter, brown leather belt with gold buckle, straight dark-washed blue jeans, red-and-white retro running sneakers, a blue-silver energy drink can in his right hand.
Style: urban graphic novel, hand-drawn with clean dark outlines, controlled textures, soft finely graded shading, believable adult proportions, muted colors.
```

### Rollen-Zeile für spätere Prompts
```
@Image 1 defines Ben's facial features, hairstyle, beard and clothing. Do not use the grey background or the panel layout.
```

---

## Kevin

```text
NAME:        Kevin
AGE / BUILD: man around 20, clearly adult, tall and lanky, taller than Ben, very skinny, long thin arms and legs,
             slightly hunched shoulders
FACE:        pale skin with a few faint blemishes; light grey-blue eyes, wide and nervous; eyebrows raised;
             thin patchy light-brown moustache and light stubble on the chin; a few drops of sweat on the forehead
HAIR:        short messy light-brown hair under the cap
OUTFIT:      dark charcoal baseball cap facing forward, slightly crooked; oversized light grey cotton crew-neck
             sweatshirt; matching very baggy light grey sweatpants with drawstring; small black nylon crossbody bag
             across the chest; worn white low sneakers without logos
PROP:        old smartphone with a spiderweb-cracked screen, held in his right hand
EXPRESSION:  anxious, brows raised, mouth slightly open
```

### Nahaufnahme (9:16 oder 3:4, keine Referenz)
```
Chest-up portrait of Kevin, a clearly adult man around 20, front view facing the camera, plain cool grey background, even soft studio light.
EYES: light grey-blue eyes, wide and nervous, eyebrows raised.
SKIN: pale skin with a few faint blemishes, a few drops of sweat on the forehead, thin patchy light-brown moustache and light stubble on the chin.
HAIR: short messy light-brown hair under a dark charcoal baseball cap facing forward, slightly crooked.
EXPRESSION: anxious, mouth slightly open.
CLOTHING: oversized light grey crew-neck sweatshirt, strap of a small black crossbody bag across the chest.
Style: urban graphic novel, hand-drawn with clean dark outlines, controlled textures, soft finely graded shading, believable adult proportions, muted colors. Sharp focus on the eyes.
```

### 3-Felder-Sheet (16:9, Referenz = beste Nahaufnahme)
```
Character reference sheet of the same person, 16:9 landscape, three panels side by side on one seamless cool grey studio background.
Left panel (about 45% of the width): bust-up portrait, front view, facing camera.
Center panel: full body standing, front view, arms relaxed, feet visible.
Right panel: full body standing, rear view from directly behind, heels visible.
Even studio light, identical appearance in all three panels.
IDENTITY: clearly adult man around 20, tall, lanky and very skinny with long thin arms and legs, slightly hunched; pale skin, light grey-blue nervous eyes, thin patchy light-brown moustache; short messy light-brown hair under a dark charcoal baseball cap facing forward; oversized light grey crew-neck sweatshirt, matching very baggy light grey sweatpants, small black nylon crossbody bag, worn white low sneakers without logos, an old smartphone with a cracked screen in his right hand.
Style: urban graphic novel, hand-drawn with clean dark outlines, controlled textures, soft finely graded shading, believable adult proportions, muted colors.
```

### Rollen-Zeile für spätere Prompts
```
@Image 2 defines Kevin's facial features, hairstyle, cap and clothing. Do not use the grey background or the panel layout.
```

---

## Checkliste für jedes Ergebnis
- Alle drei Felder zeigen **dieselbe Person im selben Outfit**
- **Kühles Grau**, keine Szene im Hintergrund
- **Klar erwachsen** (Kevin!), realistische Proportionen
- Kippe **hinterm Ohr** (Ben), Cap **nach vorne** (Kevin)
- Keine Logos
- Lieber mehrere Versionen erzeugen und die sauberste nehmen, als ein schlechtes Layout mit Prompt-Änderungen zu reparieren
