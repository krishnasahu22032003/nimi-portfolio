"use client";

/* components/ProjectFabrication.tsx   (or src/components/ProjectFabrication.tsx)
 *
 * FABRICATION — a clickable timeline.
 *
 *   TIMELINE  METAL FRAME: Radius · Bending · Alignment · Welding · Finishing
 *             WOOD SEAT:   Cutting · Joinery · Reinforcement · Finishing
 *             Click a dot (or its name) → that stage's photos + captions come in.
 *             Click "METAL FRAME" → jumps to Radius · click "WOOD SEAT" → jumps to Cutting.
 *             DOTS are the same hand-drawn dots as CONCEPT (white ring → small solid black dot when open),
 *             joined by a thin grey line that shows the timeline.
 *             Every dot is the SAME distance from the next one (DOT_PITCH), in both groups.
 *   SPACING   (as marked by the designer)
 *             · "METAL FRAME" → first dot  =  last metal dot → "WOOD SEAT"  =  "WOOD SEAT" → first wood dot   (one value: gap)
 *             · page edge → "METAL FRAME"  =  last dot → page edge                (the row is centred on the page)
 *             The gap is calculated from the real width of the two names, so it stays exact in any font.
 *   ARROWS    ‹ › step to the previous / next stage (same as clicking the next dot). ← → keys work on the timeline too.
 *   FRAMES    ONE frame size for every photo = the frame of the first photo (301 × 379 on the 1440 × 900 artboard).
 *             The photo is cropped to fill the frame (object-fit: cover).
 *   NO SCROLL-DRIVEN MOTION — the section only changes when a dot or an arrow is clicked.
 *
 * UNITS  Everything is placed in "artboard px" taken from the design video (1440 × 900) and scaled with --cu,
 *        the same unit as CONCEPT / FORM EXPLORATION (1 Canva px). At 1440 × 900 it is pixel-for-pixel the design.
 *        Section title + intro + group names sit on the same left line as the other section titles (--edge-l).
 *        (Needs the same parent as the other sections: a container-type: inline-size ancestor, for 100cqw.)
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { FabGroup, FabImage, FabStage, FabricationData } from "../data/fabrication";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
/** the universal photo frame = the first photo of the design */
const FRAME_W = 301;
const FRAME_H = 379;
/** top of the photo frames */
const FRAME_Y = 317;
/** space between the bottom of a frame and the first line of its caption (frame bottom 696 → caption top 728) */
const CAP_GAP = 32;

/** photo rows: up to 3 photos use the design's spacing and start at x 198; 4 photos are tighter and centred */
const ROW_3 = { x0: 198, gap: 61 };
const ROW_4_GAP = 24;

/** TIMELINE SPACING (artboard px)
 *  DOT_PITCH   centre of one dot → centre of the next. IDENTICAL for every dot, in both groups.
 *              100 keeps the longest name ("REINFORCEMENT", ≈106 wide) ≥ 16 px away from "JOINERY" / "FINISHING".
 *  gap         NOT a constant: it is solved so that the three marked distances are equal AND the whole row is centred
 *              (left margin = right margin = METAL_X). See timelineLayout().
 *  GROUP_W     width of "METAL FRAME" / "WOOD SEAT" at 14 px, used until the real width has been measured. */
const DOT_PITCH = 100;
const GROUP_W = { metal: 97.3, wood: 83.3 };
const DOT_R = 7.5; //   radius of the ring (≈ 15 px across, as in CONCEPT)
const DOT_Y = 243; //   centre of the dots
const GROUP_Y = 243; // centre of "METAL FRAME" / "WOOD SEAT" = centre of the dots
const METAL_X = 231; // left of "METAL FRAME" = the page's left line (same x as the section title)
const GROUP_FS = 14; // font size of "METAL FRAME" / "WOOD SEAT"

type GroupW = { metal: number; wood: number };

/** x of every dot's centre (in stage order), x of "WOOD SEAT", and the gap — all derived from the real label widths */
function timelineLayout(stages: FabStage[], w: GroupW) {
  const nMetal = stages.filter((s: FabStage) => s.group === "metal").length;
  const nWood = stages.length - nMetal;
  const span = 1440 - 2 * METAL_X; // METAL FRAME's left edge → the last dot's right edge (left margin = right margin)
  const gap = Math.max(12, (span - w.metal - w.wood - 4 * DOT_R - (nMetal - 1 + nWood - 1) * DOT_PITCH) / 3);
  const metalFirst = METAL_X + w.metal + gap + DOT_R;
  const woodX = metalFirst + (nMetal - 1) * DOT_PITCH + DOT_R + gap;
  const woodFirst = woodX + w.wood + gap + DOT_R;
  let m = 0;
  let k = 0;
  const dotX = stages.map((s: FabStage) => (s.group === "metal" ? metalFirst + m++ * DOT_PITCH : woodFirst + k++ * DOT_PITCH));
  return { dotX, woodX };
}

/* ---------- the hand-drawn dots of CONCEPT (same code, same seeds → the same dots) ---------- */
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
/* ring (empty, white) and fill (black) share a seed → the black dot is the same hand-drawn shape, filled in */
const RINGS: string[] = Array.from({ length: 12 }, (_, i) => blob(i + 1, 7.4, 0.12));
const FILLS: string[] = Array.from({ length: 12 }, (_, i) => blob(i + 1, 5.4, 0.12));

/** arrows — x of their centres, and y (the middle of the photo frames) */
const ARROW_L = 44;
const ARROW_R = 1396;
const ARROW_Y = FRAME_Y + FRAME_H / 2;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

/** x of the first frame and the gap between frames, for a stage with `n` photos */
function rowFor(n: number): { x0: number; gap: number } {
  if (n <= 3) return ROW_3;
  const total = n * FRAME_W + (n - 1) * ROW_4_GAP;
  return { x0: (1440 - total) / 2, gap: ROW_4_GAP };
}

const paragraphs = (c: string | string[]): string[] => (Array.isArray(c) ? c : [c]).filter((p: string) => p.trim() !== "");

/* =============================== COMPONENT =============================== */
export default function ProjectFabrication({ data }: { data: FabricationData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const metalRef = useRef<HTMLButtonElement>(null);
  const woodRef = useRef<HTMLButtonElement>(null);
  const [labelW, setLabelW] = useState<GroupW>(GROUP_W);
  const [index, setIndex] = useState(0);
  const last = data.stages.length - 1;

  /* fade the section's text in once it is on screen */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          section.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  /* measure "METAL FRAME" / "WOOD SEAT" in artboard px (once the font is in) so the spacing is exact in any font */
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const measure = () => {
      if (window.matchMedia("(max-width: 820px)").matches) return; // phones use their own layout
      const cu = (probeRef.current?.getBoundingClientRect().width ?? 0) / 100; // px per artboard px
      const m = metalRef.current?.getBoundingClientRect().width ?? 0;
      const w = woodRef.current?.getBoundingClientRect().width ?? 0;
      if (!cu || !m || !w) return;
      const next = { metal: Math.round((m / cu) * 100) / 100, wood: Math.round((w / cu) * 100) / 100 };
      setLabelW((p: GroupW) => (Math.abs(p.metal - next.metal) < 0.05 && Math.abs(p.wood - next.wood) < 0.05 ? p : next));
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    return () => ro.disconnect();
  }, []);

  const go = (i: number) => setIndex(Math.min(last, Math.max(0, i)));

  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
      focusDot(sectionRef.current, Math.min(last, index + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
      focusDot(sectionRef.current, Math.max(0, index - 1));
    }
  };

  const { dotX, woodX } = timelineLayout(data.stages, labelW);
  const metal = data.stages.map((s: FabStage, i: number) => ({ s, i })).filter((x) => x.s.group === "metal");
  const wood = data.stages.map((s: FabStage, i: number) => ({ s, i })).filter((x) => x.s.group === "wood");

  const renderGroup = (title: string, items: { s: FabStage; i: number }[], x: number, labelRef: React.RefObject<HTMLButtonElement | null>) => {
    const first = items[0]?.i ?? 0;
    const lastI = items[items.length - 1]?.i ?? 0;
    const inGroup = index >= first && index <= lastI;
    return (
      <div className="fb-tg">
        {/* the group name is a button too: it opens the first stage of its group */}
        <button
          ref={labelRef}
          type="button"
          className="fb-gl fb-abs"
          aria-current={inGroup ? "true" : undefined}
          aria-label={`${title} — start with ${items[0]?.s.label ?? ""}`}
          onClick={() => go(first)}
          style={cssVars({ "--x": x, "--y": GROUP_Y - 13 })}
        >
          {title}
        </button>
        <div className="fb-dots">
          <span
            className="fb-line fb-abs"
            aria-hidden="true"
            style={cssVars({ "--x": dotX[first], "--y": DOT_Y, "--w": dotX[lastI] - dotX[first] })}
          />
          {items.map(({ s, i }) => (
            <button
              key={s.id}
              type="button"
              className={`fb-dot fb-abs${i === index ? " is-on" : ""}`}
              data-fb-dot={i}
              aria-current={i === index ? "step" : undefined}
              aria-label={`${title} — ${s.label}`}
              onClick={() => go(i)}
              style={cssVars({ "--x": dotX[i], "--y": 228 })}
            >
              <svg className="fb-dot-c" viewBox="0 0 22 22" aria-hidden="true">
                <path className="fb-ring" d={RINGS[i % RINGS.length]} />
                <path className="fb-fill" d={FILLS[i % FILLS.length]} />
              </svg>
              <span className="fb-dot-l" aria-hidden="true">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section ref={sectionRef} className="fb" aria-label={data.title}>
      <h2 className="fb-title">{data.title}</h2>
      <span ref={probeRef} className="fb-probe" aria-hidden="true" />
      {/* screen readers: say which stage just opened */}
      <p className="fb-sr" role="status" aria-live="polite">
        {`Stage ${index + 1} of ${last + 1}: ${data.stages[index]?.label ?? ""}`}
      </p>
      <p className="fb-intro fb-abs" style={cssVars({ "--y": 134 })}>
        <span>{data.intro[0]}</span>
        <span>{data.intro[1]}</span>
      </p>

      {/* the timeline */}
      <nav className="fb-tl" aria-label="Fabrication stages" onKeyDown={onKey}>
        {renderGroup("Metal frame", metal, METAL_X, metalRef)}
        {renderGroup("Wood seat", wood, woodX, woodRef)}
      </nav>

      {/* every stage is in the page; only the open one is visible (so no photo ever has to load on click) */}
      <div className="fb-stages">
        {data.stages.map((s: FabStage, si: number) => {
          const n = s.groups.reduce((sum: number, g: FabGroup) => sum + g.images.length, 0);
          const { x0, gap } = rowFor(n);
          let seen = 0;
          return (
            <div
              key={s.id}
              className={`fb-stage${si === index ? " is-on" : ""}`}
              aria-hidden={si === index ? undefined : true}
              style={cssVars({ "--g": gap })}
            >
              {s.groups.map((g: FabGroup, gi: number) => {
                const k = g.images.length;
                const left = x0 + seen * (FRAME_W + gap);
                seen += k;
                return (
                  <div
                    key={gi}
                    className="fb-group fb-abs"
                    style={cssVars({ "--x": left, "--y": FRAME_Y, "--n": k, "--gi": gi })}
                  >
                    <div className="fb-frames">
                      {g.images.map((im: FabImage, ii: number) => (
                        <div key={ii} className="fb-frame">
                          {im.src ? (
                            <Image
                              className="fb-img"
                              src={im.src}
                              alt={si === index ? im.alt : ""}
                              fill
                              sizes="(max-width: 820px) 46vw, 24vw"
                              quality={85}
                              draggable={false}
                              style={im.pos ? { objectPosition: im.pos } : undefined}
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="fb-cap">
                      {paragraphs(g.caption).map((p: string, pi: number) => (
                        <p key={pi}>{p}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* arrows */}
      <div className="fb-arrows">
        <button
          type="button"
          className="fb-arrow fb-abs"
          aria-label="Previous stage"
          disabled={index === 0}
          onClick={() => go(index - 1)}
          style={cssVars({ "--x": ARROW_L, "--y": ARROW_Y })}
        >
          <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
            <path d="M18 5 9 14l9 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          className="fb-arrow fb-abs"
          aria-label="Next stage"
          disabled={index === last}
          onClick={() => go(index + 1)}
          style={cssVars({ "--x": ARROW_R, "--y": ARROW_Y })}
        >
          <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
            <path d="m10 5 9 9-9 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <style>{CSS}</style>
    </section>
  );
}

/** after an arrow key, keep keyboard focus on the dot of the stage that just opened */
function focusDot(section: HTMLElement | null, i: number) {
  requestAnimationFrame(() => section?.querySelector<HTMLElement>(`[data-fb-dot="${i}"]`)?.focus({ preventScroll: true }));
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Comico&display=swap");
@font-face {
  font-family: "Comico"; font-style: normal; font-weight: 400; font-display: swap;
  src: local("Comico"), local("Comico Regular"), url("/fonts/Comico-Regular.woff2") format("woff2"), url("/fonts/Comico-Regular.ttf") format("truetype");
}

.fb {
  --ease: cubic-bezier(.22, 1, .36, 1);
  --page-h: max(100svh, 560px);
  --header-h: 96px;
  /* the same grid as CONCEPT / FORM EXPLORATION */
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);              /* left of the 1440 artboard */
  --edge-l: calc(var(--ax) + 231 * var(--cu));
  --mute: #767676;

  position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box;
  background: #fff; color: #000;
}

/* anything placed by artboard coordinates: --x / --y (artboard px; --y counts from the top of the 1440 × 900 artboard) */
.fb-abs {
  position: absolute;
  left: calc(var(--ax) + var(--x, 0) * var(--cu));
  top: calc(var(--header-h) + (var(--y, 0) - 96) * var(--cu));
}

/* ---- title (same x / y / size / weight as the CONCEPT title) ---- */
.fb-title {
  position: absolute; left: var(--edge-l); top: calc(var(--header-h) - 4 * var(--cu)); z-index: 5; margin: 0;
  text-align: left; white-space: nowrap;
  font-size: calc(18 * var(--cu)); line-height: calc(24 * var(--cu)); font-weight: 500; letter-spacing: 0; color: #000;
}

/* ---- intro: first line is justified to the block width, second line is left as it is ---- */
.fb-intro {
  left: var(--edge-l); width: calc(399 * var(--cu)); margin: 0;
  font-size: calc(18 * var(--cu)); line-height: calc(26 * var(--cu)); font-weight: 400; letter-spacing: 0; color: #000;
}
.fb-intro span { display: block; }
.fb-intro span:first-child { text-align: justify; text-align-last: justify; }

/* ---- timeline ---- */
.fb-tl, .fb-tg, .fb-dots { display: contents; }

.fb-gl {
  margin: 0; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; white-space: nowrap; color: #000;
  -webkit-tap-highlight-color: transparent;
  font-family: "Comico", "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-size: calc(${GROUP_FS} * var(--cu)); line-height: calc(26 * var(--cu)); font-weight: 400; font-synthesis: none; letter-spacing: .02em;
  text-transform: uppercase;
}
.fb-gl::before { /* a comfortable hit area around the name */
  content: ""; position: absolute; inset: calc(-8 * var(--cu)) calc(-10 * var(--cu));
}
.fb-gl:focus-visible { outline: 2px solid #000; outline-offset: calc(4 * var(--cu)); }

/* 100 artboard px, invisible — used to read the current scale (--cu) in JS */
.fb-probe { position: absolute; left: 0; top: 0; width: calc(100 * var(--cu)); height: 0; visibility: hidden; pointer-events: none; }

/* visually hidden, still read by screen readers */
.fb-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* the grey timeline line, behind the dots (the white ring hides it inside each dot) */
.fb-line { width: calc(var(--w) * var(--cu)); height: 1px; background: #d6d6d6; pointer-events: none; }

/* one stage = a zero-size button at the dot's centre; the dot and the name hang off it */
.fb-dot {
  z-index: 3; width: 0; height: 0; margin: 0; padding: 0; border: 0; background: none; cursor: pointer; color: #000; overflow: visible;
  -webkit-tap-highlight-color: transparent;
}
.fb-dot::before { /* bigger hit area: the dot AND its name */
  content: ""; position: absolute; left: calc(-35 * var(--cu)); top: calc(-8 * var(--cu)); width: calc(70 * var(--cu)); height: calc(56 * var(--cu));
}
/* the CONCEPT dot: a 21 × 22 box centred on the dot's x, centre of the drawing = DOT_Y (243) */
.fb-dot-c {
  position: absolute; left: calc(-10.5 * var(--cu)); top: calc(4 * var(--cu));
  width: calc(21 * var(--cu)); height: calc(22 * var(--cu)); display: block; overflow: visible; border-radius: 50%;
}
.fb-ring { fill: #fff; stroke: #000; stroke-width: 1.15; }
.fb-fill { fill: #000; }
.fb-dot .fb-fill { display: none; }
.fb-dot.is-on .fb-ring { display: none; }   /* open stage = the small solid black dot, exactly as in CONCEPT */
.fb-dot.is-on .fb-fill { display: block; }
.fb-dot-l {
  position: absolute; left: 0; top: calc(34 * var(--cu)); white-space: nowrap; color: #000;
  transform: translateX(-50%);
  font-family: "Comico", "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-size: max(10px, calc(10 * var(--cu))); line-height: calc(14 * var(--cu)); font-weight: 400; font-synthesis: none; letter-spacing: .02em;
  text-transform: uppercase;
}
.fb-dot:focus-visible { outline: none; }
.fb-dot:focus-visible .fb-dot-c { outline: 2px solid #000; outline-offset: 3px; }

/* ---- the stages ---- */
.fb-stages { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
.fb-stage { position: absolute; inset: 0; visibility: hidden; transition: visibility 0s .4s; }
.fb-stage.is-on { visibility: visible; transition-delay: 0s; }

.fb-group {
  width: calc((var(--n) * ${FRAME_W} + (var(--n) - 1) * var(--g)) * var(--cu));
  opacity: 0; transform: translate3d(0, calc(12 * var(--cu)), 0);
  transition: opacity .35s ease, transform .35s ease;
}
.fb-stage.is-on .fb-group {
  opacity: 1; transform: none; pointer-events: auto;
  transition: opacity .8s var(--ease) calc(.12s + var(--gi) * .07s), transform 1s var(--ease) calc(.12s + var(--gi) * .07s);
}
.fb-frames { display: flex; gap: calc(var(--g) * var(--cu)); }
/* THE universal frame */
.fb-frame {
  position: relative; flex: none; overflow: hidden; background: #efefef;
  width: calc(${FRAME_W} * var(--cu)); height: calc(${FRAME_H} * var(--cu));
}
.fb-img { object-fit: cover; object-position: 50% 50%; user-select: none; -webkit-user-drag: none; }

.fb-cap {
  margin-top: calc(${CAP_GAP} * var(--cu)); width: 100%;
  font-size: max(12px, calc(16 * var(--cu))); line-height: 1.375; font-weight: 400; letter-spacing: 0; color: #000;
}
.fb-cap p { margin: 0; }
.fb-cap p + p { margin-top: 1.375em; } /* a blank line between paragraphs */

/* ---- arrows ---- */
.fb-arrows { display: contents; }
.fb-arrow {
  z-index: 4; margin: 0; padding: 0; border: 0; background: none; cursor: pointer; color: var(--mute);
  width: 48px; height: 48px; display: grid; place-items: center; border-radius: 2px;
  transform: translate(-50%, -50%);
  transition: color .3s ease, opacity .3s ease;
  -webkit-tap-highlight-color: transparent;
}
.fb-arrow:disabled { opacity: .25; cursor: default; pointer-events: none; }
.fb-arrow:active { color: #000; }
.fb-arrow:focus-visible { color: #000; outline: 2px solid #000; outline-offset: -2px; }
@media (hover: hover) and (pointer: fine) { .fb-arrow:not(:disabled):hover { color: #000; } }

/* ---- text fades in once, when the section first appears ---- */
.fb-title, .fb-intro, .fb-gl, .fb-line, .fb-dot, .fb-arrow { opacity: 0; transition-property: opacity; }
.fb.is-in .fb-title, .fb.is-in .fb-intro, .fb.is-in .fb-gl, .fb.is-in .fb-line, .fb.is-in .fb-dot, .fb.is-in .fb-arrow {
  opacity: 1; transition: opacity .9s var(--ease) .1s;
}
.fb.is-in .fb-arrow { transition: opacity .9s var(--ease) .4s, color .3s ease; }
.fb.is-in .fb-arrow:disabled { opacity: .25; }
.fb.is-in .fb-dot { transition: opacity .9s var(--ease) .25s; }

/* the page uses scroll-snap-type: y mandatory (ProjectDetail) — this section needs its own snap stop */
@media (min-width: 821px) {
  .fb { scroll-snap-align: start; scroll-snap-stop: always; }
}

/* ---- phones: one column, the timeline above, the open stage below ---- */
@media (max-width: 820px) {
  .fb { --edge-l: 16px; height: auto; min-height: 100svh; padding: 104px 16px 72px; }
  .fb-abs { position: static; }
  .fb-probe { display: none; }
  .fb-title { position: static; font-size: 16px; line-height: 24px; }
  .fb-intro { width: auto; margin-top: 12px; font-size: 14px; line-height: 20px; }
  .fb-intro span:first-child { text-align: left; text-align-last: auto; }

  .fb-tl { display: block; margin-top: 24px; }
  .fb-tg { display: block; margin-bottom: 18px; }
  .fb-gl { display: block; font-size: 14px; line-height: 24px; padding: 10px 0; margin-bottom: 0; }
  .fb-gl::before { display: none; }
  .fb-dots { display: flex; justify-content: space-between; }
  .fb-line { display: none; }
  .fb-dot {
    flex: 1; width: auto; height: auto; padding: 8px 0; display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .fb-dot::before { display: none; }
  .fb-dot-c { position: static; width: 21px; height: 22px; }
  .fb-dot-l { position: static; transform: none; font-size: 10px; line-height: 12px; text-align: center; }

  .fb-stages { position: relative; inset: auto; margin-top: 20px; pointer-events: auto; }
  .fb-stage { position: static; display: none; }
  .fb-stage.is-on { display: block; }
  .fb-group { width: auto; margin-bottom: 28px; }
  .fb-frames { gap: 12px; }
  .fb-frame { width: calc((100% - 12px) / 2); height: auto; aspect-ratio: ${FRAME_W} / ${FRAME_H}; }
  .fb-cap { margin-top: 12px; font-size: 14px; line-height: 20px; }

  .fb-arrows { display: flex; justify-content: space-between; margin-top: 8px; }
  .fb-arrow { transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .fb-title, .fb-intro, .fb-gl, .fb-line, .fb-dot, .fb-arrow { opacity: 1; transition: none; }
  .fb-group, .fb-stage.is-on .fb-group { transition: none; transform: none; }
}
`;