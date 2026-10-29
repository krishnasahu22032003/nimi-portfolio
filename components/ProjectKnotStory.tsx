"use client";

/* components/ProjectKnotStory.tsx   (or src/components/…)
 *
 * Page 4 of project "two" — ONE photo (knot.jpg) + her text on top. Nothing else.
 *
 * The photo fills the whole section edge to edge (no side bars, no blur, no extension).
 * It is scaled to the page width and centred vertically, exactly like her 1440 × 900 artboard.
 * The text is placed relative to the PHOTO (x from the left edge, y from the photo's centre),
 * so it always sits on the same spot of the photo as in her reference.
 *
 *   • on a 1440 × 900 (16 : 10) screen  → identical to her reference, nothing cropped
 *   • on a wider window                 → the section is one screen high; the photo is shown full width
 *                                         and a little of its top / bottom edge is cut (centre stays)
 *
 * Measured from her reference page:
 *   • text left edge x = 935, first line centre y = 347  → box top 334
 *   • 18.6 px / 26 px, same as page 2
 *   • paragraph 1: semibold 600, #FFF8E3 at 80 %      • paragraph 2: regular 400, black solid
 *   • gap between paragraphs: 37 px line-centre to line-centre = 26 line + 11 margin
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk).
 * UNITS  1s = 1 Canva px = 100 % of the section width / 1440.
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { KnotStoryData } from "@/data/knotStory";

/* ------------------------------ TUNING ------------------------------ */
const SECTION_GAP = 96; //      px — white space between the collage page and this photo (mobile uses half)
const FADE_MS = 1200; //        text fade-in when the page scrolls into view
const TEXT_X = 935, TEXT_Y = 334; // top-left of the first line's box (centre of line 1 = y 347)
const TEXT_PX = 18.6, TEXT_LH = 26; // font-size / line-height
const PARA_GAP = 11; //         extra space between the two paragraphs (26 + 11 = her 37)

export default function ProjectKnotStory({ data }: { data: KnotStoryData }) {
  const { src, alt, intro, body } = data;
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  /* fade the text in once, when the page is ≥ 40 % on screen */
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
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const renderLines = (lines: string[]) =>
    lines.map((l, i) => (
      <span key={i} className="ks-line">
        {l}
        {i < lines.length - 1 ? " " : null}
      </span>
    ));

  return (
    /* "pd-page" → same snap behaviour as the other pages of the project */
    <section ref={ref} className="pd-page ks" aria-label="The knot at the centre of the backrest">
      <Image className="ks-img" src={src} alt={alt} fill sizes="100vw" quality={90} priority />

      <div className={`ks-text${seen ? " is-seen" : ""}`}>
        <p className="ks-intro">{renderLines(intro)}</p>
        <p className="ks-body">{renderLines(body)}</p>
      </div>

      <style>{`
        .ks {
          container-type: inline-size;
          --s: calc(100cqw / 1440);                  /* 1 Canva px */
          width: 100%;
          aspect-ratio: 1440 / 900;                  /* her artboard ratio … */
          max-height: max(100svh, 560px);            /* … but never taller than one screen */
          margin-top: ${SECTION_GAP}px;              /* white gap above (the page background is #fff) */
          background: #908776; overflow: hidden;
        }
        /* full width, centred vertically: the same crop rule as her artboard */
        .ks-img { object-fit: cover; object-position: center; }

        .ks-text {
          position: absolute;
          left: calc(${TEXT_X} * var(--s));
          top: calc(50% + (${TEXT_Y} - 450) * var(--s));   /* measured from the photo's centre line */
          font-size: calc(${TEXT_PX} * var(--s)); line-height: calc(${TEXT_LH} * var(--s));
          letter-spacing: 0;
          opacity: 0; transform: translateY(calc(8 * var(--s)));
          transition: opacity ${FADE_MS}ms cubic-bezier(.45, 0, .2, 1), transform ${FADE_MS}ms cubic-bezier(.45, 0, .2, 1);
        }
        .ks-text.is-seen { opacity: 1; transform: none; }
        .ks-text p { margin: 0; }
        .ks-intro { font-weight: 600; color: rgba(255, 248, 227, 0.8); margin-bottom: calc(${PARA_GAP} * var(--s)) !important; }
        .ks-body { font-weight: 400; color: #000; }
        .ks-line { display: block; white-space: nowrap; }

        /* ≤ 820px: photo on top, text on a dark warm panel underneath (cream text only — black would not be readable there) */
        @media (max-width: 820px) {
          .ks { aspect-ratio: auto; max-height: none; height: auto; margin-top: ${Math.round(SECTION_GAP / 2)}px; background: #2b2a26; overflow: visible; }
          .ks-img { position: relative !important; height: auto !important; aspect-ratio: 4 / 3; object-position: 30% center; }
          .ks-text {
            position: static; padding: 40px 20px 72px; max-width: 34rem; margin-inline: auto;
            font-size: 16px; line-height: 26px; opacity: 1; transform: none; transition: none;
          }
          .ks-intro { color: #fff8e3; margin-bottom: 20px !important; }
          .ks-body { color: rgba(255, 248, 227, 0.85); }
          .ks-line { display: inline; white-space: normal; }
        }
        @media (prefers-reduced-motion: reduce) { .ks-text { transition: none; opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}