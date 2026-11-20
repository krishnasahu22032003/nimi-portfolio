"use client";

/* components/HowItWorksTimeline.tsx   (or src/components/HowItWorksTimeline.tsx)
 *
 * BUILD · COMPOSE · INTERPRET · PERFORM — the same timeline as FABRICATION:
 *   · the same hand-drawn dots (white ring → small solid black dot for the current step)
 *   · the same thin grey line joining the dots
 *   · the same font (Comico, 10px, uppercase) for the names under the dots
 *   · the same function: click a dot (or its name) to go to that step, ← → keys move between steps
 *   · NO animation of any kind. It is part of the page it is placed in (not fixed to the screen).
 *
 * USE   <HowItWorksTimeline active="build" />  inside the page's section (ProjectBuild has it).
 *       For pages 103–108 put  <HowItWorksTimeline active="compose" />  (or "interpret" / "perform")
 *       and give that page's root <section> the attribute  data-hiw-step="compose"  so the dots can jump to it.
 *       A dot whose page is not on screen yet simply does nothing when clicked.
 *
 * PLACE  Uses the page's artboard grid (1440 × 900, --cu / --ax / --y0 set by the parent section, as in ProjectBuild).
 *        The row is centred on the page; its dots sit on the same line as the "HOW IT WORKS ?" title.
 */
import { useRef } from "react";
import type { CSSProperties, KeyboardEvent } from "react";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const STEPS = [
  { key: "build", label: "Build" },
  { key: "compose", label: "Compose" },
  { key: "interpret", label: "Interpret" },
  { key: "perform", label: "Perform" },
] as const;

const DOT_PITCH = 100; // centre of one dot → centre of the next (same as FABRICATION)
const CENTER_X = 720; //  the row is centred on the 1440 page
const DOT_Y = 104; //     centre of the dots = centre of the "HOW IT WORKS ?" title line

export type HiwStep = (typeof STEPS)[number]["key"];

/* ---------- the hand-drawn dots of FABRICATION / CONCEPT (same code, same seeds → the same dots) ---------- */
function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function blob(seed: number, r: number, wobble: number): string {
  const R = rnd(seed * 7919 + 13);
  const n = 9;
  const start = R() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const rr = r * (1 + (R() - 0.5) * wobble);
    pts.push([11 + Math.cos(a) * rr, 11 + Math.sin(a) * rr]);
  }
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(
      p2[1] - (p3[1] - p1[1]) / 6
    )} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}
const RINGS: string[] = Array.from({ length: 12 }, (_, i) => blob(i + 1, 7.4, 0.12));
const FILLS: string[] = Array.from({ length: 12 }, (_, i) => blob(i + 1, 5.4, 0.12));

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

const dotX = (i: number) => CENTER_X + (i - (STEPS.length - 1) / 2) * DOT_PITCH;

export default function HowItWorksTimeline({ active = "build" }: { active?: HiwStep }) {
  const rootRef = useRef<HTMLElement>(null);
  const current = Math.max(0, STEPS.findIndex((s) => s.key === active));

  /* go to a step: jump to its page if it is on screen (instantly, no animation), and keep keyboard focus on its dot */
  const goTo = (i: number, focus = false) => {
    const j = Math.min(STEPS.length - 1, Math.max(0, i));
    if (STEPS[j].key !== active) {
      document.querySelector<HTMLElement>(`[data-hiw-step="${STEPS[j].key}"]`)?.scrollIntoView({ block: "start" });
    }
    if (focus) rootRef.current?.querySelector<HTMLElement>(`[data-hiw-dot="${j}"]`)?.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(current + 1, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(current - 1, true);
    }
  };

  return (
    <nav ref={rootRef} className="hiw" aria-label="How it works steps" onKeyDown={onKey}>
      <div className="hiw-dots">
        <span
          className="hiw-line hiw-abs"
          aria-hidden="true"
          style={cssVars({ "--x": dotX(0), "--y": DOT_Y, "--w": dotX(STEPS.length - 1) - dotX(0) })}
        />
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            className={`hiw-dot hiw-abs${i === current ? " is-on" : ""}`}
            data-hiw-dot={i}
            aria-current={i === current ? "step" : undefined}
            aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.label}`}
            onClick={() => goTo(i)}
            style={cssVars({ "--x": dotX(i), "--y": DOT_Y - 15 })}
          >
            <svg className="hiw-dot-c" viewBox="0 0 22 22" aria-hidden="true">
              <path className="hiw-ring" d={RINGS[i % RINGS.length]} />
              <path className="hiw-fill" d={FILLS[i % FILLS.length]} />
            </svg>
            <span className="hiw-dot-l" aria-hidden="true">
              {s.label}
            </span>
          </button>
        ))}
      </div>
      <style>{CSS}</style>
    </nav>
  );
}

/* ------------------------------- CSS (no transitions, no animation) ------------------------------- */
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Comico&display=swap");
@font-face {
  font-family: "Comico"; font-style: normal; font-weight: 400; font-display: swap;
  src: local("Comico"), local("Comico Regular"), url("/fonts/Comico-Regular.woff2") format("woff2"), url("/fonts/Comico-Regular.ttf") format("truetype");
}

.hiw, .hiw-dots { display: contents; }

/* placed by artboard coordinates, same maths as the rest of the page: y0 + y * cu */
.hiw-abs {
  position: absolute;
  left: calc(var(--ax) + var(--x, 0) * var(--cu));
  top: calc(var(--y0) + var(--y, 0) * var(--cu));
}

/* the grey timeline line, behind the dots (the white ring hides it inside each dot) */
.hiw-line { z-index: 3; width: calc(var(--w) * var(--cu)); height: 1px; background: #d6d6d6; pointer-events: none; }

/* one step = a zero-size button at the dot's centre; the dot and the name hang off it */
.hiw-dot {
  z-index: 4; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: none; cursor: pointer; color: #000; overflow: visible;
  -webkit-tap-highlight-color: transparent;
}
.hiw-dot::before { /* bigger hit area: the dot AND its name */
  content: ""; position: absolute; left: calc(-35 * var(--cu)); top: calc(-8 * var(--cu)); width: calc(70 * var(--cu)); height: calc(56 * var(--cu));
}
/* the same dot as FABRICATION: a 21 × 22 box centred on the dot's x */
.hiw-dot-c {
  position: absolute; left: calc(-10.5 * var(--cu)); top: calc(4 * var(--cu));
  width: calc(21 * var(--cu)); height: calc(22 * var(--cu)); display: block; overflow: visible; border-radius: 50%;
}
.hiw-ring { fill: #fff; stroke: #000; stroke-width: 1.15; }
.hiw-fill { fill: #000; }
.hiw-dot .hiw-fill { display: none; }
.hiw-dot.is-on .hiw-ring { display: none; }  /* current step = the small solid black dot */
.hiw-dot.is-on .hiw-fill { display: block; }
.hiw-dot-l {
  position: absolute; left: 0; top: calc(34 * var(--cu)); white-space: nowrap; color: #000;
  transform: translateX(-50%);
  font-family: "Comico", "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-size: max(10px, calc(10 * var(--cu))); line-height: calc(14 * var(--cu)); font-weight: 400; font-synthesis: none; letter-spacing: .02em;
  text-transform: uppercase;
}
.hiw-dot:focus-visible { outline: none; }
.hiw-dot:focus-visible .hiw-dot-c { outline: 2px solid #000; outline-offset: 3px; }

/* ---- phones: a row of four dots across the page, names under them ---- */
@media (max-width: 820px) {
  .hiw { display: block; margin: 0 16px 24px; }
  .hiw-dots { display: flex; justify-content: space-between; }
  .hiw-abs { position: static; }
  .hiw-line { display: none; }
  .hiw-dot {
    flex: 1; width: auto; height: auto; padding: 8px 0; display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .hiw-dot::before { display: none; }
  .hiw-dot-c { position: static; width: 21px; height: 22px; }
  .hiw-dot-l { position: static; transform: none; font-size: 10px; line-height: 12px; text-align: center; }
}
`;