"use client";

/* components/ProjectCollage.tsx   (or src/components/…)
 *
 * Page 3 of project "two" — the collage (Canva 1440 × 900 artboard).
 *   · beige panel  x 0 → 644, full height (it also runs to the screen's left edge on wide screens)
 *   · 4 chair cutouts + the sketch (55 % opacity); exact positions live in data/collage.ts
 *   · statement text (21 px, Familjen Grotesk, "Every / every / every" in white, key words semibold)
 *   · spec text (18.6 px) bottom centre
 *   · soft two-layer SHADOWS on the 4 chair photos (her note) — tune SHADOW_* below.
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk).
 * UNITS  1u = 1 Canva px, scaled to fit the screen (exact at 1440 × 900). The artboard sits on the BOTTOM edge,
 * so the two chairs that bleed off the bottom always touch the bottom of the screen.
 */
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import type { CollageData, CollageItem, Seg } from "../data/Collage ";

/* ------------------------------ TUNING ------------------------------ */
const BEIGE = "#E0D5C0"; //   same beige as the project cover
const PANEL_W = 644; //        Canva px
const INK = "#000";
/* her "add shadows" note: a tight contact shadow + a wide soft one (Canva px, warm brown, not grey) */
const SHADOW_TIGHT = "0 2 3 rgba(58, 36, 14, .26)"; //  x y blur colour
const SHADOW_SOFT = "0 16 22 rgba(58, 36, 14, .22)";
/* statement text */
const ST_X = 85, ST_TOP = 276.6, ST_PX = 21, ST_LH = 29;
/* spec text */
const SP_X = 670, SP_TOP = 823.6, SP_PX = 18.6, SP_LH = 23;

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const shadowCss = (s: string) => {
  const [x, y, b, ...c] = s.split(" ");
  return `drop-shadow(calc(${x} * var(--u)) calc(${y} * var(--u)) calc(${b} * var(--u)) ${c.join(" ")})`;
};
const FILTER = `${shadowCss(SHADOW_TIGHT)} ${shadowCss(SHADOW_SOFT)}`;

function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb: () => void) => {
      const mq = window.matchMedia("(max-width: 820px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 820px)").matches,
    () => false
  );
}

function Line({ segs }: { segs: Seg[] }) {
  if (segs.length === 0) return <span className="cl-line cl-blank">&nbsp;</span>;
  return (
    <span className="cl-line">
      {segs.map((s, i) => (
        <span key={i} className={`${s.b ? "cl-b" : ""}${s.white ? " cl-w" : ""}`}>{s.t}</span>
      ))}
    </span>
  );
}

function Photo({ it, sizes, priority }: { it: CollageItem; sizes: string; priority?: boolean }) {
  return (
    <Image
      src={it.src}
      alt={it.alt}
      fill
      sizes={sizes}
      quality={90}
      priority={priority}
      loading={priority ? undefined : "eager"}
      style={{ objectFit: "contain", transform: it.rotate ? `rotate(${it.rotate}deg)` : undefined }}
    />
  );
}

export default function ProjectCollage({ data }: { data: CollageData }) {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`pd-page cl${seen ? " is-in" : ""}`} aria-label="Every curve, every joint, every detail">
      {isMobile ? (
        <Mobile data={data} />
      ) : (
        <div className="cl-stage">
          <div className="cl-panel" aria-hidden="true" />
          <div className="cl-canvas">
            {data.items.map((it, i) => (
              <div
                key={it.id}
                className={`cl-item${it.shadow ? " cl-shadow" : ""}${it.clipRight ? " cl-clip" : ""}`}
                style={cssVars({ "--x": it.x, "--y": it.y, "--w": it.w, "--h": it.h, "--o": it.opacity ?? 1, "--d": i })}
              >
                <Photo it={it} sizes={`${Math.ceil((it.w / 1440) * 100)}vw`} />
              </div>
            ))}

            <div className="cl-text cl-statement" style={cssVars({ "--x": ST_X, "--y": ST_TOP })}>
              {data.statement.map((l, i) => <Line key={i} segs={l} />)}
            </div>
            <div className="cl-text cl-spec" style={cssVars({ "--x": SP_X, "--y": SP_TOP })}>
              {data.spec.map((l, i) => <span key={i} className="cl-line">{l}</span>)}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cl { container-type: inline-size; position: relative; height: max(100svh, 560px); background: #fff; overflow: hidden; color: ${INK}; }
        .cl-stage { position: absolute; inset: 0; }
        .cl-stage { --u: min(calc(100cqw / 1440), calc(max(100svh, 560px) / 900)); }

        /* beige panel: from the screen's left edge to the artboard's x = ${PANEL_W} */
        .cl-panel { position: absolute; left: 0; top: 0; bottom: 0; width: calc(50% - ${720 - PANEL_W} * var(--u)); background: ${BEIGE}; }

        /* the artboard — centred horizontally, sitting on the bottom edge */
        .cl-canvas { position: absolute; left: 50%; bottom: 0; width: calc(1440 * var(--u)); height: calc(900 * var(--u)); transform: translateX(-50%); overflow: hidden; }

        .cl-item {
          position: absolute; left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
          width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u));
          opacity: 0; transform: translate3d(0, calc(14 * var(--u)), 0);
          transition: opacity 1s cubic-bezier(.22, 1, .36, 1), transform 1.2s cubic-bezier(.22, 1, .36, 1);
          transition-delay: calc(var(--d) * 110ms + 100ms);
        }
        .cl-shadow { filter: ${FILTER}; }
        /* backrest: image AND its shadow stop exactly at the right edge (the beige | white seam) */
        .cl-clip { clip-path: inset(calc(-60 * var(--u)) 0 0 calc(-60 * var(--u))); }
        .is-in .cl-item { opacity: var(--o); transform: none; }

        .cl-text {
          position: absolute; left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
          font-weight: 400; letter-spacing: 0; color: ${INK}; font-synthesis: none;
          opacity: 0; transition: opacity 1s ease .5s;
        }
        .is-in .cl-text { opacity: 1; }
        .cl-statement { font-size: calc(${ST_PX} * var(--u)); line-height: calc(${ST_LH} * var(--u)); }
        .cl-spec { font-size: calc(${SP_PX} * var(--u)); line-height: calc(${SP_LH} * var(--u)); white-space: pre; }
        .cl-line { display: block; white-space: pre; }
        .cl-b { font-weight: 600; }
        .cl-w { color: #fff; }

        /* ------------------------------ mobile ------------------------------ */
        .cl-m { --u: 1px; }
        .cl-m-beige { background: ${BEIGE}; padding: 64px 16px 0; overflow: hidden; }
        .cl-m-top { position: relative; width: 78%; margin: 0 0 24px auto; filter: ${FILTER}; }
        .cl-m-statement { font-size: 19px; line-height: 27px; margin: 0 0 40px; }
        .cl-m-back { position: relative; width: 112%; margin-left: -6%; filter: ${FILTER}; margin-bottom: -6%; }
        .cl-m-white { padding: 56px 16px 72px; display: grid; gap: 32px; background: #fff; }
        .cl-m-sketch { position: relative; width: 78%; margin-inline: auto; opacity: .55; }
        .cl-m-side { position: relative; width: 74%; margin-inline: auto; filter: ${FILTER}; }
        .cl-m-bc { position: relative; width: 100%; filter: ${FILTER}; }
        .cl-m-spec { font-size: 16px; line-height: 23px; }
        .cl-m .cl-line { display: block; }

        @media (prefers-reduced-motion: reduce) {
          .cl-item, .cl-text { transition: none; opacity: 1; transform: none; }
          .cl-item { opacity: var(--o); }
        }
      `}</style>
    </section>
  );
}

/* ≤ 820px: the artboard is far too small to read, so the same pieces are stacked.
   Aspect ratios come from the data (w / h), so they can never drift from the images. */
function Mobile({ data }: { data: CollageData }) {
  const by = (id: string) => data.items.find((i) => i.id === id) as CollageItem;
  const ar = (it: CollageItem): CSSProperties => ({ aspectRatio: `${it.w} / ${it.h}` });
  const top = by("top"), back = by("backrest"), sketch = by("sketch"), side = by("side"), bc = by("back");
  return (
    <div className="cl-m">
      <div className="cl-m-beige">
        <div className="cl-m-top" style={ar(top)}><Photo it={top} sizes="80vw" /></div>
        <div className="cl-m-statement">{data.statement.map((l, i) => <Line key={i} segs={l} />)}</div>
        <div className="cl-m-back" style={ar(back)}><Photo it={back} sizes="115vw" /></div>
      </div>
      <div className="cl-m-white">
        <div className="cl-m-sketch" style={ar(sketch)}><Photo it={sketch} sizes="80vw" /></div>
        <div className="cl-m-side" style={ar(side)}><Photo it={side} sizes="75vw" /></div>
        <div className="cl-m-bc" style={ar(bc)}><Photo it={bc} sizes="100vw" /></div>
        <div className="cl-m-spec">{data.spec.map((l, i) => <span key={i} className="cl-line">{l}</span>)}</div>
      </div>
    </div>
  );
}