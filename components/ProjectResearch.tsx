"use client";
/* components/ProjectResearch.tsx   (or src/components/ProjectResearch.tsx)
 *
 * Project eight: "3. Primary research", measured from the Canva page (1440 × 900, scaled with --cu
 * exactly like the Opportunity page, so at 1440 × 900 the screen IS the Canva page):
 *   heading .......... x 108, centre y 91, 18 Medium ("3." regular)
 *   box 1 ............ x 91, y 140 → 392, 531 wide, radius 50, beige outline (WHERE I WENT)
 *   box 2 ............ x 91, y 438 → 822, 531 wide (THE GAP)
 *   top photo ........ x 771, y 103, 579 × 339
 *   bottom photo ..... x 771, y 484, 579 × 339
 *   (the "REFERENCE TEXT" labels and black arrows on Canva were notes only, so they are not on the site)
 *
 * Both photo frames are STATIC (no wipe-up / zoom / fade-up on scroll): they are in place as soon as the page shows.
 * Both photo frames auto-change (crossfade every 5s, the second one starts 2.5s later so they never flip together).
 *   · clicking an arrow restarts that frame's timer, autoplay continues
 *   · pauses only for KEYBOARD focus, when off-screen, or when the browser tab is hidden
 *   · ← / → keys and swipe work; reduced motion → photos swap instantly
 *
 * Below 1240px the page stacks into one column.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ResearchData, ResearchSlide } from "../data/puppetResearch";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const BOX_X = 91;
const BOX_W = 531;
const BOX1_Y = 140;
const BOX1_H = 252;
const BOX2_Y = 438;
const BOX2_H = 384;
const BOX_RADIUS = 50;
const BOX_BORDER = 4;
const BOX_COLOR = "#E4D6A3"; // beige outline of her boxes; swap for the exact hex from the colour picker

const PHOTO_X = 771; // photo's left edge
const PHOTO_W = 579;
const PHOTO_H = 339;
const TOP_Y = 103; // top photo's top edge
const BOTTOM_Y = 484; // bottom photo's top edge

const SLIDE_INTERVAL = 5000;
const SLIDE_FADE_MS = 1000;
const SECOND_OFFSET = 2500; // second slideshow starts this much later
const SWIPE_PX = 40;
const ARROW_SIZE = 32;
const ARROW_INSET = 10;
const ARROW_BG = "rgba(0, 0, 0, 0.5)";
const ARROW_BG_HOVER = "rgba(0, 0, 0, 0.68)";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((t: string, i: number) => (
        <span key={i} className="pr-line">
          {t === "" ? "\u00A0" : t}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <polyline
        points={dir === "prev" ? "14.5,6 8.5,12 14.5,18" : "9.5,6 15.5,12 9.5,18"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* one auto-changing photo frame with its own arrows and timer */
function Slideshow({
  slides,
  label,
  interval,
  offset,
  y,
}: {
  slides: ResearchSlide[];
  label: string;
  interval: number;
  offset: number;
  y: number;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const started = useRef(false);
  const count = slides.length;
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false); // keyboard focus only
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      setSlide((i: number) => (i + dir + count) % count);
    },
    [count]
  );

  /* autoplay: the timer restarts on every change (auto or arrow click) */
  useEffect(() => {
    if (count < 2 || paused || !inView || !tabVisible) return;
    const wait = started.current ? interval : interval + offset;
    const t = window.setTimeout(() => {
      started.current = true;
      setSlide((i: number) => (i + 1) % count);
    }, wait);
    return () => window.clearTimeout(t);
  }, [slide, count, paused, inView, tabVisible, interval, offset]);

  /* only advances while it is mostly on-screen */
  useEffect(() => {
    const el = frameRef.current;
    if (!el || count < 2) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const e = entries[0];
        if (e) setInView(e.isIntersecting);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  /* …and while the browser tab is visible */
  useEffect(() => {
    if (count < 2) return;
    const onVis = () => setTabVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [count]);

  return (
    <div className="pr-abs pr-media" style={cssVars({ "--x": PHOTO_X, "--y": y })}>
      <div
        ref={frameRef}
        className="pr-frame"
        {...(count > 1
          ? {
              role: "group",
              "aria-roledescription": "carousel",
              "aria-label": label,
              onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
                if ((e.target as HTMLElement).matches(":focus-visible")) setPaused(true);
              },
              onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
              },
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "ArrowLeft") go(-1);
                if (e.key === "ArrowRight") go(1);
              },
              onTouchStart: (e: React.TouchEvent) => {
                touchX.current = e.touches[0]?.clientX ?? null;
              },
              onTouchEnd: (e: React.TouchEvent) => {
                if (touchX.current === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
              },
            }
          : {})}
      >
        <div className="pr-slides">
          {slides.map((s, i: number) => (
            <div
              key={s.src}
              className={`pr-slide${i === slide ? " is-active" : ""}`}
              role={count > 1 ? "group" : undefined}
              aria-roledescription={count > 1 ? "slide" : undefined}
              aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
              aria-hidden={i === slide ? undefined : true}
            >
              <Image
                src={s.src}
                alt={s.alt}
                fill
                loading="eager"
                sizes="(max-width: 1239px) 100vw, 42vw"
                quality={90}
                draggable={false}
                style={{ objectFit: "cover", objectPosition: s.position ?? "50% 50%" }}
              />
            </div>
          ))}
        </div>

        {count > 1 ? (
          <>
            <button type="button" className="pr-arrow pr-arrow--prev" aria-label="Previous photo" onClick={() => go(-1)}>
              <Chevron dir="prev" />
            </button>
            <button type="button" className="pr-arrow pr-arrow--next" aria-label="Next photo" onClick={() => go(1)}>
              <Chevron dir="next" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export default function ProjectResearch({ data }: { data: ResearchData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const interval = data.intervalMs ?? SLIDE_INTERVAL;

  /* reveal once when the page scrolls into view (text and boxes only) */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="pd-page pr"
      aria-label={data.heading}
      style={cssVars({
        "--pr-box-w": BOX_W,
        "--pr-box1-h": BOX1_H,
        "--pr-box2-h": BOX2_H,
        "--pr-radius": BOX_RADIUS,
        "--pr-border": BOX_BORDER,
        "--pr-box-color": BOX_COLOR,
        "--pr-photo-w": PHOTO_W,
        "--pr-ratio": `${PHOTO_W} / ${PHOTO_H}`,
        "--pr-fade": `${SLIDE_FADE_MS}ms`,
        "--pr-arrow": `${ARROW_SIZE}px`,
        "--pr-arrow-inset": `${ARROW_INSET}px`,
        "--pr-arrow-bg": ARROW_BG,
        "--pr-arrow-bg-hover": ARROW_BG_HOVER,
      })}
    >
      <h2 className="pr-abs pr-h pr-r" style={cssVars({ "--x": 108, "--y": 76, "--d": 0 })}>
        <span className="pr-hn">3.</span>
        {data.heading}
      </h2>

      {/* box 1: where I went */}
      <div className="pr-abs pr-box pr-box1 pr-r" style={cssVars({ "--x": BOX_X, "--y": BOX1_Y, "--d": 1 })}>
        <h3 className="pr-box-title">{data.where.title}</h3>
        <p className="pr-where">
          <Lines lines={data.where.lines} />
        </p>
      </div>

      {/* box 2: the gap */}
      <div className="pr-abs pr-box pr-box2 pr-r" style={cssVars({ "--x": BOX_X, "--y": BOX2_Y, "--d": 2 })}>
        <h3 className="pr-box-title">{data.gap.title}</h3>
        <ul className="pr-list">
          {data.gap.bullets.map((lines: string[], i: number) => (
            <li key={i}>
              <Lines lines={lines} />
            </li>
          ))}
        </ul>
      </div>

      <Slideshow slides={data.top} label="Classroom photos" interval={interval} offset={0} y={TOP_Y} />
      <Slideshow
        slides={data.bottom}
        label="Research visit photos"
        interval={interval}
        offset={SECOND_OFFSET}
        y={BOTTOM_Y}
      />

      <noscript>
        <style>{`.pr-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ---------- base = stacked, one column (phones and tablets) ---------- */
.pr {
  --header-h: 96px;
  --cu: 1px;
  --ax: 0px;
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
  padding: calc(var(--header-h) + 8px) 24px 88px;
  display: flex; flex-direction: column; gap: 32px;
}

.pr-h {
  margin: 0; font-size: max(16px, calc(18 * var(--cu))); line-height: calc(30 * var(--cu));
  font-weight: 500; letter-spacing: 0; color: var(--ink);
}
.pr-hn { font-weight: 400; margin-right: 6px; }

/* beige outlined boxes */
.pr-box {
  box-sizing: border-box; width: 100%; max-width: 560px;
  border: calc(var(--pr-border) * 1px) solid var(--pr-box-color);
  border-radius: min(calc(var(--pr-radius) * 1px), 12vw);
  padding: 24px 20px 24px; background: #fff; color: var(--ink);
}
.pr-box-title {
  margin: 0 0 20px; font-size: max(14px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu));
  font-weight: 500; letter-spacing: 0; color: var(--ink);
}
.pr-where, .pr-list li {
  margin: 0; font-size: max(13px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu));
  letter-spacing: 0; color: var(--ink); text-align: left; hyphens: none;
}
.pr-where { font-weight: 500; }
.pr-list { margin: 0; padding: 0; list-style: none; }
.pr-list li { position: relative; padding-left: 31px; font-weight: 400; margin-bottom: 20px; }
.pr-list li:last-child { margin-bottom: 0; }
.pr-list li::before {
  content: ""; position: absolute; left: 13px; top: calc(13 * var(--cu) - 2.5px);
  width: 5px; height: 5px; border-radius: 50%; background: var(--ink);
}
.pr-line { display: inline; }

/* photo frames (static: no wipe-up, no zoom, no fade-up) */
.pr-media { position: relative; width: 100%; max-width: 640px; }

.pr-frame {
  position: relative; overflow: hidden; width: 100%;
  aspect-ratio: var(--pr-ratio); background: #efefef; border-radius: 4px;
}
.pr-slides { position: absolute; inset: 0; }
.pr-slide {
  position: absolute; inset: 0; opacity: 0;
  transition: opacity var(--pr-fade) cubic-bezier(.4, 0, .2, 1);
  pointer-events: none; user-select: none;
}
.pr-slide.is-active { opacity: 1; }
.pr-slide img { -webkit-user-drag: none; }

.pr-arrow {
  position: absolute; z-index: 3; top: 50%;
  width: var(--pr-arrow); height: var(--pr-arrow); margin-top: calc(var(--pr-arrow) / -2);
  padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--pr-arrow-bg); color: #fff;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  opacity: 1;
  transition: background-color .35s ease;
}
.pr-arrow--prev { left: var(--pr-arrow-inset); }
.pr-arrow--next { right: var(--pr-arrow-inset); }
.pr-arrow svg { display: block; transition: transform .5s var(--ease); }
.pr-arrow:focus { outline: none; }
.pr-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .pr-arrow:hover { background: var(--pr-arrow-bg-hover); }
  .pr-arrow--prev:hover svg { transform: translateX(-1.5px); }
  .pr-arrow--next:hover svg { transform: translateX(1.5px); }
}
.pr-arrow:active svg { transform: scale(.92); }

/* reveal (text and boxes only) */
.pr-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pr-r { opacity: 1; transform: none; }

/* ---------- ≥1240px: DESIGN MODE, positioned from her Canva page ---------- */
@media (min-width: 1240px) {
  .pr {
    --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
    --ax: calc((100cqw - 1440 * var(--cu)) / 2);
    height: var(--page-h); padding: 0; display: block;
  }
  .pr-abs {
    position: absolute; margin: 0;
    left: calc(var(--ax) + var(--x) * var(--cu));
    top: calc(var(--header-h) + (var(--y) - 96) * var(--cu));
  }
  .pr-box {
    width: calc(var(--pr-box-w) * var(--cu)); max-width: none;
    border-width: calc(var(--pr-border) * var(--cu));
    border-radius: calc(var(--pr-radius) * var(--cu));
    padding: calc(22 * var(--cu)) calc(16 * var(--cu)) 0 calc(20 * var(--cu));
  }
  .pr-box1 { height: calc(var(--pr-box1-h) * var(--cu)); }
  .pr-box2 { height: calc(var(--pr-box2-h) * var(--cu)); padding-left: calc(24 * var(--cu)); padding-top: calc(20 * var(--cu)); }
  .pr-box-title { margin-bottom: calc(26 * var(--cu)); }
  .pr-box1 .pr-box-title { margin-bottom: 0; }
  .pr-where .pr-line { display: block; white-space: nowrap; }
  .pr-where { margin-top: calc(26 * var(--cu)); }
  .pr-list li { padding-left: calc(31 * var(--cu)); margin-bottom: calc(26 * var(--cu)); }
  .pr-list li::before { left: calc(13 * var(--cu)); top: calc(13 * var(--cu) - 2.5px * var(--cu) / 1px); }
  .pr-list .pr-line { display: block; white-space: nowrap; }

  .pr-media { width: calc(var(--pr-photo-w) * var(--cu)); max-width: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pr-r, .pr-slide, .pr-arrow, .pr-arrow svg { transition: none !important; }
  .pr-r { opacity: 1; transform: none; }
}
`;