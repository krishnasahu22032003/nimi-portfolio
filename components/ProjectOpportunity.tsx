"use client";
/* components/ProjectOpportunity.tsx   (or src/components/ProjectOpportunity.tsx)
 *
 * Project eight: "OPPORTUNITY", measured from the Canva page (1440 × 900 artboard, scaled with --cu
 * exactly like the Key features page, so at 1440 × 900 the screen IS the Canva page):
 *   label ............ x 90, cap-centre y 104, 18 Medium, uppercase
 *   intro ............ x 90, centre y 144, 16 Regular
 *   heading 1 ........ x 108, centre y 207, 20 Medium ("1." regular)
 *   diagram .......... x 104 → 884, top y 240 (pipes + hand-drawn numerals), captions 14 / 22 under it
 *   photo frame ...... x 978, y 197, 519 × 325, small radius, auto-changing every 5s
 *   photo caption .... x 978, 21 below the frame, 14 / 22
 *   heading 2 ........ x 108, centre y 667
 *   paragraph ........ x 90, 16 / 26, left aligned, her line breaks kept
 *   hint ............. x 90, centre y 800, with a hand-drawn RED underline (always visible)
 *
 * Photo + caption are STATIC (no wipe-up / zoom / fade-up on scroll): in place as soon as the page shows.
 * Slideshow: crossfade every 5s, small translucent arrows, caption changes with the photo.
 *   · clicking an arrow restarts the timer, autoplay continues
 *   · pauses only for KEYBOARD focus, when off-screen, or when the browser tab is hidden
 *   · ← / → keys and swipe work; reduced motion → photos swap instantly
 *
 * Below 1240px the page stacks into one column; the diagram scrolls sideways so its captions stay aligned.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { OpportunityData, OpportunityStep } from "../data/puppetOpportunity";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const FLOW_X = 90; // left of the diagram block
const FLOW_Y = 240; // top of the diagram block
const FLOW_W = 860; // width of the diagram block (covers the last caption)
const FLOW_H = 318; // height of the diagram block
const DIAGRAM_X = 14; // diagram image offset inside the block (→ x 104)
const DIAGRAM_W = 780; // diagram image width
const STEPS_Y = 274; // captions top inside the block (→ y 514)

const MEDIA_X = 978;
const MEDIA_Y = 197; // her green box starts level with the "1. Waste Landscape" heading
const MEDIA_W = 519;
const MEDIA_H = 325;
const MEDIA_RADIUS = 4; // px
const MEDIA_CAP_GAP = 21; // frame bottom → first caption line

const SLIDE_INTERVAL = 5000;
const SLIDE_FADE_MS = 1000;
const SWIPE_PX = 40;
const ARROW_SIZE = 32; // px: small indicator, circle diameter
const ARROW_INSET = 10; // px from the frame edge
const ARROW_BG = "rgba(0, 0, 0, 0.5)";
const ARROW_BG_HOVER = "rgba(0, 0, 0, 0.68)";

const UNDERLINE_COLOR = "#D8333A"; // red of her Canva underline; swap for the exact hex from the colour picker
const UNDERLINE_OFFSET = -7; // artboard px: bottom of the text line → bottom of the underline strip (more negative = lower)

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((t: string, i: number) => (
        <span key={i} className="op-line">
          {t}
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

export default function ProjectOpportunity({ data }: { data: OpportunityData }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const slides = data.slides;
  const count = slides.length;
  const interval = data.intervalMs ?? SLIDE_INTERVAL;
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
    const t = window.setTimeout(() => setSlide((i: number) => (i + 1) % count), interval);
    return () => window.clearTimeout(t);
  }, [slide, count, paused, inView, tabVisible, interval]);

  /* reveal once when the page scrolls into view (text and diagram only) */
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

  /* the slideshow only advances while it is mostly on-screen */
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

  const { flow, swatches } = data;

  return (
    <section
      ref={sectionRef}
      className="pd-page op"
      aria-label={data.label}
      style={cssVars({
        "--op-flow-w": FLOW_W,
        "--op-flow-h": FLOW_H,
        "--op-dia-x": DIAGRAM_X,
        "--op-dia-w": DIAGRAM_W,
        "--op-steps-y": STEPS_Y,
        "--op-media-w": MEDIA_W,
        "--op-radius": `${MEDIA_RADIUS}px`,
        "--op-cap-gap": MEDIA_CAP_GAP,
        "--op-fade": `${SLIDE_FADE_MS}ms`,
        "--op-arrow": `${ARROW_SIZE}px`,
        "--op-arrow-inset": `${ARROW_INSET}px`,
        "--op-arrow-bg": ARROW_BG,
        "--op-arrow-bg-hover": ARROW_BG_HOVER,
        "--op-ratio": `${MEDIA_W} / ${MEDIA_H}`,
        "--op-ul": UNDERLINE_COLOR,
        "--op-ul-off": UNDERLINE_OFFSET,
      })}
    >
      <h2 className="op-abs op-label op-r" style={cssVars({ "--x": 90, "--y": 89, "--d": 0 })}>
        {data.label}
      </h2>

      <p className="op-abs op-intro op-r" style={cssVars({ "--x": 90, "--y": 131, "--d": 1 })}>
        {data.intro}
      </p>

      <h3 className="op-abs op-h op-r" style={cssVars({ "--x": 108, "--y": 192, "--d": 2 })}>
        <span className="op-hn">1.</span>
        {flow.title}
      </h3>

      {/* diagram + captions: one block, so on small screens they scroll sideways together */}
      <div
        className="op-abs op-scroll op-r"
        style={cssVars({ "--x": FLOW_X, "--y": FLOW_Y, "--d": 3 })}
        tabIndex={0}
        role="group"
        aria-label={`${flow.title}: six stages`}
      >
        <div className="op-flow">
          <div className="op-diagram">
            <Image
              src={flow.image.src}
              alt={flow.image.alt}
              width={flow.image.width}
              height={flow.image.height}
              sizes="(max-width: 1239px) 780px, 55vw"
              quality={90}
              draggable={false}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
          <ol className="op-steps">
            {flow.steps.map((s: OpportunityStep, i: number) => (
              <li key={i} className="op-step" style={cssVars({ "--sx": s.x - FLOW_X })}>
                <span className="op-sr">{`Step ${i + 1}: `}</span>
                {s.lines.map((t: string, j: number) => (
                  <span key={j} className="op-sl">
                    {t}
                  </span>
                ))}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* right: static photo frame (auto-changing photos) + caption */}
      <div className="op-abs op-right" style={cssVars({ "--x": MEDIA_X, "--y": MEDIA_Y })}>
        <div
          ref={frameRef}
          className="op-frame"
          {...(count > 1
            ? {
                role: "group",
                "aria-roledescription": "carousel",
                "aria-label": "Waste facility photos",
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
          <div className="op-slides">
            {slides.map((s, i: number) => (
              <div
                key={s.src}
                className={`op-slide${i === slide ? " is-active" : ""}`}
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
                  sizes="(max-width: 1239px) 100vw, 40vw"
                  quality={90}
                  draggable={false}
                  style={{ objectFit: "cover", objectPosition: s.position ?? "50% 50%" }}
                />
              </div>
            ))}
          </div>

          {count > 1 ? (
            <>
              <button type="button" className="op-arrow op-arrow--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                <Chevron dir="prev" />
              </button>
              <button type="button" className="op-arrow op-arrow--next" aria-label="Next photo" onClick={() => go(1)}>
                <Chevron dir="next" />
              </button>
            </>
          ) : null}
        </div>

        <div className="op-caps">
          {slides.map((s, i: number) => (
            <p key={s.src} className={`op-cap${i === slide ? " is-active" : ""}`} aria-hidden={i === slide ? undefined : true}>
              <Lines lines={s.caption} />
            </p>
          ))}
        </div>
      </div>

      <h3 className="op-abs op-h op-r" style={cssVars({ "--x": 108, "--y": 652, "--d": 4 })}>
        <span className="op-hn">2.</span>
        {swatches.title}
      </h3>

      <p className="op-abs op-p op-r" style={cssVars({ "--x": 90, "--y": 709, "--d": 5 })}>
        <Lines lines={swatches.paragraph} />
      </p>

      <p className="op-abs op-p op-hint op-r" style={cssVars({ "--x": 90, "--y": 787, "--d": 6 })}>
        {/* the text hugs its own box, so the underline is exactly as wide as the text */}
        <span className="op-ul-text">
          {swatches.hint}
          <span className="op-ul" aria-hidden="true" />
        </span>
      </p>

      <noscript>
        <style>{`.op-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ---------- base = stacked, one column (phones and tablets) ---------- */
.op {
  --header-h: 96px;
  --cu: 1px;
  --ax: 0px;
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
  padding: calc(var(--header-h) + 8px) 24px 88px;
}

.op-label {
  margin: 0 0 16px; text-transform: uppercase; white-space: nowrap;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}
.op-intro, .op-p {
  margin: 0 0 20px;
  font-size: max(13px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--ink);
  text-align: left; hyphens: none;
}
.op-intro { margin-bottom: 40px; }
.op-h {
  margin: 0 0 20px;
  font-size: max(15px, calc(20 * var(--cu))); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}
.op-hn { font-weight: 400; margin-right: 8px; }
.op-hint { margin-top: 0; }

/* hand-drawn red underline: the Fabrication stroke (/nav-underline.png) used as a mask and filled red.
   The PNG is a square canvas with the stroke at ~62.4% of its height, so it is scaled to the text's width
   (100% auto) and shifted so the stroke sits in the middle of a 12-unit strip. */
.op-ul-text { display: inline-block; position: relative; white-space: nowrap; }
.op-ul {
  position: absolute; left: 0; right: 0;
  bottom: calc(var(--op-ul-off) * var(--cu));
  height: calc(12 * var(--cu));
  background: var(--op-ul);
  -webkit-mask-image: url('/nav-underline.png'); mask-image: url('/nav-underline.png');
  -webkit-mask-size: 100% auto; mask-size: 100% auto;
  -webkit-mask-position: center 62.4%; mask-position: center 62.4%;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  pointer-events: none;
}

/* diagram block */
.op-scroll {
  margin: 0 -24px 40px; padding: 0 24px; overflow-x: auto; outline: none;
  scrollbar-width: thin; -webkit-overflow-scrolling: touch;
}
.op-flow {
  position: relative; flex: none;
  width: calc(var(--op-flow-w) * var(--cu)); height: calc(var(--op-flow-h) * var(--cu));
}
.op-diagram { position: absolute; top: calc(4 * var(--cu)); left: calc(var(--op-dia-x) * var(--cu)); width: calc(var(--op-dia-w) * var(--cu)); }
.op-diagram img { user-select: none; -webkit-user-drag: none; mix-blend-mode: multiply; }
.op-steps { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; }
.op-step {
  position: absolute; top: calc(var(--op-steps-y) * var(--cu)); left: calc(var(--sx) * var(--cu));
  font-size: max(12px, calc(14 * var(--cu))); line-height: calc(22 * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--ink);
  white-space: nowrap;
}
.op-sl { display: block; }
.op-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* photos (static: no wipe-up, no zoom, no fade-up) */
.op-right { margin: 0 0 56px; width: 100%; max-width: 560px; }
.op-frame {
  position: relative; overflow: hidden; width: 100%;
  aspect-ratio: var(--op-ratio); background: #efefef; border-radius: var(--op-radius);
}
.op-slides { position: absolute; inset: 0; }
.op-slide {
  position: absolute; inset: 0; opacity: 0;
  transition: opacity var(--op-fade) cubic-bezier(.4, 0, .2, 1);
  pointer-events: none; user-select: none;
}
.op-slide.is-active { opacity: 1; }
.op-slide img { -webkit-user-drag: none; }

.op-arrow {
  position: absolute; z-index: 3; top: 50%;
  width: var(--op-arrow); height: var(--op-arrow); margin-top: calc(var(--op-arrow) / -2);
  padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--op-arrow-bg); color: #fff;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  opacity: 1;
  transition: background-color .35s ease;
}
.op-arrow--prev { left: var(--op-arrow-inset); }
.op-arrow--next { right: var(--op-arrow-inset); }
.op-arrow svg { display: block; transition: transform .5s var(--ease); }
.op-arrow:focus { outline: none; }
.op-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .op-arrow:hover { background: var(--op-arrow-bg-hover); }
  .op-arrow--prev:hover svg { transform: translateX(-1.5px); }
  .op-arrow--next:hover svg { transform: translateX(1.5px); }
}
.op-arrow:active svg { transform: scale(.92); }

/* captions under the photo: all stacked in one cell, only the active one shows */
.op-caps { display: grid; margin-top: 16px; }
.op-cap {
  grid-area: 1 / 1; margin: 0; opacity: 0; transition: opacity .6s ease;
  font-size: max(12px, calc(14 * var(--cu))); line-height: calc(22 * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--ink);
}
.op-cap.is-active { opacity: 1; }
.op-line { display: inline; }

/* reveal (text and diagram only) */
.op-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .op-r { opacity: 1; transform: none; }

/* ---------- ≥1240px: DESIGN MODE, positioned from her Canva page ---------- */
@media (min-width: 1240px) {
  .op {
    --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
    --ax: calc((100cqw - 1440 * var(--cu)) / 2);
    height: var(--page-h); padding: 0;
  }
  .op-abs {
    position: absolute; margin: 0;
    left: calc(var(--ax) + var(--x) * var(--cu));
    top: calc(var(--header-h) + (var(--y) - 96) * var(--cu));
  }
  .op-scroll { overflow: visible; padding: 0; width: calc(var(--op-flow-w) * var(--cu)); height: calc(var(--op-flow-h) * var(--cu)); }
  .op-right {
    max-width: none;
    /* her full width, but never wider than the space left on screen (keeps a 40px right margin) */
    width: min(
      calc(var(--op-media-w) * var(--cu)),
      calc(100cqw - (var(--ax) + var(--x) * var(--cu)) - 40px)
    );
  }
  .op-caps { margin-top: calc(var(--op-cap-gap) * var(--cu)); }
  .op-line { display: block; white-space: nowrap; }
  .op-cap .op-line, .op-p .op-line { white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .op-r, .op-slide, .op-cap, .op-arrow, .op-arrow svg { transition: none !important; }
  .op-r { opacity: 1; transform: none; }
}
`;