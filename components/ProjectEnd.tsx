"use client";
/* components/ProjectEnd.tsx   (or src/components/ProjectEnd.tsx)
 *
 * Project eight — END page. One silent looping video in a frame, on a white page.
 * It slides UP OVER the last Iterations slide (same stacking "flip"), after a pause
 * (the pause lives in ProjectIterations → .ip-hold).
 *
 *   frame   x 259 · y 139 · 922 × 621 (artboard px, 1440 × 900) — centred on the page
 *
 * Data:  data/puppetEnd.ts
 * Video: public/projects/puppet-theatre/end/end.mp4 + end-poster.jpg
 * Phones (≤820px): no overlap; the frame sits full width with its 922 : 621 ratio.
 */
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { EndData } from "../data/puppetEnd";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const FRAME_X = 259;
const FRAME_Y = 139;
const FRAME_W = 922;
const FRAME_H = 621;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function ProjectEnd({ data }: { data: EndData }) {
  const outerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* reveal once + play only while on screen */
  useEffect(() => {
    const root = outerRef.current;
    const v = videoRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (v) {
      v.muted = true; // React doesn't always render the muted attribute → force it, or autoplay is blocked
      v.defaultMuted = true;
    }

    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) root.classList.add("is-in");
          if (v && !reduce) {
            if (e.isIntersecting && e.intersectionRatio > 0.3) v.play().catch(() => {});
            else if (!e.isIntersecting) v.pause();
          }
        });
      },
      { threshold: [0, 0.3] }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={outerRef}
      className="pe"
      aria-label="End"
      style={cssVars({ "--pe-x": FRAME_X, "--pe-y": FRAME_Y, "--pe-w": FRAME_W, "--pe-h": FRAME_H })}
    >
      <div className="pe-frame pe-r">
        <video
          ref={videoRef}
          className="pe-video"
          muted
          loop
          playsInline
          preload="metadata"
          poster={data.video.poster}
          tabIndex={-1}
          aria-label={data.video.label}
          disablePictureInPicture
          disableRemotePlayback
          style={{ objectPosition: data.video.position ?? "50% 50%" }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <source src={data.video.mp4} type="video/mp4" />
        </video>
      </div>

      <noscript>
        <style>{`.pe-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.pe {
  --header-h: 96px;
  --page-h: max(100svh, 560px);
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; z-index: 5;                 /* above the pinned Iterations slides */
  height: var(--page-h); background: #fff; overflow: hidden;
  box-shadow: 0 -24px 60px rgba(0, 0, 0, .08);    /* the soft edge while it slides over the last slide */
}
/* right after the Iterations stack: pull up by one page so it slides OVER the pinned last slide */
.ip + .pe { margin-top: calc(-1 * var(--page-h)); }

.pe-frame {
  position: absolute; overflow: hidden; background: #efefef;
  left: calc(var(--ax) + var(--pe-x) * var(--cu));
  top: calc(var(--y0) + var(--pe-y) * var(--cu));
  width: calc(var(--pe-w) * var(--cu)); height: calc(var(--pe-h) * var(--cu));
}
.pe-video {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block; pointer-events: none; user-select: none;
}

/* ---- reveal ---- */
.pe-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .pe-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: 150ms;
}

/* ---- phones ---- */
@media (max-width: 820px) {
  .pe { height: auto; padding: 24px 16px 72px; overflow: visible; box-shadow: none; }
  .ip + .pe { margin-top: 0; }
  .pe-frame { position: relative; left: auto; top: auto; width: 100%; height: auto; aspect-ratio: 922 / 621; }
}

@media (prefers-reduced-motion: reduce) {
  .pe-r { transition: none !important; opacity: 1; transform: none; }
}
`;