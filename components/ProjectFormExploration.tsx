"use client";

/* components/ProjectFormExploration.tsx   (or src/components/ProjectFormExploration.tsx)
 *
 * FORM EXPLORATION — a white field of free-floating frames, modelled on the Celeste Noir reference.
 *
 *   BAND    Every frame lives inside one horizontal band (her green lines): it starts a little below the
 *           title and ends a little above the bottom of the screen. Frames never cross the band's top or
 *           bottom edge — vertically they are always whole. Horizontally they run off both screen edges.
 *   MOTION  Three lanes drift sideways forever, each at its own speed.
 *   HOVER   Pointer on a frame → the whole field eases to a stop. Pointer off → it eases back to speed.
 *           (Touch: the field holds while a finger is down.)
 *   LOOK    White background, images exactly as photographed — no grayscale, no colour change, no dimming.
 *           Frames come in three sizes; the "Small" files are the smallest and always sit on top.
 *
 * UNITS  1u = 1vw, capped so the tallest frame always fits the band (see --u in the CSS).
 *        Every size, gap and speed below is in u, so the composition scales as one piece.
 */
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { FormExplorationData, FormTile, FrameSize } from "../data/formExploration";

/* ------------------------------ TUNING ------------------------------ */
/** frame area in u² — the aspect ratio of each photo decides its width / height */
const AREA: Record<FrameSize, number> = { large: 600, medium: 230, small: 85 };
/** stacking: small frames stay on top of the big ones */
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

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const wrap = (n: number, m: number) => ((n % m) + m) % m;

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
  const laneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travelled = lanes.map((_: Lane, i: number) => LANE_START[i] ?? 0); // u, per lane
    const pointer = { x: 0, y: 0, active: false }; // last mouse position, while it is over the section
    let speed = reduceMotion ? 0 : 1; //  current speed factor, 0…1
    let target = reduceMotion ? 0 : 1; // where it is heading: 0 while a frame is hovered
    let held = false; //                  touch is down
    let raf = 0;
    let last = 0;
    let visible = false;

    const paint = () => {
      lanes.forEach((lane: Lane, i: number) => {
        const el = laneRefs.current[i];
        if (el) el.style.transform = laneTransform(lane.loop, travelled[i]);
      });
    };

    /* is the mouse resting on a frame right now? (asked every tick, so a frame drifting under a still cursor stops too) */
    const overFrame = () =>
      pointer.active && !!document.elementFromPoint(pointer.x, pointer.y)?.closest(".fe-card");

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;

      if (!reduceMotion) target = held || overFrame() ? 0 : 1;
      speed += (target - speed) * (1 - Math.exp(-STOP_EASE * dt));
      if (Math.abs(target - speed) < 0.001) speed = target;

      if (speed > 0) {
        lanes.forEach((_: Lane, i: number) => {
          travelled[i] += (LANE_SPEED[i] ?? 1) * speed * dt;
        });
        paint();
      }
      /* keep running while moving or while a stop is still possible; sleeps only when fully stopped (see wake) */
      if (speed > 0 || target > 0) raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (raf || !visible || reduceMotion) return;
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
    paint();

    /* pointer: mouse position feeds overFrame(); a stopped field wakes the moment the mouse leaves a frame */
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
      if (speed === 0) {
        target = overFrame() ? 0 : 1;
        if (target > 0) wake();
      }
    };
    const onLeave = () => {
      pointer.active = false;
      target = 1;
      wake();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") held = true;
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "touch") return;
      held = false;
      wake();
    };
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [lanes]);

  return (
    <section ref={sectionRef} className="fe" aria-label={data.label}>
      <h2 className="fe-label">{data.label}</h2>

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

      <style>{CSS}</style>
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
.fe {
  --ease: cubic-bezier(.22, 1, .36, 1);
  --page-h: max(100svh, 560px);
  /* THE BAND (her green lines): from just under the title to a little above the bottom edge */
  --band-top: 200px;
  --band-bottom: 72px;
  --band-h: calc(var(--page-h) - var(--band-top) - var(--band-bottom));
  /* 1u = 1vw, never so big that the tallest frame (≈ 21u) outgrows the band */
  --u: min(1vw, calc(var(--band-h) / 34));

  position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box;
  background: #fff; color: #000;
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
}

/* title — 18 · Medium · #000, centred, same type as the CONCEPT label */
.fe-label {
  position: absolute; left: 0; right: 0; top: 120px; z-index: 5; margin: 0; text-align: center;
  font-size: 18px; line-height: 24px; font-weight: 500; letter-spacing: 0; color: #000;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease) .1s, transform 1.1s var(--ease) .1s;
}
.fe.is-in .fe-label { opacity: 1; transform: none; }

/* the band holds every frame */
.fe-band {
  position: absolute; left: 0; right: 0; top: var(--band-top); height: var(--band-h);
  opacity: 0; transition: opacity 1.2s var(--ease) .25s;
}
.fe.is-in .fe-band { opacity: 1; }
.fe-lane { position: absolute; left: 0; top: 0; height: 100%; will-change: transform; }

/* each frame is centred on its lane line, nudged by --dy, then clamped so it can never leave the band */
.fe-card {
  position: absolute; margin: 0; overflow: hidden; isolation: isolate; background: #efefef;
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  left: calc(var(--x) * var(--u));
  top: clamp(
    0px,
    calc(var(--cy) * var(--band-h) + (var(--dy) - var(--h) / 2) * var(--u)),
    calc(var(--band-h) - var(--h) * var(--u))
  );
}
.fe-img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  pointer-events: none; -webkit-user-drag: none;
  /* the photographed paper blends into the #efefef frame, so every frame reads as one clean tile.
     Colour is untouched: no grayscale, no filter, no hover change. */
  mix-blend-mode: multiply;
}

/* the page uses scroll-snap-type: y mandatory (ProjectDetail) — this section needs its own snap stop,
   otherwise the browser snaps back to the end of CONCEPT and this section can never be reached */
@media (min-width: 821px) {
  .fe { scroll-snap-align: start; scroll-snap-stop: always; }
}

@media (max-width: 820px) {
  .fe { --band-top: 160px; --band-bottom: 40px; --u: min(2.6vw, calc(var(--band-h) / 34)); }
  .fe-label { top: 104px; font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .fe-label, .fe-band { transition: none; opacity: 1; transform: none; }
}
`;