"use client";
/* components/ProjectEchoSound.tsx   (or src/components/ProjectEchoSound.tsx)
 *
 * Project three · page 5 — "How the dimensions are calculated ?" | "How it affects the sound ?"
 * Built from her 1440 × 900 Canva page ("referance page").
 *
 * PIXEL-PERFECT + ONE SCREEN (same system as the Concept page)
 *   Every position AND every size is her Canva value on a 1440 × 900 page, multiplied by
 *   --u = min(1px, 100cqw / 1440, pageHeight / 900). At 1440 × 900 or larger you get her exact pixels;
 *   on smaller screens the whole composition shrinks proportionally and still fits one screen.
 *   The beige half is always the left 50 % of the page. Below 1100px wide (or under 640px tall)
 *   the page becomes a stacked column.
 *
 * Design values (px):  both big questions + "Bansuri" / "Pan flute" .. 18 Medium #000
 *                      body copy ................................... 16 Regular #404040, 26 line
 *                      diagram labels .............................. 14 Regular #000
 *                      state captions .............................. 14 (black title / #404040 note)
 *                      scale labels ................................ 13 (black / #404040)
 *
 * BLUE STANDING WAVES (her note: "the blue lines throughout the flute image")
 *   The waves are now drawn as crisp vector lines in code (<Wave />) instead of cropped PNGs, so they
 *   always show, stay sharp at any size, and sit exactly inside every tube:
 *     · bansuri diagram ........ one wave along the whole closed tube
 *     · pan flute tube ......... the double-helix wave down the tube
 *     · the 3 flute states ..... same wave scale, cut at the FIRST OPEN HOLE → more holes closed = longer wave
 *   Tune: WAVE_ON_DARK / WAVE_ON_WOOD (colours), WAVE_SW (line weight), WAVE_N (number of loops).
 *
 * The formulas are typeset (not screenshots), so they stay sharp. Her screenshots had a pale box behind
 * them; set FORMULA_BG = "#EEF0E4" if she wants those boxes back.
 *
 * Images are drawn with mix-blend-mode: multiply, so their white backgrounds disappear on the beige half.
 * Do NOT put opacity / transform / filter / z-index on .pf-page or .pf-stage (that would stop the blend).
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { EchoSoundData } from "@/data/Echosound ";

const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_GREY = "#404040";
const COLOR_BEIGE = "#F2ECE1";
const FORMULA_BG = "transparent"; // "#EEF0E4" = the pale boxes of her screenshots
const FORMULA_INK = "#262626";

/* blue standing waves */
const WAVE_ON_DARK = "#52B4F2"; // on the black bansuri tubes
const WAVE_ON_WOOD = "#2B86CC"; // on the light wooden pan tube
const WAVE_SW = 1.3; // line weight (design px)
const WAVE_N = {
  bansuriDiagram: 6, // half-waves along the closed bansuri tube
  panTube: 5, // half-waves down the pan flute tube
  states: [3, 5, 9], // half-waves in the three states (≈ the same loop size, cut at the first open hole)
};

/* Where the render / tube sits inside her PNG files, as FRACTIONS of the whole image
   (l = left, t = top, w = width, h = height). They are cropped to her exact boxes with these.
   If you export trimmed PNGs, use { l: 0, t: 0, w: 1, h: 1 }. */
const INK = {
  bansuriSide: { l: 0.0108, t: 0.0949, w: 0.9804, h: 0.7722 }, // sound-bansuri-side.png (2400 × 158)
  panTube: { l: 0.1091, t: 0.0148, w: 0.789, h: 0.9648 }, //    sound-pan-tube.png       (275 × 1419)
  panRender: { l: 0.2174, t: 0.0935, w: 0.545, h: 0.9003 }, //  sound-pan-render.png     (1343 × 1605) → the five pipes only
};
type Ink = { l: number; t: number; w: number; h: number };

/* The three flute PNGs have different sizes, so each one is cropped to its tube.
   `ink`   = the tube inside the PNG (fractions of the file)
   `first` = where the FIRST OPEN hole is, as a share of the tube's length → the blue wave ends there.
   (measured from the files: all open → hole 1, 2 closed → hole 3, 5 closed → hole 6) */
const FLUTES = [
  { ink: { l: 0.0101, t: 0.1099, w: 0.9831, h: 0.7582 }, first: 0.1426 }, // sound-flute-all-open.png      (2961 × 182)
  { ink: { l: 0.0106, t: 0.1244, w: 0.9828, h: 0.7254 }, first: 0.2642 }, // sound-flute-some-closed.png   (3024 × 193)
  { ink: { l: 0.013, t: 0.1907, w: 0.9821, h: 0.6465 }, first: 0.4818 }, //  sound-flute-more-closed.png   (3011 × 215)
];
const TUBE_RATIO = 21.2; // every flute tube is 21.2 × as long as it is thick
const WAVE_X0 = 0.012; // the wave starts just inside the open end

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const pos = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l: string, i: number) => (
        <span key={i} className="pf-block">
          {l === "" ? "\u00A0" : l}
        </span>
      ))}
    </>
  );
}

/* a PNG cropped to a box via fractions of the file (see INK) */
function Crop({ src, ink, className, style, alt }: { src: string; ink: Ink; className: string; style: CSSProperties; alt?: string }) {
  return (
    <div className={`pf-crop ${className}`} style={style} {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        style={{ width: `${100 / ink.w}%`, height: `${100 / ink.h}%`, left: `${(-ink.l * 100) / ink.w}%`, top: `${(-ink.t * 100) / ink.h}%` }}
      />
    </div>
  );
}

/* ---- the blue standing wave: two mirrored sine curves that cross at the nodes (n half-waves) ----
   Desktop: w × h are design px (the SVG is scaled by --u together with its box, so the line weight scales too).
   fluid  : used on the stacked layout, where the box is sized in % — the line stays a constant 1.3px. */
function Wave({
  w,
  h,
  n,
  color,
  vertical = false,
  fluid = false,
}: {
  w: number;
  h: number;
  n: number;
  color: string;
  vertical?: boolean;
  fluid?: boolean;
}) {
  const sw = WAVE_SW;
  const across = vertical ? w : h; // thickness of the tube
  const along = vertical ? h : w; // length of the tube
  const mid = across / 2;
  const amp = mid - sw; // keep the line inside the box
  const steps = Math.max(80, n * 28);
  let d1 = "";
  let d2 = "";
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = Math.sin(Math.PI * n * t) * amp;
    const p = (along * t).toFixed(2);
    const a = (mid + s).toFixed(2);
    const b = (mid - s).toFixed(2);
    const c = i === 0 ? "M" : "L";
    d1 += vertical ? `${c}${a} ${p} ` : `${c}${p} ${a} `;
    d2 += vertical ? `${c}${b} ${p} ` : `${c}${p} ${b} `;
  }
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...(fluid ? { vectorEffect: "non-scaling-stroke" as const } : {}),
  };
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d={d1} {...common} />
      <path d={d2} {...common} />
    </svg>
  );
}

/* ---- typeset formulas ---- */
const Italic = ({ children }: { children: ReactNode }) => <i>{children}</i>;
function FormulaSpeed() {
  return (
    <span className="pf-math" role="img" aria-label="f equals v over 4 L">
      <Italic>f</Italic>
      <span className="pf-eq">=</span>
      <span className="pf-frac">
        <i className="pf-num">v</i>
        <span className="pf-den">
          4<i>L</i>
        </span>
      </span>
    </span>
  );
}
function FormulaLeff() {
  return (
    <span className="pf-math" role="img" aria-label="L effective is approximately d plus delta L end">
      <i>L</i>
      <sub>
        <i>eff</i>
      </sub>
      <span className="pf-eq">≈</span>
      <i>d</i>
      <span className="pf-eq">+</span>
      <span>Δ</span>
      <i>L</i>
      <sub>
        <i>end</i>
      </sub>
    </span>
  );
}

export default function ProjectEchoSound({ data }: { data: EchoSoundData }) {
  const rootRef = useRef<HTMLElement>(null);

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
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const { bansuri: cb, pan: cp } = data.calc;
  const { bansuri: sb, pan: sp } = data.sound;

  /* right column, bansuri states: flute top, caption top (design px) */
  const STATE_Y = [
    { flute: 403.5, cap: 430.5 },
    { flute: 512.5, cap: 541.5 },
    { flute: 625.5, cap: 655.5 },
  ];
  const FLUTE = { x: 787, w: 300 };
  const fluteH = FLUTE.w / TUBE_RATIO; // 14.2
  const WAVE_H = 11.5;

  /* right column, pan flute: pipe centres (x) and the top of each dotted arrow (y); arrows end at y = 730 */
  const PIPES = [
    { x: 1173.1, top: 542 },
    { x: 1205.1, top: 580 },
    { x: 1237, top: 619 },
    { x: 1269, top: 658 },
    { x: 1302.3, top: 700 },
  ];

  return (
    <section
      ref={rootRef}
      className={`pd-page pf-page ${grotesk.className}`}
      aria-label="Echo Pan — dimensions and sound"
      style={cssVars({ "--pf-ink": COLOR_INK, "--pf-grey": COLOR_GREY, "--pf-beige": COLOR_BEIGE, "--pf-fbg": FORMULA_BG, "--pf-fink": FORMULA_INK })}
    >
      <div className="pf-bg" aria-hidden="true" />

      {/* =============================== DESKTOP (her 1440 × 900 page) =============================== */}
      <div className="pf-stage">
        {/* ---------- LEFT: how the dimensions are calculated ---------- */}
        <h2 className="pf-h pf-abs pf-r" style={pos(90, 89, { "--d": 0 })}>
          {data.headingLeft}
        </h2>
        <h3 className="pf-h pf-abs pf-r" style={pos(90, 180, { "--d": 1 })}>
          {cb.title}
        </h3>
        <h3 className="pf-h pf-abs pf-r" style={pos(516, 180, { "--d": 1 })}>
          {cp.title}
        </h3>

        {/* bansuri diagram */}
        <p className="pf-sm pf-abs pf-r" style={pos(100, 255.5, { "--d": 2 })}>
          <Lines lines={cb.openEnd} />
        </p>
        <p className="pf-sm pf-abs pf-r" style={pos(356, 266.5, { "--d": 2 })}>
          {cb.closedEnd}
        </p>
        <div className="pf-lh l pf-abs pf-r" style={pos(100, 310.4, { "--w": 20, "--d": 2 })} aria-hidden="true" />
        <Crop src={cb.side} ink={INK.bansuriSide} alt={cb.label} className="pf-abs pf-mul pf-r" style={pos(120, 304.4, { "--w": 250, "--h": 13.1, "--d": 2 })} />
        {/* blue standing wave along the closed tube */}
        <div className="pf-wave pf-abs pf-wipe" style={pos(124, 305.2, { "--w": 242, "--h": 11.5, "--d": 3 })} aria-hidden="true">
          <Wave w={242} h={11.5} n={WAVE_N.bansuriDiagram} color={WAVE_ON_DARK} />
        </div>
        <div className="pf-ghost pf-abs pf-r" style={pos(370, 304.4, { "--w": 14, "--h": 13.1, "--d": 2 })} aria-hidden="true" />
        <div className="pf-lv t b pf-abs pf-r" style={pos(396.4, 289, { "--h": 46, "--d": 2 })} aria-hidden="true" />

        <p className="pf-body pf-abs pf-r" style={pos(90, 370, { "--d": 3 })}>
          {cb.closedTube}
        </p>
        <div className="pf-formula pf-abs pf-r" style={pos(185, 419, { "--w": 155, "--h": 62, "--d": 3 })}>
          <FormulaSpeed />
        </div>
        <p className="pf-body pf-abs pf-r" style={pos(90, 507, { "--d": 4 })}>
          <Lines lines={cb.holeLines} />
        </p>
        <div className="pf-formula pf-abs pf-r" style={pos(137, 688, { "--w": 251, "--h": 58, "--d": 4 })}>
          <FormulaLeff />
        </div>
        <p className="pf-body pf-abs pf-r" style={pos(90, 787, { "--d": 5 })}>
          {cb.correction}
        </p>

        {/* pan flute diagram */}
        <p className="pf-sm pf-center pf-abs pf-r" style={pos(520, 254.5, { "--w": 86, "--d": 2 })}>
          {cp.openEnd}
        </p>
        {[555, 563.5, 572].map((x: number) => (
          <div key={x} className="pf-lv t pf-abs pf-r" style={pos(x - 0.6, 273, { "--h": 30, "--d": 2 })} aria-hidden="true" />
        ))}
        <Crop src={cp.tube} ink={INK.panTube} alt={cp.label} className="pf-abs pf-mul pf-r" style={pos(546.9, 297, { "--w": 32.2, "--h": 203, "--d": 2 })} />
        {/* blue standing wave down the tube */}
        <div className="pf-wave pf-abs pf-wipe pf-wipe--v" style={pos(547.4, 298, { "--w": 30.4, "--h": 201, "--d": 3 })} aria-hidden="true">
          <Wave w={30.4} h={201} n={WAVE_N.panTube} color={WAVE_ON_WOOD} vertical />
        </div>
        <div className="pf-lv b pf-abs pf-r" style={pos(562.4, 503, { "--h": 14, "--d": 2 })} aria-hidden="true" />
        <p className="pf-sm pf-center pf-abs pf-r" style={pos(520, 518.5, { "--w": 86, "--d": 2 })}>
          {cp.closedEnd}
        </p>

        <div className="pf-formula pf-abs pf-r" style={pos(516, 572, { "--w": 115, "--h": 57, "--d": 3 })}>
          <FormulaSpeed />
        </div>
        <p className="pf-body pf-abs pf-r" style={pos(516, 657, { "--d": 4 })}>
          <Lines lines={cp.definitions[0]} />
        </p>
        <p className="pf-body pf-abs pf-r" style={pos(516, 735, { "--d": 4 })}>
          <Lines lines={cp.definitions[1]} />
        </p>
        <p className="pf-body pf-abs pf-r" style={pos(516, 813, { "--d": 5 })}>
          <Lines lines={cp.definitions[2]} />
        </p>

        {/* ---------- RIGHT: how it affects the sound ---------- */}
        <h2 className="pf-h pf-abs pf-r" style={pos(767, 89, { "--d": 2 })}>
          {data.headingRight}
        </h2>
        <h3 className="pf-h pf-abs pf-r" style={pos(767, 180, { "--d": 3 })}>
          {sb.title}
        </h3>
        <h3 className="pf-h pf-abs pf-r" style={pos(1153, 180, { "--d": 3 })}>
          {sp.title}
        </h3>
        <p className="pf-body pf-abs pf-r" style={pos(767, 241, { "--d": 4 })}>
          <Lines lines={sb.text} />
        </p>
        <p className="pf-body pf-abs pf-r" style={pos(1153, 241, { "--d": 4 })}>
          <Lines lines={sp.text} />
        </p>

        {/* the three flutes, each with its blue wave running from the open end to the first open hole */}
        {sb.states.map((s, i: number) => (
          <div key={s.label} style={{ display: "contents" }}>
            <Crop src={s.img} ink={FLUTES[i].ink} alt={s.alt} className="pf-abs pf-r" style={pos(FLUTE.x, STATE_Y[i].flute, { "--w": FLUTE.w, "--h": fluteH, "--d": 4 + i })} />
            <div
              className="pf-wave pf-abs pf-wipe"
              style={pos(FLUTE.x + FLUTE.w * WAVE_X0, STATE_Y[i].flute + (fluteH - WAVE_H) / 2, {
                "--w": FLUTE.w * (FLUTES[i].first - WAVE_X0),
                "--h": WAVE_H,
                "--d": 6 + i,
              })}
              aria-hidden="true"
            >
              <Wave w={FLUTE.w * (FLUTES[i].first - WAVE_X0)} h={WAVE_H} n={WAVE_N.states[i]} color={WAVE_ON_DARK} />
            </div>
            <p className="pf-cap pf-abs pf-r" style={pos(FLUTE.x, STATE_Y[i].cap, { "--d": 5 + i })}>
              <span className="pf-block pf-cap-t">{s.label}</span>
              <span className="pf-block pf-cap-n">{s.note}</span>
            </p>
          </div>
        ))}

        {/* the pan flute pipes */}
        <Crop src={sp.render} ink={INK.panRender} className="pf-abs pf-r" alt={sp.alt} style={pos(1155, 318, { "--w": 195, "--h": 385, "--d": 4 })} />
        {PIPES.map((p, i: number) => (
          <div key={`a${i}`} style={{ display: "contents" }}>
            <div className="pf-dot pf-abs pf-r" style={pos(p.x - 0.6, p.top, { "--h": 730 - p.top, "--d": 6 + i * 0.5 })} aria-hidden="true" />
            <p className="pf-pitch pf-center pf-abs pf-r" style={pos(p.x - 30, 739, { "--w": 60, "--d": 6.5 + i * 0.5 })}>
              <Lines lines={sp.notes[i]} />
            </p>
          </div>
        ))}
        <div className="pf-lh l r big pf-abs pf-r" style={pos(1152, 810.4, { "--w": 200, "--d": 8 })} aria-hidden="true" />
        <p className="pf-sc pf-abs pf-r" style={pos(1152, 820, { "--d": 8 })}>
          <span className="pf-block pf-sc-t">{sp.left[0]}</span>
          <span className="pf-block pf-sc-n">{sp.left[1]}</span>
        </p>
        <p className="pf-sc pf-right pf-abs pf-r" style={pos(1232, 820, { "--w": 120, "--d": 8 })}>
          <span className="pf-block pf-sc-t">{sp.right[0]}</span>
          <span className="pf-block pf-sc-n">{sp.right[1]}</span>
        </p>
      </div>

      {/* =============================== STACKED (small screens) =============================== */}
      <div className="pf-m">
        <div className="pf-m-block pf-m-beige">
          <h2 className="pf-h">{data.headingLeft}</h2>

          <div className="pf-m-col">
            <h3 className="pf-h">{cb.title}</h3>
            <div className="pf-m-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pf-m-img pf-mul" src={cb.side} alt={cb.label} />
              <div
                className="pf-m-wave"
                style={{
                  left: `${(INK.bansuriSide.l + INK.bansuriSide.w * 0.016) * 100}%`,
                  width: `${INK.bansuriSide.w * 0.968 * 100}%`,
                  top: `${(INK.bansuriSide.t + INK.bansuriSide.h / 2) * 100}%`,
                  height: `${INK.bansuriSide.h * 0.88 * 100}%`,
                  transform: "translateY(-50%)",
                }}
                aria-hidden="true"
              >
                <Wave w={200} h={20} n={WAVE_N.bansuriDiagram} color={WAVE_ON_DARK} fluid />
              </div>
            </div>
            <p className="pf-m-ends">
              <span>{cb.openEnd.join(" ")}</span>
              <span>{cb.closedEnd}</span>
            </p>
            <p className="pf-body">{cb.closedTube}</p>
            <div className="pf-formula pf-m-formula">
              <FormulaSpeed />
            </div>
            <p className="pf-body">
              <Lines lines={cb.holeLines} />
            </p>
            <div className="pf-formula pf-m-formula">
              <FormulaLeff />
            </div>
            <p className="pf-body">{cb.correction}</p>
          </div>

          <div className="pf-m-col">
            <h3 className="pf-h">{cp.title}</h3>
            <p className="pf-m-ends pf-m-ends--c">
              <span>{cp.openEnd}</span>
            </p>
            <div className="pf-m-wrap pf-m-wrap--tube">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="pf-m-tube pf-mul" src={cp.tube} alt={cp.label} />
              <div
                className="pf-m-wave"
                style={{
                  left: `${(INK.panTube.l + INK.panTube.w * 0.0155) * 100}%`,
                  width: `${INK.panTube.w * 0.944 * 100}%`,
                  top: `${(INK.panTube.t + INK.panTube.h * 0.005) * 100}%`,
                  height: `${INK.panTube.h * 0.99 * 100}%`,
                }}
                aria-hidden="true"
              >
                <Wave w={20} h={200} n={WAVE_N.panTube} color={WAVE_ON_WOOD} vertical fluid />
              </div>
            </div>
            <p className="pf-m-ends pf-m-ends--c">
              <span>{cp.closedEnd}</span>
            </p>
            <div className="pf-formula pf-m-formula">
              <FormulaSpeed />
            </div>
            {cp.definitions.map((d: string[], i: number) => (
              <p key={i} className="pf-body">
                <Lines lines={d} />
              </p>
            ))}
          </div>
        </div>

        <div className="pf-m-block">
          <h2 className="pf-h">{data.headingRight}</h2>

          <div className="pf-m-col">
            <h3 className="pf-h">{sb.title}</h3>
            <p className="pf-body">{sb.text.join(" ")}</p>
            {sb.states.map((s, i: number) => (
              <figure key={s.label} className="pf-m-state">
                <div className="pf-m-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="pf-m-img" src={s.img} alt={s.alt} />
                  <div
                    className="pf-m-wave"
                    style={{
                      left: `${(FLUTES[i].ink.l + FLUTES[i].ink.w * WAVE_X0) * 100}%`,
                      width: `${FLUTES[i].ink.w * (FLUTES[i].first - WAVE_X0) * 100}%`,
                      top: `${(FLUTES[i].ink.t + FLUTES[i].ink.h / 2) * 100}%`,
                      height: `${FLUTES[i].ink.h * 0.8 * 100}%`,
                      transform: "translateY(-50%)",
                    }}
                    aria-hidden="true"
                  >
                    <Wave w={200} h={20} n={WAVE_N.states[i]} color={WAVE_ON_DARK} fluid />
                  </div>
                </div>
                <figcaption className="pf-cap">
                  <span className="pf-block pf-cap-t">{s.label}</span>
                  <span className="pf-block pf-cap-n">{s.note}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="pf-m-col">
            <h3 className="pf-h">{sp.title}</h3>
            <p className="pf-body">{sp.text.join(" ")}</p>
            <div className="pf-m-pan">
              <Crop src={sp.render} ink={INK.panRender} alt={sp.alt} className="pf-m-pancrop" style={{}} />
            </div>
            <p className="pf-m-notes">{sp.notes.map((n: string[]) => n.join("")).join("  ·  ")}</p>
            <p className="pf-sc">
              <span className="pf-block pf-sc-t">
                {sp.left[0]} → {sp.right[0]}
              </span>
              <span className="pf-block pf-sc-n">
                {sp.left[1]} → {sp.right[1]}
              </span>
            </p>
          </div>
        </div>
      </div>

      <noscript>
        <style>{`.pf-r{opacity:1!important;transform:none!important}.pf-wipe{clip-path:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pf-page { --u: 1px; }
.pf-block { display: block; }
.pf-center { text-align: center; }
.pf-right { text-align: right; }

.pf-h    { margin: 0; font-weight: 500; letter-spacing: 0; color: var(--pf-ink); }
.pf-body { margin: 0; font-weight: 400; letter-spacing: 0; color: var(--pf-grey); white-space: pre; }
.pf-sm   { margin: 0; font-weight: 400; letter-spacing: 0; color: var(--pf-ink); white-space: nowrap; }
.pf-cap  { margin: 0; white-space: nowrap; }
.pf-cap-t { font-weight: 400; color: var(--pf-ink); }
.pf-cap-n { font-weight: 400; color: var(--pf-grey); }
.pf-pitch { margin: 0; font-weight: 400; color: var(--pf-grey); white-space: nowrap; }
.pf-sc   { margin: 0; white-space: nowrap; }
.pf-sc-t { color: var(--pf-ink); }
.pf-sc-n { color: var(--pf-grey); }

.pf-img  { display: block; height: auto; max-width: none; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.pf-mul  { mix-blend-mode: multiply; }
.pf-crop { overflow: hidden; pointer-events: none; }
.pf-crop img { position: absolute; max-width: none; display: block; user-select: none; -webkit-user-drag: none; }

/* blue standing waves (vector) */
.pf-wave, .pf-m-wave { pointer-events: none; }
.pf-wave svg, .pf-m-wave svg { display: block; width: 100%; height: 100%; overflow: visible; }

/* typeset formulas */
.pf-formula { display: flex; align-items: center; justify-content: center; background: var(--pf-fbg); color: var(--pf-fink); }
.pf-math { font-family: "Times New Roman", "Cambria Math", Times, serif; display: inline-flex; align-items: center; gap: .28em; white-space: nowrap; font-size: 28px; line-height: 1; }
.pf-math i { font-style: italic; }
.pf-math sub { font-size: .62em; vertical-align: sub; line-height: 0; }
.pf-eq { font-style: normal; }
.pf-frac { display: inline-flex; flex-direction: column; align-items: center; font-size: .86em; line-height: 1.1; }
.pf-num { padding: 0 .2em .04em; border-bottom: 1px solid currentColor; }
.pf-den { padding-top: .04em; }

/* arrows & dotted pointers */
.pf-lv, .pf-lh, .pf-dot, .pf-ghost { position: absolute; pointer-events: none; }
.pf-lv, .pf-lh { --hw: 3; --hl: 6; background: var(--pf-ink); }
.pf-lv.big, .pf-lh.big { --hw: 3.5; --hl: 8; }
.pf-lv { width: calc(var(--u) * 1.2); height: calc(var(--u) * var(--h)); }
.pf-lh { height: calc(var(--u) * 1.2); width: calc(var(--u) * var(--w)); }
.pf-lv::before, .pf-lv::after, .pf-lh::before, .pf-lh::after { content: ""; position: absolute; width: 0; height: 0; display: none; }
.pf-lv.t::before { display: block; top: 0; left: 50%; transform: translateX(-50%); border-left: calc(var(--u) * var(--hw)) solid transparent; border-right: calc(var(--u) * var(--hw)) solid transparent; border-bottom: calc(var(--u) * var(--hl)) solid var(--pf-ink); }
.pf-lv.b::after  { display: block; bottom: 0; left: 50%; transform: translateX(-50%); border-left: calc(var(--u) * var(--hw)) solid transparent; border-right: calc(var(--u) * var(--hw)) solid transparent; border-top: calc(var(--u) * var(--hl)) solid var(--pf-ink); }
.pf-lh.l::before { display: block; left: 0; top: 50%; transform: translateY(-50%); border-top: calc(var(--u) * var(--hw)) solid transparent; border-bottom: calc(var(--u) * var(--hw)) solid transparent; border-right: calc(var(--u) * var(--hl)) solid var(--pf-ink); }
.pf-lh.r::after  { display: block; right: 0; top: 50%; transform: translateY(-50%); border-top: calc(var(--u) * var(--hw)) solid transparent; border-bottom: calc(var(--u) * var(--hw)) solid transparent; border-left: calc(var(--u) * var(--hl)) solid var(--pf-ink); }
.pf-dot {
  width: calc(var(--u) * 1.2); height: calc(var(--u) * var(--h));
  background-image: linear-gradient(var(--pf-ink) 50%, transparent 50%); background-size: 100% calc(var(--u) * 4);
}
.pf-dot::before { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: calc(var(--u) * 3) solid transparent; border-right: calc(var(--u) * 3) solid transparent; border-bottom: calc(var(--u) * 6) solid var(--pf-ink); }
.pf-ghost { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); border: 1px dashed #8d8d8d; border-left: 0; box-sizing: border-box; }

/* reveal */
.pf-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pf-r { opacity: 1; transform: none; }
/* the blue standing waves are drawn in after the rest */
.pf-wipe { clip-path: inset(0 100% 0 0); transition: clip-path 1.5s cubic-bezier(.77, 0, .18, 1); transition-delay: calc(var(--d, 0) * 110ms + 400ms); }
.pf-wipe--v { clip-path: inset(0 0 100% 0); }
.is-in .pf-wipe { clip-path: inset(-2px -2px -2px -2px); }
.is-in .pf-wipe--v { clip-path: inset(-2px -2px -2px -2px); }

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pf-page { scroll-snap-align: none; scroll-snap-stop: normal; padding-top: var(--header-h); }
  .pf-bg, .pf-stage { display: none; }

  .pf-h { font-size: 18px; line-height: 30px; }
  .pf-body { font-size: 16px; line-height: 26px; white-space: normal; }
  .pf-math { font-size: 26px; }
  .pf-cap { font-size: 14px; line-height: 21px; white-space: normal; }
  .pf-sc { font-size: 13px; line-height: 18px; white-space: normal; }

  .pf-m-block { padding: 40px 24px 56px; display: flex; flex-direction: column; gap: 36px; }
  .pf-m-beige { background: var(--pf-beige); }
  .pf-m-col { width: 100%; max-width: 34rem; display: flex; flex-direction: column; gap: 16px; }
  .pf-m-wrap { position: relative; display: block; width: 100%; }
  .pf-m-wrap--tube { width: fit-content; align-self: center; }
  .pf-m-wave { position: absolute; }
  .pf-m-img { width: 100%; height: auto; display: block; }
  .pf-m-ends { margin: 0; display: flex; justify-content: space-between; font-size: 14px; line-height: 17px; color: var(--pf-ink); }
  .pf-m-ends--c { justify-content: center; }
  .pf-m-tube { height: 200px; width: auto; display: block; }
  .pf-m-formula { padding: 8px 0; justify-content: flex-start; }
  .pf-m-state { margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .pf-m-pan { position: relative; width: 195px; height: 385px; align-self: center; }
  .pf-m-pancrop { position: relative; width: 100%; height: 100%; }
  .pf-m-notes { margin: 0; font-size: 16px; line-height: 26px; color: var(--pf-grey); }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pf-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pf-m { display: none; }
  .pf-bg { position: absolute; top: 0; bottom: 0; left: 0; right: 50%; background: var(--pf-beige); pointer-events: none; }
  .pf-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .pf-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pf-img, .pf-crop, .pf-wave, .pf-formula, .pf-ghost { width: calc(var(--u) * var(--w)); }
  .pf-crop, .pf-wave, .pf-formula { height: calc(var(--u) * var(--h)); }
  .pf-sm.pf-center, .pf-pitch, .pf-sc.pf-right { width: calc(var(--u) * var(--w)); }
  .pf-lv, .pf-lh { left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); }
  .pf-dot { left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); }
  .pf-ghost { height: calc(var(--u) * var(--h)); }
  .pf-img[style*="--h"] { height: calc(var(--u) * var(--h)); object-fit: fill; }

  /* type = her values × --u */
  .pf-h     { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pf-body  { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); }
  .pf-sm    { font-size: calc(var(--u) * 14); line-height: calc(var(--u) * 17); }
  .pf-cap   { font-size: calc(var(--u) * 14); line-height: calc(var(--u) * 21); }
  .pf-pitch { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); }
  .pf-sc    { font-size: calc(var(--u) * 13); line-height: calc(var(--u) * 18); }
  .pf-math  { font-size: calc(var(--u) * 28); }
}

@media (prefers-reduced-motion: reduce) {
  .pf-r, .pf-wipe { transition: none !important; }
  .pf-r { opacity: 1; transform: none; }
  .pf-wipe { clip-path: none; }
}
`;