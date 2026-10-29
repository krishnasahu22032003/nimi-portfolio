"use client";

/* components/ProjectBehindScene.tsx   (or src/components/…)
 *
 * Page 5 of project "two" — "Behind the scene" (Canva 1440 × 900 artboard).
 *
 * Measured from her reference page (text sizes fitted against the real Familjen Grotesk font):
 *   · beige panel     x 0 → 644, full height (also runs to the screen's left edge on wide screens)
 *   · video           x 120, y 90, 405 × 720 (9:16)
 *   · caption         18.6 px regular, x 120, cap-top y 822  → box top 813.6
 *   · heading         21 px medium (500) / 28, x 752, cap-top y 96  → box top 87.2
 *   · body            16 px regular / 22, black, x 752, cap-top y 141 → box top 134, blank line = 22 between paragraphs
 *   · sketch          x 586, y 330, 861 × 574, opacity 0.6 (her "transparency: 60")
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk).
 * UNITS  1u = 1 Canva px, scaled to fit the screen (exact at 1440 × 900). The artboard sits on the BOTTOM edge,
 * same as the collage page.
 *
 * Video: silent endless loop, plays only while the page is on screen (saves battery / CPU).
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { BehindSceneData } from "@/data/behindScene";

/* ------------------------------ TUNING ------------------------------ */
const SECTION_GAP = 96; //            px — white space between the knot page and this page (mobile uses half)
const BEIGE = "#E0D5C0"; //           same beige as the project cover and the collage
const PANEL_W = 644; //               Canva px
const INK = "#000";
const VID = { x: 120, y: 90, w: 405, h: 720 };
const CAP = { x: 120, top: 813.6, px: 18.6, lh: 26 };
const HEAD = { x: 752, top: 87.2, px: 21, lh: 28 };
const BODY = { x: 752, top: 134, px: 16, lh: 22 }; // blank line between paragraphs = one line height

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="sw-line">
          {l}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function ProjectBehindScene({ data }: { data: BehindSceneData }) {
  const { video, caption, heading, paragraphs, sketch } = data;
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [seen, setSeen] = useState(false);

  /* reveal once; the video plays only while the page is on screen */
  useEffect(() => {
    const el = ref.current;
    const v = videoRef.current;
    if (!el) return;
    if (v) {
      v.muted = true; // React doesn't always render the muted attribute → force it, or autoplay is blocked
      v.defaultMuted = true;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          if (v && !reduce) v.play().catch(() => {});
        } else if (v) {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    /* "pd-page" → same snap behaviour as the other pages of the project */
    <section ref={ref} className={`pd-page sw${seen ? " is-in" : ""}`} aria-label="Behind the scene">
      <div className="sw-stage">
        <div className="sw-panel" aria-hidden="true" />

        <div className="sw-canvas">
          {/* LEFT: video + caption (on the beige panel) */}
          <div className="sw-left">
            <div className="sw-item sw-media" style={cssVars({ "--x": VID.x, "--y": VID.y, "--w": VID.w, "--h": VID.h, "--d": 0 })}>
              <video
                ref={videoRef}
                className="sw-video"
                src={video.mp4}
                poster={video.poster}
                loop
                muted
                playsInline
                preload="metadata"
                tabIndex={-1}
                aria-label={video.label}
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>
            <p className="sw-item sw-caption" style={cssVars({ "--x": CAP.x, "--y": CAP.top, "--d": 1 })}>
              {caption}
            </p>
          </div>

          {/* RIGHT: heading + two paragraphs */}
          <div className="sw-right">
            <h2 className="sw-item sw-head" style={cssVars({ "--x": HEAD.x, "--y": HEAD.top, "--d": 2 })}>
              {heading}
            </h2>
            <div className="sw-item sw-body" style={cssVars({ "--x": BODY.x, "--y": BODY.top, "--d": 3 })}>
              {paragraphs.map((lines, i) => (
                <p key={i}>
                  <Lines lines={lines} />
                </p>
              ))}
            </div>
          </div>

          {/* the joinery sketch, 60 % opacity */}
          <div
            className="sw-item sw-sketch"
            style={cssVars({ "--x": sketch.x, "--y": sketch.y, "--w": sketch.w, "--h": sketch.h, "--o": sketch.opacity, "--d": 4 })}
          >
            <Image src={sketch.src} alt={sketch.alt} fill sizes="60vw" quality={90} style={{ objectFit: "contain" }} />
          </div>
        </div>
      </div>

      <style>{`
        .sw {
          container-type: inline-size; position: relative; height: max(100svh, 560px);
          margin-top: ${SECTION_GAP}px;           /* white gap above (the page background is #fff) */
          background: #fff; overflow: hidden; color: ${INK};
        }
        .sw-stage { position: absolute; inset: 0; --u: min(calc(100cqw / 1440), calc(max(100svh, 560px) / 900)); }

        /* beige panel: from the screen's left edge to the artboard's x = ${PANEL_W} */
        .sw-panel { position: absolute; left: 0; top: 0; bottom: 0; width: calc(50% - ${720 - PANEL_W} * var(--u)); background: ${BEIGE}; }

        /* the artboard — centred horizontally, sitting on the bottom edge */
        .sw-canvas { position: absolute; left: 50%; bottom: 0; width: calc(1440 * var(--u)); height: calc(900 * var(--u)); transform: translateX(-50%); overflow: hidden; }
        .sw-left, .sw-right { display: contents; }

        .sw-item {
          position: absolute; left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
          margin: 0; letter-spacing: 0; font-synthesis: none;
          opacity: 0; transform: translate3d(0, calc(14 * var(--u)), 0);
          transition: opacity 1s cubic-bezier(.22, 1, .36, 1), transform 1.2s cubic-bezier(.22, 1, .36, 1);
          transition-delay: calc(var(--d) * 110ms + 100ms);
        }
        .is-in .sw-item { opacity: var(--o, 1); transform: none; }

        .sw-media, .sw-sketch { width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u)); }
        .sw-media { background: #2b2a22; overflow: hidden; }
        .sw-video { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; }

        .sw-caption { font-size: calc(${CAP.px} * var(--u)); line-height: calc(${CAP.lh} * var(--u)); font-weight: 400; white-space: nowrap; }
        .sw-head    { font-size: calc(${HEAD.px} * var(--u)); line-height: calc(${HEAD.lh} * var(--u)); font-weight: 500; white-space: nowrap; }
        .sw-body    { font-size: calc(${BODY.px} * var(--u)); line-height: calc(${BODY.lh} * var(--u)); font-weight: 400; }
        .sw-body p  { margin: 0 0 calc(${BODY.lh} * var(--u)); }
        .sw-body p:last-child { margin-bottom: 0; }
        .sw-line { display: block; white-space: nowrap; }

        /* ------------------------------ ≤ 820px: stacked ------------------------------ */
        @media (max-width: 820px) {
          .sw { height: auto; margin-top: ${Math.round(SECTION_GAP / 2)}px; overflow: visible; }
          .sw-stage { position: static; }
          .sw-panel { display: none; }
          .sw-canvas { position: static; width: auto; height: auto; transform: none; overflow: visible; }
          .sw-item { position: static; opacity: 1; transform: none; transition: none; }

          .sw-left { display: block; background: ${BEIGE}; padding: 64px 16px 32px; }
          .sw-media { width: min(100%, 300px); height: auto; aspect-ratio: 9 / 16; margin: 0 auto 14px; }
          .sw-caption { width: min(100%, 300px); margin: 0 auto; font-size: 16px; line-height: 24px; white-space: normal; }

          .sw-right { display: block; max-width: 34rem; margin-inline: auto; padding: 48px 16px 0; }
          .sw-head { font-size: 19px; line-height: 27px; margin-bottom: 16px; white-space: normal; }
          .sw-body { font-size: 15px; line-height: 24px; }
          .sw-body p { margin-bottom: 24px; }
          .sw-line { display: inline; white-space: normal; }

          .sw-sketch { position: relative; width: calc(100% - 32px); height: auto; aspect-ratio: 3 / 2; margin: 16px auto 72px; opacity: var(--o, 1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sw-item { transition: none; opacity: var(--o, 1); transform: none; }
        }
      `}</style>
    </section>
  );
}