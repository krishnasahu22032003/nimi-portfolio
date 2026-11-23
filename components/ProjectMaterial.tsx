"use client";
/* components/ProjectMaterial.tsx   (or src/components/ProjectMaterial.tsx)
 *
 * Project eight: "WHAT THE MATERIAL TAUGHT ME", measured from the Canva page (1440 × 900 artboard, scaled
 * with --cu like the Key features, Opportunity and Swatches pages, so at 1440 × 900 the screen IS the Canva page):
 *   label ............ x 90, cap-centre y 104, 18 Medium, uppercase
 *   bullets .......... dot at x 104, text at x 122, 16 / 26, first bullet semibold,
 *                      one blank line (26) between bullets, first line centre y 302
 *   photo frame ...... x 711, y 202, 551 × 565, square corners
 *   the bullets and the frame share the same vertical centre (y ≈ 485)
 *
 * The photo frame is STATIC (no wipe-up / zoom / fade-up on scroll): in place as soon as the page shows.
 * Slideshow: crossfade every 3s (faster than the 5s pages before it), small translucent arrows.
 *   · clicking an arrow restarts the timer, autoplay continues
 *   · pauses only for KEYBOARD focus, when off-screen, or when the browser tab is hidden
 *   · ← / → keys and swipe work; reduced motion → photos swap instantly
 *
 * Below 1240px the page stacks: heading, bullets, then the photos (the lines reflow as paragraphs).
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { MaterialBullet, MaterialData } from "../data/puppetMaterial";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const COPY_X = 104; // left of the bullet dots
const COPY_Y = 289; // top of the first line box (first line centre = 302)
const COPY_INDENT = 18; // dot → text (text starts at x 122)

const FRAME_X = 711;
const FRAME_Y = 202;
const FRAME_W = 551;
const FRAME_H = 565;

const SLIDE_INTERVAL = 3000; // ms. The earlier pages use 5000
const SLIDE_FADE_MS = 700;
const SWIPE_PX = 40;

const SHOW_ARROWS = true; // set to false to remove the arrows
const ARROW_SIZE = 32; // px: small indicator
const ARROW_INSET = 10; // px from the frame edge
const ARROW_BG = "rgba(0, 0, 0, 0.5)";
const ARROW_BG_HOVER = "rgba(0, 0, 0, 0.68)";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((t: string, i: number) => (
        <span key={i} className="mt-line">
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

export default function ProjectMaterial({ data }: { data: MaterialData }) {
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

  /* reveal once when the page scrolls into view (text only) */
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
      { threshold: 0.2 }
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
      className="pd-page mt"
      aria-label={data.label}
      style={cssVars({
        "--mt-w": FRAME_W,
        "--mt-h": FRAME_H,
        "--mt-indent": COPY_INDENT,
        "--mt-fade": `${SLIDE_FADE_MS}ms`,
        "--mt-arrow": `${ARROW_SIZE}px`,
        "--mt-arrow-inset": `${ARROW_INSET}px`,
        "--mt-arrow-bg": ARROW_BG,
        "--mt-arrow-bg-hover": ARROW_BG_HOVER,
        "--mt-ratio": `${FRAME_W} / ${FRAME_H}`,
      })}
    >
      <h2 className="mt-abs mt-label mt-r" style={cssVars({ "--x": 90, "--y": 89, "--d": 0 })}>
        {data.label}
      </h2>

      <ul className="mt-abs mt-list mt-r" style={cssVars({ "--x": COPY_X, "--y": COPY_Y, "--d": 1 })}>
        {data.bullets.map((b: MaterialBullet, i: number) => (
          <li key={i} className={`mt-item${b.strong ? " is-strong" : ""}`}>
            <Lines lines={b.lines} />
          </li>
        ))}
      </ul>

      <div className="mt-abs mt-right" style={cssVars({ "--x": FRAME_X, "--y": FRAME_Y })}>
        <div
          ref={frameRef}
          className="mt-frame"
          {...(count > 1
            ? {
                role: "group",
                "aria-roledescription": "carousel",
                "aria-label": "Material process photos",
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
          <div className="mt-slides">
            {slides.map((s, i: number) => (
              <div
                key={s.src}
                className={`mt-slide${i === slide ? " is-active" : ""}`}
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

          {SHOW_ARROWS && count > 1 ? (
            <>
              <button type="button" className="mt-arrow mt-arrow--prev" aria-label="Previous photo" onClick={() => go(-1)}>
                <Chevron dir="prev" />
              </button>
              <button type="button" className="mt-arrow mt-arrow--next" aria-label="Next photo" onClick={() => go(1)}>
                <Chevron dir="next" />
              </button>
            </>
          ) : null}
        </div>
      </div>

      <noscript>
        <style>{`.mt-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ---------- base = stacked, one column (phones and tablets) ---------- */
.mt {
  --header-h: 96px;
  --cu: 1px;
  --ax: 0px;
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
  padding: calc(var(--header-h) + 8px) 24px 88px;
}

.mt-label {
  margin: 0 0 32px; text-transform: uppercase;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}

.mt-list { margin: 0 0 48px; padding: 0; list-style: none; display: flex; flex-direction: column; gap: calc(26 * var(--cu)); }
.mt-item {
  position: relative; padding-left: calc(var(--mt-indent) * var(--cu));
  font-size: max(14px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 400; letter-spacing: 0;
  color: var(--ink); text-align: left; hyphens: none;
}
.mt-item.is-strong { font-weight: 600; }
.mt-item::before {
  content: ""; position: absolute; left: 0; border-radius: 50%; background: currentColor;
  width: calc(5 * var(--cu)); height: calc(5 * var(--cu));
  top: calc(13 * var(--cu) - 2.5 * var(--cu));
}
.mt-line { display: inline; }

/* photos (static: no wipe-up, no zoom, no fade-up) */
.mt-right { margin: 0; width: 100%; max-width: 560px; }
.mt-frame {
  position: relative; overflow: hidden; width: 100%;
  aspect-ratio: var(--mt-ratio); background: #efefef;
}
.mt-slides { position: absolute; inset: 0; }
.mt-slide {
  position: absolute; inset: 0; opacity: 0;
  transition: opacity var(--mt-fade) cubic-bezier(.4, 0, .2, 1);
  pointer-events: none; user-select: none;
}
.mt-slide.is-active { opacity: 1; }
.mt-slide img { -webkit-user-drag: none; }

.mt-arrow {
  position: absolute; z-index: 3; top: 50%;
  width: var(--mt-arrow); height: var(--mt-arrow); margin-top: calc(var(--mt-arrow) / -2);
  padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--mt-arrow-bg); color: #fff;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  opacity: 1;
  transition: background-color .35s ease;
}
.mt-arrow--prev { left: var(--mt-arrow-inset); }
.mt-arrow--next { right: var(--mt-arrow-inset); }
.mt-arrow svg { display: block; transition: transform .5s var(--ease); }
.mt-arrow:focus { outline: none; }
.mt-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .mt-arrow:hover { background: var(--mt-arrow-bg-hover); }
  .mt-arrow--prev:hover svg { transform: translateX(-1.5px); }
  .mt-arrow--next:hover svg { transform: translateX(1.5px); }
}
.mt-arrow:active svg { transform: scale(.92); }

/* reveal (text only) */
.mt-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .mt-r { opacity: 1; transform: none; }

/* ---------- ≥1240px: DESIGN MODE, positioned from her Canva page ---------- */
@media (min-width: 1240px) {
  .mt {
    --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
    --ax: calc((100cqw - 1440 * var(--cu)) / 2);
    height: var(--page-h); padding: 0;
  }
  .mt-abs {
    position: absolute; margin: 0;
    left: calc(var(--ax) + var(--x) * var(--cu));
    top: calc(var(--header-h) + (var(--y) - 96) * var(--cu));
  }
  .mt-label { white-space: nowrap; }
  .mt-right { max-width: none; width: calc(var(--mt-w) * var(--cu)); }
  .mt-line { display: block; white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .mt-r, .mt-slide, .mt-arrow, .mt-arrow svg { transition: none !important; }
  .mt-r { opacity: 1; transform: none; }
}
`;