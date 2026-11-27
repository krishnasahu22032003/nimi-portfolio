"use client";
/* components/ProjectPerform.tsx
 *
 * Project eight · PERFORM. Built from her 1440 × 900 Canva page.
 *
 *   · heading ........ x 90,  y 89,  18 Medium, #D98A1B, uppercase
 *   · text ........... x 90,  y 130, 16 / 26 Regular #000 (3 forced lines on desktop)
 *   · left clip ...... x 90,  y 293, 760 × 460 (landscape)
 *   · right clip ..... x 929, y 293, 359 × 460
 *
 * VIDEO BEHAVIOUR (components/VideoPlayer.tsx), same as the Echo Pan testing page
 *   · both clips start MUTED when the page is on screen, and pause when it leaves
 *   · play / pause button in the centre of each clip, mute button bottom right
 *   · only ONE clip can have sound at a time
 *
 * The root <section> carries data-hiw-step="perform" so the fixed
 * BUILD / COMPOSE / INTERPRET / PERFORM timeline highlights PERFORM here.
 * CSS prefix is "pf-". Do NOT put opacity / transform / filter on .pf-page or .pf-stage.
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import VideoPlayer from "./VideoPlayer";
import type { PerformData } from "../data/puppetPerform";

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_ACCENT = "#D98A1B"; // PERFORM orange: eyedrop her Canva heading and paste the exact hex here

/* her Canva coordinates (px on the 1440 × 900 page) */
const GEO = {
  title: { x: 90, y: 89 },
  text: { x: 90, y: 130 },
  left: { x: 90, y: 293, w: 760, h: 460 },
  right: { x: 929, y: 293, w: 359, h: 460 },
};

type Side = "left" | "right";

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const at = (x: number, y: number, extra: Record<string, string | number> = {}) =>
  cssVars({ "--x": x, "--y": y, ...extra });

export default function ProjectPerform({ data }: { data: PerformData }) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false); //                 page is on screen
  const [desktop, setDesktop] = useState<boolean | null>(null); //   which layout is showing
  const [sound, setSound] = useState<Side | null>(null); //          which clip has sound (null = both muted)

  /* page on screen → reveal once + play; off screen → pause */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const e = entries[0];
        if (!e) return;
        setVisible(e.isIntersecting);
        if (e.isIntersecting) el.classList.add("is-in");
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* desktop and stacked layouts both exist in the DOM; only the visible one may play (and make sound) */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px) and (min-height: 640px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const toggle = (side: Side) => () => setSound((s) => (s === side ? null : side));
  const playDesktop = visible && desktop === true;
  const playStacked = visible && desktop === false;

  const Text = (
    <>
      {data.lines.map((t: string, i: number) => (
        <span key={i} className="pf-line">
          {t}
          {i < data.lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );

  return (
    <section
      ref={rootRef}
      className="pd-page pf-page"
      data-hiw-step="perform"
      aria-label="Puppet theatre — perform"
      style={cssVars({ "--pf-ink": COLOR_INK, "--pf-accent": COLOR_ACCENT })}
    >
      {/* =============================== DESKTOP (her 1440 × 900 page) =============================== */}
      <div className="pf-stage">
        <h2 className="pf-title pf-abs pf-r" style={at(GEO.title.x, GEO.title.y, { "--d": 0 })}>
          {data.heading}
        </h2>

        <p className="pf-text pf-abs pf-r" style={at(GEO.text.x, GEO.text.y, { "--d": 1 })}>
          {Text}
        </p>

        <div
          className="pf-media pf-abs pf-r"
          style={at(GEO.left.x, GEO.left.y, { "--w": GEO.left.w, "--h": GEO.left.h, "--d": 2 })}
        >
          <VideoPlayer
            src={data.left.src}
            poster={data.left.poster}
            label={data.left.label}
            position={data.left.position}
            play={playDesktop}
            muted={sound !== "left"}
            onToggleMute={toggle("left")}
          />
        </div>

        <div
          className="pf-media pf-abs pf-r"
          style={at(GEO.right.x, GEO.right.y, { "--w": GEO.right.w, "--h": GEO.right.h, "--d": 3 })}
        >
          <VideoPlayer
            src={data.right.src}
            poster={data.right.poster}
            label={data.right.label}
            position={data.right.position}
            play={playDesktop}
            muted={sound !== "right"}
            onToggleMute={toggle("right")}
          />
        </div>
      </div>

      {/* =============================== STACKED (small screens) =============================== */}
      <div className="pf-m">
        <h2 className="pf-title">{data.heading}</h2>
        <p className="pf-text">{Text}</p>

        <div className="pf-m-media pf-m-media--l">
          <VideoPlayer
            src={data.left.src}
            poster={data.left.poster}
            label={data.left.label}
            position={data.left.position}
            play={playStacked}
            muted={sound !== "left"}
            onToggleMute={toggle("left")}
          />
        </div>
        <div className="pf-m-media pf-m-media--p">
          <VideoPlayer
            src={data.right.src}
            poster={data.right.poster}
            label={data.right.label}
            position={data.right.position}
            play={playStacked}
            muted={sound !== "right"}
            onToggleMute={toggle("right")}
          />
        </div>
      </div>

      <noscript>
        <style>{`.pf-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pf-page { --u: 1px; background: #fff; }
.pf-title { margin: 0; font-size: 18px; line-height: 30px; font-weight: 500; letter-spacing: 0; color: var(--pf-accent); text-transform: uppercase; }
.pf-text  { margin: 0; font-size: 16px; line-height: 26px; font-weight: 400; letter-spacing: 0; color: var(--pf-ink); text-align: left; }

.pf-media, .pf-m-media { position: relative; overflow: hidden; background: #2b2a22; }

/* reveal (same easing as every other page) */
.pf-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pf-r { opacity: 1; transform: none; }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pf-page { scroll-snap-align: none; scroll-snap-stop: normal; padding-top: var(--header-h); }
  .pf-stage { display: none; }

  .pf-m { display: flex; flex-direction: column; gap: 24px; padding: 40px 24px 72px; max-width: 34rem; margin: 0 auto; box-sizing: content-box; }
  .pf-m .pf-title { margin-bottom: -12px; }
  .pf-text { text-wrap: pretty; }
  .pf-m-media--l { width: 100%; aspect-ratio: 760 / 460; }
  .pf-m-media--p { width: min(100%, 320px); aspect-ratio: 359 / 460; align-self: center; }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pf-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pf-m { display: none; }
  .pf-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .pf-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pf-media { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }

  .pf-title { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pf-text  { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); }
  .pf-line  { display: block; white-space: nowrap; } /* her line breaks, kept exactly */
}

@media (prefers-reduced-motion: reduce) {
  .pf-r { transition: none !important; opacity: 1; transform: none; }
}
`;