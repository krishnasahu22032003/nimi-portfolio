"use client";
/* components/ProjectMaterialExploration.tsx   (or src/components/ProjectMaterialExploration.tsx)
 *
 * Project three · page 6 — MATERIAL EXPLORATION. Built from her 1440 × 900 Canva pages (pg 73 + one page per material).
 *
 * THE INTERACTION
 *   Six material tiles on the right. Hover one (or focus / tap it) → the left side cross-fades to that
 *   material (name, tagline and the three rows: acoustic, making & form, object experience) and every
 *   OTHER tile dims to 30 %. The active tile is always full colour. When the cursor leaves the grid the
 *   last material stays selected (the page never goes blank). Bamboo is active on load.
 *
 * CLIENT CHANGES IN THIS VERSION
 *   1. The numbers 1–6 around the tiles are removed.
 *   2. Aluminium tile: image is zoomed slightly (object-fit: cover + small scale) so the gap at the top/bottom is gone.
 *   3. "Hover over a material to learn more." now shows on ALL six materials (it is no longer Bamboo-only).
 *   4. Carbon-fibre tile: the pipes are fitted inside the frame so the top pipe is no longer cut (like the PVC tile).
 *   5. The hint has a gentle attention animation (soft copper sheen sweep + tiny nudge, every few seconds).
 *      It calms down for good as soon as the visitor hovers / taps any material.
 *   6. The hint now has the hand-drawn orange underline (/public/nav-underline.png, 800 × 28) ALWAYS visible,
 *      exactly the width of the text (it is attached to the text's own wrapper).
 *
 * Design values (px):  title + row headings ..... 18 Medium #000 (uppercase)
 *                      material name ............ 22 Medium #000 (uppercase)
 *                      hint, taglines, row subs . 16 Regular #404040, 26 line
 *                      captions ................. 16 Regular #000, 26 line
 *                      tiles .................... 195 × 195, radius 18
 *
 * Do NOT put opacity / transform / filter on .pm-page or .pm-stage.
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Ink, DotsSpec, MaterialExplorationData, MaterialItem } from "../data/materialExploration.";

const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const COLOR_INK = "#000";
const COLOR_GREY = "#404040";
const COLOR_LINE = "#ECE6DA"; // the faint beige dividers on her page
const COLOR_ACCENT = "#B5735A"; // copper — same family as her hand-drawn icons (used for the hint sheen)
const TILE_DIM = 0.3; // opacity of the tiles that are NOT active
const TILE_RADIUS = 18;

/* tile image tweaks (per material id) */
const ALUMINIUM_ZOOM = 1.06; // >1 zooms the aluminium photo in so it fills the frame (raise to 1.1 for a tighter crop)
const CARBON_FIT = 0.86; // <1 shrinks the carbon-fibre pipes inside the frame so nothing is cut (1 = touching the edges)

/* hint animation timing */
const HINT_START = "1.6s"; // wait after the page appears before the first sheen
const HINT_CYCLE = "4.2s"; // one sheen + nudge, then a rest, then repeat

/* hint underline: distance (design px) from the bottom of the text line to the bottom of the underline.
   Bigger negative number = the line sits lower. */
const HINT_UL_OFFSET = -6;

/* the five circles inside each of her dots PNGs: centres as fractions of the file; `size` = file width in design px.
   (all her dots files share the same circle positions) */
const DOTS = {
  size: 167.7,
  cell: { w: 34.2, h: 28 },
  cx: [0.0947, 0.2987, 0.5072, 0.7101, 0.9203],
  cy: [0.58, 0.576, 0.576, 0.574, 0.579],
};

/* her Canva coordinates (px on the 1440 × 900 page) — the parts that never change between materials */
const GEO = {
  title: { x: 90, y: 89 },
  hint: { x: 90, y: 123 },
  name: { x: 90, y: 182 },
  tagline: { x: 90, y: 213 },
  rowLines: [258, 437, 622],
  rowLine: { x: 90, w: 752 },
  divider: { x: 382, y: 258, h: 552 },
  rows: [
    { head: { x: 90, y: 316 }, sub: { x: 90, y: 354 } },
    { head: { x: 90, y: 499 }, sub: { x: 90, y: 537 } },
    { head: { x: 90, y: 680 }, sub: { x: 90, y: 718 } },
  ],
  waveCap: { x: 491, y: 365 },
  formCap: { x: 491, y: 548 },
  dotsCapY: 718,
  tile: 195,
  tiles: [
    { x: 888, y: 157 },
    { x: 1117, y: 157 },
    { x: 888, y: 386 },
    { x: 1117, y: 386 },
    { x: 888, y: 615 },
    { x: 1117, y: 615 },
  ],
} as const;

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const at = (x: number, y: number, extra: Record<string, string | number> = {}) => cssVars({ "--x": x, "--y": y, ...extra });
const du = (n: number) => `calc(var(--u) * ${n.toFixed(3)})`;

/* extra class for the tile photo of a given material */
const tileImgClass = (id: string) => (id === "aluminium" ? "pm-img-zoom" : id === "carbon" ? "pm-img-fit" : "");
const tileClass = (id: string, on: boolean) => `pm-tile${on ? " on" : ""}${id === "carbon" ? " pm-tile--fit" : ""}`;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((l: string, i: number) => (
        <span key={i} className="pm-block">
          {l}
        </span>
      ))}
    </>
  );
}

/* a PNG cropped to its drawing; the box keeps the drawing's aspect ratio */
function Crop({ src, ink, w, className = "", style }: { src: string; ink: Ink; w: number; className?: string; style?: CSSProperties }) {
  const h = (w * ink.h) / ink.w;
  return (
    <div className={`pm-crop ${className}`} style={{ ...style, ...cssVars({ "--w": w, "--h": h }) }} aria-hidden="true">
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

/* five hand-drawn dots, cut out of her own PNG one circle at a time (`pick` = which circle of the file, left → right) */
function Dots({ spec, className = "", style }: { spec: DotsSpec; className?: string; style?: CSSProperties }) {
  const size = spec.size ?? DOTS.size;
  const k = size / DOTS.size;
  const cw = DOTS.cell.w * k;
  const ch = DOTS.cell.h * k;
  return (
    <div className={`pm-dots ${className}`} style={{ ...style, ...cssVars({ "--cw": cw, "--ch": ch }) }} aria-hidden="true">
      {spec.pick.map((c: number, i: number) => (
        <span key={i} className="pm-dot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={spec.src}
            alt=""
            draggable={false}
            decoding="async"
            style={{
              width: du(size),
              height: du(size),
              left: du(cw / 2 - DOTS.cx[c] * size),
              top: du(ch / 2 - DOTS.cy[c] * size),
            }}
          />
        </span>
      ))}
    </div>
  );
}

export default function ProjectMaterialExploration({ data }: { data: MaterialExplorationData }) {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [hinted, setHinted] = useState(false); // becomes true after the first hover / tap → the hint stops animating

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

  const { materials, rows } = data;
  const cur = materials[active];

  const pick = (i: number) => () => {
    setActive(i);
    setHinted(true);
  };
  const hover = (i: number) => (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") {
      setActive(i);
      setHinted(true);
    }
  };

  const hintCls = `pm-hint${hinted ? "" : " is-live"}`;

  return (
    <section
      ref={rootRef}
      className={`pd-page pm-page ${grotesk.className}`}
      aria-label="Echo Pan — material exploration"
      style={cssVars({
        "--pm-ink": COLOR_INK,
        "--pm-grey": COLOR_GREY,
        "--pm-line": COLOR_LINE,
        "--pm-accent": COLOR_ACCENT,
        "--pm-dim": TILE_DIM,
        "--pm-r": TILE_RADIUS,
        "--pm-al-zoom": ALUMINIUM_ZOOM,
        "--pm-carbon-fit": CARBON_FIT,
        "--pm-hint-start": HINT_START,
        "--pm-hint-cycle": HINT_CYCLE,
        "--pm-ul-offset": HINT_UL_OFFSET,
      })}
    >
      <p className="pm-sr" aria-live="polite">
        {cur.name}. {cur.tagline}. {[...cur.acoustic.caption, ...cur.form.caption, ...cur.object.caption].join(" ")}
      </p>

      {/* =============================== DESKTOP (her 1440 × 900 page) =============================== */}
      <div className="pm-stage">
        <h2 className="pm-title pm-abs pm-r" style={at(GEO.title.x, GEO.title.y, { "--d": 0 })}>
          {data.heading}
        </h2>

        {/* the hint: visible for EVERY material, orange hand-drawn underline always on, gentle attention animation until the first hover */}
        <p className="pm-sub pm-abs pm-r" style={at(GEO.hint.x, GEO.hint.y, { "--d": 1 })}>
          <span className={hintCls}>
            {data.hint}
            <span className="pm-ul" aria-hidden="true" />
          </span>
        </p>

        {/* fixed structure: lines + the three row headings (never change) */}
        {GEO.rowLines.map((y: number) => (
          <div key={y} className="pm-hl pm-abs pm-r" style={at(GEO.rowLine.x, y, { "--w": GEO.rowLine.w, "--d": 2 })} aria-hidden="true" />
        ))}
        <div className="pm-vl pm-abs pm-r" style={at(GEO.divider.x, GEO.divider.y, { "--h": GEO.divider.h, "--d": 2 })} aria-hidden="true" />
        {rows.map((r, i: number) => (
          <div key={r.title} style={{ display: "contents" }}>
            <h3 className="pm-rowh pm-abs pm-r" style={at(GEO.rows[i].head.x, GEO.rows[i].head.y, { "--d": 2 + i })}>
              {r.title}
            </h3>
            <p className="pm-sub pm-abs pm-r" style={at(GEO.rows[i].sub.x, GEO.rows[i].sub.y, { "--d": 2 + i })}>
              {r.sub}
            </p>
          </div>
        ))}

        {/* the part that changes: one layer per material, cross-faded */}
        {materials.map((m: MaterialItem, i: number) => (
          <div key={m.id} className={`pm-layer${i === active ? " on" : ""}`} aria-hidden={i !== active}>
            <h3 className="pm-name pm-abs" style={at(GEO.name.x, GEO.name.y)}>
              {m.name}
            </h3>
            <p className="pm-sub pm-abs" style={at(GEO.tagline.x, GEO.tagline.y)}>
              {m.tagline}
            </p>

            <Crop src={m.acoustic.wave.src} ink={m.acoustic.wave.ink} w={m.acoustic.wave.w} className="pm-abs" style={at(m.acoustic.wave.x, m.acoustic.wave.y)} />
            <p className="pm-cap pm-abs" style={at(GEO.waveCap.x, GEO.waveCap.y)}>
              <Lines lines={m.acoustic.caption} />
            </p>

            <Crop src={m.form.form.src} ink={m.form.form.ink} w={m.form.form.w} className="pm-abs" style={at(m.form.form.x, m.form.form.y)} />
            <p className="pm-cap pm-abs" style={at(GEO.formCap.x, GEO.formCap.y)}>
              <Lines lines={m.form.caption} />
            </p>

            <Dots spec={m.object.dots} className="pm-abs" style={at(m.object.dots.x, m.object.dots.y)} />
            <p className="pm-cap pm-abs" style={at(m.object.capX, GEO.dotsCapY)}>
              <Lines lines={m.object.caption} />
            </p>
          </div>
        ))}

        {/* tiles (no numbers any more) */}
        <div role="group" aria-label="Materials" style={{ display: "contents" }}>
          {materials.map((m: MaterialItem, i: number) => (
            <div key={m.id} className="pm-slot pm-abs pm-r" style={at(GEO.tiles[i].x, GEO.tiles[i].y, { "--w": GEO.tile, "--h": GEO.tile, "--d": 3 + i * 0.5 })}>
              <button
                type="button"
                className={tileClass(m.id, i === active)}
                aria-label={m.name}
                aria-pressed={i === active}
                onPointerEnter={hover(i)}
                onFocus={pick(i)}
                onClick={pick(i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt={m.alt} draggable={false} decoding="async" className={tileImgClass(m.id)} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* =============================== STACKED (small screens) =============================== */}
      <div className="pm-m">
        <h2 className="pm-title">{data.heading}</h2>
        <p className="pm-sub">
          <span className={hintCls}>
            {data.hint}
            <span className="pm-ul" aria-hidden="true" />
          </span>
        </p>

        <div className="pm-m-grid" role="group" aria-label="Materials">
          {materials.map((m: MaterialItem, i: number) => (
            <div key={m.id} className="pm-m-cell">
              <button type="button" className={tileClass(m.id, i === active)} aria-label={m.name} aria-pressed={i === active} onClick={pick(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt={m.alt} draggable={false} decoding="async" className={tileImgClass(m.id)} />
              </button>
            </div>
          ))}
        </div>

        <div key={cur.id} className="pm-m-panel">
          <div>
            <h3 className="pm-name">{cur.name}</h3>
            <p className="pm-sub">{cur.tagline}</p>
          </div>

          <div className="pm-m-row">
            <h4 className="pm-rowh">{rows[0].title}</h4>
            <p className="pm-sub">{rows[0].sub}</p>
            <Crop src={cur.acoustic.wave.src} ink={cur.acoustic.wave.ink} w={cur.acoustic.wave.w} />
            <p className="pm-cap">{cur.acoustic.caption.join(" ")}</p>
          </div>
          <div className="pm-m-row">
            <h4 className="pm-rowh">{rows[1].title}</h4>
            <p className="pm-sub">{rows[1].sub}</p>
            <Crop src={cur.form.form.src} ink={cur.form.form.ink} w={cur.form.form.w} />
            <p className="pm-cap">{cur.form.caption.join(" ")}</p>
          </div>
          <div className="pm-m-row">
            <h4 className="pm-rowh">{rows[2].title}</h4>
            <p className="pm-sub">{rows[2].sub}</p>
            <Dots spec={cur.object.dots} />
            <p className="pm-cap">{cur.object.caption.join(" ")}</p>
          </div>
        </div>
      </div>

      <noscript>
        <style>{`.pm-r{opacity:1!important;transform:none!important}.pm-layer.on{opacity:1!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
/* ===================== shared ===================== */
.pm-page { --u: 1px; background: #fff; }
.pm-block { display: block; white-space: nowrap; }
.pm-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.pm-title, .pm-name, .pm-rowh, .pm-sub, .pm-cap { margin: 0; letter-spacing: 0; }
.pm-title, .pm-rowh { font-weight: 500; color: var(--pm-ink); text-transform: uppercase; }
.pm-name { font-weight: 500; color: var(--pm-ink); text-transform: uppercase; }
.pm-sub { font-weight: 400; color: var(--pm-grey); }
.pm-cap { font-weight: 400; color: var(--pm-ink); }

.pm-crop { position: relative; overflow: hidden; pointer-events: none; width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }
.pm-crop img, .pm-dot img { position: absolute; display: block; max-width: none; user-select: none; -webkit-user-drag: none; }

.pm-dots { display: flex; pointer-events: none; }
.pm-dot { position: relative; flex: none; overflow: hidden; width: calc(var(--u) * var(--cw)); height: calc(var(--u) * var(--ch)); }

.pm-hl { height: 1px; background: var(--pm-line); width: calc(var(--u) * var(--w)); }
.pm-vl { width: 1px; background: var(--pm-line); height: calc(var(--u) * var(--h)); }

/* tiles */
.pm-tile {
  display: block; width: 100%; height: 100%; padding: 0; border: 0; margin: 0; cursor: pointer;
  background: #efefef; overflow: hidden; border-radius: calc(var(--u) * var(--pm-r));
  opacity: var(--pm-dim); transition: opacity .45s ease;
  -webkit-tap-highlight-color: transparent;
}
.pm-tile.on { opacity: 1; }
.pm-tile img { display: block; width: 100%; height: 100%; object-fit: cover; user-select: none; -webkit-user-drag: none; }

/* Aluminium: fill the whole frame (no gap top / bottom) by zooming in slightly */
.pm-tile img.pm-img-zoom {
  object-fit: cover;
  object-position: center;
  transform: scale(var(--pm-al-zoom));
  transform-origin: 50% 50%;
}
/* Carbon fibre: show every pipe fully inside the frame (nothing touches / is cut by the edge) */
.pm-tile--fit { background: #fff; }
.pm-tile img.pm-img-fit {
  object-fit: contain;
  object-position: center;
  transform: scale(var(--pm-carbon-fit));
  transform-origin: 50% 50%;
}
.pm-tile:focus-visible { outline: 2px solid var(--pm-ink); outline-offset: 3px; }

/* reveal */
.pm-r {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 110ms + 100ms);
}
.is-in .pm-r { opacity: 1; transform: none; }

/* the changing content: one layer per material, cross-faded */
.pm-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: none;
}
.is-in .pm-layer.on { opacity: 1; }

/* ---------- hint: the text hugs its own box, so the underline below is EXACTLY as wide as the text ---------- */
.pm-hint { display: inline-block; position: relative; }

/* hand-drawn orange underline (client artwork, /public/nav-underline.png, 800 x 28) — always visible, no hover */
.pm-ul {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(var(--u) * var(--pm-ul-offset));
  aspect-ratio: 800 / 28;
  background-image: url('/nav-underline.png');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
}

/* soft copper sheen sweeps across the text + a tiny nudge, then rests, then repeats */
.pm-hint.is-live {
  background-image: linear-gradient(100deg, var(--pm-grey) 0%, var(--pm-grey) 38%, var(--pm-accent) 50%, var(--pm-grey) 62%, var(--pm-grey) 100%);
  background-size: 260% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation:
    pm-hint-sheen var(--pm-hint-cycle) ease-in-out var(--pm-hint-start) infinite,
    pm-hint-nudge var(--pm-hint-cycle) ease-in-out var(--pm-hint-start) infinite;
}
@keyframes pm-hint-sheen {
  0%   { background-position: 100% 0; }
  45%  { background-position: 0% 0; }
  100% { background-position: 0% 0; }
}
@keyframes pm-hint-nudge {
  0%, 46%  { transform: translateX(0); }
  52%      { transform: translateX(5px); }
  58%      { transform: translateX(-4px); }
  64%      { transform: translateX(3px); }
  70%      { transform: translateX(-2px); }
  76%, 100% { transform: translateX(0); }
}

/* ===================== STACKED (<1100px wide or <640px tall) ===================== */
@media (max-width: 1099.98px), (max-height: 639.98px) {
  .pm-page { scroll-snap-align: none; scroll-snap-stop: normal; padding: calc(var(--header-h) + 24px) 24px 72px; }
  .pm-stage { display: none; }
  .pm-m { width: 100%; max-width: 34rem; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }

  .pm-title { font-size: 18px; line-height: 30px; }
  .pm-name { font-size: 22px; line-height: 30px; }
  .pm-rowh { font-size: 18px; line-height: 30px; }
  .pm-sub, .pm-cap { font-size: 16px; line-height: 26px; }

  .pm-m-grid { margin: 24px 0 36px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .pm-m-cell { position: relative; aspect-ratio: 1; }
  .pm-m-panel { display: flex; flex-direction: column; gap: 28px; animation: pm-in .5s ease both; }
  .pm-m-row { display: flex; flex-direction: column; gap: 4px; padding-top: 20px; border-top: 1px solid var(--pm-line); }
  .pm-m-row .pm-crop, .pm-m-row .pm-dots { margin: 16px 0 8px; }
  @keyframes pm-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
}

/* ===================== DESKTOP: her 1440 × 900 composition, scaled to fit one screen ===================== */
@media (min-width: 1100px) and (min-height: 640px) {
  .pm-page {
    --u: min(1px, calc(100cqw / 1440), calc(var(--page-h) / 900));
    height: var(--page-h);
    display: grid; place-items: center;
    scroll-snap-align: start; scroll-snap-stop: always;
  }
  .pm-m { display: none; }
  .pm-stage { position: relative; width: calc(var(--u) * 1440); height: calc(var(--u) * 900); }

  .pm-abs { position: absolute; left: calc(var(--u) * var(--x)); top: calc(var(--u) * var(--y)); margin: 0; }
  .pm-slot { width: calc(var(--u) * var(--w)); height: calc(var(--u) * var(--h)); }

  .pm-title { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pm-rowh  { font-size: calc(var(--u) * 18); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pm-name  { font-size: calc(var(--u) * 22); line-height: calc(var(--u) * 30); white-space: nowrap; }
  .pm-sub   { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); white-space: nowrap; }
  .pm-cap   { font-size: calc(var(--u) * 16); line-height: calc(var(--u) * 26); white-space: nowrap; }
}

@media (prefers-reduced-motion: reduce) {
  .pm-r, .pm-layer, .pm-tile, .pm-m-panel { transition: none !important; animation: none !important; }
  .pm-r { opacity: 1; transform: none; }
  .pm-hint.is-live { animation: none !important; background: none; -webkit-text-fill-color: currentColor; }
}
`;