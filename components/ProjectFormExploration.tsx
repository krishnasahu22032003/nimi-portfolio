"use client";

/* components/ProjectFormExploration.tsx   (or src/components/ProjectFormExploration.tsx)
 *
 * FORM EXPLORATION — a white field of free-floating frames, modelled on the Celeste Noir reference.
 *
 *   BAND    Every frame lives inside one horizontal band: it starts a little below the title and ends a
 *           little above the bottom of the screen. Frames never cross the band's top or bottom edge.
 *           Horizontally they run off both screen edges.
 *   MOTION  Three lanes drift sideways forever, each at its own speed.
 *   HOVER   Pointer on a frame → the whole field eases to a stop AND that frame comes to the very front.
 *           Pointer off → it drops back and the field eases back to speed.
 *   DRAG    NEW. Press and hold anywhere on the field, move left / right → the field follows your hand.
 *           The three lanes follow at slightly different rates (depth). Let go → it glides and settles.
 *           Touch: the same, with one finger (vertical swipes still scroll the page).
 *   TITLE   NEW. Left-aligned on the SAME grid as the CONCEPT title (same x, same y, same size).
 *   3D      NEW. "3D MODEL" at the bottom right (Comico 16, grey → black on hover). Click → the 3D viewer.
 *
 * UNITS  1u = 1vw, capped so the tallest frame always fits the band (see --u in the CSS).
 *        --cu = the CONCEPT section's unit (1 Canva px). Only the title, the 3D text and the viewer use it,
 *        so they sit on exactly the same grid as the CONCEPT section.
 */
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { FormExplorationData, FormTile, FrameSize } from "../data/formExploration";

/* the 3D viewer (three.js) is only downloaded when someone clicks "3D MODEL" */
const ProjectModelViewer = dynamic(() => import("./ProjectModelViewer"), { ssr: false });

/* ------------------------------ TUNING ------------------------------ */
/** frame area in u² — the aspect ratio of each photo decides its width / height */
const AREA: Record<FrameSize, number> = { large: 600, medium: 230, small: 85 };
/** stacking: small frames stay on top of the big ones (a hovered frame beats all of them) */
const Z_INDEX: Record<FrameSize, number> = { large: 1, medium: 2, small: 3 };

/** per lane — centre line as a fraction of the band height (0 = top, 1 = bottom) */
const LANE_CENTRE = [0.2, 0.5, 0.8];
/** per lane — drift speed in u / second (all move left; different speeds create depth) */
const LANE_SPEED = [4.2, 5.7, 2.7];
/** per lane — u already travelled at load, so the first view is already scattered */
const LANE_START = [0, 97, 171];

/** space after each frame in a lane, in u (cycled) */
const GAPS = [11, 6, 14, 8, 12, 7];
/** a lane is never shorter than this (u); any shortfall is added to the gaps */
const MIN_LOOP = 300;
/** each lane is drawn this many times back to back so the strip never runs dry on wide screens */
const COPIES = 3;
/** how quickly the field stops / restarts (higher = snappier) */
const STOP_EASE = 5;

/* DRAG */
/** per lane — how far the lane follows the hand (1 = exactly the hand). Slightly different = depth */
const DRAG_FOLLOW = [1, 1.15, 0.85];
/** how quickly the glide after letting go dies out (higher = stops sooner) */
const GLIDE_DECAY = 3.2;
/** glide never starts faster than this, in u / second */
const GLIDE_MAX = 160;

/** NEW: the frame under the pointer gets this soft shadow so it reads as "lifted" (set to "none" to remove) */
const FRONT_SHADOW = "0 14px 36px rgba(0, 0, 0, 0.10)";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const wrap = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* ------------------------------ layout ------------------------------ */
type Placed = FormTile & { uw: number; uh: number; x: number };
type Lane = { tiles: Placed[]; loop: number };

/** lay each lane out as one strip: x position of every frame, and the strip's total length (both in u) */
function layoutLanes(tiles: FormTile[]): Lane[] {
  return LANE_CENTRE.map((_, lane: number): Lane => {
    const placed: Placed[] = tiles
      .filter((t: FormTile) => t.lane === lane)
      .map((t: FormTile) => {
        const ratio = t.w / t.h;
        const k = t.scale ?? 1; // per-frame fine-tune from the data file
        return { ...t, uw: Math.sqrt(AREA[t.size] * ratio) * k, uh: Math.sqrt(AREA[t.size] / ratio) * k, x: 0 };
      });
    const gaps = placed.map((_, i: number) => GAPS[(i + lane) % GAPS.length]);
    const natural = placed.reduce((sum: number, t: Placed, i: number) => sum + t.uw + gaps[i], 0);
    const extra = Math.max(0, MIN_LOOP - natural) / Math.max(placed.length, 1);
    let cursor = 0;
    placed.forEach((t: Placed, i: number) => {
      t.x = cursor;
      cursor += t.uw + gaps[i] + extra;
    });
    return { tiles: placed, loop: cursor };
  });
}

/** CSS transform for a lane that has travelled `pos` u — always inside the middle copy's range */
const laneTransform = (loop: number, pos: number) =>
  `translate3d(calc(var(--u) * ${(-(loop + wrap(pos, loop))).toFixed(3)}), 0, 0)`;

/* =============================== COMPONENT =============================== */
export default function ProjectFormExploration({ data }: { data: FormExplorationData }) {
  const lanes = useMemo(() => layoutLanes(data.tiles), [data.tiles]);
  const sectionRef = useRef<HTMLElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const laneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travelled = lanes.map((_: Lane, i: number) => LANE_START[i] ?? 0); // u, per lane
    const pointer = { x: 0, y: 0, active: false }; // last mouse position, while it is over the section
    let speed = reduceMotion ? 0 : 1; //  current drift factor, 0…1
    let target = reduceMotion ? 0 : 1; // where it is heading: 0 while a frame is hovered or the field is held
    let raf = 0;
    let last = 0;
    let visible = false;

    /* drag state */
    let down = false; //        a pointer is pressed on the field
    let dragId = -1;
    let lastX = 0;
    let lastT = 0;
    let glide = 0; //           u / second, + = field moving right (follows the hand after release)
    let sample = 0; //          smoothed hand velocity while dragging
    let uPx = 14; //            size of 1u in real pixels (measured)

    /* the frame that is currently in front */
    let front: HTMLElement | null = null;
    const setFront = (card: HTMLElement | null) => {
      if (card === front) return;
      if (front) {
        front.classList.remove("is-front");
        front.parentElement?.classList.remove("is-front"); // each lane is its own stacking layer
      }
      if (card) {
        card.classList.add("is-front");
        card.parentElement?.classList.add("is-front");
      }
      front = card;
    };

    const measure = () => {
      const w = probeRef.current?.getBoundingClientRect().width ?? 0;
      if (w > 0) uPx = w;
    };

    const paint = () => {
      lanes.forEach((lane: Lane, i: number) => {
        const el = laneRefs.current[i];
        if (el) el.style.transform = laneTransform(lane.loop, travelled[i]);
      });
    };

    /* which frame is the mouse resting on right now? (asked every tick, so a frame drifting under a still cursor is caught too) */
    const cardAt = (): HTMLElement | null =>
      pointer.active
        ? (document.elementFromPoint(pointer.x, pointer.y)?.closest(".fe-card") as HTMLElement | null) ?? null
        : null;

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;

      const card = down ? front : cardAt();
      if (!down) setFront(card);
      if (!reduceMotion) target = down || card ? 0 : 1;
      speed += (target - speed) * (1 - Math.exp(-STOP_EASE * dt));
      if (Math.abs(target - speed) < 0.001) speed = target;

      let moved = false;
      if (speed > 0) {
        lanes.forEach((_: Lane, i: number) => {
          travelled[i] += (LANE_SPEED[i] ?? 1) * speed * dt;
        });
        moved = true;
      }
      if (!down && Math.abs(glide) > 0.05) {
        lanes.forEach((_: Lane, i: number) => {
          travelled[i] -= glide * (DRAG_FOLLOW[i] ?? 1) * dt;
        });
        glide *= Math.exp(-GLIDE_DECAY * dt);
        moved = true;
      } else if (!down) {
        glide = 0;
      }
      if (moved) paint();

      /* keep running while moving, gliding or held; sleeps only when fully stopped (see wake) */
      if (speed > 0 || target > 0 || down || glide !== 0) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    /* run only while the section is on screen */
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        if (visible) {
          section.classList.add("is-in");
          wake();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(section);
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    measure();
    paint();

    /* ---- hover (mouse) ---- */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (!down) setFront(cardAt());
      if (speed === 0) {
        target = down || cardAt() ? 0 : 1;
        if (target > 0) wake();
      }
    };
    const onLeave = () => {
      pointer.active = false;
      if (!down) setFront(null);
      target = down ? 0 : 1;
      wake();
    };

    /* ---- press & drag (mouse, pen, finger) ---- */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if ((e.target as Element | null)?.closest(".fe-3d")) return; // the 3D text is a button, not part of the field
      down = true;
      dragId = e.pointerId;
      lastX = e.clientX;
      lastT = e.timeStamp;
      glide = 0;
      sample = 0;
      section.classList.add("is-drag");
      measure();
      wake();
    };
    const onDrag = (e: PointerEvent) => {
      if (!down || e.pointerId !== dragId) return;
      const du = (e.clientX - lastX) / uPx; // + = hand moved right
      const dt = Math.max((e.timeStamp - lastT) / 1000, 0.001);
      lastX = e.clientX;
      lastT = e.timeStamp;
      lanes.forEach((_: Lane, i: number) => {
        travelled[i] -= du * (DRAG_FOLLOW[i] ?? 1); // field moves WITH the hand
      });
      sample = sample * 0.7 + (du / dt) * 0.3;
      paint();
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== dragId) return;
      down = false;
      section.classList.remove("is-drag");
      const resting = e.timeStamp - lastT > 90; // hand stopped before letting go → no glide
      glide = resting ? 0 : clamp(sample, -GLIDE_MAX, GLIDE_MAX);
      if (e.pointerType !== "mouse") {
        pointer.active = false;
        setFront(null);
      }
      wake();
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [lanes]);

  const closeViewer = () => {
    setViewerOpen(false);
    requestAnimationFrame(() => modelBtnRef.current?.focus({ preventScroll: true })); // focus goes back to the text
  };

  return (
    <section ref={sectionRef} className="fe" aria-label={data.label}>
      <h2 className="fe-label">{data.label}</h2>

      {/* 1u in real pixels — measured by the drag code */}
      <span ref={probeRef} className="fe-probe" aria-hidden="true" />

      <div className="fe-band">
        {lanes.map((lane: Lane, li: number) => (
          <div
            key={li}
            className="fe-lane"
            ref={(el) => {
              laneRefs.current[li] = el;
            }}
            style={{
              width: `calc(var(--u) * ${lane.loop * COPIES})`,
              transform: laneTransform(lane.loop, LANE_START[li] ?? 0),
            }}
          >
            {Array.from({ length: COPIES }, (_, copy: number) =>
              lane.tiles.map((t: Placed, i: number) => {
                const main = copy === 1; // only the middle copy is exposed to assistive tech
                return (
                  <figure
                    key={`${copy}-${t.src}`}
                    className="fe-card"
                    aria-hidden={main ? undefined : true}
                    style={cssVars({
                      "--w": t.uw,
                      "--h": t.uh,
                      "--x": copy * lane.loop + t.x,
                      "--cy": LANE_CENTRE[li],
                      "--dy": t.dy,
                      zIndex: Z_INDEX[t.size],
                    })}
                  >
                    <Image
                      className="fe-img"
                      src={t.src}
                      alt={main ? t.alt : ""}
                      width={t.w}
                      height={t.h}
                      sizes={`${Math.ceil(t.uw)}vw`}
                      quality={85}
                      priority={main && i < 3}
                      draggable={false}
                    />
                  </figure>
                );
              })
            )}
          </div>
        ))}
      </div>

      {data.model ? (
        <button
          ref={modelBtnRef}
          type="button"
          className="fe-3d"
          aria-haspopup="dialog"
          onClick={() => setViewerOpen(true)}
        >
          {data.model.label}
        </button>
      ) : null}

      {viewerOpen && data.model ? (
        <ProjectModelViewer src={data.model.src} label={data.model.label} alt={data.model.alt} onClose={closeViewer} />
      ) : null}

      <style>{CSS}</style>
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Comico&display=swap");

.fe {
  --ease: cubic-bezier(.22, 1, .36, 1);
  --page-h: max(100svh, 560px);
  /* THE BAND: from just under the title to a little above the bottom edge */
  --band-top: 200px;
  --band-bottom: 72px;
  --band-h: calc(var(--page-h) - var(--band-top) - var(--band-bottom));
  /* 1u = 1vw, never so big that the tallest frame (≈ 21u) outgrows the band */
  --u: min(1vw, calc(var(--band-h) / 34));

  /* ---- THE CONCEPT GRID (identical maths to ProjectConcept) ----
     --cu      1 Canva px, scaled to fit the screen (1440 × 900 artboard below a 96px header)
     --edge-l  x of the title  = Canva x 231  (left edge of the left photo)
     --edge-r  distance from the right screen edge = Canva x 1210 (right edge of the right photo) */
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --edge-l: calc((100cqw - 1440 * var(--cu)) / 2 + 231 * var(--cu));
  --edge-r: calc((100cqw - 1440 * var(--cu)) / 2 + 230 * var(--cu));
  --mute: #767676;   /* resting grey of clickable text — 4.5:1 on white (WCAG AA) */

  position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box;
  background: #fff; color: #000;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
  cursor: grab;
}
.fe.is-drag, .fe.is-drag * { cursor: grabbing; }

/* title — same x, same y, same size and weight as the CONCEPT title */
.fe-label {
  position: absolute; left: var(--edge-l); top: calc(var(--header-h) - 4 * var(--cu)); z-index: 5; margin: 0;
  text-align: left; white-space: nowrap;
  font-size: calc(18 * var(--cu)); line-height: calc(24 * var(--cu)); font-weight: 500; letter-spacing: 0; color: #000;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease) .1s, transform 1.1s var(--ease) .1s;
}
.fe.is-in .fe-label { opacity: 1; transform: none; }

.fe-probe { position: absolute; left: 0; top: 0; width: var(--u); height: 0; visibility: hidden; pointer-events: none; }

/* the band holds every frame. z-index + isolation keep a raised frame inside it, below the title and the 3D text */
.fe-band {
  position: absolute; left: 0; right: 0; top: var(--band-top); height: var(--band-h);
  z-index: 1; isolation: isolate;
  opacity: 0; transition: opacity 1.2s var(--ease) .25s;
}
.fe.is-in .fe-band { opacity: 1; }
.fe-lane { position: absolute; left: 0; top: 0; height: 100%; will-change: transform; pointer-events: none; } /* lanes are full-width and stacked: they must never catch the pointer, only the frames do */
/* every lane is its own stacking layer → the lane of the hovered frame is lifted above the other lanes too */
.fe-lane.is-front { z-index: 50; }

/* each frame is centred on its lane line, nudged by --dy, then clamped so it can never leave the band */
.fe-card {
  position: absolute; margin: 0; overflow: hidden; isolation: isolate; background: #efefef; pointer-events: auto;
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  left: calc(var(--x) * var(--u));
  top: clamp(
    0px,
    calc(var(--cy) * var(--band-h) + (var(--dy) - var(--h) / 2) * var(--u)),
    calc(var(--band-h) - var(--h) * var(--u))
  );
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  transition: box-shadow .45s var(--ease);
}
/* HOVER: the frame comes to the very front */
.fe-card.is-front { z-index: 50 !important; box-shadow: ${FRONT_SHADOW}; }
.fe-img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  pointer-events: none; -webkit-user-drag: none;
  /* the photographed paper blends into the #efefef frame, so every frame reads as one clean tile.
     Colour is untouched: no grayscale, no filter, no hover change. */
  mix-blend-mode: multiply;
}

/* "3D MODEL" — bottom right, on the right edge of the CONCEPT photos. Comico 16, grey → black on hover.
   The 12px padding is a larger hit area; the offsets below cancel it so the TEXT sits exactly on the grid. */
.fe-3d {
  position: absolute; z-index: 6; right: calc(var(--edge-r) - 12px); bottom: 24px;
  margin: 0; padding: 12px; border: 0; background: none; cursor: pointer; border-radius: 2px;
  font-family: "Comico", "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-size: 16px; line-height: 24px; font-weight: 400; font-synthesis: none; letter-spacing: .02em;
  text-transform: uppercase; white-space: nowrap; color: var(--mute);
  opacity: 0;
  transition: color .3s ease, opacity .9s var(--ease) .5s;
  -webkit-tap-highlight-color: transparent;
}
.fe.is-in .fe-3d { opacity: 1; }
.fe-3d:active { color: #000; }
.fe-3d:focus-visible { color: #000; outline: 2px solid #000; outline-offset: -2px; }
@media (hover: hover) and (pointer: fine) {
  .fe-3d:hover { color: #000; }
}

/* the page uses scroll-snap-type: y mandatory (ProjectDetail) — this section needs its own snap stop,
   otherwise the browser snaps back to the end of CONCEPT and this section can never be reached */
@media (min-width: 821px) {
  .fe { scroll-snap-align: start; scroll-snap-stop: always; }
}

@media (max-width: 820px) {
  .fe { --band-top: 160px; --band-bottom: 40px; --u: min(2.6vw, calc(var(--band-h) / 34)); --edge-l: 16px; --edge-r: 16px; }
  .fe-label { top: 104px; font-size: 16px; line-height: 24px; }
  .fe-3d { bottom: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .fe-label, .fe-band, .fe-3d { transition: none; opacity: 1; transform: none; }
  .fe-3d { transition: color .3s ease; }
  .fe-card { transition: none; }
}
`;