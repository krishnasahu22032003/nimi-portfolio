"use client";
/* components/ProjectEchoEnd.tsx   (or src/components/ProjectEchoEnd.tsx)
 *
 * Project three · page 9 — END. Built from her 1440 × 900 Canva page.
 *
 *   · video frame ........ x 259, y 140, 922 × 615 (3:2), centred on the white page
 *   · left arrow ......... 48px grey circle, centre x 208, y 450
 *   · right arrow ........ 48px grey circle, centre x 1232, y 450
 *   · TWO videos on the same page: the arrows (or ← → keys, or a swipe) switch between them.
 *     Only the visible video plays; the other pauses. Silent endless loops.
 *
 * Every position AND size is her Canva value × --u = min(1px, 100cqw / 1440, pageHeight / 900).
 * Below 1100px wide (or under 640px tall) the video fills the width and the arrows sit on its left / right edges.
 *
 * Do NOT put opacity / transform / filter on .pe-page or .pe-stage.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);

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

  /* only the active video plays, and only while the page is on screen */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    vids.current.forEach((v, k) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
      if (visible && k === active && !reduce) v.play().catch(() => {});
      else v.pause();
    });
  }, [active, visible]);

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
      className={`pd-page pe-page${seen ? " is-in" : ""}`}
      aria-label="Echo Pan — final videos"
      aria-roledescription="carousel"
      style={cssVars({ "--pe-arrow": ARROW_BG, "--pe-arrow-h": ARROW_BG_HOVER, "--pe-fade": `${FADE_MS}ms` })}
    >
      <p className="pe-sr" aria-live="polite">
        {videos[active]?.label} ({active + 1} of {n})
      </p>

      <div className="pe-stage">
        {/* the video frame: both videos stacked, cross-faded */}
        <div
          className="pe-frame pe-abs pe-r"
          style={at(GEO.frame.x, GEO.frame.y, { "--w": GEO.frame.w, "--h": GEO.frame.h, "--d": 0 })}
          onPointerDown={onDown}
          onPointerUp={onUp}
          onPointerCancel={() => (swipe.current = null)}
        >
          {videos.map((v, k) => (
            <video
              key={v.src}
              ref={(el) => {
                vids.current[k] = el;
              }}
              className={`pe-video${k === active ? " on" : ""}`}
              src={v.src}
              poster={v.poster}
              loop
              muted
              playsInline
              preload={k === 0 ? "auto" : "metadata"}
              tabIndex={-1}
              aria-hidden={k !== active}
              aria-label={v.label}
              disablePictureInPicture
              disableRemotePlayback
              onContextMenu={(e) => e.preventDefault()}
            />
          ))}

          {/* stacked layout only: arrows sit on the frame's edges */}
          {n > 1 && (
            <>
              <button type="button" className="pe-arrow pe-arrow--in pe-arrow--l" aria-label="Previous video" onClick={() => go(-1)}>
                <Chevron dir="l" />
              </button>
              <button type="button" className="pe-arrow pe-arrow--in pe-arrow--r" aria-label="Next video" onClick={() => go(1)}>
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
              className="pe-arrow pe-arrow--out pe-abs pe-r"
              aria-label="Previous video"
              onClick={() => go(-1)}
              style={at(GEO.left.cx - a / 2, GEO.left.cy - a / 2, { "--w": a, "--d": 1 })}
            >
              <Chevron dir="l" />
            </button>
            <button
              type="button"
              className="pe-arrow pe-arrow--out pe-abs pe-r"
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
        <style>{`.pe-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pe-page { --u: 1px; background: #fff; }
.pe-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.pe-frame { position: relative; overflow: hidden; background: #2b2a22; touch-action: pan-y; }
.pe-video {
  position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover;
  opacity: 0; transition: opacity var(--pe-fade, 600ms) ease; pointer-events: none; user-select: none;
}
.pe-video.on { opacity: 1; }

.pe-arrow {
  display: block; padding: 0; border: 0; margin: 0; cursor: pointer; border-radius: 50%;
  background: var(--pe-arrow); color: #fff; -webkit-tap-highlight-color: transparent;
  transition: background .25s ease, transform .25s ease;
}
.pe-arrow:hover { background: var(--pe-arrow-h); }
.pe-arrow:active { transform: scale(.94); }
.pe-arrow:focus-visible { outline: 2px solid #000; outline-offset: 3px; }
.pe-arrow svg { display: block; }

/* reveal */
.pe-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pe-r { opacity: 1; transform: none; }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pe-page { scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 16px 72px; }
  .pe-stage { width: 100%; max-width: 40rem; margin: 0 auto; }
  .pe-frame { width: 100%; aspect-ratio: 922 / 615; }
  .pe-arrow--out { display: none; }
  .pe-arrow--in { position: absolute; top: 50%; width: 40px; height: 40px; margin-top: -20px; background: rgba(90, 90, 90, .72); z-index: 2; }
  .pe-arrow--l { left: 10px; }
  .pe-arrow--r { right: 10px; }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pe-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pe-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .pe-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pe-frame { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }
  .pe-arrow--out { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--w)); padding: calc(var(--u) * 12); }
  .pe-arrow--in { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pe-r, .pe-video, .pe-arrow { transition: none !important; }
  .pe-r { opacity: 1; transform: none; }
}
`;