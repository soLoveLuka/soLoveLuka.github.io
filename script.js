/*
FILE: /styles.css
Receipts — Lux Minimal “White Room” UI
*/

:root {
  --paper: #fbfbfd;
  --paper-2: #f6f6fa;
  --ink: #0b0b0e;
  --ink-2: #14141a;

  /* neutral purple “whisper” (kept faint but unmistakably present) */
  --violet: #7b73ff;
  --violet-2: #a59fff;

  --line: rgba(10, 10, 14, 0.09);
  --line-2: rgba(10, 10, 14, 0.06);

  --shadow: 0 20px 50px rgba(10, 10, 14, 0.08);
  --shadow-2: 0 12px 30px rgba(10, 10, 14, 0.12);

  --radius: 18px;
  --radius-2: 26px;

  --mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --sans: "Inter", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: var(--sans);
  color: var(--ink);
  background: var(--paper);
  overflow-x: hidden;
}

/* White room illusion */
.theme-room::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -3;
  background:
    radial-gradient(1200px 900px at 50% 38%, rgba(123, 115, 255, 0.06), transparent 60%),
    radial-gradient(900px 700px at 20% 70%, rgba(10, 10, 14, 0.04), transparent 62%),
    linear-gradient(180deg, var(--paper), var(--paper-2));
}

.theme-room::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -2;

  /* Corner lines: extremely faint “room edges” */
  background:
    linear-gradient(90deg, transparent 0%, transparent 12%, rgba(10,10,14,0.05) 12.1%, transparent 12.2%, transparent 87.8%, rgba(10,10,14,0.05) 87.9%, transparent 88%),
    linear-gradient(180deg, transparent 0%, transparent 16%, rgba(10,10,14,0.05) 16.1%, transparent 16.2%, transparent 83.8%, rgba(10,10,14,0.05) 83.9%, transparent 84%),
    radial-gradient(900px 600px at 50% 0%, rgba(10,10,14,0.06), transparent 55%);

  opacity: 0.55;
  filter: blur(0.2px);
  transform: perspective(1200px) translateZ(-1px);
}

.room-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  opacity: 0.20;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");
  mix-blend-mode: multiply;
}

a {
  color: inherit;
  text-decoration: none;
}

.mono {
  font-family: var(--mono);
  letter-spacing: 0.02em;
}

.code {
  font-family: var(--mono);
  padding: 0.1rem 0.35rem;
  border-radius: 8px;
  background: rgba(10, 10, 14, 0.06);
}

.subtle {
  opacity: 0.72;
}

.muted {
  opacity: 0.72;
}

.dot {
  opacity: 0.55;
  margin: 0 0.35rem;
}

.section {
  width: min(1200px, calc(100% - 2.4rem));
  margin: 0 auto;
  padding: 5.2rem 0;
}

.section-head {
  margin-bottom: 1.6rem;
}

.section-title {
  font-size: clamp(1.8rem, 2.6vw, 2.5rem);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.section-sub {
  margin: 0;
  max-width: 68ch;
  line-height: 1.6;
  color: rgba(10, 10, 14, 0.74);
}

.kicker {
  font-size: 0.82rem;
  opacity: 0.78;
}

/* Topbar */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(10px);
  background: rgba(251, 251, 253, 0.72);
  border-bottom: 1px solid rgba(10, 10, 14, 0.08);
}

.topbar-inner {
  width: min(1200px, calc(100% - 2.4rem));
  margin: 0 auto;
  padding: 0.9rem 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  min-width: 140px;
}

.brand-mark {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--ink);
  box-shadow:
    0 0 0 6px rgba(123, 115, 255, 0.09),
    0 0 0 1px rgba(10, 10, 14, 0.06) inset;
}

.brand-text {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.nav {
  display: flex;
  gap: 1.1rem;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.nav-link {
  position: relative;
  padding: 0.55rem 0.35rem;
  border-radius: 10px;
  color: rgba(10, 10, 14, 0.78);
  transition: transform 220ms ease, color 220ms ease, background 220ms ease;
}

.nav-link:hover {
  background: rgba(10, 10, 14, 0.04);
  color: rgba(10, 10, 14, 0.95);
  transform: translateY(-1px);
}

.topbar-actions {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: flex-end;
  min-width: 140px;
}

.icon-btn {
  appearance: none;
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.8);
  border-radius: 999px;
  padding: 0.55rem 0.7rem;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(10, 10, 14, 0.06);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.30);
  box-shadow: 0 14px 26px rgba(10, 10, 14, 0.10);
}

.icon {
  font-family: var(--mono);
  font-size: 0.9rem;
}

/* Buttons */
.btn {
  appearance: none;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.9);
  border-radius: 999px;
  padding: 0.85rem 1.1rem;
  cursor: pointer;
  font-weight: 500;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, background 220ms ease;
  box-shadow: 0 14px 28px rgba(10, 10, 14, 0.08);
}

.btn:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.28);
  box-shadow: 0 20px 40px rgba(10, 10, 14, 0.12);
}

.btn.primary {
  background: var(--ink);
  color: var(--paper);
  border-color: rgba(10, 10, 14, 0.22);
  box-shadow:
    0 18px 45px rgba(10, 10, 14, 0.24),
    0 0 0 1px rgba(123, 115, 255, 0.08) inset;
}

.btn.primary:hover {
  border-color: rgba(123, 115, 255, 0.40);
}

.btn.ghost {
  background: rgba(251, 251, 253, 0.55);
}

/* Black-hole hover with faint stars */
.hole-hover {
  position: relative;
  overflow: hidden;
}

.hole-hover::before {
  content: "";
  position: absolute;
  inset: -40%;
  opacity: 0;
  transform: scale(0.86);
  transition: opacity 240ms ease, transform 380ms cubic-bezier(0.16, 1, 0.3, 1);
  background:
    radial-gradient(circle at 50% 50%, rgba(10,10,14,0.96) 0 22%, rgba(10,10,14,0.72) 28%, rgba(10,10,14,0.00) 62%),
    radial-gradient(circle at 30% 35%, rgba(251,251,253,0.95) 0 1px, transparent 2px),
    radial-gradient(circle at 65% 42%, rgba(251,251,253,0.85) 0 1px, transparent 2px),
    radial-gradient(circle at 52% 70%, rgba(251,251,253,0.75) 0 1px, transparent 2px),
    radial-gradient(circle at 40% 62%, rgba(251,251,253,0.65) 0 1px, transparent 2px),
    radial-gradient(circle at 72% 68%, rgba(251,251,253,0.75) 0 1px, transparent 2px);
  filter: contrast(1.1);
}

.hole-hover:hover::before {
  opacity: 1;
  transform: scale(1);
}

.hole-hover > * {
  position: relative;
  z-index: 1;
}

/* Preloader */
.preloader {
  position: fixed;
  inset: 0;
  background: var(--paper);
  display: grid;
  place-items: center;
  z-index: 1000;
  transition: opacity 520ms ease, transform 520ms ease;
}

.preloader-core {
  display: grid;
  gap: 1.1rem;
  place-items: center;
}

.preloader-mark {
  width: 74px;
  height: 74px;
  position: relative;
}

.preloader-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.16);
  box-shadow: 0 0 0 10px rgba(123, 115, 255, 0.06);
  animation: spin 1.2s linear infinite;
}

.preloader-ring.ring-2 {
  inset: 10px;
  animation-duration: 1.65s;
  border-color: rgba(123, 115, 255, 0.22);
  box-shadow: 0 0 0 12px rgba(10, 10, 14, 0.03);
}

.preloader-label {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: rgba(10, 10, 14, 0.70);
}

.preloader-percent {
  margin-left: 0.4rem;
  color: rgba(123, 115, 255, 0.75);
}

.preloader.is-hidden {
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Hero */
.hero {
  padding-top: 3.2rem;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2.2rem;
  align-items: center;
}

.hero-title {
  font-size: clamp(2.8rem, 5.8vw, 5.2rem);
  margin: 0.2rem 0 0.8rem 0;
  letter-spacing: -0.05em;
  line-height: 0.92;
}

.hero-sub {
  margin: 0 0 1.4rem 0;
  font-size: 1.05rem;
  line-height: 1.7;
  max-width: 64ch;
  color: rgba(10, 10, 14, 0.74);
}

.accent {
  color: rgba(123, 115, 255, 0.86);
}

.hero-ctas {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.4rem;
}

.hero-meta {
  display: flex;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.meta-pill {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  padding: 0.5rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.75);
  box-shadow: 0 10px 22px rgba(10, 10, 14, 0.06);
}

/* Sculpt */
.hero-sculpt {
  display: grid;
  justify-content: end;
}

.sculpt-card {
  width: min(420px, 100%);
  border-radius: var(--radius-2);
  background: rgba(251, 251, 253, 0.72);
  border: 1px solid rgba(10, 10, 14, 0.10);
  box-shadow: var(--shadow);
  padding: 1.2rem;
}

.sculpt-room {
  border-radius: 22px;
  height: 240px;
  position: relative;
  background:
    radial-gradient(600px 320px at 30% 25%, rgba(123, 115, 255, 0.09), transparent 60%),
    linear-gradient(180deg, rgba(10, 10, 14, 0.02), rgba(10, 10, 14, 0.00));
  overflow: hidden;
}

.sculpt-line {
  position: absolute;
  opacity: 0.45;
}

.sculpt-line.l1 {
  inset: 14% 12% auto 12%;
  height: 1px;
  background: rgba(10, 10, 14, 0.10);
}

.sculpt-line.l2 {
  inset: auto 16% 18% 16%;
  height: 1px;
  background: rgba(10, 10, 14, 0.10);
}

.sculpt-line.l3 {
  inset: 16% auto 18% 50%;
  width: 1px;
  background: rgba(10, 10, 14, 0.08);
  transform: skewY(-9deg);
}

.sculpt-caption {
  margin-top: 0.9rem;
  opacity: 0.72;
  font-size: 0.8rem;
}

/* Music layout */
.music-layout {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 1.2rem;
  align-items: start;
}

.player-room {
  border-radius: var(--radius-2);
  background: rgba(251, 251, 253, 0.64);
  border: 1px solid rgba(10, 10, 14, 0.10);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.player-surface {
  padding: 1.2rem;
}

.player-core {
  display: grid;
  gap: 1.05rem;
}

.cylinder-wrap {
  position: relative;
  height: 280px;
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.08);
  background:
    radial-gradient(900px 400px at 50% 30%, rgba(123, 115, 255, 0.10), transparent 62%),
    linear-gradient(180deg, rgba(10, 10, 14, 0.02), rgba(10, 10, 14, 0.00));
  box-shadow: inset 0 0 0 1px rgba(251, 251, 253, 0.55);
  overflow: hidden;
  perspective: 1200px;
}

.cylinder {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: translateZ(-220px) rotateY(var(--cyl-rot, 0deg));
  transition: transform 820ms cubic-bezier(0.16, 1, 0.3, 1);
}

.cyl-panel {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 260px;
  height: 180px;
  transform-style: preserve-3d;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 20px 40px rgba(10, 10, 14, 0.14),
    0 0 0 1px rgba(251, 251, 253, 0.35) inset;
  background: rgba(10, 10, 14, 0.94);
}

.cyl-panel::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(600px 240px at 35% 35%, rgba(123, 115, 255, 0.20), transparent 58%),
    linear-gradient(90deg, rgba(251, 251, 253, 0.06), transparent 40%, rgba(251, 251, 253, 0.03));
  mix-blend-mode: screen;
  opacity: 0.75;
}

.cyl-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.15) contrast(1.08);
  opacity: 0.92;
}

.cylinder-shadow {
  position: absolute;
  inset: auto 10% 10% 10%;
  height: 24px;
  border-radius: 999px;
  background: radial-gradient(closest-side, rgba(10,10,14,0.28), transparent 70%);
  filter: blur(6px);
  opacity: 0.55;
}

/* Player UI */
.player-ui {
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.78);
  box-shadow: var(--shadow-2);
  padding: 1rem;
}

.track-top {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
  margin-bottom: 0.8rem;
}

.track-title {
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin-bottom: 0.25rem;
}

.track-meta {
  font-size: 0.82rem;
  opacity: 0.72;
}

.fav-btn {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.88);
  cursor: pointer;
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
  box-shadow: 0 12px 26px rgba(10, 10, 14, 0.08);
}

.fav-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.32);
  box-shadow: 0 18px 36px rgba(10, 10, 14, 0.12);
}

.fav-btn[aria-pressed="true"] {
  border-color: rgba(123, 115, 255, 0.45);
  box-shadow:
    0 18px 36px rgba(10, 10, 14, 0.12),
    0 0 0 6px rgba(123, 115, 255, 0.10);
}

.fav-mark {
  color: rgba(123, 115, 255, 0.84);
}

.wave-wrap {
  position: relative;
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.08);
  background:
    radial-gradient(900px 320px at 45% 20%, rgba(123, 115, 255, 0.09), transparent 60%),
    linear-gradient(180deg, rgba(10, 10, 14, 0.02), rgba(10, 10, 14, 0.00));
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
}

.scrub {
  position: absolute;
  inset: auto 0 0 0;
  padding: 0.8rem 0.9rem 0.75rem;
  background: linear-gradient(180deg, transparent, rgba(251, 251, 253, 0.92));
  border-top: 1px solid rgba(10, 10, 14, 0.07);
}

.scrub input[type="range"] {
  width: 100%;
  appearance: none;
  height: 10px;
  border-radius: 999px;
  background: rgba(10, 10, 14, 0.10);
  outline: none;
}

.scrub input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--ink);
  border: 3px solid rgba(251, 251, 253, 0.96);
  box-shadow: 0 0 0 6px rgba(123, 115, 255, 0.10);
  cursor: pointer;
}

.scrub input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--ink);
  border: 3px solid rgba(251, 251, 253, 0.96);
  box-shadow: 0 0 0 6px rgba(123, 115, 255, 0.10);
  cursor: pointer;
}

.time-row {
  margin-top: 0.55rem;
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  opacity: 0.78;
}

.time-divider {
  opacity: 0.55;
}

/* Transport */
.transport {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.7rem;
  margin-top: 0.9rem;
  flex-wrap: wrap;
}

.transport-btn {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.92);
  padding: 0.8rem 1rem;
  cursor: pointer;
  box-shadow: 0 14px 26px rgba(10, 10, 14, 0.08);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.transport-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.30);
  box-shadow: 0 18px 34px rgba(10, 10, 14, 0.12);
}

.transport-btn.play {
  background: var(--ink);
  color: var(--paper);
  border-color: rgba(10, 10, 14, 0.22);
}

.transport-right {
  display: flex;
  gap: 0.55rem;
  align-items: center;
}

.mini-btn {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.72);
  padding: 0.7rem 0.9rem;
  cursor: pointer;
  box-shadow: 0 12px 22px rgba(10, 10, 14, 0.07);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.mini-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.28);
  box-shadow: 0 18px 34px rgba(10, 10, 14, 0.10);
}

/* Lyrics drawer */
.lyrics-drawer {
  margin-top: 0.9rem;
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.82);
  box-shadow: 0 16px 34px rgba(10, 10, 14, 0.08);
  overflow: hidden;
}

.lyrics-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid rgba(10, 10, 14, 0.08);
}

.lyrics-body {
  padding: 0.85rem 0.85rem 1rem;
  line-height: 1.7;
  color: rgba(10, 10, 14, 0.80);
  max-height: 240px;
  overflow: auto;
}

.lyrics-body p {
  margin: 0 0 0.85rem 0;
}

/* Share row */
.share-row {
  margin-top: 0.85rem;
  display: flex;
  gap: 0.6rem;
  align-items: center;
  flex-wrap: wrap;
}

.share-chip {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.80);
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(10, 10, 14, 0.07);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.share-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.28);
  box-shadow: 0 18px 32px rgba(10, 10, 14, 0.10);
}

.share-hint {
  opacity: 0.65;
  font-size: 0.78rem;
}

/* Library */
.library {
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.64);
  box-shadow: var(--shadow);
  overflow: hidden;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.library-head {
  padding: 1rem 1rem 0.7rem;
  border-bottom: 1px solid rgba(10, 10, 14, 0.08);
}

.filters {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.chip {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.84);
  padding: 0.55rem 0.85rem;
  cursor: pointer;
  box-shadow: 0 10px 22px rgba(10, 10, 14, 0.06);
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}

.chip:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.28);
  box-shadow: 0 16px 28px rgba(10, 10, 14, 0.10);
}

.chip.is-active {
  border-color: rgba(123, 115, 255, 0.42);
  box-shadow:
    0 16px 28px rgba(10, 10, 14, 0.10),
    0 0 0 6px rgba(123, 115, 255, 0.10);
}

.albums {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tracklist {
  padding: 0.7rem;
  overflow: auto;
}

.track-item {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem;
  border-radius: 16px;
  border: 1px solid rgba(10, 10, 14, 0.08);
  background: rgba(251, 251, 253, 0.78);
  box-shadow: 0 12px 22px rgba(10, 10, 14, 0.05);
  cursor: pointer;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
  margin-bottom: 0.6rem;
}

.track-item:hover {
  transform: translateY(-1px);
  border-color: rgba(123, 115, 255, 0.24);
  box-shadow: 0 18px 34px rgba(10, 10, 14, 0.10);
}

.track-item.is-playing {
  border-color: rgba(123, 115, 255, 0.48);
  box-shadow:
    0 18px 34px rgba(10, 10, 14, 0.12),
    0 0 0 6px rgba(123, 115, 255, 0.10);
}

.track-cover {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(10, 10, 14, 0.92);
  overflow: hidden;
  box-shadow: 0 12px 22px rgba(10, 10, 14, 0.12);
}

.track-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(1.2) contrast(1.05);
  opacity: 0.92;
}

.track-name {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.track-sub {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  opacity: 0.72;
}

.track-actions {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.small {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.86);
  padding: 0.45rem 0.6rem;
  cursor: pointer;
  box-shadow: 0 10px 18px rgba(10, 10, 14, 0.06);
}

.library-foot {
  padding: 0.8rem 1rem;
  border-top: 1px solid rgba(10, 10, 14, 0.08);
}

.foot-note {
  font-size: 0.78rem;
  opacity: 0.68;
}

/* Panels */
.panel {
  border-radius: var(--radius-2);
  border: 1px solid rgba(10, 10, 14, 0.10);
  background: rgba(251, 251, 253, 0.64);
  box-shadow: var(--shadow);
  padding: 1.2rem;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.panel h3 {
  margin: 0 0 0.6rem 0;
  letter-spacing: -0.01em;
}

.panel p {
  margin: 0;
  line-height: 1.7;
  color: rgba(10, 10, 14, 0.78);
}

/* Contact form */
.contact-form {
  max-width: 760px;
}

.field {
  display: grid;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

input,
textarea {
  font-family: var(--sans);
  font-size: 1rem;
  padding: 0.85rem 0.95rem;
  border-radius: 16px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(251, 251, 253, 0.86);
  outline: none;
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

input:focus,
textarea:focus {
  border-color: rgba(123, 115, 255, 0.42);
  box-shadow: 0 0 0 6px rgba(123, 115, 255, 0.10);
}

.form-row {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-wrap: wrap;
}

.footer {
  padding: 2.8rem 0 4rem;
  border-top: 1px solid rgba(10, 10, 14, 0.08);
}

.footer-inner {
  width: min(1200px, calc(100% - 2.4rem));
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

/* Toast */
.toast {
  position: fixed;
  inset: auto 1.2rem 1.2rem auto;
  z-index: 80;
  width: min(520px, calc(100% - 2.4rem));
}

.toast-inner {
  border-radius: 999px;
  border: 1px solid rgba(10, 10, 14, 0.12);
  background: rgba(10, 10, 14, 0.92);
  color: var(--paper);
  box-shadow: 0 24px 60px rgba(10, 10, 14, 0.24);
  padding: 0.7rem 0.8rem 0.7rem 1rem;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
}

.toast-msg {
  font-family: var(--mono);
  font-size: 0.85rem;
  opacity: 0.92;
}

/* Deep mode */
body.deep-mode .topbar,
body.deep-mode .player-room,
body.deep-mode .library,
body.deep-mode .panel {
  background: rgba(10, 10, 14, 0.88) !important;
  color: var(--paper);
  border-color: rgba(251, 251, 253, 0.12);
}

body.deep-mode .section-sub,
body.deep-mode .hero-sub,
body.deep-mode .panel p {
  color: rgba(251, 251, 253, 0.74) !important;
}

body.deep-mode .brand-mark {
  background: var(--paper);
  box-shadow: 0 0 0 6px rgba(123, 115, 255, 0.14);
}

body.deep-mode input,
body.deep-mode textarea,
body.deep-mode .track-item,
body.deep-mode .player-ui,
body.deep-mode .lyrics-drawer {
  background: rgba(251, 251, 253, 0.06) !important;
  color: var(--paper) !important;
  border-color: rgba(251, 251, 253, 0.14) !important;
}

body.deep-mode .transport-btn.play {
  background: var(--paper);
  color: var(--ink);
}

/* Responsive */
@media (max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr;
  }

  .hero-sculpt {
    justify-content: start;
  }

  .music-layout {
    grid-template-columns: 1fr;
  }

  .about-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}
