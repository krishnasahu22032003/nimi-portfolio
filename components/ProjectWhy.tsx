"use client";
/* components/ProjectWhy.tsx   (or src/components/ProjectWhy.tsx)
 *
 * Project eight — page 115 "Why puppet theatre ?".
 *
 * Measured from her Canva page (1717 px screenshot → 1440 × 900 artboard, × 0.8387). Everything below is artboard px.
 *
 * LEFT   orange line of text (#E38406, 18) · headline (24, regular + semibold) · paragraph (14, regular + semibold)
 * RIGHT  2 × 2 cards. Each card = her colour at 50% transparency + a square-ish 50% #EAC466 border,
 *        an icon (client artwork), the heading in Playfair Display italic 23.8, and three lines of Familjen Grotesk 16.
 * Title and the thin gold line are the same as every other page (the line runs to the right edge of the page).
 *
 * Data: data/puppetWhy.ts
 * Icons: public/projects/puppet-theatre/why/cognitive.png · language.png · emotional.png · social.png
 * Phones (≤820px): everything stacks; each card shows icon + heading, then its three lines.
 */
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import type { Seg, WhyData } from "../data/puppetWhy";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400"], style: ["italic"], display: "swap" });

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const LEFT_X = 90; // title, line, left text
const LINE_Y = 146; // the thin gold line (same as the Target user page)

const KICK_Y = 207; // top of the orange text (aligned with the top of the cards)
const KICK_LH = 29; // its line height
const HEAD_Y = 540; // top of "At 5–7, children shift from"
const HEAD_LH = 44.5;
const PARA_Y = 688; // top of "Research on puppet-led …"
const PARA_LH = 26.2;

/* the four cards */
const CARD_W = 310;
const CARD_H = 295;
const CARD_POS: [number, number][] = [
  [648, 208], // Cognitive
  [1015, 208], // Language
  [648, 541], // Emotional
  [1015, 541], // Social
];
const CARD_R = 52; // corner radius
const BORDER = 4; // border thickness (her "square border", 50% #EAC466)
const TEXT_TOP = 168; // top of the first of the three lines, from the card's top
const TEXT_LH = 29.4; // line height of the three lines

/* colours (her codes) */
const GOLD = "#EAC466";
const KICK_COLOR = "#E38406";
const INK = "#000";
const HEAD_COLOR = "#2B2B2B";
const BODY_COLOR = "#333";
const CARD_TEXT = "#2B2B2B";
const FILL_ALPHA = 0.5; // "for all: transparency 50%"
const BORDER_ALPHA = 0.5;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const rgb = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255} / ${a})`;
};

/* one forced line per array (desktop); below 1280px the lines reflow as one paragraph */
function Rich({ lines }: { lines: Seg[][] }) {
  return (
    <>
      {lines.map((segs: Seg[], i: number) => (
        <span key={i} className="wy-ln">
          {segs.map((s: Seg, k: number) => (s.b ? <strong key={k}>{s.t}</strong> : <span key={k}>{s.t}</span>))}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function ProjectWhy({ data }: { data: WhyData }) {
  const outerRef = useRef<HTMLElement>(null);

  /* reveal once, when the section first appears */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={outerRef}
      className="pd-page wy"
      aria-label={data.title}
      style={cssVars({
        "--wy-left": LEFT_X,
        "--wy-line-y": LINE_Y,
        "--wy-ky": KICK_Y,
        "--wy-klh": KICK_LH,
        "--wy-hy": HEAD_Y,
        "--wy-hlh": HEAD_LH,
        "--wy-py": PARA_Y,
        "--wy-plh": PARA_LH,
        "--wy-cw": CARD_W,
        "--wy-ch": CARD_H,
        "--wy-cr": CARD_R,
        "--wy-bw": BORDER,
        "--wy-ty": TEXT_TOP,
        "--wy-tlh": TEXT_LH,
        "--wy-gold": GOLD,
        "--wy-kick": KICK_COLOR,
        "--wy-ink": INK,
        "--wy-head": HEAD_COLOR,
        "--wy-body": BODY_COLOR,
        "--wy-ctext": CARD_TEXT,
        "--wy-border": rgb(GOLD, BORDER_ALPHA),
      })}
    >
      <div className="wy-stage">
        <h2 className="wy-title wy-r">{data.title}</h2>
        <span className="wy-line wy-r" aria-hidden="true" />

        <p className="wy-kick wy-r">
          {data.kicker.map((t: string, i: number) => (
            <span key={i} className="wy-ln">
              {t}
              {i < data.kicker.length - 1 ? " " : null}
            </span>
          ))}
        </p>

        <h3 className="wy-headline wy-r">
          <Rich lines={data.headline} />
        </h3>

        <p className="wy-para wy-r">
          <Rich lines={data.paragraph} />
        </p>

        {data.cards.map((c, i: number) => (
          <article
            key={c.heading}
            className="wy-card wy-r"
            style={cssVars({
              "--x": CARD_POS[i][0],
              "--y": CARD_POS[i][1],
              "--i": i,
              "--fill": rgb(c.color, FILL_ALPHA),
              "--ix": c.ix, "--iy": c.iy, "--iw": c.iw, "--ih": c.ih,
              "--hx": c.hx, "--hy": c.hy,
              "--tx": c.tx,
            })}
          >
            <div className="wy-icon">
              <Image src={c.icon.src} alt={c.icon.alt} fill unoptimized sizes="120px" style={{ objectFit: "contain" }} draggable={false} />
            </div>
            <h4 className={`wy-h ${playfair.className}`}>{c.heading}</h4>
            <p className="wy-text">
              {c.lines.map((t: string, k: number) => (
                <span key={k} className="wy-tl">
                  {t}
                </span>
              ))}
            </p>
          </article>
        ))}
      </div>

      <noscript>
        <style>{`.wy-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.wy {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --ease: cubic-bezier(.22, 1, .36, 1);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  background: #fff;
}
.wy-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; }

/* ---- title (same place as every other title) — here in normal case, as she wrote it ---- */
.wy-title {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--wy-left) * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  white-space: nowrap;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--wy-ink);
}

/* ---- thin gold line: from the title's left edge to the RIGHT EDGE of the page ---- */
.wy-line {
  position: absolute; z-index: 1; height: 1px; background: var(--wy-gold); pointer-events: none;
  left: calc(var(--ax) + var(--wy-left) * var(--cu)); right: 0;
  top: calc(var(--y0) + var(--wy-line-y) * var(--cu));
}

/* ---- left column ---- */
.wy-kick, .wy-headline, .wy-para {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + var(--wy-left) * var(--cu));
}
.wy-kick {
  top: calc(var(--y0) + var(--wy-ky) * var(--cu));
  font-size: calc(18 * var(--cu)); line-height: calc(var(--wy-klh) * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--wy-kick);
}
.wy-headline {
  top: calc(var(--y0) + var(--wy-hy) * var(--cu));
  font-size: calc(24 * var(--cu)); line-height: calc(var(--wy-hlh) * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--wy-head);
}
.wy-para {
  top: calc(var(--y0) + var(--wy-py) * var(--cu));
  font-size: max(12px, calc(14 * var(--cu))); line-height: calc(var(--wy-plh) * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--wy-body);
}
.wy-headline strong, .wy-para strong { font-weight: 600; }

/* ---- cards: her colour at 50%, square-ish border #EAC466 at 50% ---- */
.wy-card {
  position: absolute; z-index: 1; box-sizing: border-box;
  left: calc(var(--ax) + var(--x) * var(--cu));
  top: calc(var(--y0) + var(--y) * var(--cu));
  width: calc(var(--wy-cw) * var(--cu)); height: calc(var(--wy-ch) * var(--cu));
  border: calc(var(--wy-bw) * var(--cu)) solid var(--wy-border);
  border-radius: calc(var(--wy-cr) * var(--cu));
  background: var(--fill);
  background-clip: padding-box;          /* the fill stops at the border, so the border keeps its own pale tone */
}
/* children are placed from the card's OUTER corner: subtract the border */
.wy-icon {
  position: absolute;
  left: calc((var(--ix) - var(--wy-bw)) * var(--cu)); top: calc((var(--iy) - var(--wy-bw)) * var(--cu));
  width: calc(var(--iw) * var(--cu)); height: calc(var(--ih) * var(--cu));
  pointer-events: none; user-select: none;
}
.wy-h {
  position: absolute; margin: 0; white-space: nowrap;
  left: calc((var(--hx) - var(--wy-bw)) * var(--cu)); top: calc((var(--hy) - var(--wy-bw)) * var(--cu)); transform: translateY(-50%);
  font-size: calc(23.8 * var(--cu)); line-height: 1.2; font-weight: 400; font-style: italic; letter-spacing: 0; color: var(--wy-head);
}
.wy-text {
  position: absolute; margin: 0;
  left: calc((var(--tx) - var(--wy-bw)) * var(--cu)); top: calc((var(--wy-ty) - var(--wy-bw)) * var(--cu)); right: calc(8 * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(var(--wy-tlh) * var(--cu)); font-weight: 400; letter-spacing: 0; color: var(--wy-ctext);
}
.wy-tl { display: block; white-space: nowrap; }

/* ≥1280px: DESIGN MODE — every string is exactly one line, as she broke it in Canva */
@media (min-width: 1280px) { .wy-ln { display: block; white-space: nowrap; } }

/* ---- reveal ---- */
.wy-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .wy-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: 100ms;
}
.is-in .wy-line { transition-delay: 150ms; }
.is-in .wy-kick { transition-delay: 250ms; }
.is-in .wy-headline { transition-delay: 350ms; }
.is-in .wy-para { transition-delay: 450ms; }
.is-in .wy-card { transition-delay: calc(300ms + var(--i) * 130ms); }

/* ---- phones: everything stacks ---- */
@media (max-width: 820px) {
  .wy { --cu: 1px; --y0: 0px; }
  .wy-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 16px 64px; }
  .wy-title, .wy-line, .wy-kick, .wy-headline, .wy-para, .wy-card { position: relative; left: auto; right: auto; top: auto; }
  .wy-title { margin: 0 0 18px; font-size: 18px; line-height: 30px; }
  .wy-line { margin: 0 -16px 24px 0; }
  .wy-kick { margin: 0 0 28px; font-size: 18px; line-height: 28px; }
  .wy-headline { margin: 0 0 18px; font-size: 22px; line-height: 34px; }
  .wy-para { margin: 0 0 32px; font-size: 14px; line-height: 24px; }
  .wy-card {
    width: 100%; height: auto; margin: 0 0 18px; border-radius: 40px;
    padding: 26px 24px 28px; display: grid; grid-template-columns: auto 1fr; column-gap: 16px; align-items: center;
  }
  .wy-icon { position: relative; left: auto; top: auto; width: calc(var(--iw) * .8px); height: calc(var(--ih) * .8px); }
  .wy-h { position: relative; left: auto; top: auto; transform: none; font-size: 22px; }
  .wy-text { position: relative; left: auto; top: auto; right: auto; grid-column: 1 / -1; margin-top: 18px; font-size: 15px; line-height: 26px; }
  .wy-tl { white-space: normal; }
}

@media (prefers-reduced-motion: reduce) {
  .wy-r { transition: none !important; opacity: 1; transform: none; }
}
`;