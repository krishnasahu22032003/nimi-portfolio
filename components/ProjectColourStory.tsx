"use client";

/* components/ProjectColourStory.tsx   (or src/components/…)
 *
 * Page 2 of project "two" — 2 × 2 tiles + text (Canva 1440 × 900 artboard).
 *
 * BEHAVIOUR  (clock starts when the section is ~40 % on screen)
 *     +8 s  tile 2 → 22
 *     +3 s  tile 3 → 33
 *     +3 s  tile 4 → 44
 *     +3 s  tile 1 → 11
 *   Each swap is a soft cross-fade in the SAME spot — same chair, same placement, only the colour changes.
 *   Change ORDER / the timings below; RANDOM_ORDER = true shuffles the order on every visit.
 *
 * Font: inherited from ProjectDetail's <main> (Familjen Grotesk) — so it is automatically the site font.
 * Text size 18.6px: measured — her longest lines are 477–490 px wide on the 1440 artboard, which is exactly
 * what Familjen Grotesk Regular gives at 18.6px.
 *
 * UNITS  1u = 1 Canva px, scaled to fit the screen (exact at 1440 × 900).
 */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ColourStoryData } from "@/data/Colourstory ";

/* ------------------------------ TUNING ------------------------------ */
const FIRST_DELAY_MS = 8000; // section on screen → first change
const GAP_MS = 3000; //         between the following changes
const FADE_MS = 1400; //        length of the colour cross-fade
const ORDER = [1, 2, 3, 0]; //  tile indexes → 2nd, 3rd, 4th, then 1st
const RANDOM_ORDER = false;

/* Canva geometry (px on the 1440 × 900 artboard) */
const GRID_X = 90, GRID_Y = 128, TILE = 322; // 2 × 2 tiles of 322 → 644 × 644
const TEXT_X = 833, TEXT_Y = 484; //            top of the first line's box (its centre sits at y = 497)
const TEXT_PX = 18.6, TEXT_LH = 26; //          font-size / line-height (also the blank line between paragraphs)

export default function ProjectColourStory({ data }: { data: ColourStoryData }) {
  const { tiles, text } = data;
  const ref = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [swapped, setSwapped] = useState<boolean[]>(() => tiles.map(() => false));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const order = ORDER.filter((i) => i < tiles.length);
    if (RANDOM_ORDER) order.sort(() => Math.random() - 0.5);
    const timers = order.map((tileIdx, n) =>
      window.setTimeout(
        () => setSwapped((prev) => prev.map((v, i) => (i === tileIdx ? true : v))),
        FIRST_DELAY_MS + n * GAP_MS
      )
    );
    return () => timers.forEach(window.clearTimeout);
  }, [started, tiles.length]);

  return (
    /* "pd-page" → same 100svh snap behaviour as the other pages of the project */
    <section ref={ref} className="pd-page cs" aria-label="The Easy Armchair">
      <div className="cs-canvas">
        <div className="cs-grid">
          {tiles.map((t, i) => (
            <div key={t.from} className={`cs-tile${swapped[i] ? " is-swapped" : ""}`}>
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