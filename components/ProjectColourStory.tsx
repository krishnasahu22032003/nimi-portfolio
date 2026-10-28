"use client";

/* components/ProjectColourStory.tsx   (or src/components/…)
 *
 * Page 2 of project "two" — 2 × 2 tiles + text (Canva 1440 × 900 artboard).
 *
 * BEHAVIOUR — endless, random
 *   Once the section is on screen (≥ 40 %), the first change happens after FIRST_DELAY_MS (8 s, as before).
 *   From then on, ONE tile at a time flips between its two colours (1 ↔ 11, 2 ↔ 22, 3 ↔ 33, 4 ↔ 44),
 *   forever, at random moments (GAP_MIN_MS … GAP_MAX_MS between changes, ≈ 3 s on average like before).
 *   The ORDER is random too: every round all four tiles change once in a shuffled order, then the order is
 *   shuffled again — so no tile is ever left behind and the same tile never changes twice in a row.
 *   Speed of each colour change is unchanged: a soft 1.4 s cross-fade in the SAME spot.
 *   The loop pauses while the section is off screen or the browser tab is hidden (saves battery / CPU).
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk) — so it is automatically the site font.
 * Text size 18.6px: measured against her Canva lines (477–490 px wide on the 1440 artboard).
 *
 * UNITS  1u = 1 Canva px, scaled to fit the screen (exact at 1440 × 900).
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ColourStoryData } from "@/data/Colourstory ";

/* ------------------------------ TUNING ------------------------------ */
const FIRST_DELAY_MS = 6000; // section on screen → first change (unchanged)
const GAP_MIN_MS = 1500; //     shortest pause between two changes  (keep > FADE_MS so fades never overlap)
const GAP_MAX_MS = 2000; //     longest pause between two changes
const FADE_MS = 1000; //        length of the colour cross-fade (unchanged)

/* Canva geometry (px on the 1440 × 900 artboard) */
const GRID_X = 90, GRID_Y = 128, TILE = 322; // 2 × 2 tiles of 322 → 644 × 644
const TEXT_X = 833, TEXT_Y = 484; //            top of the first line's box (its centre sits at y = 497)
const TEXT_PX = 18.6, TEXT_LH = 26; //          font-size / line-height (also the blank line between paragraphs)

const randomGap = () => GAP_MIN_MS + Math.random() * (GAP_MAX_MS - GAP_MIN_MS);

export default function ProjectColourStory({ data }: { data: ColourStoryData }) {
  const { tiles, text } = data;
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [flipped, setFlipped] = useState<boolean[]>(() => tiles.map(() => false));
  const firstRef = useRef(true); // the 8 s wait only happens once
  const bagRef = useRef<number[]>([]); // tiles still to change in the current round
  const lastRef = useRef(-1); // the tile that changed last

  /* on / off screen */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* the endless random schedule */
  useEffect(() => {
    if (!inView) return;
    let timer = 0;

    /* shuffled rounds: every tile once per round, never the same tile twice in a row */
    const nextTile = () => {
      if (bagRef.current.length === 0) {
        const bag = tiles.map((_, i) => i);
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
        if (bag.length > 1 && bag[0] === lastRef.current) [bag[0], bag[1]] = [bag[1], bag[0]];
        bagRef.current = bag;
      }
      const t = bagRef.current.shift() as number;
      lastRef.current = t;
      return t;
    };

    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        firstRef.current = false;
        if (!document.hidden) {
          const t = nextTile();
          setFlipped((prev) => prev.map((v, i) => (i === t ? !v : v)));
        }
        schedule(randomGap());
      }, delay);
    };

    schedule(firstRef.current ? FIRST_DELAY_MS : randomGap());
    return () => window.clearTimeout(timer);
  }, [inView, tiles]);

  return (
    /* "pd-page" → same 100svh snap behaviour as the other pages of the project */
    <section ref={ref} className="pd-page cs" aria-label="The Easy Armchair">
      <div className="cs-canvas">
        <div className="cs-grid">
          {tiles.map((t, i) => (
            <div key={t.from} className={`cs-tile${flipped[i] ? " is-swapped" : ""}`}>
              <Image className="cs-img" src={t.from} alt={t.alt} fill sizes="(max-width: 820px) 50vw, 25vw" quality={90} loading="eager" />
              <Image className="cs-img cs-to" src={t.to} alt="" aria-hidden="true" fill sizes="(max-width: 820px) 50vw, 25vw" quality={90} loading="eager" />
            </div>
          ))}
        </div>

        <div className="cs-text">
          {text.map((lines, pi) => (
            <p key={pi}>
              {lines.map((l, li) => (
                <span key={li} className="cs-line">
                  {l}
                  {li < lines.length - 1 ? " " : null}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <style>{`
        .cs { container-type: inline-size; height: max(100svh, 560px); background: #fff; overflow: hidden; }
        .cs-canvas {
          --u: min(calc(100cqw / 1440), calc(max(100svh, 560px) / 900));
          position: absolute; left: 50%; top: 50%;
          width: calc(1440 * var(--u)); height: calc(900 * var(--u));
          transform: translate(-50%, -50%);
        }
        .cs-grid {
          position: absolute; left: calc(${GRID_X} * var(--u)); top: calc(${GRID_Y} * var(--u));
          width: calc(${TILE * 2} * var(--u)); height: calc(${TILE * 2} * var(--u));
          display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 0;
        }
        .cs-tile { position: relative; overflow: hidden; background: #efefef; }
        .cs-img { object-fit: cover; }
        .cs-to { opacity: 0; transition: opacity ${FADE_MS}ms cubic-bezier(.45, 0, .2, 1); }
        .cs-tile.is-swapped .cs-to { opacity: 1; }

        .cs-text {
          position: absolute; left: calc(${TEXT_X} * var(--u)); top: calc(${TEXT_Y} * var(--u));
          font-size: calc(${TEXT_PX} * var(--u)); line-height: calc(${TEXT_LH} * var(--u)); font-weight: 400; color: #000; letter-spacing: 0;
        }
        .cs-text p { margin: 0 0 calc(${TEXT_LH} * var(--u)); }
        .cs-text p:last-child { margin-bottom: 0; }
        .cs-line { display: block; white-space: nowrap; }

        /* ≤ 820px: tiles on top, text underneath, natural wrapping */
        @media (max-width: 820px) {
          .cs { height: auto; padding: 96px 16px 72px; }
          .cs-canvas { position: static; width: 100%; height: auto; transform: none; display: grid; gap: 32px; max-width: 34rem; margin-inline: auto; }
          .cs-grid { position: static; width: 100%; height: auto; aspect-ratio: 1; }
          .cs-text { position: static; font-size: 16px; line-height: 26px; }
          .cs-text p { margin-bottom: 26px; }
          .cs-line { display: inline; white-space: normal; }
        }
        @media (prefers-reduced-motion: reduce) { .cs-to { transition: none; } }
      `}</style>
    </section>
  );
}