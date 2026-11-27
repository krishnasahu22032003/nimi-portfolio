"use client";

/* components/ProjectCompose.tsx   (or src/components/ProjectCompose.tsx)
 *
 * Project eight — HOW IT WORKS · COMPOSE  ("1. Pick a world")
 *
 * Same system as ProjectBuild / HowItWorksTimeline: a 1440 × 900 artboard scaled by --cu,
 * every element placed by its Canva coordinates (x, y in artboard px).
 *
 * CSS PREFIX IS "cmp-" (it was "pc-", which collided with ProjectConstruction's styles
 * and pushed the paragraph to the top-left of the page). Keep it unique.
 *
 * THE CARD ANIMATION (starts once, when the page is half on screen)
 *   stage 1  the four cards appear close together, like a deck held in the hand
 *   stage 2  they spread into the fan from her Canva page
 *   stage 3  each card settles with a tiny natural movement, one after another (Ocean → Forest → Town → Space)
 *   stage 4  the Forest card lifts out in front of the others, then "FOREST / Now create the setting" fades in
 *   stage 4 (live)  HOVER: the card under the cursor lifts up and comes on top of the others, then settles back when
 *                   the cursor leaves. The cards never leave their places. Touch: tap a card to lift it. Keyboard: Tab.
 *   prefers-reduced-motion: no movement, the finished page is shown straight away.
 *
 * The timeline (BUILD · COMPOSE · INTERPRET · PERFORM) is the existing <HowItWorksTimeline />, with active="compose".
 * The section carries data-hiw-step="compose" so the timeline dots can jump here.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import HowItWorksTimeline from "./HowItWorksTimeline";
import type { ComposeData } from "../data/puppetCompose";

/* ------------------------------ TUNING ------------------------------ */
const COLOR_ORANGE = "#E28A12"; // "COMPOSE" (her Canva orange)
const CARD_W = 290; // artboard px — the PNG is 2:3 and has a little transparent margin, so the painted card ≈ 278 wide
const CARD_H = 435;

/* timing, ms from the moment the page is half on screen */
const T_SPREAD = 900; //  deck → fan
const T_SETTLE = T_SPREAD + 1700; // the cards settle one after another (260ms apart, see CSS)
const T_FORWARD = T_SETTLE + 3 * 260 + 1300; // Forest comes forward, then the caption
const T_LIVE = T_FORWARD + 1500; //   hover switches on once everything has settled

/* hover highlight */
const HOVER_LIFT = 26; //   artboard px the card rises
const HOVER_SCALE = 1.06; // how much it grows
const HOVER_STRAIGHTEN = 0.35; // share of its tilt it keeps (0 = fully upright, 1 = keeps all of it)

/* artboard coordinates of the text (top-left of each box, 1440 × 900) */
const POS = {
  kicker: { x: 90, y: 163 },
  tagline: { x: 240, y: 164 },
  step: { x: 108, y: 214 },
  paragraph: { x: 90, y: 263 },
  note: { x: 90, y: 346 },
  caption: { y: 817 }, // top of the caption's first line (its centre-x follows the featured card)
};

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function ProjectCompose({ data }: { data: ComposeData }) {
  const ref = useRef<HTMLElement>(null);
  const [stage, setStage] = useState(0);
  const [live, setLive] = useState(false); // hover only works after the intro animation has finished
  const [hot, setHot] = useState<number | null>(null); // index of the card under the cursor

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStage(4);
      setLive(true);
      return;
    }

    const timers: number[] = [];
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setStage(1);
      timers.push(window.setTimeout(() => setStage(2), T_SPREAD));
      timers.push(window.setTimeout(() => setStage(3), T_SETTLE));
      timers.push(window.setTimeout(() => setStage(4), T_FORWARD));
      timers.push(window.setTimeout(() => setLive(true), T_LIVE));
    };

    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0]?.isIntersecting) {
          start();
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const { cards, featured, featuredPose: fp } = data;

  return (
    <section
      ref={ref}
      className={`pd-page cmp cmp-s${stage}${live ? " cmp-live" : ""}`}
      data-hiw-step="compose"
      aria-label="How it works — Compose"
      style={cssVars({ "--cw": CARD_W, "--ch": CARD_H, "--orange": COLOR_ORANGE, "--lift": HOVER_LIFT, "--hs": HOVER_SCALE })}
    >
      <HowItWorksTimeline active="compose" />

      {/* ---------------- text ---------------- */}
      <p className="cmp-abs cmp-kicker" style={cssVars({ "--x": POS.kicker.x, "--y": POS.kicker.y })}>
        {data.kicker}
      </p>
      <p className="cmp-abs cmp-tagline" style={cssVars({ "--x": POS.tagline.x, "--y": POS.tagline.y })}>
        {data.tagline}
      </p>

      <h2 className="cmp-abs cmp-step" style={cssVars({ "--x": POS.step.x, "--y": POS.step.y })}>
        <span className="cmp-step-n">{data.step.number}</span>
        <span className="cmp-step-t">{data.step.title}</span>
      </h2>

      <p className="cmp-abs cmp-para" style={cssVars({ "--x": POS.paragraph.x, "--y": POS.paragraph.y })}>
        {data.paragraph.map((line: string, i: number) => (
          <span key={i} className="cmp-line">
            {line}
            {i < data.paragraph.length - 1 ? " " : null}
          </span>
        ))}
      </p>

      <p className="cmp-abs cmp-note" style={cssVars({ "--x": POS.note.x, "--y": POS.note.y })}>
        {data.note}
      </p>

      {/* ---------------- the cards ---------------- */}
      <div className="cmp-fan">
        <div className="cmp-art" role="group" aria-label="The four world cards: Ocean, Forest, Town and Space">
          {cards.map((c, i: number) => {
            const odd = i % 2 === 1;
            return (
              <div
                key={c.key}
                className={`cmp-card${i === featured ? " cmp-feat" : ""}${hot === i ? " cmp-hot" : ""}`}
                style={cssVars({
                  "--i": i,
                  "--fx": c.x,
                  "--fy": c.y,
                  "--r": `${c.r}deg`,
                  "--z": c.z,
                  "--sx": c.from.x,
                  "--sy": c.from.y,
                  "--sr": `${c.from.r}deg`,
                  "--hr": `${c.r * HOVER_STRAIGHTEN}deg`,
                  /* the tiny movement of the settle step: alternate direction card by card */
                  "--wx": odd ? -5 : 5,
                  "--wy": odd ? 4 : -4,
                  "--wr": odd ? "-1.6deg" : "1.6deg",
                  /* where the featured card lands */
                  "--ex": fp.x - c.x,
                  "--ey": fp.y - c.y,
                  "--es": fp.scale,
                })}
              >
                <Image
                  src={c.src}
                  alt={c.alt}
                  width={3000}
                  height={4500}
                  sizes="(max-width: 820px) 34vw, 22vw"
                  quality={90}
                  priority={i === 0}
                  draggable={false}
                />
              </div>
            );
          })}

          <p
            className="cmp-caption"
            aria-live="polite"
            style={cssVars({ "--cx": fp.x, "--y": POS.caption.y })}
          >
            {data.caption.map((line: string, i: number) => (
              <span key={i} className="cmp-cap-line">
                {line}
              </span>
            ))}
          </p>

          {/* invisible hover zones: they stay at each card's RESTING place, so the card that lifts never
              moves out from under the cursor (no flicker). Stacking order = the fan's stacking order. */}
          {cards.map((c, i: number) => (
            <button
              key={`hit-${c.key}`}
              type="button"
              className={`cmp-hit${i === featured ? " cmp-feat" : ""}`}
              aria-label={c.world}
              tabIndex={live ? 0 : -1}
              onPointerEnter={(e) => { if (e.pointerType !== "touch") setHot(i); }}
              onPointerLeave={(e) => { if (e.pointerType !== "touch") setHot((h: number | null) => (h === i ? null : h)); }}
              onPointerDown={(e) => { if (e.pointerType === "touch") setHot((h: number | null) => (h === i ? null : i)); }}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setHot(i); }}
              onBlur={() => setHot((h: number | null) => (h === i ? null : h))}
              style={cssVars({
                "--fx": c.x,
                "--fy": c.y,
                "--r": `${c.r}deg`,
                "--z": c.z,
                "--ex": fp.x - c.x,
                "--ey": fp.y - c.y,
                "--es": fp.scale,
              })}
            />
          ))}
        </div>
      </div>

      <style>{CSS}</style>
    </section>
  );
}

/* ------------------------------------ CSS ------------------------------------ */
const CSS = `
.cmp {
  /* the 1440 × 900 artboard, scaled to fit the page. Same variable names as ProjectBuild / HowItWorksTimeline. */
  --cu: min(calc(100cqw / 1440), calc(var(--page-h) / 900));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc((var(--page-h) - 900 * var(--cu)) / 2);
  height: var(--page-h);
  overflow: hidden;
  background: #fff;
  color: #000;
}

/* ---------------- text (desktop: absolute on the artboard) ---------------- */
.cmp .cmp-abs {
  position: absolute; margin: 0;
  left: calc(var(--ax) + var(--x) * var(--cu));
  top: calc(var(--y0) + var(--y) * var(--cu));
}

.cmp .cmp-kicker  { font-size: max(16px, calc(20 * var(--cu))); line-height: calc(28 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--orange); white-space: nowrap; }
.cmp .cmp-tagline { font-size: max(14px, calc(16 * var(--cu))); line-height: calc(24 * var(--cu)); font-weight: 400; color: #000; white-space: nowrap; }
.cmp .cmp-step    { display: flex; align-items: baseline; gap: calc(6 * var(--cu)); font-size: max(16px, calc(20 * var(--cu))); line-height: calc(28 * var(--cu)); color: #000; white-space: nowrap; }
.cmp .cmp-step-n  { font-weight: 400; }
.cmp .cmp-step-t  { font-weight: 600; }
.cmp .cmp-para    { font-size: max(15px, calc(20 * var(--cu))); line-height: calc(29 * var(--cu)); font-weight: 400; letter-spacing: 0; text-align: left; color: #000; }
.cmp .cmp-note    { font-size: max(14px, calc(16 * var(--cu))); line-height: calc(24 * var(--cu)); font-weight: 400; color: #000; white-space: nowrap; }

/* her line breaks are kept on desktop */
.cmp .cmp-line { display: block; white-space: nowrap; }

/* ---------------- the card fan ---------------- */
.cmp-fan { position: absolute; inset: 0; pointer-events: none; }
.cmp-art {
  position: absolute;
  left: var(--ax); top: var(--y0);
  width: calc(1440 * var(--cu)); height: calc(900 * var(--cu));
}

.cmp-card {
  position: absolute; z-index: var(--z);
  left: calc(var(--fx) * var(--cu)); top: calc(var(--fy) * var(--cu));
  width: calc(var(--cw) * var(--cu)); height: calc(var(--ch) * var(--cu));
  margin: calc(var(--ch) * var(--cu) / -2) 0 0 calc(var(--cw) * var(--cu) / -2);
  transform-origin: 50% 50%;
  will-change: transform, opacity;
  /* stage 0–1: the deck — all four close together, slightly smaller */
  opacity: 0;
  transform:
    translate(calc((var(--sx) - var(--fx)) * var(--cu)), calc((var(--sy) - var(--fy)) * var(--cu)))
    rotate(var(--sr)) scale(0.9);
  transition:
    transform 1.5s cubic-bezier(.22, 1, .36, 1) calc(var(--i) * 110ms),
    opacity .6s ease calc(var(--i) * 110ms);
}
.cmp-card img {
  display: block; width: 100%; height: 100%;
  object-fit: contain; user-select: none; -webkit-user-drag: none;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, .12));
  transition: filter .4s ease;
}

.cmp-s1 .cmp-card { opacity: 1; }

/* stage 2: spread into the fan */
.cmp-s2 .cmp-card,
.cmp-s3 .cmp-card,
.cmp-s4 .cmp-card {
  opacity: 1;
  transform: translate(0px, 0px) rotate(var(--r)) scale(1);
}

/* stage 3: one after another, each card settles with a small natural movement */
.cmp-s3 .cmp-card,
.cmp-s4 .cmp-card {
  animation: cmp-settle 1.3s ease-in-out calc(var(--i) * 260ms) 1 backwards;
}
@keyframes cmp-settle {
  0%, 100% { transform: translate(0px, 0px) rotate(var(--r)) scale(1); }
  38% { transform: translate(calc(var(--wx) * var(--cu)), calc(var(--wy) * var(--cu))) rotate(calc(var(--r) + var(--wr))) scale(1.012); }
  72% { transform: translate(calc(var(--wx) * -0.4 * var(--cu)), calc(var(--wy) * -0.4 * var(--cu))) rotate(calc(var(--r) - var(--wr) * 0.35)) scale(1.004); }
}

/* stage 4: the featured card (Forest) comes forward, straightens and grows a little */
.cmp-s4 .cmp-card { transition-delay: 0s; }
.cmp-s4 .cmp-card.cmp-feat {
  z-index: 20;
  transform: translate(calc(var(--ex) * var(--cu)), calc(var(--ey) * var(--cu))) rotate(0deg) scale(var(--es));
  transition-duration: 1.2s, .6s;
}
.cmp-s4 .cmp-card.cmp-feat img { filter: drop-shadow(0 12px 22px rgba(0, 0, 0, .2)); }

/* ---------------- HOVER: the card under the cursor lifts and comes on top ---------------- */
/* once the intro is over, moves are quick and soft */
.cmp.cmp-s4.cmp-live .cmp-card { transition-duration: .45s, .4s; transition-delay: 0s; }

.cmp.cmp-s4 .cmp-card.cmp-hot {
  z-index: 25;
  transform: translate(0px, calc(var(--lift) * -1 * var(--cu))) rotate(var(--hr)) scale(var(--hs));
}
.cmp.cmp-s4 .cmp-card.cmp-feat.cmp-hot {
  transform: translate(calc(var(--ex) * var(--cu)), calc((var(--ey) - var(--lift)) * var(--cu))) rotate(0deg) scale(calc(var(--es) * var(--hs) / 1.04));
}
.cmp.cmp-s4 .cmp-card.cmp-hot img { filter: drop-shadow(0 14px 24px rgba(0, 0, 0, .24)); }

/* the hover zones: same box and resting pose as the cards, clipped to the painted card (not the transparent margin) */
.cmp-hit {
  position: absolute; z-index: calc(40 + var(--z));
  left: calc(var(--fx) * var(--cu)); top: calc(var(--fy) * var(--cu));
  width: calc(var(--cw) * var(--cu)); height: calc(var(--ch) * var(--cu));
  margin: calc(var(--ch) * var(--cu) / -2) 0 0 calc(var(--cw) * var(--cu) / -2);
  padding: 0; border: 0; background: transparent; appearance: none;
  transform: rotate(var(--r));
  clip-path: inset(5% 2% 5% 2% round 7%);
  pointer-events: none; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.cmp.cmp-live .cmp-hit { pointer-events: auto; }
.cmp-hit.cmp-feat { z-index: 60; transform: translate(calc(var(--ex) * var(--cu)), calc(var(--ey) * var(--cu))) scale(var(--es)); }
.cmp-hit:focus { outline: none; }

/* caption: comes in after the card has moved forward */
.cmp-caption {
  position: absolute; z-index: 30; margin: 0; text-align: center; white-space: nowrap;
  left: calc(var(--cx) * var(--cu)); top: calc(var(--y) * var(--cu));
  transform: translate(-50%, 10px);
  font-size: max(16px, calc(20 * var(--cu))); line-height: calc(29 * var(--cu)); font-weight: 500; color: #000;
  opacity: 0;
  transition: opacity .8s ease 1s, transform 1s cubic-bezier(.22, 1, .36, 1) 1s;
}
.cmp-cap-line { display: block; }
.cmp-s4 .cmp-caption { opacity: 1; transform: translate(-50%, 0); }

/* ---------------- phones (≤820px): text flows, the fan is cropped to its cards ---------------- */
@media (max-width: 820px) {
  .cmp {
    --cu: calc((100cqw - 32px) / 960); /* the fan (x 215 → 1175) fills the width */
    height: auto; overflow: visible;
    padding: 24px 16px 72px;
    scroll-snap-align: none;
  }
  .cmp .cmp-abs { position: static; display: block; }
  .cmp .cmp-kicker  { font-size: 20px; line-height: 28px; margin-top: 24px; }
  .cmp .cmp-tagline { font-size: 16px; line-height: 24px; margin-top: 4px; white-space: normal; }
  .cmp .cmp-step    { font-size: 20px; line-height: 28px; margin-top: 28px; gap: 6px; }
  .cmp .cmp-para    { font-size: 18px; line-height: 27px; margin-top: 12px; }
  .cmp .cmp-line    { display: inline; white-space: normal; }
  .cmp .cmp-note    { font-size: 15px; line-height: 23px; margin-top: 16px; white-space: normal; }

  .cmp-fan  { position: relative; inset: auto; height: calc(530 * var(--cu)); margin-top: 24px; overflow: hidden; }
  .cmp-art  { left: calc(-215 * var(--cu)); top: calc(-370 * var(--cu)); }
  .cmp-caption { font-size: 17px; line-height: 25px; }
}

/* ---------------- reduced motion ---------------- */
@media (prefers-reduced-motion: reduce) {
  .cmp-card, .cmp-caption { transition: none !important; animation: none !important; }
}
`;