# Design- & Motion-Leitfaden: Dunkle, kinoreife Studio-Web-App

Synthese aus vier Skills (LottieFiles motion-design, threejs-skills, design-dna, gsap-skill) — vereinheitlicht auf **eine** Motion-Persönlichkeit: **Premium/Cinematic**. Alle Muster sind in self-contained Vanilla HTML/CSS/JS umsetzbar (keine Libraries, keine CDNs).

---

## 1. Die wichtigsten Regeln (priorisiert)

1. **Eine Motion-Identität, konsequent:** Persönlichkeit „Premium/Cinematic" — Dauern 350/500/800 ms (quick/standard/slow), **eine** Signature-Easing-Kurve `cubic-bezier(0.4, 0, 0.2, 1)` für ~80 % aller Animationen, **0 % Overshoot** (kein Bounce — Bounce wirkt verspielt, nicht kinoreif).
2. **Alles als CSS Custom Properties in `:root`:** `--ease`, `--ease-out`, `--ease-in`, `--duration-micro/normal/macro`, `--color-*`, `--radius-*`, `--shadow-low/med/high`. Komponenten konsumieren nur Variablen, nie hartkodierte Werte.
3. **Nur `transform` und `opacity` animieren.** Niemals `left/top/width/height/margin` (Layout-Thrashing, ruckelt). Ziel: 60 fps.
4. **Richtungsregel Easing:** Entrance = ease-out (dezelerierend), Exit = ease-in (akzelerierend), Bewegung auf dem Screen = ease-in-out, Ambient-Loops = sinusbasiert, Spinner/Progress = linear. `linear` **nie** für räumliche Bewegung.
5. **Exits kürzer als Entrances:** 65–75 % der Entrance-Dauer. Nutzer priorisieren, was erscheint.
6. **Drei Motion-Layer für Kino-Qualität:** Primary (Hauptaktion) + Secondary (Schatten, Icons, Begleitbewegung) + Ambient (Gradient-Drift, Floating, Puls). Ambient-Amplitude max. 10–20 % der Primärbewegung — darf nie um Aufmerksamkeit konkurrieren.
7. **Choreografie statt Gleichzeitigkeit:** Hero-Element führt (zuerst, prominentester Eintritt), dann Panels gestaffelt, dann Details. Alle Elemente aus derselben Richtung. Gesamt-Stagger hart unter 500 ms.
8. **Weiche Kopplung statt direkter:** Maus-Parallax, Cursor-Glow, Kamera-Drift immer gedämpft nachziehen (`wert += (ziel - wert) * 0.06` im rAF-Loop) und clampen — das träge Nachfedern ist das „Premium-Gefühl". Delta-Time-basiert, nie feste Per-Frame-Inkremente.
9. **`prefers-reduced-motion` ist Pflicht:** Animation überspringen, Endzustand sofort setzen. Zusätzlich Low-End-Fallback (`navigator.hardwareConcurrency <= 2` → Ambient/Canvas-Effekte deaktivieren).
10. **Filmische Effekte dezent:** Glow nur auf die hellsten Akzente (Bloom-Analogie: hoher Threshold), Vignette als `radial-gradient`-Overlay (transparent → `rgba(0,0,0,0.4)`), Film-Grain via SVG `feTurbulence` bei sehr niedriger Opacity. Jeder Effekt abschaltbar.
11. **Licht-Systematik 1 : 0.5 : 0.3** (Key/Fill/Rim) auf CSS übertragen: ein dominanter Licht-Akzent (Glow/Gradient), gedämpfter Gegenpol, subtile Kante — plus warm/kalt-Kontrast (z. B. warmes Amber gegen kühles Blau) für Tiefe im Dark Theme.
12. **Hygiene:** `will-change: transform, opacity` nur unmittelbar vor der Animation setzen, danach zurück auf `auto`. rAF statt `setInterval`, `ResizeObserver` für Canvas, Listener/Loops beim Entfernen aufräumen. Kontrast mind. 4.5:1 (Fließtext) / 3:1 (großer Text).

---

## 2. Timing/Easing-Tabelle

| Kategorie | Dauer | Easing (cubic-bezier) | Einsatz |
|---|---|---|---|
| **Mikro-Interaktion** (Hover, Press, Toggle, Fokus) | Hover-Einstieg ≤ 100 ms, Press 80 ms, Release/Settle 150–200 ms, Hover-Ausstieg 150–200 ms | Einstieg: `cubic-bezier(0.33, 1, 0.68, 1)` (easeOutCubic) · Ausstieg: `cubic-bezier(0.65, 0, 0.35, 1)` | Buttons scale 0.98→1.0, Cards lift 1.01–1.02 + Schatten, Icons scale 1.1 |
| **Element-Reveal** (Cards, Panels, Listen) | 350–500 ms · Stagger 80 ms/Element (gesamt < 400–500 ms) | `cubic-bezier(0.05, 0.7, 0.1, 1)` (MD3 Emphasized — dramatisches Dezelerieren, ideal für Kino-Look) | opacity 0→1, translateY 20–24 px→0, scale 0.96→1 |
| **Element-Exit** | 250–350 ms (≈ 0.7× Entrance) | `cubic-bezier(0.3, 0, 1, 1)` (MD3 Accelerate) | fade + translateY oder scale → 0.96 |
| **Szenen-/Seiten-Übergang** | Exit 300 ms, dann Entrance 400–600 ms mit 100 ms Delay; Modals 300–400 ms | Exit: `cubic-bezier(0.3, 0, 1, 1)` · Entrance: `cubic-bezier(0.05, 0.7, 0.1, 1)` · Shared Elements: `cubic-bezier(0.65, 0, 0.35, 1)` | Crossfade + gerichteter Slide; Reveal per `clip-path` 300–500 ms für dramatische Momente |
| **Ambient** (Dauerbewegung) | Breathing 3000–4000 ms · Floating 3500–5500 ms · Gradient-Drift 8000–20000 ms · Shimmer 1500–2500 ms | sinusartig: `ease-in-out` bzw. Keyframes mit `animation-direction: alternate` | scale 0.98–1.02, translateY ±8–12 px, background-position-Drift |

Als Tokens:

```css
:root {
  --ease:        cubic-bezier(0.4, 0, 0.2, 1);   /* Signature, 80% aller Fälle */
  --ease-out:    cubic-bezier(0.05, 0.7, 0.1, 1); /* Entrances/Reveals */
  --ease-in:     cubic-bezier(0.3, 0, 1, 1);      /* Exits */
  --ease-inout:  cubic-bezier(0.65, 0, 0.35, 1);  /* Morph, On-Screen-Bewegung */
  --duration-micro: 150ms;
  --duration-normal: 400ms;
  --duration-macro: 700ms;
  --stagger: 80ms;
}
```

---

## 3. Animations-Muster für maximalen „Studio"-Eindruck

### 3.1 Gestaffelter Cinematic Reveal (Hero → Panels → Details)

Der wichtigste Einzeleffekt. IntersectionObserver + `transition-delay` über eine Index-Variable.

```css
.reveal {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
  transition: opacity var(--duration-normal) var(--ease-out),
              transform var(--duration-normal) var(--ease-out);
  transition-delay: calc(var(--i, 0) * var(--stagger));
}
.reveal.is-visible { opacity: 1; transform: none; }
```

```js
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) {
    e.target.classList.add('is-visible');
    io.unobserve(e.target);
  }
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.setProperty('--i', i % 8);   // Stagger-Budget begrenzen
  io.observe(el);
});
```

Choreografie: Hero bei 0 ms (Dauer 500–600 ms), Panels ab 150 ms mit 80 ms Stagger, Metadaten/Details zuletzt — alles komplett bei ≈ 700 ms.

### 3.2 Gedämpfter Cursor-Parallax / Spotlight

Das träge Nachziehen erzeugt den Premium-Charakter. Maus auf −1..1 normalisieren, mit Faktor 0.05–0.08 pro Frame dämpfen, clampen.

```js
let tx = 0, ty = 0, x = 0, y = 0;
addEventListener('pointermove', (e) => {
  tx = (e.clientX / innerWidth) * 2 - 1;
  ty = -((e.clientY / innerHeight) * 2 - 1);
});
(function loop() {
  x += (tx - x) * 0.06;                 // Damping
  y += (ty - y) * 0.06;
  hero.style.transform =
    `translate(${x * 12}px, ${-y * 8}px)`;   // Amplitude geclampt (max ~12px)
  glow.style.transform = `translate(${x * -20}px, ${y * 14}px)`; // Counter-Motion, ~20-30% Tempo-Gefühl
  requestAnimationFrame(loop);
})();
```

Counter-Motion (Ambient-Glow entgegengesetzt zum Hero) verstärkt die Tiefenwirkung. Bei `prefers-reduced-motion` den Loop gar nicht starten.

### 3.3 Ambient-Schicht: desynchronisiertes Floating + Gradient-Drift

Hintergrundleben ohne Ablenkung — unterschiedliche Zyklusdauern und negative Delays verhindern Synchronität.

```css
@keyframes float { from { transform: translateY(-10px); } to { transform: translateY(10px); } }
@keyframes drift { from { background-position: 0% 50%; } to { background-position: 100% 50%; } }

.orb-1 { animation: float 4000ms ease-in-out infinite alternate; }
.orb-2 { animation: float 5500ms ease-in-out -1600ms infinite alternate; }
.orb-3 { animation: float 3500ms ease-in-out -2100ms infinite alternate; }
.bg    { background: linear-gradient(120deg, #0a0e1a, #141a2e, #0a0e1a);
         background-size: 300% 300%;
         animation: drift 16000ms ease-in-out infinite alternate; }

@media (prefers-reduced-motion: reduce) {
  .orb-1, .orb-2, .orb-3, .bg { animation: none; }
}
```

Dazu Vignette als fixiertes Overlay: `radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45))`.

### 3.4 Szenen-Übergang (View-Wechsel) mit gerichteter Staffelung

Alte Szene beschleunigt hinaus, neue dezeleriert herein — nie hart schneiden.

```js
async function wechsleSzene(alt, neu) {
  alt.style.transition = 'opacity 300ms cubic-bezier(0.3,0,1,1), transform 300ms cubic-bezier(0.3,0,1,1)';
  alt.style.opacity = '0';
  alt.style.transform = 'translateX(-32px)';
  await new Promise(r => setTimeout(r, 300));
  alt.hidden = true;

  neu.hidden = false;
  neu.style.opacity = '0';
  neu.style.transform = 'translateX(32px)';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    neu.style.transition = 'opacity 500ms cubic-bezier(0.05,0.7,0.1,1), transform 500ms cubic-bezier(0.05,0.7,0.1,1)';
    neu.style.opacity = '1';
    neu.style.transform = 'none';
  }));
}
```

Innerhalb der neuen Szene läuft danach Muster 3.1 (gestaffelter Reveal).

### 3.5 Status-Feedback: Press, Success, Error

```css
.btn { transition: transform var(--duration-micro) var(--ease); }
.btn:active { transform: scale(0.98); transition-duration: 80ms; } /* Premium: kein Overshoot */

@keyframes shake { /* Error: bestimmt, 0% Overshoot */
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-12px); } 40% { transform: translateX(10px); }
  60% { transform: translateX(-6px); }  80% { transform: translateX(4px); }
}
.error { animation: shake 350ms ease-in-out; }
```

Success-Checkmark: Container scale 0.9→1.0 (200 ms, ease-out), SVG-Häkchen via `stroke-dashoffset` in 150 ms mit 100 ms Delay zeichnen, Farbwechsel 200 ms — gesamt ≈ 300 ms.

---

## 4. Typische Fehler, die vermieden werden müssen

- **Persönlichkeiten mischen:** Bouncy-Overshoot neben Premium-Glide zerstört die Identität. Premium = 0 % Overshoot, überall.
- **`left/top/width/height/margin` animieren** statt `transform/opacity` → Layout-Reflows, Ruckeln.
- **`linear` für räumliche Bewegung** (nur für Spinner/Progress/Deko-Rotation erlaubt).
- **Opacity-only für wichtige State-Changes** — immer mit `translate` oder `scale` kombinieren, sonst wirkt es billig.
- **Alles gleichzeitig animieren:** Bei 3+ Elementen bewegt sich max. ⅓ zugleich; Gesamt-Stagger nie über 500 ms; Exit nie länger als Entrance.
- **Ambient zu laut:** Amplituden über 20 % der Primärbewegung oder synchron pulsierende Elemente lenken ab statt Atmosphäre zu schaffen.
- **`will-change` dauerhaft gesetzt lassen** → Memory-Bloat. Nur vor der Animation setzen, danach `auto`.
- **`setTimeout`/`setInterval` für Animations-Loops** statt `requestAnimationFrame`; feste Per-Frame-Inkremente statt Delta-Time/Damping → framerate-abhängige Geschwindigkeit.
- **`prefers-reduced-motion` ignorieren** und keine Low-End-Fallbacks — Ambient/Canvas-Effekte müssen `enabled=false`-fähig sein.
- **Ungeclampte Parallax-/Tilt-Effekte:** Immer Grenzen setzen (max. ~12–30 px Versatz); Scroll-Parallax unter 100 px halten und auf Mobile weglassen.
- **Effekt-Overkill:** Chromatic Aberration, Grain, Glow gleichzeitig und stark → Effekte müssen unterschwellig bleiben (Grain-Opacity < 5 %, Glow nur auf hellste Akzente, 1 Property = direkt, 2 = poliert, 3+ = überladen).
- **Loops/Listener nicht aufräumen:** rAF-Loops und Observer beim Entfernen von Views stoppen, sonst Memory-Leaks bei Szenenwechseln.
- **Zu dunkler Text auf dunklem Grund:** Kontrast 4.5:1 (Body) / 3:1 (groß) einhalten — Kino-Look entsteht durch Licht-Hierarchie, nicht durch unlesbaren Text.

---

## Quellen

Destilliert aus vier öffentlichen Skill-Vorlagen:

- CloudAI-X/threejs-skills (Szenen-Ästhetik, Damping, filmische Effekt-Parameter)
- zanwei/design-dna (Token-System, Motion-Philosophie, Performance-Tiers)
- LottieFiles/motion-design-skill (Timing-/Easing-Tabellen, Motion-Personality, MIT-Lizenz)
- martinholovsky/claude-skills-generator → skills/gsap (Orchestrierung, Performance-Regeln)
