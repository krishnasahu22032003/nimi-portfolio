"use client";
/* components/ProjectFeatures.tsx   (or src/components/ProjectFeatures.tsx)
 *
 * Project eight — page 3 "KEY FEATURES".
 * Pinned section: vertical scroll moves the row of cards sideways (1px scroll = 1px movement, eased).
 *
 * NEW in this version (client feedback):
 *   1. The dotted rule is drawn PER CARD: it starts at the card's dot and ends at the card's right edge.
 *      Nothing is drawn in the gap between cards. Real round dots (no solid line, no dashes).
 *   2. PARALLAX (as on icomat.co.uk): while the row moves, the photo inside each frame drifts
 *      slightly left / right. The frame itself does not change size.
 *
 * Phones (≤820px): no pinning, no parallax. The row scrolls sideways by swipe, one card snaps at a time.
 */
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { FeatureItem, FeaturesData } from "../data/puppetFeatures";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const GREY = "#A3A3A3"; // numbers, dotted line and dots
const CARD_W = 630;
const CARD_H = 432;
const GAP = 58; // space between every two cards
const EDGE_X = 90; // left margin of the title and of the first card
const RADIUS = 18;
const NUM_Y = 250;
const NUM_H = 30;
const RAIL_H = 33;
const CAP_GAP = 42;
const NUM_FS = 22;
const EASE = 0.14; // how softly the row follows the scroll (1 = no smoothing)

/* parallax: the photo is drawn PARALLAX × the frame's width.
   1.18 → the photo can drift ±9% of the frame width. Raise to 1.24 for a stronger effect. */
const PARALLAX = 1.18;

/* dotted rule */
const DOT_SIZE = 2; // artboard px, diameter of each dot
const DOT_STEP = 7; // artboard px, distance between dot centres

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

export default function ProjectFeatures({ data }: { data: FeaturesData }) {
  const outerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* reveal once, when the section first appears */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* vertical scroll → horizontal movement + parallax inside each frame */
  useEffect(() => {
    const outer = outerRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!outer || !stage || !track) return;

    const mq = window.matchMedia("(max-width: 820px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const k = reduce ? 1 : EASE;
    const pars = Array.from(track.querySelectorAll<HTMLElement>(".kf-par"));
    const items = Array.from(track.querySelectorAll<HTMLElement>(".kf-item"));

    let shift = 0; // how far the row has to travel (px)
    let cur = 0;
    let target = 0;
    let raf = 0;
    let lefts: number[] = [];
    let widths: number[] = [];
    let vw = 0;

    const compute = () => {
      const range = outer.offsetHeight - stage.offsetHeight;
      const top = outer.getBoundingClientRect().top;
      target = range > 0 ? clamp(-top / range, 0, 1) * shift : 0;
    };

    /* photo drift: p = -1 (card at the left edge of the screen) … 0 (centre) … +1 (right edge).
       The photo moves AGAINST the card, so each frame feels like a window onto a slower layer. */
    const parallax = () => {
      for (let i = 0; i < pars.length; i++) {
        const el = pars[i];
        if (!el) continue;
        if (mq.matches || reduce) {
          el.style.transform = "";
          continue;
        }
        const w = widths[i] ?? 0;
        const centre = (lefts[i] ?? 0) + w / 2 - cur;
        const p = clamp((centre - vw / 2) / (vw / 2 + w / 2), -1, 1);
        const maxShift = ((PARALLAX - 1) / 2) * w;
        el.style.transform = `translate3d(${(-p * maxShift).toFixed(2)}px,0,0)`;
      }
    };

    const paint = () => {
      track.style.transform = `translate3d(${-cur}px,0,0)`;
      parallax();
    };
    const tick = () => {
      cur += (target - cur) * k;
      if (Math.abs(target - cur) < 0.3) cur = target;
      paint();
      raf = cur !== target ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      if (mq.matches) return;
      compute();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const measure = () => {
      vw = stage.clientWidth;
      lefts = items.map((it) => it.offsetLeft);
      widths = items.map((it) => it.offsetWidth);
      if (mq.matches) {
        outer.style.height = "";
        track.style.transform = "";
        shift = 0;
        cur = target = 0;
        parallax();
        return;
      }
      shift = Math.max(0, track.offsetWidth - stage.clientWidth);
      outer.style.height = `${stage.offsetHeight + shift}px`;
      compute();
      cur = target;
      paint();
    };

    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    ro.observe(track);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    mq.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", measure);
    };
  }, []);

  const total = data.items.length;

  return (
    <section
      ref={outerRef}
      className="pd-page kf"
      aria-label={data.title}
      style={cssVars({
        "--kf-grey": GREY,
        "--kf-w": CARD_W,
        "--kf-h": CARD_H,
        "--kf-gap": GAP,
        "--kf-edge": EDGE_X,
        "--kf-r": RADIUS,
        "--kf-num-y": NUM_Y,
        "--kf-num-h": NUM_H,
        "--kf-rail-h": RAIL_H,
        "--kf-cap-gap": CAP_GAP,
        "--kf-num-fs": NUM_FS,
        "--kf-par": PARALLAX,
        "--kf-dot": DOT_SIZE,
        "--kf-step": DOT_STEP,
      })}
    >
      <div ref={stageRef} className="kf-stage">
        <h2 className="kf-title kf-r">{data.title}</h2>

        <div className="kf-view">
          <div ref={trackRef} className="kf-track" role="list">
            {data.items.map((it: FeatureItem, i: number) => (
              <figure key={it.src} className="kf-item kf-r" role="listitem" style={cssVars({ "--i": i })}>
                <div className="kf-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {/* dotted rule: begins at the dot, ends at this card's right edge */}
                <span className="kf-rule" aria-hidden="true" />
                <span className="kf-dot" aria-hidden="true" />
                <div className="kf-photo">
                  {/* the photo is wider than the frame; JS slides it sideways while the row scrolls */}
                  <div className="kf-par">
                    <Image
                      src={it.src}
                      alt={it.alt}
                      fill
                      loading="eager"
                      sizes="(max-width: 820px) 82vw, 52vw"
                      quality={90}
                      draggable={false}
                      style={{ objectFit: "cover", objectPosition: it.pos ?? "50% 50%" }}
                    />
                  </div>
                </div>
                <figcaption className="kf-cap">
                  <span className="kf-sr">{`Feature ${i + 1} of ${total}: `}</span>
                  {it.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <noscript>
        <style>{`.kf-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.kf {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
}

.kf-stage {
  position: sticky; top: 0; height: var(--page-h); overflow: hidden; box-sizing: border-box;
}

/* ---- title ---- */
.kf-title {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--kf-edge) * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  white-space: nowrap; text-transform: uppercase;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}

/* ---- the row ---- */
.kf-view { position: absolute; inset: 0; overflow: hidden; }
.kf-track {
  position: absolute; left: 0; width: max-content; display: flex; align-items: flex-start; will-change: transform;
  top: calc(var(--header-h) + (var(--kf-num-y) - 96) * var(--cu));
  gap: calc(var(--kf-gap) * var(--cu));
  padding: 0 calc(var(--ax) + var(--kf-edge) * var(--cu));
}

.kf-item { position: relative; flex: none; margin: 0; width: calc(var(--kf-w) * var(--cu)); }

.kf-num {
  height: calc(var(--kf-num-h) * var(--cu)); display: flex; align-items: center;
  font-size: calc(var(--kf-num-fs) * var(--cu)); line-height: 1; font-weight: 500; letter-spacing: .04em;
  font-variant-numeric: tabular-nums; color: var(--kf-grey);
}

/* dotted rule — per card: from the dot (left: 0) to the card's right edge (width: 100%).
   Round dots made with a radial gradient, so they stay crisp and evenly spaced at every zoom. */
.kf-rule {
  position: absolute; left: 0; width: 100%; pointer-events: none;
  height: calc(var(--kf-dot) * var(--cu));
  top: calc((var(--kf-num-h) + var(--kf-rail-h) / 2 - var(--kf-dot) / 2) * var(--cu));
  background-image: radial-gradient(circle at center, var(--kf-grey) 0 48%, transparent 52%);
  background-size: calc(var(--kf-step) * var(--cu)) 100%;
  background-repeat: repeat-x;
  background-position: left center;
}
/* the larger dot that marks the start of each card */
.kf-dot {
  position: absolute; left: 0; border-radius: 50%; background: var(--kf-grey);
  width: calc(5 * var(--cu)); height: calc(5 * var(--cu));
  top: calc((var(--kf-num-h) + var(--kf-rail-h) / 2 - 2.5) * var(--cu));
}

.kf-photo {
  position: relative; overflow: hidden; background: #efefef;
  margin-top: calc(var(--kf-rail-h) * var(--cu));
  width: 100%; height: calc(var(--kf-h) * var(--cu)); border-radius: calc(var(--kf-r) * var(--cu));
  isolation: isolate; /* keeps the rounded clip clean while the inner photo moves */
}
/* the moving layer: wider than the frame, centred, slid sideways by JS */
.kf-par {
  position: absolute; top: 0; bottom: 0;
  width: calc(var(--kf-par) * 100%);
  left: calc((var(--kf-par) - 1) * -50%);
  will-change: transform;
}
.kf-par img { user-select: none; -webkit-user-drag: none; }

.kf-cap {
  margin-top: calc(var(--kf-cap-gap) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: 1.625; font-weight: 500; letter-spacing: 0; color: var(--ink);
  text-align: justify; hyphens: none;
}
.kf-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}

/* ---- reveal ---- */
.kf-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .kf-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(min(var(--i, 0), 2) * 110ms + 150ms);
}
.is-in .kf-title { transition-delay: 0ms; }

/* ---- phones: no pinning, no parallax, swipe the row ---- */
@media (max-width: 820px) {
  .kf { --cu: 1px; }
  .kf-stage { position: static; height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 0 64px; }
  .kf-title { position: static; margin: 0 16px 24px; font-size: 18px; line-height: 30px; }
  .kf-view { position: static; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
  .kf-view::-webkit-scrollbar { display: none; }
  .kf-track { position: relative; top: auto; padding: 0 16px; gap: 16px; transform: none !important; }
  .kf-item { width: 82vw; max-width: 420px; scroll-snap-align: start; }
  .kf-num { height: 28px; font-size: 18px; }
  .kf-rule { top: 41px; height: 2px; background-size: 7px 100%; }
  .kf-dot { top: 40.5px; width: 5px; height: 5px; }
  .kf-photo { margin-top: 30px; height: auto; aspect-ratio: 630 / 432; border-radius: 14px; }
  .kf-par { width: 100%; left: 0; transform: none !important; }
  .kf-cap { margin-top: 16px; font-size: 14px; line-height: 22px; text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .kf-r { opacity: 1; transform: none; transition: none !important; }
  .kf-par { width: 100%; left: 0; transform: none !important; }
}
`;