"use client";
/* components/ProjectTargetUser.tsx   (or src/components/ProjectTargetUser.tsx)
 *
 * Project eight — page "TARGET USER".
 *
 * Measured from her Canva page (1440 × 900 artboard). Everything below is artboard px.
 *
 * NO MOTION: when the visitor arrives, the whole page is already there — title, line, subtitle, the orange bar
 * with its numbers, and the three cards. Nothing fades, slides or wipes in.
 *
 * THE BAR
 *   Three rounded shapes, all #DC7B36:  3–5 at 40% · 5–7 "Sweet spot" at 80% · 7–9 at 100%.
 *   The middle shape has a ROUNDED END ON BOTH SIDES (left lens from the 80% over the 40%; right lens painted
 *   with LENS_RIGHT, because 80% over 100% would be the same colour and the curve would not show).
 *   The AGE NUMBERS 3–9 sit under the bar.
 *
 * CARDS
 *   · the first three bullets of every card are MEDIUM weight (BULLET_WEIGHT)
 *   · the "Outcome" bullet of EVERY card starts at the same height (OUTCOME_Y), so the three line up
 *
 * Data: data/puppetTargetUser.ts
 * Phones (≤820px): the bar scrolls sideways if needed, the three cards stack.
 */
import type { CSSProperties } from "react";
import { Familjen_Grotesk, Playfair_Display } from "next/font/google";
import type { TargetUserData } from "../data/puppetTargetUser";

/* the page already loads Familjen Grotesk upright; the sweet-spot label needs the ITALIC cut,
   and the card headings are Playfair Display italic (size 21). */
const familjenItalic = Familjen_Grotesk({ subsets: ["latin"], weight: ["600"], style: ["italic"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400"], style: ["italic"], display: "swap" });

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const LEFT_X = 90; // title, line and subtitle

const LINE_Y = 146; // the thin gold line under the title (runs to the right edge of the page)
const SUB_Y = 186; // top of "Works for 3–9…" (30px line box → centre at 201)

/* the bar */
const BAR_X = 85;
const BAR_Y = 250;
const BAR_W = 1265; // 85 → 1350
const BAR_H = 83;
/* where each shape starts and ends (artboard x) */
const SEG_LIGHT = [85, 540]; // 3–5   · 40%
const SEG_MID = [445, 947]; //   5–7   · 80%  (centre 696 = where "Sweet spot" sits)
const SEG_DARK = [865, 1350]; // 7–9   · 100%
const SWEET_X = 696; // centre of the label
const SWEET_Y = 293; // vertical centre of the label

const NUM_GAP = 25; // bar bottom → top of the age numbers (30px line box, centre lands at y=373)

/* the cards */
const CARD_Y = 450;
const CARD_W = 360;
const CARD_H = 326;
const CARD_X = [85, 540, 990];
const CARD_R = 46; // corner radius of the card
const HEAD_H = 76; // height of the coloured header
const HEAD_R = 38; // radius of the header's lower corners
const HEAD_PAD = 47; // heading text: distance from the card's left edge
const LIST_Y = 105; // top of the bullet list, from the card's top
const LIST_X = 60; // bullet text: distance from the card's left edge
const OUTCOME_Y = 261; // top of the "Outcome" bullet, from the card's top — the SAME in all three cards
const BULLET_WEIGHT = 500; // the first three bullets: 500 = medium, 600 = semibold

/* colours (her codes) */
const ORANGE = "#DC7B36"; // bar, borders, headers
const LINE_GOLD = "#EAC466";
const SUB_ORANGE = "#E38406";
const INK = "#000";
const BODY = "#333";
const NUM = "#2F2F2F";
const OP = [0.4, 0.8, 1]; // 40% · 80% · 100%
/* colour of the rounded lens where the middle shape meets the 100% shape (see top of file) */
const LENS_RIGHT = "#D4702C";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((t: string, i: number) => (
        <span key={i} className="tu-ln">
          {t}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function ProjectTargetUser({ data }: { data: TargetUserData }) {
  /* bar shapes, relative to the bar's own top-left corner */
  const rel = (s: number[]) => ({ x: s[0] - BAR_X, w: s[1] - s[0] });
  const L = rel(SEG_LIGHT);
  const M = rel(SEG_MID);
  const D = rel(SEG_DARK);
  const R = BAR_H / 2; // fully rounded ends
  const pct = (x: number) => `${(((x - BAR_X) / BAR_W) * 100).toFixed(3)}%`;

  return (
    <section
      className="pd-page tu"
      aria-label={data.title}
      style={cssVars({
        "--tu-left": LEFT_X,
        "--tu-line-y": LINE_Y,
        "--tu-sub-y": SUB_Y,
        "--tu-bx": BAR_X,
        "--tu-by": BAR_Y,
        "--tu-bw": BAR_W,
        "--tu-bh": BAR_H,
        "--tu-numgap": NUM_GAP,
        "--tu-cy": CARD_Y,
        "--tu-cw": CARD_W,
        "--tu-ch": CARD_H,
        "--tu-cr": CARD_R,
        "--tu-hh": HEAD_H,
        "--tu-hr": HEAD_R,
        "--tu-hpad": HEAD_PAD,
        "--tu-ly": LIST_Y,
        "--tu-lx": LIST_X,
        "--tu-oy": OUTCOME_Y,
        "--tu-bw-weight": BULLET_WEIGHT,
        "--tu-orange": ORANGE,
        "--tu-gold": LINE_GOLD,
        "--tu-sub": SUB_ORANGE,
        "--tu-ink": INK,
        "--tu-body": BODY,
        "--tu-num": NUM,
      })}
    >
      <div className="tu-stage">
        <h2 className="tu-title">{data.title}</h2>
        <span className="tu-line" aria-hidden="true" />
        <p className="tu-sub">{data.subtitle}</p>

        {/* ---------------- the bar + the age numbers ---------------- */}
        <div className="tu-barwrap" role="img" aria-label={data.alt}>
          <div className="tu-bar">
            <div className="tu-shapes">
              <svg className="tu-svg" viewBox={`0 0 ${BAR_W} ${BAR_H}`} aria-hidden="true" focusable="false">
                <defs>
                  <clipPath id="tu-clip-mid">
                    <rect x={M.x} y={0} width={M.w} height={BAR_H} rx={R} ry={R} />
                  </clipPath>
                </defs>
                {/* order matters: 40% and 100% first, the 80% middle on top of both */}
                <rect x={L.x} y={0} width={L.w} height={BAR_H} rx={R} ry={R} fill={ORANGE} fillOpacity={OP[0]} />
                <rect x={D.x} y={0} width={D.w} height={BAR_H} rx={R} ry={R} fill={ORANGE} fillOpacity={OP[2]} />
                <rect x={M.x} y={0} width={M.w} height={BAR_H} rx={R} ry={R} fill={ORANGE} fillOpacity={OP[1]} />
                {/* the rounded lens on the RIGHT end of the middle shape: where it meets the 100% shape */}
                <rect x={D.x} y={0} width={D.w} height={BAR_H} rx={R} ry={R} fill={LENS_RIGHT} clipPath="url(#tu-clip-mid)" />
              </svg>

              <p
                className={`tu-sweet ${familjenItalic.className}`}
                style={{ left: pct(SWEET_X), top: `calc((${SWEET_Y - BAR_Y} / ${BAR_H}) * 100%)` }}
              >
                {data.sweetLabel}
              </p>
            </div>

            <ul className="tu-nums" aria-hidden="true">
              {data.ages.map((a) => (
                <li key={a.label} style={{ left: pct(a.x) }}>
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------------- the three cards ---------------- */}
        {data.cards.map((c, i: number) => (
          <article key={c.heading} className="tu-card" style={cssVars({ "--x": CARD_X[i], "--tone": OP[c.tone] })}>
            <h3 className={`tu-head ${playfair.className}`}>{c.heading}</h3>
            <ul className="tu-list">
              {c.bullets.map((lines: string[], k: number) => (
                <li key={k}>
                  <Lines lines={lines} />
                </li>
              ))}
              <li className="tu-outcome">
                <Lines lines={c.outcome} />
              </li>
            </ul>
          </article>
        ))}
      </div>

      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.tu {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  background: #fff;
}
.tu-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; }

/* ---- title (same place as every other title) ---- */
.tu-title {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--tu-left) * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  white-space: nowrap; text-transform: uppercase;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--tu-ink);
}

/* ---- thin gold line: from the title's left edge to the RIGHT EDGE of the page ---- */
.tu-line {
  position: absolute; z-index: 1; height: 1px; background: var(--tu-gold); pointer-events: none;
  left: calc(var(--ax) + var(--tu-left) * var(--cu)); right: 0;
  top: calc(var(--y0) + var(--tu-line-y) * var(--cu));
}

/* ---- subtitle ---- */
.tu-sub {
  position: absolute; z-index: 2; margin: 0; white-space: pre;   /* keeps her double spaces */
  left: calc(var(--ax) + var(--tu-left) * var(--cu));
  top: calc(var(--y0) + var(--tu-sub-y) * var(--cu));
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; color: var(--tu-sub);
}

/* ---- the bar ---- */
.tu-barwrap {
  position: absolute; z-index: 1;
  left: calc(var(--ax) + var(--tu-bx) * var(--cu));
  top: calc(var(--y0) + var(--tu-by) * var(--cu));
  width: calc(var(--tu-bw) * var(--cu)); height: calc(var(--tu-bh) * var(--cu));
}
.tu-bar { position: relative; width: 100%; height: 100%; }
.tu-shapes { position: absolute; inset: 0; }
.tu-svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }

.tu-sweet {
  position: absolute; margin: 0; transform: translate(-50%, -50%); white-space: nowrap;
  font-size: calc(19 * var(--cu)); line-height: 1.2; font-weight: 600; font-style: italic; letter-spacing: 0; color: #262626;
}

/* the age numbers 3–9, under the bar (Familjen Grotesk, 25.3) */
.tu-nums { list-style: none; margin: 0; padding: 0; position: absolute; left: 0; right: 0; top: calc(100% + var(--tu-numgap) * var(--cu)); }
.tu-nums li {
  position: absolute; top: 0; transform: translateX(-50%);
  font-size: calc(25.3 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--tu-num);
}

/* ---- cards ---- */
.tu-card {
  position: absolute; z-index: 1; box-sizing: border-box; overflow: hidden;
  left: calc(var(--ax) + var(--x) * var(--cu));
  top: calc(var(--y0) + var(--tu-cy) * var(--cu));
  width: calc(var(--tu-cw) * var(--cu)); height: calc(var(--tu-ch) * var(--cu));
  border: max(1.5px, calc(2 * var(--cu))) solid var(--tu-orange);
  border-radius: calc(var(--tu-cr) * var(--cu));
  background: #fff;
}
.tu-head {
  position: absolute; left: 0; right: 0; top: 0; margin: 0;
  height: calc(var(--tu-hh) * var(--cu)); box-sizing: border-box;
  padding-left: calc((var(--tu-hpad) - 2) * var(--cu));
  display: flex; align-items: center;
  background: rgb(220 123 54 / var(--tone));
  border-radius: 0 0 calc(var(--tu-hr) * var(--cu)) calc(var(--tu-hr) * var(--cu));
  font-size: calc(21 * var(--cu)); line-height: 1.2; font-weight: 400; font-style: italic; letter-spacing: 0;
  color: #2B2B2B; white-space: nowrap;
}
.tu-list {
  list-style: none; margin: 0; padding: 0; position: absolute; right: calc(18 * var(--cu)); left: 0;
  top: calc((var(--tu-ly) - 2) * var(--cu));
}
.tu-list li {
  position: relative; padding-left: calc((var(--tu-lx) - 2) * var(--cu));
  font-size: max(12px, calc(14 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: var(--tu-bw-weight); letter-spacing: 0; color: var(--tu-body);
}
.tu-list li::before {                                   /* the bullet */
  content: ""; position: absolute; border-radius: 50%; background: var(--tu-body);
  width: calc(5 * var(--cu)); height: calc(5 * var(--cu)); min-width: 4px; min-height: 4px;
  left: calc(41 * var(--cu)); top: calc(10.5 * var(--cu));
}
/* the OUTCOME bullet: pinned to the same height in all three cards (regular weight) */
.tu-list li.tu-outcome {
  position: absolute; left: 0; right: 0;
  top: calc((var(--tu-oy) - var(--tu-ly)) * var(--cu));
  font-weight: 400;
}

/* ≥1280px: DESIGN MODE — every string is exactly one line, as she broke it in Canva */
@media (min-width: 1280px) { .tu-ln { display: block; white-space: nowrap; } }

/* ---- phones: bar scrolls sideways, cards stack ---- */
@media (max-width: 820px) {
  .tu { --cu: 1px; --y0: 0px; }
  .tu-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 16px 64px; }
  .tu-title, .tu-line, .tu-sub, .tu-barwrap, .tu-card { position: relative; left: auto; right: auto; top: auto; }
  .tu-title { margin: 0 0 18px; font-size: 18px; line-height: 30px; }
  .tu-line { margin: 0 -16px 22px 0; }
  .tu-sub { margin: 0 0 22px; font-size: 16px; line-height: 26px; }
  .tu-barwrap { width: 100%; height: auto; overflow-x: auto; padding-bottom: 54px; scrollbar-width: none; }
  .tu-barwrap::-webkit-scrollbar { display: none; }
  .tu-bar { width: 640px; height: 42px; }
  .tu-sweet { font-size: 14px; }
  .tu-nums { top: calc(100% + 8px); }
  .tu-nums li { font-size: 18px; line-height: 24px; }
  .tu-card { width: 100%; height: auto; margin: 0 0 20px; border-radius: 30px; padding-bottom: 20px; }
  .tu-head { position: relative; height: auto; padding: 18px 24px; border-radius: 0 0 26px 26px; font-size: 20px; white-space: normal; }
  .tu-list { position: relative; top: auto; right: auto; padding: 22px 20px 0 0; }
  .tu-list li { padding-left: 42px; font-size: 14px; line-height: 24px; }
  .tu-list li::before { left: 24px; top: 9.5px; }
  .tu-list li.tu-outcome { position: relative; top: auto; left: auto; right: auto; margin-top: 16px; }
}
`;