"use client";
/* components/ProjectAbout.tsx   (or src/components/ProjectAbout.tsx)
 *
 * Project eight — page 2 "ABOUT", measured from the client's 1440 × 900 reference:
 *   side margins ........ 90px  → 6.25cqw (label, text and image share the same margins)
 *   text column ......... 494px wide, justified (her line breaks are kept)
 *   gap text → image .... 85px  → 5.9cqw
 *   image ............... 681 × 455px (3 : 2), right edge 90px from the page edge
 *   text block + image are both vertically centred on the page
 *   label ABOUT ......... 18 Medium, cap-centre at y = 104
 *   heading ............. 16 Medium (accent orange), 29px line-height
 *   body ................ 14 Regular #000, 26px line-height, one blank line between paragraphs, bold = 600
 *
 * Image: same auto-changing slideshow as page 1 (crossfade every 5s, translucent grey arrows).
 *   · clicking an arrow restarts the timer, autoplay continues
 *   · pauses only for KEYBOARD focus, when off-screen, or when the browser tab is hidden
 *   · ← / → keys and swipe work too; reduced motion → photos swap instantly
 */
import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { AboutData, AboutLine } from "../data/puppetAbout";

/* ------------------------------ TUNING ------------------------------ */
const ACCENT = "#E1871A"; // heading orange — swap for the exact hex from Canva's colour picker if it differs
const MARGIN = 6.25; // cqw — 90px on 1440 (left of label + text, right of image)
const GAP = 5.9; // cqw — 85px on 1440, between text column and image
const TEXT_W = 494; // px — her text box
const IMG_RATIO = "3 / 2"; // 681 × 455

const LABEL_SIZE = 18; // px
const LABEL_TRACK = "0.02em";
/* ABOUT's cap-centre sits at 104 / 900 of the page height; it never rises into the 96px site header */
const LABEL_TOP = "max(calc(var(--header-h) - 7px), calc(var(--page-h) * 0.0989))";

const SLIDE_INTERVAL = 5000; // ms
const SLIDE_FADE_MS = 1000;
const SWIPE_PX = 40;
const ARROW_SIZE = 48; // px (also the touch target)
const ARROW_INSET = 16; // px from the photo's edge to the circle
const ARROW_BG = "rgba(0, 0, 0, 0.5)";
const ARROW_BG_HOVER = "rgba(0, 0, 0, 0.68)";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

/* **bold** → <strong> */
function Runs({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p: string, i: number) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  );
}

/* one forced line per entry (desktop); below 1280px the lines reflow as one paragraph */
function Lines({ lines }: { lines: AboutLine[] }) {
  return (
    <>
      {lines.map((l: AboutLine, i: number) => {
        const text = typeof l === "string" ? l : l.text;
        const end = i === lines.length - 1 || (typeof l !== "string" && !!l.end);
        return (
          <span key={i} className={`pa-line${end ? " pa-end" : ""}`}>
            <Runs text={text} />
            {i < lines.length - 1 ? " " : null}
          </span>
        );
      })}
    </>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true" focusable="false">
      <polyline
        points={dir === "prev" ? "14.5,6 8.5,12 14.5,18" : "9.5,6 15.5,12 9.5,18"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectAbout({ data }: { data: AboutData }) {
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

  /* autoplay — the timer restarts on every change (auto or arrow click) */
  useEffect(() => {
    if (count < 2 || paused || !inView || !tabVisible) return;
    const t = window.setTimeout(() => setSlide((i: number) => (i + 1) % count), interval);
    return () => window.clearTimeout(t);
  }, [slide, count, paused, inView, tabVisible, interval]);

  /* reveal when the page scrolls into view */
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
      { threshold: 0.25 }
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

  return (
    <section
      ref={sectionRef}
      className="pd-page pa"
      aria-label="About"
      style={cssVars({
        "--pa-margin": `${MARGIN}cqw`,
        "--pa-gap": `${GAP}cqw`,
        "--pa-text-w": `${TEXT_W}px`,
        "--pa-ratio": IMG_RATIO,
        "--pa-accent": ACCENT,
        "--pa-label": `${LABEL_SIZE}px`,
        "--pa-track": LABEL_TRACK,
        "--pa-label-top": LABEL_TOP,
        "--pa-fade": `${SLIDE_FADE_MS}ms`,
        "--pa-arrow": `${ARROW_SIZE}px`,
        "--pa-arrow-inset": `${ARROW_INSET}px`,
        "--pa-arrow-bg": ARROW_BG,
        "--pa-arrow-bg-hover": ARROW_BG_HOVER,
      })}
    >
      <h2 className="pa-label pa-reveal" style={cssVars({ "--d": 0 })}>
        {data.label}
      </h2>

      <div className="pa-grid">
        <div className="pa-copy">
          <h3 className="pa-heading pa-reveal" style={cssVars({ "--d": 1 })}>
            <Lines lines={data.heading} />
          </h3>

          <div className="pa-body">
            {data.paragraphs.map((lines: AboutLine[], i: number) => (
              <p key={i} className="pa-reveal" style={cssVars({ "--d": i + 2 })}>
                <Lines lines={lines} />
              </p>
            ))}
          </div>
        </div>

        <div
          ref={frameRef}
          className="pa-frame"
          {...(count > 1
            ? {
                role: "group",
                "aria-roledescription": "carousel",
                "aria-label": "About — photos",
                /* pause only for KEYBOARD focus; a mouse click on an arrow must not stop autoplay */
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
          <div className="pa-slides" aria-live={paused ? "polite" : "off"}>
            {slides.map((s, i: number) => (
              <div
                key={s.src}
                className={`pa-slide${i === slide ? " is-active" : ""}`}
                role={count > 1 ? "group" : undefined}
                aria-roledescription={count > 1 ? "slide" : undefined}
                aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
                aria-hidden={i === slide ? undefined : true}
              >
                <Image
                  src={s.src}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 820px) 100vw, 50vw"
                  quality={90}
                  draggable={false}
                  style={{ objectFit: "cover", objectPosition: s.position ?? "50% 50%" }}
                />
              </div>
            ))}
          </div>

          {count > 1 ? (
            <>
              <button type="button" className="pa-arrow pa-arrow--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                <Chevron dir="prev" />
              </button>
              <button type="button" className="pa-arrow pa-arrow--next" aria-label="Next photo" onClick={() => go(1)}>
                <Chevron dir="next" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <noscript>
        <style>{`.pa-reveal{opacity:1!important;transform:none!important}.pa-frame{clip-path:none!important}.pa-slides{transform:none!important}.pa-arrow{opacity:1!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ------------------------------ layout ------------------------------ */
.pa {
  min-height: var(--page-h);
  /* symmetric padding → the text block and the photo stay centred on the page, like her layout */
  padding: calc(var(--header-h) + 48px) var(--pa-margin);
  display: grid; align-items: center;
}
.pa-label {
  position: absolute; z-index: 1;
  left: var(--pa-margin); top: var(--pa-label-top);
  margin: 0;
  font-size: var(--pa-label); line-height: 30px; font-weight: 500;
  letter-spacing: var(--pa-track); text-transform: uppercase; color: var(--ink);
}
.pa-grid {
  display: grid; align-items: center;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: var(--pa-gap);
}
.pa-copy { width: max-content; min-width: var(--pa-text-w); box-sizing: border-box; }

/* ------------------------------ type (literal px) ------------------------------ */
.pa-heading {
  margin: 0 0 28px;
  font-size: 16px; line-height: 29px; font-weight: 500; letter-spacing: 0;
  color: var(--pa-accent); text-align: left;
}
.pa-body { display: flex; flex-direction: column; gap: 26px; } /* one blank line between paragraphs */
.pa-body p {
  margin: 0;
  font-size: 14px; line-height: 26px; font-weight: 400; letter-spacing: 0;
  color: var(--ink); text-align: justify; hyphens: none;
}
.pa-body strong { font-weight: 600; }

/* ------------------------------ slideshow ------------------------------ */
.pa-frame {
  position: relative; overflow: hidden; width: 100%;
  aspect-ratio: var(--pa-ratio); background: #efefef;
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1.2s cubic-bezier(.77, 0, .18, 1) .2s;
}
.pa-slides {
  position: absolute; inset: 0;
  transform: scale(1.08);
  transition: transform 1.8s cubic-bezier(.22, 1, .36, 1) .4s;
}
.pa-slide {
  position: absolute; inset: 0; opacity: 0;
  transition: opacity var(--pa-fade) cubic-bezier(.4, 0, .2, 1);
  pointer-events: none; user-select: none;
}
.pa-slide.is-active { opacity: 1; }
.pa-slide img { -webkit-user-drag: none; }

.pa-arrow {
  position: absolute; z-index: 3; top: 50%;
  width: var(--pa-arrow); height: var(--pa-arrow); margin-top: calc(var(--pa-arrow) / -2);
  padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--pa-arrow-bg); color: #fff;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  opacity: 0;
  transition: opacity .7s ease 1.5s, background-color .35s ease;
}
.pa-arrow--prev { left: var(--pa-arrow-inset); }
.pa-arrow--next { right: var(--pa-arrow-inset); }
.pa-arrow svg { display: block; transition: transform .5s cubic-bezier(.22, 1, .36, 1); }
.pa-arrow:focus { outline: none; }
.pa-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .pa-arrow:hover { background: var(--pa-arrow-bg-hover); }
  .pa-arrow--prev:hover svg { transform: translateX(-2px); }
  .pa-arrow--next:hover svg { transform: translateX(2px); }
}
.pa-arrow:active svg { transform: scale(.92); }

/* ------------------------------ reveal ------------------------------ */
.pa-reveal {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pa-reveal { opacity: 1; transform: none; }
.is-in .pa-frame { clip-path: inset(0 0 0 0); }
.is-in .pa-slides { transform: scale(1); }
.is-in .pa-arrow { opacity: 1; }

/* ---------- ≥1280px: DESIGN MODE — every string is exactly one line, as the client broke it ---------- */
@media (min-width: 1280px) {
  .pa-line { display: block; white-space: nowrap; }
  .pa-body .pa-line:not(.pa-end) { text-align: justify; text-align-last: justify; }
  .pa-body .pa-line.pa-end { text-align: left; }
}

/* ---------- 821–1279px: same layout, text reflows (and stays justified) ---------- */
@media (max-width: 1279.98px) {
  .pa-grid { grid-template-columns: minmax(0, 1fr) minmax(0, 1.38fr); }
  .pa-copy { width: auto; min-width: 0; }
  .pa-heading { text-wrap: balance; }
}

/* ---------- ≤820px: single column, left-aligned text (justified text makes gaps on narrow screens) ---------- */
@media (max-width: 820px) {
  .pa { min-height: 0; padding: calc(var(--header-h) + 8px) 16px 72px; align-items: start; row-gap: 28px; }
  .pa-label { position: static; }
  .pa-grid { grid-template-columns: minmax(0, 1fr); row-gap: 40px; }
  .pa-body p { text-align: left; }
  .pa-arrow--prev { left: 12px; }
  .pa-arrow--next { right: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  .pa-reveal, .pa-frame, .pa-slides, .pa-slide, .pa-arrow, .pa-arrow svg { transition: none !important; }
  .pa-reveal { opacity: 1; transform: none; }
  .pa-frame { clip-path: none; }
  .pa-slides { transform: none; }
  .pa-arrow { opacity: 1; }
}
`;