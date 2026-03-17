# DRIFT

> ✦ Your code has a pulse

A real-time 3D visualization of your GitHub development universe. Every repo becomes a galaxy, every commit becomes a star, every streak draws a constellation across your sky.

![DRIFT Preview](drift-preview.png)

## Features

- **🌌 3D Galaxy Scene** — Repos rendered as spiral/elliptical galaxies with commit stars, positioned on a Fibonacci sphere
- **✨ Commit Classification** — Stars colored by type: feature (blue), fix (amber), refactor (teal), docs (silver), CI (purple)
- **🔥 Streak Constellations** — Consecutive coding days form gold constellation lines
- **📸 Share Cards** — One-click 1200×630 PNG export with your stats overlaid on the 3D scene
- **🌠 Milky Way Band** — 4,000-particle band tilted to the galactic plane
- **🔴 Redshift Aging** — Older commits warm-shift over months
- **🎯 Galaxy Detail** — Click any galaxy to fly in and see repo stats
- **📱 Responsive** — Touch controls, mobile-friendly

## Try It

**[→ Launch DRIFT](https://rjlopezai.github.io/drift/)**

Enter any public GitHub username to visualize their development universe.

## Stack

- **Three.js** — 3D rendering engine
- **Vite** — Build tooling
- **GitHub REST API** — Public endpoints, no auth required
- **Vanilla JS** — Zero framework dependencies

## Design Language

| Token | Value |
|-------|-------|
| Void | `#060610` |
| Gold | `#c9b06b` |
| Glass | `rgba(12,12,28,0.88)` + `blur(20px)` |
| Font UI | Inter |
| Font Mono | JetBrains Mono |

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

---

**DRIFT** by VERITAS · Built by [@RJLopezAI](https://github.com/RJLopezAI)
