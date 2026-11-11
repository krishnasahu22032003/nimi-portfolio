"use client";
/* components/ProjectConstruction.tsx   (or src/components/ProjectConstruction.tsx)
 *
 * Project three · page 7 — CONSTRUCTION. Built from her 1440 × 900 Canva page.
 *
 * LAYOUT (design px on the 1440 × 900 page)
 *   heading ... x 90, y 89 · 18 Medium #000 · uppercase
 *   tiles ..... 266 × 252, square corners
 *               columns at x 301 / 587 / 873 (20 px gap) · rows at y 189 / 459 (18 px gap)
 *   Her numbers 1–6 were file labels, so they are not drawn.
 *
 * Same unit system as the other pages: every value × --u = min(1px, 100cqw / 1440, pageHeight / 900).
 * Below 1100px wide (or under 640px tall) the tiles become a 2-column grid (1 column under 420px).
 *
 * Videos: silent, looping, autoplay; paused while off-screen; not autoplayed with reduced motion.
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ConstructionData, ConstructionTile } from "../data/construction";

const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";

/* her Canva coordinates (px on the 1440 × 900 page) */
const GEO = {
  heading: { x: 90, y: 89 },
  tile: { w: 266, h: 252 },
  xs: [301, 587, 873],
  ys: [189, 459],
} as const;

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const at = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });

function Media({ tile }: { tile: ConstructionTile }) {
  const pos = tile.position ?? "50% 50%";
  if (tile.video) {
    return (
      <video
        className="pk-media"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        poster={tile.video.poster}
        aria-label={tile.alt}
        disablePictureInPicture
        disableRemotePlayback
        style={{ objectPosition: pos }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {tile.video.webm && <source src={tile.video.webm} type="video/webm" />}
        <source src={tile.video.mp4} type="video/mp4" />
      </video>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="pk-media" src={tile.image} alt={tile.alt} draggable={false} decoding="async" loading="lazy" style={{ objectPosition: pos }} />
  );
}

export default function ProjectConstruction({ data }: { data: ConstructionData }) {
  const rootRef = useRef<HTMLElement>(null);

  /* reveal once, when the page is ~30 % in view */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* videos: silent loop, play only while visible */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const vids = Array.from(root.querySelectorAll<HTMLVideoElement>("video"));
    if (!vids.length) return;
    vids.forEach((v: HTMLVideoElement) => {
      v.muted = true;
      v.defaultMuted = true;
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      vids.forEach((v: HTMLVideoElement) => v.pause());
      return;
    }
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.2 }
    );
    vids.forEach((v: HTMLVideoElement) => io.observe(v));
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      className={`pd-page pk-page ${grotesk.className}`}
      aria-label="Echo Pan — construction"
      style={cssVars({ "--pk-ink": COLOR_INK })}
    >
      <div className="pk-stage">
        <h2 className="pk-title pk-abs pk-r" style={at(GEO.heading.x, GEO.heading.y, { "--d": 0 })}>
          {data.heading}
        </h2>

        <div className="pk-grid">
          {data.tiles.map((t: ConstructionTile, i: number) => (
            <div
              key={i}
              className="pk-tile pk-abs pk-r"
              style={at(GEO.xs[i % 3], GEO.ys[Math.floor(i / 3)], { "--w": GEO.tile.w, "--h": GEO.tile.h, "--d": 1 + i * 0.6 })}
            >
              <Media tile={t} />
            </div>
          ))}
        </div>
      </div>

      <noscript>
        <style>{`.pk-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pk-page { --u: 1px; background: #fff; }

.pk-title { margin: 0; font-weight: 500; letter-spacing: 0; color: var(--pk-ink); text-transform: uppercase; }

.pk-tile { overflow: hidden; background: #efefef; }
.pk-media { display: block; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none; pointer-events: none; }

/* reveal */
.pk-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pk-r { opacity: 1; transform: none; }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pk-page { scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 24px 72px; }
  .pk-stage { width: 100%; max-width: 34rem; margin: 0 auto; }
  .pk-title { font-size: 18px; line-height: 30px; margin-bottom: 24px; }
  .pk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .pk-tile { aspect-ratio: 266 / 252; }
}
@media (max-width: 420px) {
  .pk-grid { grid-template-columns: minmax(0, 1fr); }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pk-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pk-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }
  .pk-grid { display: contents; }

  .pk-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pk-tile { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }

  .pk-title { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .pk-r { transition: none !important; opacity: 1; transform: none; }
}
`;