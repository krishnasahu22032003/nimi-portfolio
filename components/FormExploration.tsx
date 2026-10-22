"use client";

/* components/FormExploration.tsx   (or src/components/FormExploration.tsx)
 *
 * FORM EXPLORATION — the gallery of every sketch that led to the Seesaw shape.
 * Built from her Canva page (1440 × 900 artboard).
 *
 * HOW IT WORKS (desktop ≥ 821px)
 *   The section is "pinned": while you scroll through it the stage stays on screen and the sketches rise
 *   into place, each at its own speed (small sketches travel further and faster than big ones → depth).
 *   When the last sketch lands, the board is EXACTLY her Canva page and holds for a moment before the page
 *   moves on. Scrolling back up plays it in reverse. Nothing is snapped or hijacked — it is plain scrolling,
 *   so trackpads, wheels, keyboards and touch all feel natural.
 *
 *   Motion is driven by ONE number, --p (0 → 1), written to the stage. Every sketch derives its own position and
 *   opacity from --p in CSS, so there is no per-sketch JavaScript. The value is eased a little (see EASE) so a
 *   notchy mouse wheel still feels smooth.
 *
 * BLENDING  The sketches are photographed on white paper, so they are blended with `multiply`: only the pencil
 *   shows, neighbouring crops never hide each other and no rectangular edges are visible.
 *
 * UNITS  1u = 1 Canva px, scaled to fit the screen (identical to the artboard at 1440 × 900). Because the whole
 *   board scales together, positions and sizes can never drift against each other.
 *
 * MOBILE (≤ 820px)  The board is far too small to read at phone width, so the sketches become a calm single-column
 *   gallery (staggered, each sketch keeping its relative size) that fades in as you scroll. Same images, same order.
 */
import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import type { FormExplorationData, FormTile } from "../data/formExploration";

/* ------------------------------ TUNING ------------------------------ */
const HEADER_H = 96; // px — must match HEADER_H in ProjectDetail.tsx. Set to 0 to run the board full-bleed under the header.
const ART_W = 1440; // her Canva page
const ART_H = 900;

const TRACK_VH = 2.0; // section height in screens. More = slower, longer scroll.
const LEAD_VH = 0.4; // the motion starts when the section's top edge is this far (in screens) from the top — i.e. a little BEFORE it pins, so it never arrives as an empty white screen
const SPAN = 0.46; // how much of the scroll (0–1) each sketch takes to land
const DELAY_ROWS = 0.18; // top rows land first: extra delay (0–1) for the bottom row
const DELAY_JITTER = 0.06; // tiny per-sketch variation so it never feels mechanical
const TRAVEL_NEAR = 170; // Canva px — how far the BIGGEST sketch rises from
const TRAVEL_FAR = 520; //   … and the smallest one (depth)
const EASE = 0.14; // 0.05 = floaty · 0.3 = tight · 1 = no smoothing

/* mobile gallery: a sketch this wide (Canva px) fills the column; narrower ones scale down with it, never below M_MIN */
const M_FULL_AT = 300;
const M_MIN = 0.4;
const M_ALIGN = ["start", "end", "center", "start", "end", "start", "center", "end"]; // gentle stagger, like a scattered sheet

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/* deterministic 0–1 per index (server = client, no hydration mismatch) */
const jitter = (i: number) => {
  const s = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

/* per-sketch motion, derived from its size and position — nothing to maintain by hand */
function motion(tiles: FormTile[]) {
  const areas = tiles.map((t: FormTile) => t.w * t.h);
  const maxA = Math.max(...areas);
  return tiles.map((t: FormTile, i: number) => {
    const size = Math.sqrt(areas[i] / maxA); // 1 = biggest, → 0 = smallest
    const dy = TRAVEL_FAR - (TRAVEL_FAR - TRAVEL_NEAR) * size;
    const d = clamp((t.y + t.h / 2) / ART_H, 0, 1) * DELAY_ROWS + jitter(i) * DELAY_JITTER;
    return { dy: Math.round(dy), d: Number(d.toFixed(3)) };
  });
}

/* ----------------------------- media query ----------------------------- */
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb: () => void) => {
      const mq = window.matchMedia("(max-width: 820px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 820px)").matches,
    () => false
  );
}

/* =============================== MAIN =============================== */
export default function FormExploration({ data }: { data: FormExplorationData }) {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? <MobileGallery data={data} /> : <DesktopBoard data={data} />}
      <style>{CSS}</style>
      <noscript>
        <style>{`.fx-canvas{--p:1!important}.fx-m-tile{opacity:1!important;transform:none!important}`}</style>
      </noscript>
    </>
  );
}

/* ------------------------------ DESKTOP ------------------------------ */
function DesktopBoard({ data }: { data: FormExplorationData }) {
  const { tiles, label, labelAt, note } = data;
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const m = motion(tiles);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      canvas.style.setProperty("--p", "1");
      return;
    }

    let target = 0;
    let current = -1; // -1 → first frame jumps straight to the right place (no fly-in from 0 on reload)
    let raf = 0;

    const read = () => {
      const vh = window.innerHeight;
      const r = track.getBoundingClientRect();
      const pinned = track.offsetHeight - vh; // how far the stage stays pinned
      const lead = vh * LEAD_VH;
      target = clamp((lead - r.top) / (pinned + lead), 0, 1);
    };
    const paint = () => {
      raf = 0;
      current = current < 0 ? target : current + (target - current) * EASE;
      if (Math.abs(target - current) < 0.0005) current = target;
      canvas.style.setProperty("--p", current.toFixed(4));
      if (current !== target) raf = requestAnimationFrame(paint);
    };
    const onScroll = () => {
      read();
      if (!raf) raf = requestAnimationFrame(paint);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={trackRef}
      className="fx-track"
      style={cssVars({ "--track": TRACK_VH, "--header-h": `${HEADER_H}px` })}
      aria-label={label}
    >
      <div className="fx-stage">
        <div className="fx-canvas" ref={canvasRef}>
          <h2 className="fx-label" style={cssVars({ "--cx": labelAt.cx, "--cy": labelAt.capTop })}>
            {label}
          </h2>

          {tiles.map((t: FormTile, i: number) => (
            <figure
              key={t.src}
              className="fx-tile"
              style={cssVars({ "--x": t.x, "--y": t.y, "--w": t.w, "--h": t.h, "--dy": m[i].dy, "--d": m[i].d })}
            >
              <Image
                className="fx-img"
                src={t.src}
                alt={t.alt}
                fill
                sizes={`${Math.ceil((t.w / ART_W) * 100)}vw`}
                quality={90}
                draggable={false}
                style={{ objectFit: "fill" }}
              />
            </figure>
          ))}

          {note ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="fx-note"
              src={note.src}
              alt={note.alt}
              width={note.w}
              height={note.h}
              draggable={false}
              style={cssVars({ "--x": note.x, "--y": note.y, "--w": note.w, "--h": note.h })}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- MOBILE ------------------------------- */
function MobileGallery({ data }: { data: FormExplorationData }) {
  const { tiles, label, note } = data;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".fx-m-tile, .fx-m-note"));
    if (!("IntersectionObserver" in window)) {
      items.forEach((el: HTMLElement) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    items.forEach((el: HTMLElement) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} className="fx-m" aria-label={label}>
      <h2 className="fx-m-label">{label}</h2>
      <div className="fx-m-grid">
        {tiles.map((t: FormTile, i: number) => {
          /* keep her relative sizes: the widest sketches fill the column, smaller ones stay smaller (floor so they stay readable) */
          const pct = Math.round(clamp(t.w / M_FULL_AT, M_MIN, 1) * 100);
          return (
            <figure
              key={t.src}
              className="fx-m-tile"
              style={cssVars({ "--ar": `${t.w} / ${t.h}`, "--mw": `${pct}%`, "--al": M_ALIGN[i % M_ALIGN.length] })}
            >
              <Image
                src={t.src}
                alt={t.alt}
                fill
                sizes={`${pct}vw`}
                quality={88}
                draggable={false}
                style={{ objectFit: "fill" }}
              />
            </figure>
          );
        })}
      </div>
      {note ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="fx-m-note" src={note.src} alt={note.alt} width={note.w} height={note.h} draggable={false} />
      ) : null}
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
.fx-track {
  /* 1u = 1 Canva px.  The board is 1440 × 900 and is fitted into the screen below the header. */
  --u: min(calc(100cqw / ${ART_W}), calc((100svh - var(--header-h)) / ${ART_H}));
  position: relative;
  height: calc(100svh * var(--track));
  background: #fff;
  /* one tall snap area: it lets the page arrive at the top of the section, then scroll freely through it
     (a snap area taller than the screen never fights the scrolling) */
  scroll-snap-align: start;
}

.fx-stage { position: sticky; top: 0; height: 100svh; overflow: hidden; background: #fff; }

.fx-canvas {
  --p: 0;
  position: absolute; left: 50%;
  /* centred in the space under the header */
  top: calc(var(--header-h) + (100svh - var(--header-h) - ${ART_H} * var(--u)) / 2);
  width: calc(${ART_W} * var(--u)); height: calc(${ART_H} * var(--u));
  transform: translateX(-50%);
  isolation: isolate; background: #fff;
}

/* ---------------------------- sketches ---------------------------- */
.fx-tile {
  position: absolute; margin: 0;
  left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  /* each sketch has its own start (--d) and its own travel (--dy); everything else is shared */
  --t: clamp(0, calc((var(--p) - var(--d)) / ${SPAN}), 1);
  --e: calc(1 - (1 - var(--t)) * (1 - var(--t)) * (1 - var(--t)));
  opacity: clamp(0, calc(var(--e) * 2.4), 1);
  transform: translate3d(0, calc((1 - var(--e)) * var(--dy) * var(--u)), 0);
  mix-blend-mode: multiply; /* paper disappears, only the pencil stays */
  will-change: transform, opacity;
  pointer-events: none; user-select: none;
}
.fx-img { display: block; pointer-events: none; user-select: none; }

/* --------------------------- title + note --------------------------- */
.fx-label {
  --l: clamp(0, calc((var(--p) - .04) / .14), 1);
  position: absolute; z-index: 3; margin: 0;
  left: calc(var(--cx) * var(--u)); top: calc(var(--cy) * var(--u));
  font-size: calc(18 * var(--u)); line-height: 1; font-weight: 500; letter-spacing: 0;
  color: #000; white-space: nowrap;
  /* trim the line box to the capital letters, so "top" is exactly where her capitals start */
  text-box: trim-both cap alphabetic;
  opacity: var(--l);
  transform: translate3d(-50%, calc((1 - var(--l)) * 14px), 0);
}
@supports not (text-box: trim-both cap alphabetic) {
  .fx-label { line-height: calc(24 * var(--u)); top: calc((var(--cy) - 5.7) * var(--u)); }
}

.fx-note {
  --n: clamp(0, calc((var(--p) - .62) / .12), 1);
  position: absolute; z-index: 3; display: block;
  left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
  width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
  opacity: var(--n);
  transform: translate3d(0, calc((1 - var(--n)) * 14px), 0);
  pointer-events: none; user-select: none;
}

/* -------------------------- mobile (≤ 820px) -------------------------- */
.fx-m { padding: 56px 16px 96px; background: #fff; }
.fx-m-label { margin: 0 0 32px; font-size: 16px; line-height: 24px; font-weight: 500; letter-spacing: 0; color: #000; }
.fx-m-grid {
  display: grid; grid-template-columns: minmax(0, 1fr);
  gap: 40px 0; max-width: 34rem; margin-inline: auto;
}
.fx-m-tile {
  position: relative; margin: 0; width: var(--mw); justify-self: var(--al); aspect-ratio: var(--ar);
  mix-blend-mode: multiply;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
}
.fx-m-tile.is-in, .fx-m-note.is-in { opacity: 1; transform: none; }
.fx-m-note {
  display: block; width: 64px; height: auto; margin: 40px 0 0 auto;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
}

@media (prefers-reduced-motion: reduce) {
  .fx-canvas { --p: 1; }
  .fx-m-tile, .fx-m-note { opacity: 1; transform: none; transition: none; }
}
`;
