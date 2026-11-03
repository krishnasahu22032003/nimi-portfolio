"use client";
/* components/ProjectEchoShapes.tsx   (or src/components/ProjectEchoShapes.tsx)
 *
 * Project three · page 4 — "What shapes a note?"  Built from her 1440 × 900 Canva page.
 *
 * THE EXPERIENCE
 *   The page is PINNED for about four screens of scrolling. The render and the title are there
 *   straight away; then, as the visitor scrolls, the measurements draw themselves in one after
 *   another — Bansuri length → diameter → the six finger holes → the tuning hole → the bracket →
 *   Pan Flute width → tube diameter → the five pipe lengths. Every piece is scrubbed by the scroll
 *   position (scroll back and it un-draws) and eased, so it feels floaty rather than jumpy.
 *
 * PIXEL-PERFECT
 *   Every position AND every size is her Canva value on a 1440 × 900 page, multiplied by
 *   --u = min(1px, 100cqw / 1440, pageHeight / 900):
 *     · viewport ≥ 1440 × 900 → exactly her pixels
 *     · smaller → the whole composition (image, lines, type) shrinks proportionally and stays in one screen
 *   Below 1100px wide (or under 640px tall) the page becomes a simple stacked column:
 *   title, render, then the same measurements as a short list.
 *
 * Type (design px):  title + "Bansuri" / "Pan Flute" ... 18 Medium #000
 *                    every measurement .................. 16 Regular #404040, 26 line
 *
 * TIMELINE — each [start, end] is a slice of the scroll progress (0 → 1). Tweak freely.
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { EchoShapesData } from "../data/echoShapes";

const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_GREY = "#404040";

const PAGES_OF_SCROLL = 5; // pinned height = this many screens (4 screens of actual scrolling)
const END = 0.92; // everything is fully drawn when scroll progress reaches 92 % → a short rest at the end
const SMOOTH = 0.12; // 0–1: lower = floatier

type Range = [number, number];
const T = {
  bHead: [0.03, 0.1] as Range,
  bTotal: [0.08, 0.15] as Range,
  bArrow: [0.05, 0.19] as Range,
  diaArrow: [0.19, 0.25] as Range,
  diaText: [0.22, 0.28] as Range,
  hole: (i: number): Range => [0.28 + i * 0.04, 0.36 + i * 0.04], // 6 finger holes → ends 0.56
  tuning: [0.56, 0.64] as Range,
  bracket: [0.64, 0.71] as Range,
  span: [0.68, 0.74] as Range,
  pHead: [0.74, 0.8] as Range,
  pTotal: [0.77, 0.83] as Range,
  pArrow: [0.76, 0.84] as Range,
  tube: [0.8, 0.86] as Range,
  lenLabel: [0.83, 0.87] as Range,
  len: (i: number): Range => [0.84 + i * 0.02, 0.9 + i * 0.02], // 5 pipes → ends 0.98
};
/* a label follows its arrow: it starts halfway through the arrow's draw */
const after = ([a, b]: Range): Range => [a + (b - a) * 0.45, b];

/* ---- her Canva coordinates (px on the 1440 × 900 page) ---- */
const G = {
  title: { x: 90, y: 89 },
  image: { x: 67, y: 303, w: 1306 },

  bansuri: { x: 437, headY: 216, totalY: 249, arrow: { x: 84, y: 290, w: 821 } },
  dia: { arrow: { x: 52, y: 331, h: 50 }, text: { x: 51, y: 403 } },
  holes: [
    { ax: 213, lx: 193 },
    { ax: 281, lx: 262 },
    { ax: 330, lx: 310 },
    { ax: 414, lx: 394 },
    { ax: 482, lx: 461 },
    { ax: 550, lx: 530 },
  ],
  holeArrow: { top: 378, h: 100 },
  holeLabelY: 493,
  tuning: { ax: 871, top: 378, h: 97, lx: 851, ly: 490 },
  bracket: { x: 213, y: 543, w: 658 },
  span: { x: 437, y: 559 },

  pan: { x: 1105, headY: 216, totalY: 249, arrow: { x: 1076, y: 289, w: 235 } },
  tube: { x: 1311, y: 403 },
  lenLabel: { x: 964, y: 632 },
  lengths: [
    { ax: 1066, top: 530, h: 100, lx: 1037, ly: 631 },
    { ax: 1105, top: 543, h: 87, lx: 1085, ly: 631 },
    { ax: 1144, top: 572, h: 58, lx: 1133, ly: 631 },
    { ax: 1187, top: 583, h: 47, lx: 1172, ly: 634 },
    { ax: 1229, top: 595, h: 35, lx: 1216, ly: 634 },
  ],
} as const;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const pos = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });
const tm = ([a, b]: Range) => ({ "data-a": a, "data-b": b });

const clamp = (v: number, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);
const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

export default function ProjectEchoShapes({ data }: { data: EchoShapesData }) {
  const rootRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const { bansuri: b, pan: p } = data;

  /* time-based reveal of the title + render (once, when the page is in view) */
  useEffect(() => {
    const root = rootRef.current;
    const st = stickyRef.current;
    if (!root || !st) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            root.classList.add("is-in");
            io.disconnect();
          }
        }),
      { threshold: 0.2 }
    );
    io.observe(st);
    return () => io.disconnect();
  }, []);

  /* scroll-scrubbed measurements */
  useEffect(() => {
    const root = rootRef.current;
    const st = stickyRef.current;
    if (!root || !st) return;

    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-a]"));
    const desktopMq = window.matchMedia("(min-width: 1100px) and (min-height: 640px)");
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = (prog: number) => {
      els.forEach((el: HTMLElement) => {
        const a = Number(el.dataset.a);
        const bb = Number(el.dataset.b);
        const t = ease(clamp((prog - a) / (bb - a)));
        el.style.setProperty("--t", t.toFixed(4));
      });
    };

    let cleanup = () => {};
    const setup = () => {
      cleanup();
      /* stacked layout or reduced motion → everything simply visible */
      if (!desktopMq.matches || reduceMq.matches) {
        apply(1);
        cleanup = () => {};
        return;
      }

      let target = 0;
      let cur = 0;
      let raf = 0;

      const read = () => {
        const total = root.offsetHeight - st.offsetHeight;
        const top = root.getBoundingClientRect().top;
        const raw = total > 0 ? clamp(-top / total) : 1;
        target = clamp(raw / END);
      };
      const tick = () => {
        cur += (target - cur) * SMOOTH;
        if (Math.abs(target - cur) < 0.0004) cur = target;
        apply(cur);
        raf = cur !== target ? requestAnimationFrame(tick) : 0;
      };
      const onScroll = () => {
        read();
        if (!raf) raf = requestAnimationFrame(tick);
      };

      read();
      cur = target;
      apply(cur);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      };
    };

    setup();
    desktopMq.addEventListener("change", setup);
    reduceMq.addEventListener("change", setup);
    return () => {
      cleanup();
      desktopMq.removeEventListener("change", setup);
      reduceMq.removeEventListener("change", setup);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className={`pd-page pe-page ${grotesk.className}`}
      aria-label="Echo Pan — what shapes a note"
      style={cssVars({ "--pe-ink": COLOR_INK, "--pe-grey": COLOR_GREY, "--pe-pages": PAGES_OF_SCROLL })}
    >
      <div ref={stickyRef} className="pe-sticky">
        <div className="pe-stage">
          <h2 className="pe-head pe-title pe-abs pe-r" style={pos(G.title.x, G.title.y)}>
            {data.heading}
          </h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="pe-img pe-abs pe-r"
            src={data.image.src}
            alt={data.image.alt}
            draggable={false}
            decoding="async"
            style={pos(G.image.x, G.image.y, { "--w": G.image.w, "--d": 1 })}
          />

          {/* ================= measurements (drawn by scroll) ================= */}
          <div className="pe-ann" aria-hidden="true">
            {/* ---- Bansuri ---- */}
            <p className="pe-head pe-t pe-abs" style={pos(G.bansuri.x, G.bansuri.headY)} {...tm(T.bHead)}>
              {b.title}
            </p>
            <p className="pe-note pe-t pe-abs" style={pos(G.bansuri.x, G.bansuri.totalY)} {...tm(T.bTotal)}>
              {b.total}
            </p>
            <div className="pe-hline pe-abs" style={pos(G.bansuri.arrow.x, G.bansuri.arrow.y - 0.75, { "--w": G.bansuri.arrow.w })} {...tm(T.bArrow)} />

            <div className="pe-vline pe-abs" style={pos(G.dia.arrow.x - 0.75, G.dia.arrow.y, { "--h": G.dia.arrow.h })} {...tm(T.diaArrow)} />
            <p className="pe-note pe-t pe-abs" style={pos(G.dia.text.x, G.dia.text.y)} {...tm(T.diaText)}>
              {b.diameter}
            </p>

            {G.holes.map((h, i: number) => (
              <div key={`h${i}`} style={{ display: "contents" }}>
                <div className="pe-dot pe-abs" style={pos(h.ax - 0.6, G.holeArrow.top, { "--h": G.holeArrow.h })} {...tm(T.hole(i))} />
                <p className="pe-note pe-t pe-abs" style={pos(h.lx, G.holeLabelY)} {...tm(after(T.hole(i)))}>
                  {b.holes[i]}
                </p>
              </div>
            ))}

            <div className="pe-dot pe-abs" style={pos(G.tuning.ax - 0.6, G.tuning.top, { "--h": G.tuning.h })} {...tm(T.tuning)} />
            <p className="pe-note pe-t pe-abs" style={pos(G.tuning.lx, G.tuning.ly)} {...tm(after(T.tuning))}>
              {b.tuning}
            </p>

            <div className="pe-bracket pe-abs" style={pos(G.bracket.x, G.bracket.y - 0.6, { "--w": G.bracket.w })} {...tm(T.bracket)} />
            <p className="pe-note pe-t pe-abs" style={pos(G.span.x, G.span.y)} {...tm(T.span)}>
              <span className="pe-block">{b.span[0]}</span>
              <span className="pe-block">{b.span[1]}</span>
            </p>

            {/* ---- Pan Flute ---- */}
            <p className="pe-head pe-t pe-abs" style={pos(G.pan.x, G.pan.headY)} {...tm(T.pHead)}>
              {p.title}
            </p>
            <p className="pe-note pe-t pe-abs" style={pos(G.pan.x, G.pan.totalY)} {...tm(T.pTotal)}>
              {p.total}
            </p>
            <div className="pe-hline pe-abs" style={pos(G.pan.arrow.x, G.pan.arrow.y - 0.75, { "--w": G.pan.arrow.w })} {...tm(T.pArrow)} />

            <p className="pe-note pe-t pe-abs" style={pos(G.tube.x, G.tube.y)} {...tm(T.tube)}>
              {p.tube.map((l: string) => (
                <span key={l} className="pe-block">
                  {l}
                </span>
              ))}
            </p>

            <p className="pe-note pe-t pe-abs" style={pos(G.lenLabel.x, G.lenLabel.y)} {...tm(T.lenLabel)}>
              {p.lengthLabel}
            </p>
            {G.lengths.map((l, i: number) => (
              <div key={`l${i}`} style={{ display: "contents" }}>
                <div className="pe-dot pe-abs" style={pos(l.ax - 0.6, l.top, { "--h": l.h })} {...tm(T.len(i))} />
                <p className="pe-note pe-t pe-abs" style={pos(l.lx, l.ly)} {...tm(after(T.len(i)))}>
                  <span className="pe-block">{p.lengths[i][0]}</span>
                  <span className="pe-block">{p.lengths[i][1]}</span>
                </p>
              </div>
            ))}
          </div>

          {/* same numbers as a list: read by screen readers, shown on small screens */}
          <div className="pe-list">
            <div className="pe-group pe-r" style={cssVars({ "--d": 2 })}>
              <h3 className="pe-head">{b.title}</h3>
              <ul>
                <li>{b.total}</li>
                <li>{b.diameter}</li>
                <li>
                  {b.span.join(" ")}: {[...b.holes, b.tuning].join(", ")}
                </li>
              </ul>
            </div>
            <div className="pe-group pe-r" style={cssVars({ "--d": 3 })}>
              <h3 className="pe-head">{p.title}</h3>
              <ul>
                <li>{p.total}</li>
                <li>{p.tube.join(" ")}</li>
                <li>
                  {p.lengthLabel} {p.lengths.map((l: string[]) => l.join(" ")).join(", ")}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <noscript>
        <style>{`.pe-r{opacity:1!important;transform:none!important}.pe-t{opacity:1!important;transform:none!important}.pe-hline,.pe-vline,.pe-dot,.pe-bracket{clip-path:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pe-page { --u: 1px; }
.pe-block { display: block; }

.pe-head { margin: 0; font-weight: 500; letter-spacing: 0; color: var(--pe-ink); }
.pe-note { margin: 0; font-weight: 400; letter-spacing: 0; color: var(--pe-grey); white-space: pre; }

.pe-img { display: block; height: auto; max-width: none; pointer-events: none; user-select: none; -webkit-user-drag: none; }

/* time-based reveal (title + render) */
.pe-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 140ms + 100ms);
}
.is-in .pe-r { opacity: 1; transform: none; }

/* scroll-scrubbed text: --t (0 → 1) is written by the component */
.pe-t {
  opacity: var(--t, 0);
  transform: translate3d(0, calc((1 - var(--t, 0)) * var(--u) * 10), 0);
  will-change: opacity, transform;
}

/* ---- lines (all drawn with --t) ---- */
.pe-hline, .pe-vline, .pe-dot, .pe-bracket { --ink: var(--pe-ink); pointer-events: none; }

/* double-headed horizontal arrow: grows from the centre outwards */
.pe-hline {
  width: calc(var(--u) * var(--w)); height: calc(var(--u) * 1.5); background: var(--pe-ink);
  clip-path: inset(calc(var(--u) * -8) calc((1 - var(--t, 0)) * 50%));
}
.pe-hline::before, .pe-hline::after {
  content: ""; position: absolute; top: 50%; transform: translateY(-50%); width: 0; height: 0;
  border-top: calc(var(--u) * 3.5) solid transparent; border-bottom: calc(var(--u) * 3.5) solid transparent;
}
.pe-hline::before { left: 0;  border-right: calc(var(--u) * 8) solid var(--pe-ink); }
.pe-hline::after  { right: 0; border-left:  calc(var(--u) * 8) solid var(--pe-ink); }

/* double-headed vertical arrow (diameter) */
.pe-vline {
  width: calc(var(--u) * 1.5); height: calc(var(--u) * var(--h)); background: var(--pe-ink);
  clip-path: inset(calc((1 - var(--t, 0)) * 50%) calc(var(--u) * -8));
}
.pe-vline::before, .pe-vline::after {
  content: ""; position: absolute; left: 50%; transform: translateX(-50%); width: 0; height: 0;
  border-left: calc(var(--u) * 3.5) solid transparent; border-right: calc(var(--u) * 3.5) solid transparent;
}
.pe-vline::before { top: 0;    border-bottom: calc(var(--u) * 8) solid var(--pe-ink); }
.pe-vline::after  { bottom: 0; border-top:    calc(var(--u) * 8) solid var(--pe-ink); }

/* dotted arrow pointing UP at the hole / pipe: the head appears first, the line runs down to its label */
.pe-dot {
  width: calc(var(--u) * 1.2); height: calc(var(--u) * var(--h));
  background-image: linear-gradient(var(--pe-ink) 50%, transparent 50%);
  background-size: 100% calc(var(--u) * 4);
  clip-path: inset(0 calc(var(--u) * -6) calc((1 - var(--t, 0)) * 100%) calc(var(--u) * -6));
}
.pe-dot::before {
  content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0;
  border-left: calc(var(--u) * 3) solid transparent; border-right: calc(var(--u) * 3) solid transparent;
  border-bottom: calc(var(--u) * 6) solid var(--pe-ink);
}

/* bracket under the finger holes: runs left → right, with end ticks */
.pe-bracket {
  width: calc(var(--u) * var(--w)); height: calc(var(--u) * 1.2); background: var(--pe-ink);
  clip-path: inset(calc(var(--u) * -6) calc((1 - var(--t, 0)) * 100%) calc(var(--u) * -6) 0);
}
.pe-bracket::before, .pe-bracket::after {
  content: ""; position: absolute; top: 50%; transform: translateY(-50%); width: calc(var(--u) * 1.2); height: calc(var(--u) * 8); background: var(--pe-ink);
}
.pe-bracket::before { left: 0; }
.pe-bracket::after  { right: 0; }

/* the numbers as a list: hidden visually on desktop (still read by screen readers) */
.pe-list { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* ===================== STACKED column: narrow (<1100px) or short (<640px) screens ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pe-page { height: auto; scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 24px 88px; }
  .pe-sticky { position: static; }
  .pe-stage { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 34rem; margin: 0 auto; }
  .pe-ann { display: none; }

  .pe-head { font-size: 18px; line-height: 30px; }
  .pe-img { width: 100%; }

  .pe-list { position: static; width: auto; height: auto; margin: 0; overflow: visible; clip: auto; white-space: normal; display: flex; flex-direction: column; gap: 28px; }
  .pe-list ul { list-style: none; margin: 8px 0 0; padding: 0; }
  .pe-list li { font-size: 16px; line-height: 26px; font-weight: 400; color: var(--pe-grey); }
}

/* ===================== DESKTOP: her 1440 × 900 composition, pinned + scrubbed ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pe-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: calc(var(--page-h) * var(--pe-pages));
    scroll-snap-stop: normal; /* the page is taller than the screen: let the visitor scroll through it freely */
  }
  .pe-sticky { position: sticky; top: 0; height: var(--page-h); display: grid; place-items: center; }
  .pe-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }
  .pe-ann { position: absolute; inset: 0; }

  .pe-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pe-img { width: calc(var(--u) * var(--w)); }

  .pe-head { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pe-note { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); }
}

@media (prefers-reduced-motion: reduce) {
  .pe-r { transition: none !important; opacity: 1; transform: none; }
  .pe-t { transform: none; }
  .pe-page { height: auto !important; }
}
`;