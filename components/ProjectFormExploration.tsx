"use client";

/* components/ProjectFormExploration.tsx   (or src/components/ProjectFormExploration.tsx)
 *
 * FORM EXPLORATION — a white stage with a ring of sketches that rotates endlessly.
 *
 *   • White background. The images are shown exactly as they are: no black & white → colour change,
 *     no filter, no hover effect. They only rotate.
 *   • Frames keep each photo's own aspect ratio. Two sizes: regular, and SMALL (the files she renamed
 *     "Small") — the small frames are the smallest in the rotation.
 *   • Rotation is continuous. Drag / swipe to spin it by hand (it carries on with a soft inertia and
 *     settles back to the steady speed). ← → also nudge it. Page scrolling is never hijacked.
 *   • prefers-reduced-motion: the ring stays still (it can still be dragged).
 *
 * UNITS  1u = 1vw (capped by the viewport height, see --u in the CSS). Every size below is in u,
 *        so the composition scales as one piece from phone to 4K.
 */
import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { FormExplorationData, FormTile } from "../data/formExploration";

/* ------------------------------ TUNING ------------------------------ */
const AREA_REGULAR = 340; // u² — every regular frame has this area (any aspect ratio → same visual weight)
const AREA_SMALL = 92;  //   u² — the SMALL frames. Lower = smaller.
const GAP = 3;   //          u  — space between neighbouring frames along the ring
const PERSPECTIVE = 85;  //  u  — camera distance (higher = flatter ring, lower = stronger curve)
const SPEED = 5; //          deg / second (negative sign handled below) — one full turn ≈ 72 s
const FRICTION = 2.2; //     how quickly a flick settles back to SPEED
const DRAG_GAIN = 1; //      1 = the frame under the finger follows the finger

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

type Placed = FormTile & { uw: number; uh: number; deg: number };

/* lay the frames around the ring: equal GAP between neighbours whatever their width */
function layout(tiles: FormTile[]): { placed: Placed[]; radius: number } {
  const sized = tiles.map((t: FormTile) => {
    const ratio = t.w / t.h;
    const area = t.small ? AREA_SMALL : AREA_REGULAR;
    return { ...t, uw: Math.sqrt(area * ratio), uh: Math.sqrt(area / ratio) };
  });
  const total = sized.reduce((sum: number, t) => sum + t.uw + GAP, 0);
  const radius = total / (2 * Math.PI);
  let cursor = 0;
  const placed: Placed[] = sized.map((t) => {
    const centre = cursor + t.uw / 2;
    cursor += t.uw + GAP;
    return { ...t, deg: (centre / radius) * (180 / Math.PI) };
  });
  return { placed, radius };
}

export default function ProjectFormExploration({ data }: { data: FormExplorationData }) {
  const { placed, radius } = useMemo(() => layout(data.tiles), [data.tiles]);

  const sectionRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);

  /* ---------- rotation engine ---------- */
  useEffect(() => {
    const section = sectionRef.current;
    const ring = ringRef.current;
    const probe = probeRef.current;
    if (!section || !ring || !probe) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const base = reduce ? 0 : -SPEED; // deg/s — negative = frames travel to the left
    let rot = 0; //                    current rotation (deg)
    let vel = base; //                 current speed (deg/s)
    let uPx = 14.4; //                 1u in pixels (measured)
    let raf = 0;
    let last = 0;
    let visible = false;
    let dragging = false;
    let lastX = 0;
    let lastT = 0;
    let dragVel = 0;

    const paint = () => {
      ring.style.transform = `translateZ(calc(var(--u) * ${-radius})) rotateY(${rot.toFixed(3)}deg)`;
    };
    const measure = () => {
      uPx = probe.offsetWidth / 100 || uPx;
    };
    const degPerPx = () => (180 / Math.PI) / (radius * uPx); // arc length → degrees

    const tick = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      if (!dragging) {
        vel += (base - vel) * (1 - Math.exp(-FRICTION * dt));
        rot += vel * dt;
      }
      paint();
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf && visible) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    /* run only while the section is on screen */
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

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    measure();
    paint();

    /* drag / swipe */
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastT = performance.now();
      dragVel = 0;
      section.classList.add("is-drag");
      section.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      const d = dx * degPerPx() * DRAG_GAIN;
      rot += d;
      dragVel = d / Math.max((now - lastT) / 1000, 0.008);
      lastX = e.clientX;
      lastT = now;
      paint();
    };
    const onUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      section.classList.remove("is-drag");
      section.releasePointerCapture?.(e.pointerId);
      vel = Math.max(-240, Math.min(240, dragVel)); // flick → settles back to the steady speed
      wake();
    };
    section.addEventListener("pointerdown", onDown);
    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerup", onUp);
    section.addEventListener("pointercancel", onUp);

    /* keyboard nudge (section must be focused) */
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") vel = 70;
      else if (e.key === "ArrowLeft") vel = -70;
      else return;
      e.preventDefault();
      wake();
    };
    section.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      section.removeEventListener("pointerdown", onDown);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerup", onUp);
      section.removeEventListener("pointercancel", onUp);
      section.removeEventListener("keydown", onKey);
    };
  }, [radius]);

  return (
    <section
      ref={sectionRef}
      className="fe"
      aria-roledescription="carousel"
      aria-label={data.label}
      tabIndex={0}
      style={cssVars({ "--persp": PERSPECTIVE })}
    >
      <h2 className="fe-label">{data.label}</h2>

      <div className="fe-stage">
        <div className="fe-probe" ref={probeRef} aria-hidden="true" />
        <div className="fe-ring" ref={ringRef}>
          {placed.map((t: Placed, i: number) => (
            <figure
              key={t.src}
              className={`fe-card${t.small ? " is-small" : ""}`}
              style={cssVars({ "--w": t.uw, "--h": t.uh, "--deg": `${t.deg}deg`, "--r": radius })}
            >
              <Image
                className="fe-img"
                src={t.src}
                alt={t.alt}
                width={t.w}
                height={t.h}
                sizes="(max-width: 820px) 60vw, 28vw"
                quality={85}
                priority={i < 4}
                draggable={false}
              />
            </figure>
          ))}
        </div>
      </div>

      <style>{CSS}</style>
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
.fe {
  --ease: cubic-bezier(.22, 1, .36, 1);
  /* 1u = 1vw, never taller than the screen allows (the tallest portrait frame is ≈ 23u) */
  --u: min(1vw, calc((100svh - 150px) / 30));
  position: relative; height: 100svh; min-height: 560px; overflow: hidden;
  background: #fff; color: #000;
  display: flex; flex-direction: column; align-items: center;
  padding-top: 96px; box-sizing: border-box;
  cursor: grab; touch-action: pan-y; user-select: none; -webkit-user-select: none;
  outline: none;
}
.fe.is-drag { cursor: grabbing; }
.fe:focus-visible { outline: 2px solid #000; outline-offset: -2px; }

/* title — 18 · Medium · #000, centred, same as the CONCEPT label */
.fe-label {
  position: absolute; left: 0; right: 0; top: 56px; margin: 0; text-align: center;
  font-size: 18px; line-height: 24px; font-weight: 500; letter-spacing: 0; color: #000;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease) .1s, transform 1.1s var(--ease) .1s;
}
.fe.is-in .fe-label { opacity: 1; transform: none; }

/* stage: the camera */
.fe-stage {
  position: relative; flex: 1 1 auto; width: 100%; min-height: 0;
  display: grid; place-items: center;
  perspective: calc(var(--persp) * var(--u)); perspective-origin: 50% 50%;
  opacity: 0; transition: opacity 1.2s var(--ease) .25s;
}
.fe.is-in .fe-stage { opacity: 1; }
.fe-probe { position: absolute; left: 0; top: 0; width: calc(var(--u) * 100); height: 0; visibility: hidden; pointer-events: none; }

/* the ring: a zero-size pivot in the middle of the stage */
.fe-ring { position: relative; width: 0; height: 0; transform-style: preserve-3d; will-change: transform; }

/* each frame sits on the ring, facing outward; the back half of the ring is hidden */
.fe-card {
  position: absolute; margin: 0; overflow: hidden; background: #efefef;
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  left: calc(var(--w) * var(--u) / -2); top: calc(var(--h) * var(--u) / -2);
  transform: rotateY(var(--deg)) translateZ(calc(var(--r) * var(--u)));
  backface-visibility: hidden; -webkit-backface-visibility: hidden; isolation: isolate;
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
  .fe { --u: min(2.8vw, calc((100svh - 150px) / 30)); padding-top: 72px; }
  .fe-label { top: 40px; font-size: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  .fe-label, .fe-stage { transition: none; opacity: 1; transform: none; }
}
`;