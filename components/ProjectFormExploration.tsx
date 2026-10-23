"use client";

/* components/ProjectFormExploration.tsx   (or src/components/ProjectFormExploration.tsx)
 *
 * FORM EXPLORATION — a white field of free-floating frames, modelled on the Celeste Noir reference.
 *
 *   • Frames of different sizes are scattered across the screen, overlap a little and are cut by the
 *     screen edges. They drift sideways forever, each row at its own speed.
 *   • HOVER = STOP. Put the pointer on a frame and the whole field eases to a halt; leave and it eases
 *     back to speed. (Touch: the field holds while a finger is down.)
 *   • White background. Images are shown as they are — no black & white → colour, no filter, no dimming.
 *   • The four "Small" files are the smallest frames. Small frames sit on top of the big ones.
 *
 * UNITS  1u = 1vw (capped by the viewport height, see --u in the CSS), so the composition scales as one piece.
 */
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { FormExplorationData, FormTile, FrameSize } from "../data/formExploration";

/* ------------------------------ TUNING ------------------------------ */
const AREA: Record<FrameSize, number> = { large: 420, medium: 170, small: 40 }; // u² per frame (any aspect ratio)
const LANE_Y = [14, 38, 62, 84]; //  % of the field height — centre line of each lane
const LANE_SPEED = [1.4, 0.9, 1.9, 1.15]; // u / second (negative = moves left). Different speeds = depth
const LANE_START = [0, 83, 151, 47]; //   u — where each lane starts, so the first view is already scattered
const GAPS = [10, 6, 13, 8, 11, 7]; //     u — space after each frame in a lane (cycled)
const MIN_LOOP = 260; //                   u — a lane is never shorter than this (extra space is added to the gaps)
const STOP_EASE = 5; //                    higher = stops / restarts faster
const Z: Record<FrameSize, number> = { large: 1, medium: 2, small: 3 }; // small frames stay on top

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

type Placed = FormTile & { uw: number; uh: number; x: number };
type Lane = { tiles: Placed[]; loop: number };

/* lay each lane out as a strip: x positions in u, total loop width in u */
function layout(tiles: FormTile[]): Lane[] {
  return LANE_Y.map((_, li: number) => {
    const row = tiles.filter((t: FormTile) => t.lane === li);
    const sized = row.map((t: FormTile) => {
      const ratio = t.w / t.h;
      return { ...t, uw: Math.sqrt(AREA[t.size] * ratio), uh: Math.sqrt(AREA[t.size] / ratio), x: 0 };
    });
    const gaps = sized.map((_, i: number) => GAPS[(i + li) % GAPS.length]);
    const natural = sized.reduce((s: number, t: Placed, i: number) => s + t.uw + gaps[i], 0);
    const extra = Math.max(0, MIN_LOOP - natural) / Math.max(sized.length, 1);
    let cursor = 0;
    sized.forEach((t: Placed, i: number) => {
      t.x = cursor;
      cursor += t.uw + gaps[i] + extra;
    });
    return { tiles: sized, loop: cursor };
  });
}

const COPIES = 3; // each lane is drawn three times, so the strip never runs out

export default function ProjectFormExploration({ data }: { data: FormExplorationData }) {
  const lanes = useMemo(() => layout(data.tiles), [data.tiles]);
  const sectionRef = useRef<HTMLElement>(null);
  const laneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pos = lanes.map((_: Lane, i: number) => LANE_START[i] ?? 0); // u travelled so far, per lane
    let speed = reduce ? 0 : 1; //  current speed factor 0…1
    let target = reduce ? 0 : 1; // 0 while hovering
    let raf = 0;
    let last = 0;
    let visible = false;

    const paint = () => {
      lanes.forEach((lane: Lane, i: number) => {
        const el = laneRefs.current[i];
        if (!el) return;
        const p = ((pos[i] % lane.loop) + lane.loop) % lane.loop; // 0 … loop
        el.style.transform = `translate3d(calc(var(--u) * ${(-(lane.loop + p)).toFixed(3)}), 0, 0)`;
      });
    };

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      speed += (target - speed) * (1 - Math.exp(-STOP_EASE * dt));
      if (Math.abs(target - speed) < 0.001) speed = target;
      if (speed > 0) {
        lanes.forEach((_: Lane, i: number) => {
          pos[i] += (LANE_SPEED[i] ?? 1) * speed * dt;
        });
        paint();
      }
      /* keep the loop alive while moving or still easing; sleep once fully stopped */
      if (speed > 0 || target > 0) raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) {
          section.classList.add("is-in");
          wake();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(section);
    paint();

    /* hover a frame → stop · leave → go */
    const hold = (on: boolean) => {
      if (reduce) return;
      target = on ? 0 : 1;
      wake();
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if ((e.target as HTMLElement | null)?.closest(".fe-card")) hold(true);
      else hold(false);
    };
    const onLeave = () => hold(false);
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") hold(true);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") hold(false);
    };
    section.addEventListener("pointermove", onOver);
    section.addEventListener("pointerleave", onLeave);
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      section.removeEventListener("pointermove", onOver);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [lanes]);

  return (
    <section ref={sectionRef} className="fe" aria-label={data.label}>
      <h2 className="fe-label">{data.label}</h2>

      <div className="fe-field">
        {lanes.map((lane: Lane, li: number) => (
          <div
            key={li}
            className="fe-lane"
            ref={(el) => {
              laneRefs.current[li] = el;
            }}
            style={cssVars({
              "--y": `${LANE_Y[li]}%`,
              width: `calc(var(--u) * ${lane.loop * COPIES})`,
              transform: `translate3d(calc(var(--u) * ${-(lane.loop + (LANE_START[li] ?? 0) % lane.loop)}), 0, 0)`,
            })}
          >
            {Array.from({ length: COPIES }, (_, c: number) =>
              lane.tiles.map((t: Placed, i: number) => (
                <figure
                  key={`${c}-${t.src}`}
                  className={`fe-card is-${t.size}`}
                  aria-hidden={c !== 1 ? true : undefined}
                  style={cssVars({
                    "--w": t.uw,
                    "--h": t.uh,
                    "--x": c * lane.loop + t.x,
                    "--dy": t.dy,
                    zIndex: Z[t.size],
                  })}
                >
                  <Image
                    className="fe-img"
                    src={t.src}
                    alt={c === 1 ? t.alt : ""}
                    width={t.w}
                    height={t.h}
                    sizes={`${Math.ceil(t.uw)}vw`}
                    quality={85}
                    priority={c === 1 && i < 3}
                    draggable={false}
                  />
                </figure>
              ))
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
  --label-zone: 168px; /* header (96) + the title row */
  /* 1u = 1vw, never so big that a large frame outgrows the lanes */
  --u: min(1vw, calc((100svh - var(--label-zone)) / 42));
  position: relative; height: 100svh; min-height: 560px; overflow: hidden;
  background: #fff; color: #000; box-sizing: border-box;
  padding-top: var(--label-zone);
  touch-action: pan-y; user-select: none; -webkit-user-select: none;
}

/* title — 18 · Medium · #000, centred, same type as the CONCEPT label */
.fe-label {
  position: absolute; left: 0; right: 0; top: 120px; margin: 0; z-index: 5; text-align: center;
  font-size: 18px; line-height: 24px; font-weight: 500; letter-spacing: 0; color: #000;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease) .1s, transform 1.1s var(--ease) .1s;
}
.fe.is-in .fe-label { opacity: 1; transform: none; }

/* the field: every lane sits on its own centre line */
.fe-field {
  position: relative; width: 100%; height: 100%;
  opacity: 0; transition: opacity 1.2s var(--ease) .25s;
}
.fe.is-in .fe-field { opacity: 1; }
.fe-lane { position: absolute; left: 0; top: var(--y); height: 0; will-change: transform; }

.fe-card {
  position: absolute; margin: 0; overflow: hidden; background: #efefef;
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  left: calc(var(--x) * var(--u));
  top: calc((var(--h) / -2 + var(--dy)) * var(--u));
}
.fe-img {
  display: block; width: 100%; height: 100%; object-fit: cover;
  pointer-events: none; -webkit-user-drag: none;
  /* the photographed paper blends into the #efefef frame so every frame reads as one clean tile.
     Colour is untouched: no grayscale, no filter, no hover change. */
  mix-blend-mode: multiply;
}
.fe-card { isolation: isolate; }

/* the page uses scroll-snap-type: y mandatory (ProjectDetail) — this section needs its own snap stop,
   otherwise the browser snaps back to the end of CONCEPT and this section can never be reached */
@media (min-width: 821px) {
  .fe { scroll-snap-align: start; scroll-snap-stop: always; }
}

@media (max-width: 820px) {
  .fe { --label-zone: 136px; --u: min(2.6vw, calc((100svh - var(--label-zone)) / 42)); }
  .fe-label { top: 104px; font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .fe-label, .fe-field { transition: none; opacity: 1; transform: none; }
}
`;
