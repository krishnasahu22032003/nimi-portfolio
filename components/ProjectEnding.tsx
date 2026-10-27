"use client";

/* components/ProjectEnding.tsx   (or src/components/ProjectEnding.tsx)          — NEW FILE
 *
 * The last thing on a project page: one silent, looping clip in a rectangular frame, centred on the screen.
 *
 *   SHAPE   The frame has the clip's own shape (data.ratio = [1072, 932]) → the WHOLE video shows, nothing is cut.
 *   SIZE    660 grid units tall (the same --cu unit as the other sections / the 3D viewer: 1cu = 1px on a 1440 × 900
 *           screen), never wider than the 979-unit content column of CONCEPT / FORM EXPLORATION.
 *   CENTRE  The section is one screen tall and keeps the header's height free above AND below the frame,
 *           so the frame sits in the true centre of the screen and can never slide under the header.
 *   MOTION  Rises in once when it scrolls into view. The clip plays only while visible (and not at all if the
 *           visitor prefers reduced motion — the poster stays).
 */
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { EndingData } from "../data/ending";

/* ------------------------------ TUNING ------------------------------ */
const HEADER_H = 96; // px — same as the other sections
const FRAME_W = 979; // grid units — the widest the frame may get (= content width of the other sections, 1209 − 231)
const FRAME_H = 660; // grid units — how tall the frame is (width follows from the clip's shape)

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function ProjectEnding({ data }: { data: EndingData }) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { video } = data;

  /* the frame rises in when the section is half in view */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            root.classList.add("is-in");
            io.disconnect();
          }
        }),
      { threshold: 0.3 }
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  /* silent endless loop: fades in once the first frame is ready, plays only while on screen */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // React doesn't always render the muted attribute → force it, or autoplay is blocked
    v.defaultMuted = true;

    const show = () => v.classList.add("ready");
    if (v.readyState >= 2) show();
    v.addEventListener("loadeddata", show);
    v.addEventListener("canplay", show);
    const fallback = window.setTimeout(show, 2500);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | undefined;
    if (!reduce) {
      io = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          const e = entries[0];
          if (!e) return;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        },
        { threshold: 0.15 }
      );
      io.observe(v);
    }

    return () => {
      window.clearTimeout(fallback);
      v.removeEventListener("loadeddata", show);
      v.removeEventListener("canplay", show);
      io?.disconnect();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="pe"
      aria-label="Seesaw — in use"
      style={cssVars({
        "--header-h": `${HEADER_H}px`,
        "--frame-w": FRAME_W,
        "--frame-h": FRAME_H,
        "--rw": (data.ratio ?? [1072, 932])[0],
        "--rh": (data.ratio ?? [1072, 932])[1],
      })}
    >
      <div className="pe-frame">
        <video
          ref={videoRef}
          className="pe-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={video.poster}
          tabIndex={-1}
          aria-label={video.label}
          disablePictureInPicture
          disableRemotePlayback
          style={{ objectPosition: video.position ?? "50% 50%" }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {video.webm && <source src={video.webm} type="video/webm" />}
          <source src={video.mp4} type="video/mp4" />
        </video>
      </div>

      <noscript>
        <style>{`.pe-frame{opacity:1!important;transform:none!important}.pe-video{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
.pe {
  --ease: cubic-bezier(.22, 1, .36, 1);
  /* same unit as CONCEPT / FORM EXPLORATION / the 3D viewer: 1 cu = 1px on a 1440 × 900 screen */
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));

  container-type: inline-size;
  position: relative; box-sizing: border-box;
  min-height: max(100svh, 560px);
  padding: var(--header-h) 0; /* header's height free above AND below → the frame is centred on the screen */
  display: grid; place-items: center;
  background: #fff;
}
/* desktop snap (set on <html> by ProjectDetail): the ending is a stop of its own.
   If scrolling ever feels sticky around FABRICATION, delete this one rule. */
html.pd-snap .pe { scroll-snap-align: start; }

.pe-frame {
  position: relative; overflow: hidden; background: #efefef;
  /* sized by HEIGHT (so it always fits the screen), capped at the content column; height follows from the shape */
  width: min(calc(var(--frame-w) * var(--cu)), calc(var(--frame-h) * var(--cu) * var(--rw) / var(--rh)));
  aspect-ratio: var(--rw) / var(--rh);
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
}
.pe.is-in .pe-frame { opacity: 1; transform: none; }

.pe-video {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block;
  opacity: 0; transform: scale(1.06);
  transition: opacity .6s ease, transform 1.8s var(--ease) .15s;
  pointer-events: none; user-select: none;
}
.pe-video.ready { opacity: 1; }
.pe.is-in .pe-video { transform: scale(1); }

/* ---------- ≤820px: full width minus the 16px page gutter (height follows the clip's shape) ---------- */
@media (max-width: 820px) {
  .pe { min-height: 0; padding: 56px 16px 96px; }
  .pe-frame { width: 100%; height: auto; }
  html.pd-snap .pe { scroll-snap-align: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pe-frame, .pe-video { transition: none !important; }
  .pe-frame { opacity: 1; transform: none; }
  .pe-video { transform: none; }
}
`;