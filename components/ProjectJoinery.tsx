"use client";

/* components/ProjectJoinery.tsx   (or src/components/…)
 *
 * Page 6 of project "two" — three photos over a beige | white | cream background + three numbered notes
 * (Canva 1440 × 900 artboard), measured from her clean reference page:
 *   · beige  #E0D5C0  x 0 → 644      · white  x 644 → 918      · cream  #F2ECE1  x 918 → 1440
 *   · beige runs to the screen's left edge and cream to the right edge on wide screens (like the collage page)
 *   · photos: exact boxes + crops in data/joinery.ts (the box-joint photo sits on top of the two left ones)
 *   · text: 16 px regular / 22 px line height, black, bold words medium (500), left edge x = 1014.5,
 *           blocks at y = 87 · 373 · 659 → "01" line, blank line, paragraph(s)
 *   · her black boxes were only a guide for the empty space → NOT built
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk, weights 400 / 500 / 600 are loaded there).
 * UNITS  1u = 1 Canva px, scaled to fit the screen (exact at 1440 × 900). The artboard sits on the BOTTOM edge,
 * same as the collage and "behind the scene" pages.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { JoineryData, JoineryItem, JoineryPhoto, Seg } from "@/data/joinery";

/* ------------------------------ TUNING ------------------------------ */
const SECTION_GAP = 96; //        px — white space between the previous page and this one (mobile uses half)
const BEIGE = "#E0D5C0"; //       her colour code (left band)
const CREAM = "#F2ECE1"; //       her colour code (right band)
const LEFT_W = 644; //            Canva px — where beige ends
const RIGHT_X = 918; //           Canva px — where cream starts
const NOTE_X = 1014.5; //         Canva px — left edge of the text
const TEXT_PX = 16, TEXT_LH = 22; // font-size / line-height (also the blank line between blocks)
const BOLD = 500; //              weight of the bold words

const cssVars = (v: Record<string, string | number>): CSSProperties => v as unknown as CSSProperties;
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

function Para({ lines }: { lines: Seg[][] }) {
  return (
    <p className="jn-p">
      {lines.map((segs, i) => (
        <span key={i} className="jn-line">
          {segs.map((s, j) =>
            s.b ? (
              <strong key={j} className="jn-b">{s.t}</strong>
            ) : (
              <span key={j}>{s.t}</span>
            )
          )}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </p>
  );
}

function Photo({ p }: { p: JoineryPhoto }) {
  const c = p.crop;
  /* the crop is stored in %, so it stays exact on the artboard AND on the mobile stack */
  const inner: CSSProperties = c
    ? { left: pct(c.left, p.w), top: pct(c.top, p.h), width: pct(c.w, p.w), height: pct(c.h, p.h) }
    : { left: 0, top: 0, width: "100%", height: "100%" };
  return (
    <div className="jn-crop" style={inner}>
      <Image src={p.src} alt={p.alt} fill sizes="(max-width: 820px) 100vw, 40vw" quality={90} loading="eager" style={{ objectFit: "cover" }} />
    </div>
  );
}

export default function ProjectJoinery({ data }: { data: JoineryData }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  /* reveal once, when the page is ≥ 30 % on screen */
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
    /* "pd-page" → same snap behaviour as the other pages of the project */
    <section ref={ref} className={`pd-page jn${seen ? " is-in" : ""}`} aria-label="The details: armrest, box joint and compass legs">
      <div className="jn-stage">
        <div className="jn-band jn-beige" aria-hidden="true" />
        <div className="jn-band jn-cream" aria-hidden="true" />

        <div className="jn-canvas">
          {data.items.map((it: JoineryItem, i: number) => (
            <Fragment3 key={it.n} it={it} i={i} />
          ))}
        </div>
      </div>

      <style>{`
        .jn {
          container-type: inline-size; position: relative; height: max(100svh, 560px);
          margin-top: ${SECTION_GAP}px;            /* white gap above (the page background is #fff) */
          background: #fff; overflow: hidden; color: #000;
        }
        .jn-stage { position: absolute; inset: 0; --u: min(calc(100cqw / 1440), calc(max(100svh, 560px) / 900)); }

        /* the two colour bands: beige reaches the screen's left edge, cream the right edge */
        .jn-band { position: absolute; top: 0; bottom: 0; }
        .jn-beige { left: 0; width: calc(50% - ${720 - LEFT_W} * var(--u)); background: ${BEIGE}; }
        .jn-cream { right: 0; left: calc(50% + ${RIGHT_X - 720} * var(--u)); background: ${CREAM}; }

        /* the artboard — centred horizontally, sitting on the bottom edge */
        .jn-canvas { position: absolute; left: 50%; bottom: 0; width: calc(1440 * var(--u)); height: calc(900 * var(--u)); transform: translateX(-50%); overflow: hidden; }

        .jn-item {
          position: absolute; left: calc(var(--x) * var(--u)); top: calc(var(--y) * var(--u));
          margin: 0; letter-spacing: 0; font-synthesis: none;
          opacity: 0; transform: translate3d(0, calc(14 * var(--u)), 0);
          transition: opacity 1s cubic-bezier(.22, 1, .36, 1), transform 1.2s cubic-bezier(.22, 1, .36, 1);
          transition-delay: calc(var(--d) * 120ms + 100ms);
        }
        .is-in .jn-item { opacity: 1; transform: none; }

        .jn-ph { width: calc(var(--w) * var(--u)); height: calc(var(--h) * var(--u)); overflow: hidden; z-index: var(--z, 1); background: #d8cdb9; }
        .jn-crop { position: absolute; }

        .jn-note { font-size: calc(${TEXT_PX} * var(--u)); line-height: calc(${TEXT_LH} * var(--u)); font-weight: 400; color: #000; }
        .jn-n, .jn-p { margin: 0 0 calc(${TEXT_LH} * var(--u)); }
        .jn-note > :last-child { margin-bottom: 0; }
        .jn-line { display: block; white-space: nowrap; }
        .jn-b { font-weight: ${BOLD}; }

        /* ------------------------------ ≤ 820px: stacked, each photo above its note ------------------------------ */
        @media (max-width: 820px) {
          .jn { height: auto; margin-top: ${Math.round(SECTION_GAP / 2)}px; overflow: visible; background: ${CREAM}; }
          .jn-stage { position: static; }
          .jn-band { display: none; }
          .jn-canvas {
            position: static; width: auto; height: auto; transform: none; overflow: visible;
            display: flex; flex-direction: column; max-width: 34rem; margin-inline: auto; padding: 48px 16px 40px;
          }
          .jn-item { position: static; opacity: 1; transform: none; transition: none; order: var(--ord, 0); }
          .jn-ph { position: relative; width: 100%; height: auto; aspect-ratio: calc(var(--w) / var(--h)); margin-bottom: 20px; }
          .jn-note { font-size: 16px; line-height: 24px; margin-bottom: 48px; }
          .jn-n, .jn-p { margin-bottom: 24px; }
          .jn-line { display: inline; white-space: normal; }
        }
        @media (prefers-reduced-motion: reduce) { .jn-item { transition: none; opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}

/* one photo + its note (kept as two siblings so the photo can overlap the bands and the other photos) */
function Fragment3({ it, i }: { it: JoineryItem; i: number }) {
  const p = it.photo;
  return (
    <>
      <div
        className="jn-item jn-ph"
        style={cssVars({ "--x": p.x, "--y": p.y, "--w": p.w, "--h": p.h, "--z": p.z, "--d": p.d, "--ord": i * 2 + 1 })}
      >
        <Photo p={p} />
      </div>
      <div className="jn-item jn-note" style={cssVars({ "--x": NOTE_X, "--y": it.noteY, "--d": 3 + i, "--ord": i * 2 + 2 })}>
        <p className="jn-n">{it.n}</p>
        {it.paragraphs.map((lines, k) => (
          <Para key={k} lines={lines} />
        ))}
      </div>
    </>
  );
}