"use client";
/* components/ProjectEchoEnd.tsx   (or src/components/ProjectEchoEnd.tsx)
 *
 * Project three · page 9 — END. Built from her 1440 × 900 Canva page.
 *
 *   · video frame ........ x 259, y 140, 922 × 615 (3:2), centred on the white page
 *   · left arrow ......... 48px grey circle, centre x 208, y 450
 *   · right arrow ........ 48px grey circle, centre x 1232, y 450
 *   · TWO videos on the same page: the arrows (or ← → keys, or a swipe) switch between them.
 *
 * VIDEO BEHAVIOUR (components/VideoPlayer.tsx)
 *   · the current video starts playing MUTED as soon as the page is on screen; the other one is paused
 *   · one play / pause button in the centre of the frame
 *   · mute / unmute button at the bottom right of the frame (the choice carries over when you switch videos)
 *
 * CSS prefix is "ee-" (echo end). It must NOT be "pe-" — that belongs to ProjectEchoShapes and the two clash.
 * Do NOT put opacity / transform / filter on .ee-page or .ee-stage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import VideoPlayer from "./VideoPlayer";
import type { EchoEndData } from "../data/echoEnding";

/* ------------------------------ TUNING ------------------------------ */
const ARROW_BG = "#7f7f7f"; // her grey circles
const ARROW_BG_HOVER = "#5c5c5c";
const FADE_MS = 600; // cross-fade between the two videos
const SWIPE_PX = 50; // how far a finger must travel to switch video

/* her Canva coordinates (px on the 1440 × 900 page) */
const GEO = {
  frame: { x: 259, y: 140, w: 922, h: 615 },
  arrow: 48,
  left: { cx: 208, cy: 450 },
  right: { cx: 1232, cy: 450 },
};

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const at = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });

function Chevron({ dir }: { dir: "l" | "r" }) {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true" focusable="false">
      <path
        d={dir === "l" ? "M14.5 6.5 L9 12 L14.5 17.5" : "M9.5 6.5 L15 12 L9.5 17.5"}
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectEchoEnd({ data }: { data: EchoEndData }) {
  const { videos } = data;
  const n = videos.length;
  const rootRef = useRef<HTMLElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  const [muted, setMuted] = useState(true); // starts muted; shared by both videos

  const go = useCallback((d: number) => setActive((p) => (p + d + n) % n), [n]);

  /* reveal once + remember whether the page is on screen */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const e = entries[0];
        if (!e) return;
        setVisible(e.isIntersecting);
        if (e.isIntersecting) setSeen(true);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ← / → keys while the page is on screen */
  useEffect(() => {
    if (!visible || n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, n, go]);

  /* swipe on touch screens */
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return;
    swipe.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = (e: React.PointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s || n < 2) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  const a = GEO.arrow;

  return (
    <section
      ref={rootRef}
      className={`pd-page ee-page${seen ? " is-in" : ""}`}
      aria-label="Echo Pan — final videos"
      aria-roledescription="carousel"
      style={cssVars({ "--ee-arrow": ARROW_BG, "--ee-arrow-h": ARROW_BG_HOVER, "--ee-fade": `${FADE_MS}ms` })}
    >
      <p className="ee-sr" aria-live="polite">
        {videos[active]?.label} ({active + 1} of {n})
      </p>

      <div className="ee-stage">
        {/* the video frame: both videos stacked, cross-faded */}
        <div
          className="ee-frame ee-abs ee-r"
          style={at(GEO.frame.x, GEO.frame.y, { "--w": GEO.frame.w, "--h": GEO.frame.h, "--d": 0 })}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          {videos.map((v, k) => (
            <div key={v.src} className={`ee-layer${k === active ? " on" : ""}`} aria-hidden={k !== active}>
              <VideoPlayer
                src={v.src}
                poster={v.poster}
                label={v.label}
                play={visible && k === active}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                interactive={k === active}
              />
            </div>
          ))}

          {/* stacked layout only: arrows sit on the frame's edges */}
          {n > 1 && (
            <>
              <button type="button" className="ee-arrow ee-arrow--in ee-arrow--l" aria-label="Previous video" onClick={() => go(-1)}>
                <Chevron dir="l" />
              </button>
              <button type="button" className="ee-arrow ee-arrow--in ee-arrow--r" aria-label="Next video" onClick={() => go(1)}>
                <Chevron dir="r" />
              </button>
            </>
          )}
        </div>

        {/* desktop arrows: outside the frame, exactly where she placed them */}
        {n > 1 && (
          <>
            <button
              type="button"
              className="ee-arrow ee-arrow--out ee-abs ee-r"
              aria-label="Previous video"
              onClick={() => go(-1)}
              style={at(GEO.left.cx - a / 2, GEO.left.cy - a / 2, { "--w": a, "--d": 1 })}
            >
              <Chevron dir="l" />
            </button>
            <button
              type="button"
              className="ee-arrow ee-arrow--out ee-abs ee-r"
              aria-label="Next video"
              onClick={() => go(1)}
              style={at(GEO.right.cx - a / 2, GEO.right.cy - a / 2, { "--w": a, "--d": 1 })}
            >
              <Chevron dir="r" />
            </button>
          </>
        )}
      </div>

      <noscript>
        <style>{`.ee-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.ee-page { --u: 1px; background: #fff; }
.ee-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.ee-frame { position: relative; overflow: hidden; background: #2b2a22; touch-action: pan-y; }

/* each video (with its own buttons) lives in a layer; the layers cross-fade */
.ee-layer {
  position: absolute; inset: 0; opacity: 0; pointer-events: none;
  transition: opacity var(--ee-fade, 600ms) ease;
}
.ee-layer.on { opacity: 1; pointer-events: auto; }

.ee-arrow {
  display: block; padding: 0; border: 0; margin: 0; cursor: pointer; border-radius: 50%;
  background: var(--ee-arrow); color: #fff; -webkit-tap-highlight-color: transparent;
  transition: background .25s ease, transform .25s ease;
}
.ee-arrow:hover { background: var(--ee-arrow-h); }
.ee-arrow:active { transform: scale(.94); }
.ee-arrow:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
.ee-arrow svg { display: block; }

/* reveal */
.ee-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .ee-r { opacity: 1; transform: none; }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .ee-page { scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 16px 72px; }
  .ee-stage { width: 100%; max-width: 40rem; margin: 0 auto; }
  .ee-frame { width: 100%; aspect-ratio: 922 / 615; }
  .ee-arrow--out { display: none; }
  .ee-arrow--in { position: absolute; top: 50%; width: 40px; height: 40px; margin-top: -20px; background: rgba(90, 90, 90, .72); z-index: 5; }
  .ee-arrow--l { left: 10px; }
  .ee-arrow--r { right: 10px; }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .ee-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .ee-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .ee-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .ee-frame { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }
  .ee-arrow--out { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--w)); padding: calc(var(--u) * 12); }
  .ee-arrow--in { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .ee-r, .ee-layer, .ee-arrow { transition: none !important; }
  .ee-r { opacity: 1; transform: none; }
}
`;