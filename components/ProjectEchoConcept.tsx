"use client";
/* components/ProjectEchoConcept.tsx   (or src/components/ProjectEchoConcept.tsx)
 *
 * Project three · page 3 — CONCEPT. Built from her 1440 × 900 Canva page.
 *
 * HOW IT STAYS PIXEL-PERFECT *AND* FITS ONE SCREEN
 *   Every position AND every font size is her Canva value (design px on a 1440 × 900 page),
 *   multiplied by one unit  --u = min(1px, 100cqw / 1440, pageHeight / 900):
 *     · viewport ≥ 1440 × 900 → --u = 1px → exactly her pixels
 *     · smaller (laptops, browser zoom, 125 % Windows scaling…) → the WHOLE composition
 *       (images, text, line breaks) shrinks proportionally, so it always fits in one screen
 *   The beige half is always the left 50 % of the page, full height, so the big sketch crosses the seam.
 *   Below 1100px wide (or under 640px tall) the page becomes a single stacked column.
 *
 * Design values (px on the 1440 × 900 page)
 *   "CONCEPT" and the words on the icons ... 18 Medium #000
 *   paragraphs (justified) ................ 14 Regular #000, 22 line, bold = 600
 *   captions .............................. 14 Regular #000
 *
 * CAPTIONS: each caption is centred under its sketch (GEO.captions → cx = centre x, y = top).
 *   So when the words change (e.g. "Bansuri (Indian Flute)") the text stays centred under the drawing.
 *   If she wants the bansuri caption nudged, change only its `cx` (±2 is a visible nudge).
 *
 * Her annotations ("transparency- 23", the arrows, "#F2ECE1 background") are NOT drawn —
 * they became: icon opacity 0.23 and the beige half-page colour.
 *
 * NOTE — blend modes: icons and sketches use mix-blend-mode: multiply, so their white backgrounds
 * vanish on the beige half. Do NOT put opacity / transform / filter / z-index on .pc-page or
 * .pc-stage: that creates a stacking context and the blend stops seeing the beige panel.
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { EchoConceptData } from "../data/Echoconcept ";

/* loaded here too, so this page never falls back to Arial and the bold (600) always exists */
const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_BEIGE = "#F2ECE1"; // her "#F2ECE1 background"
const ICON_OPACITY = 0.23; // her "transparency- 23" → 23 % opacity (use 0.77 if she meant 23 % transparent)

/* Eye PNG: the file has white padding. These are the eye's measured bounds as FRACTIONS of the whole
   PNG, so it is cropped to her exact 205 × 127 box. If you export a trimmed PNG (no padding), set
   l: 0, t: 0, w: 1, ar: <height / width>, inkAspect: <width / height>. */
const EYE_INK = { l: 0.0715, t: 0.0968, w: 0.888, ar: 0.668, inkAspect: 1.618 };
const EYE_IMG_W = 100 / EYE_INK.w;
const EYE_IMG_L = (-EYE_INK.l * 100) / EYE_INK.w;
const EYE_IMG_T = -EYE_INK.t * (1 / EYE_INK.w) * EYE_INK.ar * EYE_INK.inkAspect * 100;

/* width of the invisible box each caption is centred in (wide enough for the longest caption) */
const CAP_W = 240;

/* Her Canva coordinates (px on the 1440 × 900 page). x/y = top-left, w = width. */
const GEO = {
  heading: { x: 90, y: 89 },
  items: [
    {
      icon: { x: 97, y: 153, w: 123 }, // the "?"
      label: { x: 162, y: 212 },
      text: { x: 292, y: 197, w: 384 },
    },
    {
      icon: { x: 63, y: 375, w: 205 }, // the eye
      label: { x: 162, y: 411 },
      text: { x: 292, y: 407, w: 384 },
    },
  ],
  pair: { x: 836, y: 164, w: 456 },
  /* cx = centre of the caption (under the middle of each sketch), y = top of the line */
  captions: [
    { cx: 935, y: 467 }, // under the pan flute
    { cx: 1213, y: 467 }, // under the bansuri
  ],
  hybrid: { x: 182, y: 525, w: 1085 },
} as const;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const at = (x: number, y: number, w?: number, d = 0) =>
  cssVars({ "--x": x, "--y": y, ...(w !== undefined ? { "--w": w } : {}), "--d": d });

/* "text **bold** text" → text with <b> segments */
function renderLine(text: string) {
  return text.split("**").map((part: string, i: number) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((text: string, i: number) => (
        <span key={i} className={`pc-line${i === lines.length - 1 ? " pc-last" : ""}`}>
          {renderLine(text)}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function ProjectEchoConcept({ data }: { data: EchoConceptData }) {
  const rootRef = useRef<HTMLElement>(null);

  /* reveal once, when the page is ~35 % in view */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [first, second] = data.items;
  const [g1, g2] = GEO.items;

  const eyeImgStyle: CSSProperties = {
    width: `${EYE_IMG_W}%`,
    left: `${EYE_IMG_L}%`,
    top: `${EYE_IMG_T}%`,
  };

  return (
    <section
      ref={rootRef}
      className={`pd-page pc-page ${grotesk.className}`}
      aria-label="Echo Pan — concept"
      style={cssVars({ "--pc-beige": COLOR_BEIGE, "--pc-ink": COLOR_INK, "--pc-icon-o": ICON_OPACITY })}
    >
      <div className="pc-bg" aria-hidden="true" />

      <div className="pc-stage">
        <h2 className="pc-heading pc-abs pc-r" style={at(GEO.heading.x, GEO.heading.y, undefined, 0)}>
          {data.heading}
        </h2>

        {/* ---- What happens (?) ---- */}
        <div className="pc-item">
          <div className="pc-iconwrap">
            <div className="pc-icon pc-icon--q pc-abs pc-sized" style={at(g1.icon.x, g1.icon.y, g1.icon.w, 1)} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={first.icon} alt="" draggable={false} decoding="async" />
            </div>
            <p className="pc-label pc-abs pc-r" style={at(g1.label.x, g1.label.y, undefined, 1)}>
              {first.label.map((l: string) => (
                <span key={l} className="pc-block">
                  {l}
                </span>
              ))}
            </p>
          </div>
          <p className="pc-text pc-abs pc-sized pc-r" style={at(g1.text.x, g1.text.y, g1.text.w, 2)}>
            <Lines lines={first.lines} />
          </p>
        </div>

        {/* ---- To observe (eye) ---- */}
        <div className="pc-item">
          <div className="pc-iconwrap">
            <div className="pc-icon pc-icon--eye pc-abs pc-sized" style={at(g2.icon.x, g2.icon.y, g2.icon.w, 3)} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={second.icon} alt="" draggable={false} decoding="async" style={eyeImgStyle} />
            </div>
            <p className="pc-label pc-abs pc-r" style={at(g2.label.x, g2.label.y, undefined, 3)}>
              {second.label.map((l: string) => (
                <span key={l} className="pc-block">
                  {l}
                </span>
              ))}
            </p>
          </div>
          <p className="pc-text pc-abs pc-sized pc-r" style={at(g2.text.x, g2.text.y, g2.text.w, 4)}>
            <Lines lines={second.lines} />
          </p>
        </div>

        {/* ---- pan flute + bansuri ---- */}
        <div className="pc-pair">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="pc-sketch pc-abs pc-sized"
            src={data.pair.src}
            alt={data.pair.alt}
            draggable={false}
            decoding="async"
            style={at(GEO.pair.x, GEO.pair.y, GEO.pair.w, 3)}
          />
          <div className="pc-caps">
            {data.pair.captions.map((c: string, i: number) => (
              <p
                key={c}
                className="pc-cap pc-abs pc-sized pc-r"
                style={at(GEO.captions[i].cx - CAP_W / 2, GEO.captions[i].y, CAP_W, 4)}
              >
                {c}
              </p>
            ))}
          </div>
        </div>

        {/* ---- Echo Pan sketch (crosses the beige / white seam) ---- */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="pc-hybrid pc-abs pc-sized"
          src={data.hybrid.src}
          alt={data.hybrid.alt}
          draggable={false}
          decoding="async"
          style={at(GEO.hybrid.x, GEO.hybrid.y, GEO.hybrid.w, 5)}
        />
      </div>

      <noscript>
        <style>{`.pc-r,.pc-sketch{opacity:1!important;transform:none!important}.pc-icon{opacity:${ICON_OPACITY}!important;transform:none!important}.pc-hybrid{clip-path:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pc-page { --u: 1px; }
.pc-bg { position: absolute; pointer-events: none; background: var(--pc-beige); }
.pc-block { display: block; }
.pc-text b { font-weight: 600; }

.pc-heading, .pc-label, .pc-text, .pc-cap { margin: 0; letter-spacing: 0; color: var(--pc-ink); }
.pc-heading, .pc-label { font-weight: 500; }
.pc-text, .pc-cap { font-weight: 400; }
.pc-text { text-align: justify; hyphens: none; }

.pc-icon { position: relative; mix-blend-mode: multiply; pointer-events: none; user-select: none; }
.pc-icon img { display: block; height: auto; max-width: none; -webkit-user-drag: none; }
.pc-icon--q img { width: 100%; }
.pc-icon--eye { overflow: hidden; aspect-ratio: 2087 / 1290; }
.pc-icon--eye img { position: absolute; }

.pc-sketch, .pc-hybrid { display: block; height: auto; mix-blend-mode: multiply; pointer-events: none; user-select: none; -webkit-user-drag: none; }

/* reveal */
.pc-r, .pc-icon, .pc-sketch {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pc-r, .is-in .pc-sketch { opacity: 1; transform: none; }
.is-in .pc-icon { opacity: var(--pc-icon-o); transform: none; }
/* the big sketch is drawn in from the left, across the seam */
.pc-hybrid {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1.6s cubic-bezier(.77, 0, .18, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pc-hybrid { clip-path: inset(0 0 0 0); }

/* ===================== STACKED column: narrow (<1100px) or short (<640px) screens ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pc-page { scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 24px 88px; }
  .pc-bg { inset: 0; }
  .pc-stage { position: relative; width: 100%; max-width: 34rem; margin: 0 auto; display: flex; flex-direction: column; gap: 40px; }

  .pc-heading { font-size: 18px; line-height: 30px; }
  .pc-label   { font-size: 18px; line-height: 29px; white-space: nowrap; }
  .pc-text    { font-size: 14px; line-height: 22px; }
  .pc-cap     { font-size: 14px; line-height: 24px; }

  .pc-item { display: grid; grid-template-columns: 108px minmax(0, 1fr); column-gap: 20px; align-items: center; }
  .pc-iconwrap { position: relative; width: 108px; height: 108px; display: grid; place-items: center; }
  .pc-iconwrap .pc-label { position: absolute; inset: 0; display: grid; align-content: center; justify-items: center; text-align: center; }
  .pc-icon--q { width: 62px; }
  .pc-icon--eye { width: 108px; }

  .pc-sketch, .pc-hybrid { width: 100%; }
  .pc-caps { display: flex; justify-content: space-around; gap: 16px; margin-top: 8px; }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pc-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    padding: 0;
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  /* beige = left half of the page (#F2ECE1), full height */
  .pc-bg { top: 0; bottom: 0; left: 0; right: 50%; }

  .pc-stage { position: relative; display: block; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }
  .pc-item, .pc-iconwrap, .pc-pair, .pc-caps { display: contents; }

  .pc-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pc-sized { width: calc(var(--u) * var(--w)); }

  /* type = her values × --u */
  .pc-heading { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pc-label   { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 29); white-space: nowrap; text-align: left; }
  .pc-text    { font-size: calc(var(--u) * 14); line-height: calc(var(--u) * 22); }
  /* captions are centred under their sketch */
  .pc-cap     { font-size: calc(var(--u) * 14); line-height: calc(var(--u) * 24); white-space: nowrap; text-align: center; }

  /* every string is exactly one line, as she broke it in Canva; justified to the block width */
  .pc-line { display: block; white-space: nowrap; }
  .pc-text { width: max-content; min-width: calc(var(--u) * var(--w)); }
  .pc-text .pc-line:not(.pc-last) { text-align: justify; text-align-last: justify; }
  .pc-text .pc-line.pc-last { text-align: left; }
}

@media (prefers-reduced-motion: reduce) {
  .pc-r, .pc-icon, .pc-sketch, .pc-hybrid { transition: none !important; }
  .pc-r, .pc-sketch { opacity: 1; transform: none; }
  .pc-icon { opacity: var(--pc-icon-o); transform: none; }
  .pc-hybrid { clip-path: none; }
}
`;