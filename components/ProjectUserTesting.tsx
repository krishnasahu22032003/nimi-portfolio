"use client";
/* components/ProjectUserTesting.tsx   (or src/components/ProjectUserTesting.tsx)
 *
 * Project eight — page 110 "USER TESTING".
 *
 * LEFT   video (changes with the number)
 * MIDDLE number rail 01–13, EQUAL spacing from the top to the bottom of the video, no background.
 *        The cursor on a number → that number gets the beige rectangle + bold type, a small BLACK DOT appears
 *        next to it, the video and the three texts change. (click / tap / keyboard focus do the same.)
 * RIGHT  arrows (just the two circles, no background) · counter "01 / 13" · OBSERVATION · INSIGHT · DESIGN DIRECTION
 *        separated by thin ORANGE lines. The headings and lines NEVER move; only the text below each heading changes.
 *
 * PAGE BACKGROUND: #F6F3E9 (her Canva colour code).
 *
 * Measured from her Canva page (1440 × 900 artboard). Everything below is artboard px.
 * Data: data/puppetUserTesting.ts
 * Phones (≤820px): video, number strip, arrows, counter, then the three texts underneath.
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Newsreader } from "next/font/google";
import type { UserTestingData } from "../data/puppetUserTesting";

const serif = Newsreader({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const TITLE_LEFT = 90; // same as every other title ("KEY FEATURES", "HOW IT WORKS")

const VIDEO_X = 90;
const VIDEO_Y = 209;
const VIDEO_W = 754;
const VIDEO_H = 490; // 754 / 490 = her 838 / 545 frame

const RAIL_X = 864; // 20px right of the video
const RAIL_W = 67; // same height as the video
const RAIL_PT = 16; // space above the first slot (the small tick sits here)
const RAIL_PB = 8; // space below the last slot
const CHIP_W = 56; // the beige rectangle behind the active number
const CHIP_H = 32;
const DOT_D = 7; // the black dot next to the active number
const DOT_GAP = 9; // px between the beige rectangle and the dot

const ARROWS_X = 1236; // the two circles (top aligned with the video)
const ARROWS_W = 90;
const ARROWS_H = 41;
const ARROW_D = 34; // diameter of one arrow button

const TEXT_X = 1051; // left edge of the three headings / texts
const TEXT_Y = 293; // top of the first heading
const TEXT_PITCH = 145; // distance from one heading to the next
const TEXT_W = 252; // text width: nudge ±6 if a line breaks differently from her Canva page
const HEAD_GAP = 4; // heading → text

const COUNT_Y = 251; // top of the "01 / 13" counter (just above OBSERVATION)

const LINE_W = 299; // orange lines run from TEXT_X to 90px before the right edge (1051 + 299 = 1350)
const LINE_UP = 22; // a line sits this far ABOVE the next heading

/* colours */
const PAGE_BG = "#F6F3E9"; // her colour code for the page
const INK = "#000";
const GREY = "#404040";
const CHIP_BG = "#E6DECB";
const NUM_OFF = "#7A7266";
const NUM_ON = "#1A1713";
const ARROW_FILL = "#85705B";
const ARROW_LINE = "#D8CFBC";
const ARROW_PREV_BG = "#FBF9F3"; // the small light circle behind the left arrow — set "transparent" for an outline only
const LINE_COLOR = "#DDA070"; // thin orange lines
const TICK = "#BDB4A3";

const FADE_MS = 450; // video crossfade

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const two = (n: number) => String(n).padStart(2, "0");

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true" focusable="false">
      <path
        d={dir === "prev" ? "M13 8H3M7.5 3.5 3 8l4.5 4.5" : "M3 8h10M8.5 3.5 13 8l-4.5 4.5"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectUserTesting({ data }: { data: UserTestingData }) {
  const outerRef = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const lastVid = useRef(-1);
  const [active, setActive] = useState(0);
  const [onScreen, setOnScreen] = useState(false);
  const [warm, setWarm] = useState(false);

  const { items, videos } = data;
  const n = items.length;
  const activeVideo = items[active].video;
  const item = items[active];

  const show = (i: number) => setActive((cur: number) => (cur === i ? cur : i));
  const step = (d: 1 | -1) => setActive((cur: number) => (cur + d + n) % n);

  /* reveal once, when the section first appears */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            setWarm(true); // from now on, load all videos so a hover never waits
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* play only while the section is mostly on screen */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const e = entries[0];
        if (e) setOnScreen(e.isIntersecting);
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* videos must be muted for autoplay (React does not always render the attribute) */
  useEffect(() => {
    vids.current.forEach((v: HTMLVideoElement | null) => {
      if (!v) return;
      v.muted = true;
      v.defaultMuted = true;
    });
  }, []);

  /* the active video plays (from 0:00 if it just became active); every other one pauses once its fade-out is over */
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const changed = lastVid.current !== activeVideo;
    vids.current.forEach((v: HTMLVideoElement | null, i: number) => {
      if (!v || i !== activeVideo) return;
      if (changed) {
        try {
          v.currentTime = 0;
        } catch {
          /* metadata not loaded yet: it starts at 0 anyway */
        }
      }
      if (onScreen && !reduce) v.play().catch(() => { });
    });
    lastVid.current = activeVideo;

    const t = window.setTimeout(() => {
      vids.current.forEach((v: HTMLVideoElement | null, i: number) => {
        if (v && (i !== activeVideo || !onScreen)) v.pause();
      });
    }, FADE_MS + 60);
    return () => window.clearTimeout(t);
  }, [activeVideo, onScreen]);

  const blocks: { h: string; text: string }[] = [
    { h: "Observation", text: item.observation },
    { h: "Insight", text: item.insight },
    { h: "Approach", text: item.direction },
  ];

  return (
    <section
      ref={outerRef}
      className="pd-page ut"
      aria-label={data.title}
      style={cssVars({
        "--ut-title-x": TITLE_LEFT,
        "--ut-vx": VIDEO_X,
        "--ut-vy": VIDEO_Y,
        "--ut-vw": VIDEO_W,
        "--ut-vh": VIDEO_H,
        "--ut-rx": RAIL_X,
        "--ut-rw": RAIL_W,
        "--ut-rpt": RAIL_PT,
        "--ut-rpb": RAIL_PB,
        "--ut-chip-w": CHIP_W,
        "--ut-chip-h": CHIP_H,
        "--ut-dot": DOT_D,
        "--ut-dot-gap": DOT_GAP,
        "--ut-ax": ARROWS_X,
        "--ut-aw": ARROWS_W,
        "--ut-ah": ARROWS_H,
        "--ut-ad": ARROW_D,
        "--ut-tx": TEXT_X,
        "--ut-ty": TEXT_Y,
        "--ut-tp": TEXT_PITCH,
        "--ut-tw": TEXT_W,
        "--ut-hg": HEAD_GAP,
        "--ut-cy": COUNT_Y,
        "--ut-lw": LINE_W,
        "--ut-lup": LINE_UP,
        "--ut-bg": PAGE_BG,
        "--ut-ink": INK,
        "--ut-grey": GREY,
        "--ut-chip-bg": CHIP_BG,
        "--ut-num-off": NUM_OFF,
        "--ut-num-on": NUM_ON,
        "--ut-arrow-fill": ARROW_FILL,
        "--ut-arrow-line": ARROW_LINE,
        "--ut-arrow-prev": ARROW_PREV_BG,
        "--ut-line": LINE_COLOR,
        "--ut-tick": TICK,
        "--ut-fade": `${FADE_MS}ms`,
      })}
    >
      <div className="ut-stage">
        <h2 className="ut-title ut-r">{data.title}</h2>

        {/* LEFT — the videos, stacked, crossfaded */}
        <div className="ut-media ut-r" role="group" aria-label={data.title}>
          {videos.map((v, i: number) => (
            <video
              key={v.src}
              ref={(el: HTMLVideoElement | null) => {
                vids.current[i] = el;
              }}
              className={`ut-video${i === activeVideo ? " is-on" : ""}`}
              src={v.src}
              muted
              loop
              playsInline
              preload={warm || i === activeVideo ? "auto" : "metadata"}
              tabIndex={-1}
              aria-label={v.label}
              aria-hidden={i === activeVideo ? undefined : true}
              disablePictureInPicture
              disableRemotePlayback
              style={{ objectPosition: v.position ?? "50% 50%" }}
              onContextMenu={(e) => e.preventDefault()}
            />
          ))}
        </div>

        {/* MIDDLE — numbers 01–13, equal spacing: every number owns a slot of the same height */}
        <div className={`ut-rail ut-r ${serif.className}`} role="tablist" aria-orientation="vertical" aria-label="Observations">
          {items.map((_, i: number) => (
            <div key={i} className="ut-slot" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Observation ${i + 1} of ${n}`}
                className={`ut-num${i === active ? " is-on" : ""}`}
                onMouseEnter={() => show(i)}
                onFocus={() => show(i)}
                onClick={() => show(i)}
              >
                {two(i + 1)}
              </button>
              {i === active ? <span className="ut-dot" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        {/* RIGHT — arrows: just the two circles, no background */}
        <div className="ut-arrows ut-r">
          <button type="button" className="ut-arrow" aria-label="Previous observation" onClick={() => step(-1)}>
            <Arrow dir="prev" />
          </button>
          <button type="button" className="ut-arrow ut-arrow--next" aria-label="Next observation" onClick={() => step(1)}>
            <Arrow dir="next" />
          </button>
        </div>

        {/* RIGHT — counter "01 / 13" */}
        <p className={`ut-count ut-r ${serif.className}`} aria-hidden="true">
          {two(active + 1)} / {two(n)}
        </p>

        {/* RIGHT — three fixed headings; only the text under them changes */}
        {blocks.map((b, i: number) => (
          <div key={b.h} className={`ut-block ut-r${i > 0 ? " ut-block--line" : ""}`} style={cssVars({ "--i": i })}>
            <h3 className="ut-h">{b.h}</h3>
            <p key={active} className="ut-p" aria-live={i === 0 ? "polite" : undefined}>
              {b.text}
            </p>
          </div>
        ))}

        {/* the two thin orange lines between the blocks */}
        <span className="ut-line ut-r" style={cssVars({ "--i": 1 })} aria-hidden="true" />
        <span className="ut-line ut-r" style={cssVars({ "--i": 2 })} aria-hidden="true" />
      </div>

      <noscript>
        <style>{`.ut-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.ut {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --ease: cubic-bezier(.22, 1, .36, 1);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  background: var(--ut-bg);
}
.ut-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; background: var(--ut-bg); }

/* ---- title (same place as "KEY FEATURES") ---- */
.ut-title {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--ut-title-x) * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  white-space: nowrap; text-transform: uppercase;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}

/* ---- video ---- */
.ut-media {
  position: absolute; z-index: 1; overflow: hidden; background: #1b1713;
  left: calc(var(--ax) + var(--ut-vx) * var(--cu));
  top: calc(var(--y0) + var(--ut-vy) * var(--cu));
  width: calc(var(--ut-vw) * var(--cu)); height: calc(var(--ut-vh) * var(--cu));
}
.ut-video {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block;
  opacity: 0; transition: opacity var(--ut-fade) ease;
  pointer-events: none; user-select: none;
}
.ut-video.is-on { opacity: 1; z-index: 1; }

/* ---- number rail: NO background; 13 equal slots from the top to the bottom of the video ---- */
.ut-rail {
  position: absolute; z-index: 2; box-sizing: border-box;
  left: calc(var(--ax) + var(--ut-rx) * var(--cu));
  top: calc(var(--y0) + var(--ut-vy) * var(--cu));
  width: calc(var(--ut-rw) * var(--cu)); height: calc(var(--ut-vh) * var(--cu));
  padding: calc(var(--ut-rpt) * var(--cu)) 0 calc(var(--ut-rpb) * var(--cu));
  display: flex; flex-direction: column;
  background: transparent;
}
.ut-rail::before {                       /* the small tick above "01" */
  content: ""; position: absolute; top: calc(2 * var(--cu)); left: 50%;
  width: 1px; height: calc(10 * var(--cu)); background: var(--ut-tick); transform: translateX(-50%);
}
.ut-slot {
  position: relative; flex: 1 1 0; min-height: 0;     /* every slot is exactly the same height → equal spacing */
  display: flex; align-items: center; justify-content: center;
}
.ut-num {
  appearance: none; border: 0; padding: 0; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  width: calc(var(--ut-chip-w) * var(--cu)); height: calc(var(--ut-chip-h) * var(--cu));
  font-family: inherit; font-size: calc(18 * var(--cu)); line-height: 1; font-weight: 400; letter-spacing: 0;
  font-variant-numeric: lining-nums;
  color: var(--ut-num-off);
  transition: background-color .25s ease, color .25s ease;
  -webkit-tap-highlight-color: transparent;
}
.ut-num:hover { color: var(--ut-num-on); }
.ut-num.is-on { background: var(--ut-chip-bg); color: var(--ut-num-on); font-weight: 700; }
.ut-num:focus { outline: none; }
.ut-num:focus-visible { outline: 2px solid var(--ut-arrow-fill); outline-offset: 1px; }

/* the black dot next to the active box */
.ut-dot {
  position: absolute; top: 50%;
  left: calc(50% + (var(--ut-chip-w) / 2 + var(--ut-dot-gap)) * var(--cu));
  width: calc(var(--ut-dot) * var(--cu)); height: calc(var(--ut-dot) * var(--cu));
  margin-top: calc(var(--ut-dot) * var(--cu) / -2);
  border-radius: 50%; background: var(--ut-num-on);
  pointer-events: none;
  animation: ut-dot .35s var(--ease) both;
}
@keyframes ut-dot { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }

/* ---- arrows: only the two circles, NO background behind them ---- */
.ut-arrows {
  position: absolute; z-index: 2; display: flex; align-items: center; justify-content: center; gap: calc(8 * var(--cu));
  left: calc(var(--ax) + var(--ut-ax) * var(--cu));
  top: calc(var(--y0) + var(--ut-vy) * var(--cu));
  width: calc(var(--ut-aw) * var(--cu)); height: calc(var(--ut-ah) * var(--cu));
  background: transparent;
}
.ut-arrow {
  appearance: none; padding: 0; cursor: pointer; display: grid; place-items: center;
  width: calc(var(--ut-ad) * var(--cu)); height: calc(var(--ut-ad) * var(--cu)); border-radius: 50%;
  border: 1px solid var(--ut-arrow-line); background: var(--ut-arrow-prev); color: #2B2621;
  transition: transform .3s var(--ease), background-color .25s ease;
  -webkit-tap-highlight-color: transparent;
}
.ut-arrow--next { background: var(--ut-arrow-fill); border-color: var(--ut-arrow-fill); color: #fff; }
.ut-arrow svg { width: calc(14 * var(--cu)); height: calc(14 * var(--cu)); min-width: 10px; min-height: 10px; display: block; }
.ut-arrow:focus { outline: none; }
.ut-arrow:focus-visible { outline: 2px solid var(--ut-arrow-fill); outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) { .ut-arrow:hover { transform: scale(1.07); } }
.ut-arrow:active { transform: scale(.94); }

/* ---- counter "01 / 13" ---- */
.ut-count {
  position: absolute; z-index: 2; margin: 0; white-space: nowrap;
  left: calc(var(--ax) + var(--ut-tx) * var(--cu));
  top: calc(var(--y0) + var(--ut-cy) * var(--cu));
  font-size: calc(15 * var(--cu)); line-height: calc(24 * var(--cu)); font-weight: 400; letter-spacing: 0;
  font-variant-numeric: lining-nums; color: var(--ut-num-on);
}

/* ---- the three blocks: the heading is pinned, the paragraph underneath is swapped ---- */
.ut-block {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--ut-tx) * var(--cu));
  top: calc(var(--y0) + (var(--ut-ty) + var(--i) * var(--ut-tp)) * var(--cu));
  width: calc(var(--ut-tw) * var(--cu));
}
.ut-h {
  margin: 0 0 calc(var(--ut-hg) * var(--cu));
  font-size: calc(20 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0;
  text-transform: uppercase; color: var(--ut-ink);
}
.ut-p {
  margin: 0;
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 400; letter-spacing: 0;
  color: var(--ut-grey);
  animation: ut-in .45s var(--ease) both;
}
@keyframes ut-in { from { opacity: 0; transform: translate3d(0, 5px, 0); } to { opacity: 1; transform: none; } }

/* ---- the thin orange lines (they never move) ---- */
.ut-line {
  position: absolute; z-index: 2; height: 1px; background: var(--ut-line); pointer-events: none;
  left: calc(var(--ax) + var(--ut-tx) * var(--cu));
  width: calc(var(--ut-lw) * var(--cu));
  top: calc(var(--y0) + (var(--ut-ty) + var(--i) * var(--ut-tp) - var(--ut-lup)) * var(--cu));
}

/* ---- reveal (same recipe as the other pages) ---- */
.ut-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .ut-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: 150ms;
}
.is-in .ut-media { transition-delay: 250ms; }
.is-in .ut-rail, .is-in .ut-arrows { transition-delay: 400ms; }
.is-in .ut-count, .is-in .ut-block, .is-in .ut-line { transition-delay: 550ms; }

/* ---- phones: video, number strip, arrows, counter, then the three texts ---- */
@media (max-width: 820px) {
  .ut { --cu: 1px; --y0: 0px; }
  .ut-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 16px 56px; display: flex; flex-direction: column; }
  .ut-title, .ut-media, .ut-rail, .ut-arrows, .ut-count, .ut-block { position: relative; left: auto; top: auto; }
  .ut-title { margin: 0 0 28px; font-size: 18px; line-height: 30px; }
  .ut-media { width: 100%; height: auto; aspect-ratio: 754 / 490; }
  .ut-rail {
    width: 100%; height: 52px; padding: 0 4px; flex-direction: row; align-items: center;
    overflow-x: auto; scrollbar-width: none;
  }
  .ut-rail::-webkit-scrollbar { display: none; }
  .ut-rail::before { display: none; }
  .ut-slot { flex: 0 0 auto; width: 52px; }
  .ut-num { width: 48px; height: 36px; font-size: 17px; }
  .ut-dot { display: none; }
  .ut-arrows { align-self: flex-end; margin-top: 16px; width: 90px; height: 41px; }
  .ut-arrow { width: 34px; height: 34px; }
  .ut-count { margin-top: 12px; font-size: 15px; line-height: 24px; }
  .ut-block { width: auto; margin-top: 14px; }
  .ut-block--line { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--ut-line); }
  .ut-line { display: none; }
  .ut-h { font-size: 18px; line-height: 28px; margin-bottom: 4px; }
  .ut-p { font-size: 14px; line-height: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .ut-r, .ut-video, .ut-num, .ut-arrow { transition: none !important; }
  .ut-r { opacity: 1; transform: none; }
  .ut-p, .ut-dot { animation: none; }
}
`;