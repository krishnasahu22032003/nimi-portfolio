"use client";
/* components/ProjectEchoTesting.tsx   (or src/components/ProjectEchoTesting.tsx)
 *
 * Project three · page 8 — TESTING. Built from her 1440 × 900 Canva page.
 *
 *   · beige half ......... x 0 → 720 (always the left 50 % of the screen, runs to the screen edge)
 *   · heading ............ x 90, y 89, 18 Medium #000, uppercase
 *   · left clip .......... x 90,  y 152, 408 × 596 (portrait, on the beige)
 *   · right clip ......... x 586, y 254, 697 × 392 (landscape, straddles the beige / white edge)
 *
 * VIDEO BEHAVIOUR (components/VideoPlayer.tsx)
 *   · both clips start playing MUTED as soon as the page is on screen, and pause when it leaves
 *   · one play / pause button in the centre of each clip
 *   · mute / unmute button at the bottom right of each clip
 *   · only ONE clip can have sound at a time (unmuting one mutes the other)
 *
 * CSS prefix is "pt-". Do NOT put opacity / transform / filter on .pt-page or .pt-stage.
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import VideoPlayer from "./VideoPlayer";
import type { EchoTestingData, TestingMedia } from "../data/echoTesting";

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_BEIGE = "#F2ECE1"; // same beige as the Echo Pan sound page

/* her Canva coordinates (px on the 1440 × 900 page) */
const GEO = {
  title: { x: 90, y: 89 },
  left: { x: 90, y: 152, w: 408, h: 596 },
  right: { x: 586, y: 254, w: 697, h: 392 },
};

type Side = "left" | "right";

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const at = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });

function Media({
  m,
  play,
  muted,
  onToggleMute,
}: {
  m: TestingMedia;
  play: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  if (m.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="pt-el" src={m.src} alt={m.label} draggable={false} decoding="async" style={{ objectPosition: m.position ?? "50% 50%" }} />
    );
  }
  return (
    <VideoPlayer src={m.src} poster={m.poster} label={m.label} position={m.position} play={play} muted={muted} onToggleMute={onToggleMute} />
  );
}

export default function ProjectEchoTesting({ data }: { data: EchoTestingData }) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false); //          page is on screen
  const [desktop, setDesktop] = useState<boolean | null>(null); // which of the two layouts is showing
  const [sound, setSound] = useState<Side | null>(null); //   which clip has sound on (null = both muted)

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

  /* the desktop and stacked layouts both exist in the DOM; only the visible one may play (and make sound) */
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

  return (
    <section
      ref={rootRef}
      className="pd-page pt-page"
      aria-label="Echo Pan — testing"
      style={cssVars({ "--pt-ink": COLOR_INK, "--pt-beige": COLOR_BEIGE })}
    >
      <div className="pt-bg" aria-hidden="true" />

      {/* =============================== DESKTOP (her 1440 × 900 page) =============================== */}
      <div className="pt-stage">
        <h2 className="pt-title pt-abs pt-r" style={at(GEO.title.x, GEO.title.y, { "--d": 0 })}>
          {data.heading}
        </h2>

        <div className="pt-media pt-abs pt-r" style={at(GEO.left.x, GEO.left.y, { "--w": GEO.left.w, "--h": GEO.left.h, "--d": 1 })}>
          <Media m={data.left} play={playDesktop} muted={sound !== "left"} onToggleMute={toggle("left")} />
        </div>
        <div className="pt-media pt-abs pt-r" style={at(GEO.right.x, GEO.right.y, { "--w": GEO.right.w, "--h": GEO.right.h, "--d": 2 })}>
          <Media m={data.right} play={playDesktop} muted={sound !== "right"} onToggleMute={toggle("right")} />
        </div>
      </div>

      {/* =============================== STACKED (small screens) =============================== */}
      <div className="pt-m">
        <div className="pt-m-beige">
          <h2 className="pt-title">{data.heading}</h2>
          <div className="pt-m-media pt-m-media--p">
            <Media m={data.left} play={playStacked} muted={sound !== "left"} onToggleMute={toggle("left")} />
          </div>
        </div>
        <div className="pt-m-white">
          <div className="pt-m-media pt-m-media--l">
            <Media m={data.right} play={playStacked} muted={sound !== "right"} onToggleMute={toggle("right")} />
          </div>
        </div>
      </div>

      <noscript>
        <style>{`.pt-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pt-page { --u: 1px; background: #fff; }
.pt-title { margin: 0; font-weight: 500; letter-spacing: 0; color: var(--pt-ink); text-transform: uppercase; }

.pt-media, .pt-m-media { position: relative; overflow: hidden; background: #2b2a22; }
.pt-el { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; -webkit-user-drag: none; }

/* reveal */
.pt-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pt-r { opacity: 1; transform: none; }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pt-page { scroll-snap-align: none; scroll-snap-stop: normal; padding-top: var(--header-h); }
  .pt-bg, .pt-stage { display: none; }

  .pt-title { font-size: 18px; line-height: 30px; }
  .pt-m-beige { background: var(--pt-beige); padding: 40px 24px 40px; display: flex; flex-direction: column; gap: 24px; align-items: center; }
  .pt-m-beige .pt-title { align-self: flex-start; width: 100%; max-width: 34rem; }
  .pt-m-white { padding: 32px 24px 72px; display: flex; justify-content: center; }
  .pt-m-media--p { width: min(100%, 320px); aspect-ratio: 408 / 596; }
  .pt-m-media--l { width: 100%; max-width: 34rem; aspect-ratio: 697 / 392; }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pt-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pt-m { display: none; }
  .pt-bg { position: absolute; top: 0; bottom: 0; left: 0; right: 50%; background: var(--pt-beige); pointer-events: none; }
  .pt-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .pt-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pt-media { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }

  .pt-title { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .pt-r { transition: none !important; opacity: 1; transform: none; }
}
`;