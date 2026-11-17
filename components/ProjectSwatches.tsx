"use client";
/* components/ProjectSwatches.tsx   (or src/components/ProjectSwatches.tsx)
 *
 * Project eight: HDPE swatches page, measured from the Canva page (1440 × 900 artboard, scaled with --cu
 * exactly like the Key features and Opportunity pages, so at 1440 × 900 the screen IS the Canva page):
 *   background .......... #233239, full width
 *   tiles ............... 304 × 183, square corners, 3 × 3
 *   columns start at .... x 221 · 568 · 915   (gap 43)
 *   rows start at ....... y 137 · 358 · 579   (gap 38)
 *   the grid is 998 × 625 and sits exactly in the middle of the page
 *
 * Interaction: click a tile → it flips (3D card flip) from the shredded plastic to the heat-pressed result.
 * Click it again → it flips back. Each tile works on its own. Tiles are real buttons:
 * Tab to reach them, Enter / Space to flip. Reduced motion → the photo swaps instantly.
 *
 * Phones (≤820px): two columns, the ninth tile is centred on its own row.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { SwatchItem, SwatchesData } from "../data/puppetSwatches";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const TILE_W = 304;
const TILE_H = 183;
const GRID_X = 221; // left edge of the first column
const GRID_Y = 137; // top edge of the first row
const COL_GAP = 43;
const ROW_GAP = 38;
const FLIP_MS = 800; // duration of the flip

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function ProjectSwatches({ data }: { data: SwatchesData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [flipped, setFlipped] = useState<boolean[]>(() => data.items.map(() => false));

  const toggle = (i: number) =>
    setFlipped((prev: boolean[]) => prev.map((v: boolean, j: number) => (j === i ? !v : v)));

  /* reveal once when the page scrolls into view */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pd-page sw"
      aria-label="HDPE panel swatches"
      style={cssVars({
        "--sw-bg": data.background,
        "--sw-w": TILE_W,
        "--sw-h": TILE_H,
        "--sw-x": GRID_X,
        "--sw-y": GRID_Y,
        "--sw-cgap": COL_GAP,
        "--sw-rgap": ROW_GAP,
        "--sw-flip": `${FLIP_MS}ms`,
      })}
    >
      <ul className="sw-grid">
        {data.items.map((it: SwatchItem, i: number) => {
          const on = flipped[i] ?? false;
          return (
            <li key={it.raw} className="sw-cell" style={cssVars({ "--i": i })}>
              <button
                type="button"
                className="sw-tile"
                aria-pressed={on}
                aria-label={`Sample ${i + 1}, ${it.alt}. ${on ? "Showing the heat-pressed result" : "Showing the shredded plastic"}. Press to flip.`}
                onClick={() => toggle(i)}
              >
                <span className="sw-card">
                  <span className="sw-face sw-face--front" aria-hidden="true">
                    <Image
                      src={it.raw}
                      alt=""
                      fill
                      loading="eager"
                      sizes="(max-width: 820px) 50vw, 22vw"
                      quality={90}
                      draggable={false}
                      style={{ objectFit: "cover" }}
                    />
                  </span>
                  <span className="sw-face sw-face--back" aria-hidden="true">
                    <Image
                      src={it.pressed}
                      alt=""
                      fill
                      loading="eager"
                      sizes="(max-width: 820px) 50vw, 22vw"
                      quality={90}
                      draggable={false}
                      style={{ objectFit: "cover" }}
                    />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <noscript>
        <style>{`.sw-cell{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.sw {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; overflow: hidden;
  height: var(--page-h);
  background: var(--sw-bg);
}

/* the 3 × 3 grid, placed from the Canva page */
.sw-grid {
  position: absolute; margin: 0; padding: 0; list-style: none;
  left: calc(var(--ax) + var(--sw-x) * var(--cu));
  top: calc(var(--header-h) + (var(--sw-y) - 96) * var(--cu));
  display: grid;
  grid-template-columns: repeat(3, calc(var(--sw-w) * var(--cu)));
  column-gap: calc(var(--sw-cgap) * var(--cu));
  row-gap: calc(var(--sw-rgap) * var(--cu));
}

/* reveal: each tile fades up, one after another */
.sw-cell {
  width: calc(var(--sw-w) * var(--cu)); height: calc(var(--sw-h) * var(--cu));
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(var(--i, 0) * 70ms + 100ms);
}
.is-in .sw-cell { opacity: 1; transform: none; }

/* the tile = a button that holds the 3D scene */
.sw-tile {
  position: relative; display: block; width: 100%; height: 100%;
  margin: 0; padding: 0; border: 0; background: none; border-radius: 0;
  cursor: pointer; perspective: 1000px;
  -webkit-tap-highlight-color: transparent;
  transition: transform .45s var(--ease);
}
.sw-tile:focus { outline: none; }
.sw-tile:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }

.sw-card {
  position: absolute; inset: 0; display: block;
  transform-style: preserve-3d; -webkit-transform-style: preserve-3d;
  transition: transform var(--sw-flip) cubic-bezier(.45, .05, .2, 1);
}
.sw-tile[aria-pressed="true"] .sw-card { transform: rotateY(180deg); }

.sw-face {
  position: absolute; inset: 0; display: block; overflow: hidden;
  background: #2f424a;
  backface-visibility: hidden; -webkit-backface-visibility: hidden;
}
.sw-face--back { transform: rotateY(180deg); }
.sw-face img { user-select: none; -webkit-user-drag: none; }

@media (hover: hover) and (pointer: fine) {
  .sw-tile:hover { transform: translateY(-3px); }
}

/* ---------- ≤820px: two columns, the ninth tile centred ---------- */
@media (max-width: 820px) {
  .sw { --cu: 1px; height: auto; padding: calc(var(--header-h) + 8px) 16px 72px; }
  .sw-grid {
    position: static; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 12px; row-gap: 12px;
  }
  .sw-cell { width: 100%; height: auto; aspect-ratio: 304 / 183; }
  .sw-cell:last-child { grid-column: 1 / -1; justify-self: center; width: calc(50% - 6px); }
}

@media (prefers-reduced-motion: reduce) {
  .sw-cell, .sw-tile, .sw-card { transition: none !important; }
  .sw-cell { opacity: 1; transform: none; }
}
`;