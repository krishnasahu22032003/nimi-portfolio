"use client";
/* components/ProjectIterations.tsx   (or src/components/ProjectIterations.tsx)
 *
 * Project eight — "ITERATIONS & PROTOTYPES": six colour cards that STICK and STACK.
 * Each card is `position: sticky; top: 0`, so the next one slides up over it
 * (sticky-stacking work section). While a card is being covered it scales down a little
 * and dims, which gives the stack its depth.
 *
 * Everything is placed in artboard px (1440 × 900) through the same --cu / --ax / --y0
 * scaling as the other pages, so it lines up with every other title and the header.
 *
 *   title   x 90 · 18 medium · uppercase (first slide only; stays pinned above the stack)
 *   card    x 90 · width 1260 · top y 138 · top radius 115 · runs off the bottom of the page
 *   caption x 165 · first line centred at y 213 · 14 medium #000 · line height 22
 *
 * Data:   data/puppetIterations.ts
 * Images: public/projects/puppet-theatre/iterations/*.png  (transparent PNG cut-outs)
 * Phones (≤820px): no sticky; each slide is a normal card with caption, then its images.
 */
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import type { IterationsData } from "../data/puppetIterations";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const LEFT_X = 90; // title + card left edge
const CARD_W = 1260;
const CARD_Y = 138; // top of the card
const CARD_R = 115; // top corner radius
const CAP_X = 165; // caption left edge
const CAP_Y = 202; // caption top  (first line centred at 213 with a 22px line height)
const CAP_LH = 22;
const STACK_SCALE = 0.05; // how much a covered card shrinks (0.05 = 5%)
const STACK_SHADE = 0.1; // how dark a covered card gets (0.1 = 10% black)

const INK = "#000";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function ProjectIterations({ data }: { data: IterationsData }) {
  const outerRef = useRef<HTMLElement>(null);

  /* reveal each slide once, when it first scrolls into view */
  useEffect(() => {
    const root = outerRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>(".ip-slide"));
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    slides.forEach((s: HTMLElement) => io.observe(s));
    return () => io.disconnect();
  }, []);

  /* stacking depth: --p (0 → 1) on a slide = how far the NEXT slide has covered it */
  useEffect(() => {
    const root = outerRef.current;
    if (!root) return;
    const slides = Array.from(root.querySelectorAll<HTMLElement>(".ip-slide"));
    const desk = window.matchMedia("(min-width: 821px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      slides.forEach((el: HTMLElement, i: number) => {
        const next = slides[i + 1];
        let p = 0;
        if (next && desk.matches && !reduce.matches) {
          const top = next.getBoundingClientRect().top;
          p = Math.min(1, Math.max(0, 1 - top / vh));
        }
        el.style.setProperty("--p", p.toFixed(3));
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      ref={outerRef}
      className="ip"
      aria-label={data.title}
      style={cssVars({
        "--ip-left": LEFT_X,
        "--ip-cw": CARD_W,
        "--ip-cy": CARD_Y,
        "--ip-cr": CARD_R,
        "--ip-capx": CAP_X,
        "--ip-capy": CAP_Y,
        "--ip-caplh": CAP_LH,
        "--ip-scale": STACK_SCALE,
        "--ip-shade": STACK_SHADE,
        "--ip-ink": INK,
      })}
    >
      {data.slides.map((s, si: number) => (
        <div key={s.id} className="ip-slide" style={cssVars({ "--bg": s.bg, "--p": 0 })}>
          {si === 0 ? <h2 className="ip-title ip-r">{data.title}</h2> : null}

          <article className="ip-card" aria-label={s.caption.join(" ")}>
            <p className="ip-cap ip-r">
              {s.caption.map((t: string, i: number) => (
                <span key={i} className="ip-ln">
                  {t}
                  {i < s.caption.length - 1 ? " " : null}
                </span>
              ))}
            </p>

            {s.images.map((im, k: number) => (
              <div
                key={im.src}
                className="ip-img ip-r"
                style={cssVars({ "--x": im.x, "--y": im.y, "--w": im.w, "--h": im.h, "--k": k })}
              >
                <Image
                  src={im.src}
                  alt={im.alt}
                  fill
                  sizes="(max-width: 820px) 100vw, 60vw"
                  quality={90}
                  draggable={false}
                  style={{ objectFit: "contain" }}
                />
              </div>
            ))}

            <span className="ip-shade" aria-hidden="true" />
          </article>
        </div>
      ))}

      <noscript>
        <style>{`.ip-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.ip {
  --header-h: 96px;
  --page-h: max(100svh, 560px);
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  --ease: cubic-bezier(.22, 1, .36, 1);
  position: relative; background: #fff;
  scroll-snap-align: start;
}

/* each slide is one full page tall and sticks to the top; the next one slides over it */
.ip-slide { position: sticky; top: 0; height: var(--page-h); }

/* ---- title: same place as every other title, uppercase as she wrote it ---- */
.ip-title {
  position: absolute; z-index: 2; margin: 0; white-space: nowrap;
  left: calc(var(--ax) + var(--ip-left) * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500;
  letter-spacing: 0; text-transform: uppercase; color: var(--ip-ink);
}

/* ---- the card ---- */
.ip-card {
  position: absolute; z-index: 1; box-sizing: border-box; overflow: hidden;
  left: calc(var(--ax) + var(--ip-left) * var(--cu));
  top: calc(var(--y0) + var(--ip-cy) * var(--cu));
  width: calc(var(--ip-cw) * var(--cu));
  bottom: 0;
  background: var(--bg);
  border-radius: calc(var(--ip-cr) * var(--cu)) calc(var(--ip-cr) * var(--cu)) 0 0;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, .05);
  transform-origin: 50% 0;
  transform: scale(calc(1 - var(--p, 0) * var(--ip-scale)));
  will-change: transform;
}
/* darkens a card while the next one covers it */
.ip-shade {
  position: absolute; inset: 0; z-index: 3; pointer-events: none; background: #000;
  opacity: calc(var(--p, 0) * var(--ip-shade));
}

/* ---- caption (positions are measured from the card's top-left) ---- */
.ip-cap {
  position: absolute; z-index: 2; margin: 0;
  left: calc((var(--ip-capx) - var(--ip-left)) * var(--cu));
  top: calc((var(--ip-capy) - var(--ip-cy)) * var(--cu));
  font-size: 14px; line-height: 22px;   /* literal px, like the other pages' type spec */
  font-weight: 500; letter-spacing: 0; color: var(--ip-ink);
}

/* ---- images ---- */
.ip-img {
  position: absolute; z-index: 1;
  left: calc((var(--x) - var(--ip-left)) * var(--cu));
  top: calc((var(--y) - var(--ip-cy)) * var(--cu));
  width: calc(var(--w) * var(--cu)); height: calc(var(--h) * var(--cu));
  pointer-events: none; user-select: none;
}
.ip-img img { -webkit-user-drag: none; }

/* ≥1280px: DESIGN MODE — every string is exactly one line, as she broke it in Canva */
@media (min-width: 1280px) { .ip-ln { display: block; white-space: nowrap; } }

/* ---- reveal ---- */
.ip-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .ip-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: 120ms;
}
.is-in .ip-cap { transition-delay: 180ms; }
.is-in .ip-img { transition-delay: calc(300ms + var(--k, 0) * 130ms); }

/* ---- phones: no sticky, each slide is a normal card ---- */
@media (max-width: 820px) {
  .ip { --cu: 1px; --y0: 0px; scroll-snap-align: none; padding: 0 0 48px; }
  .ip-slide { position: relative; height: auto; padding: 0 16px 16px; }
  .ip-slide:first-child { padding-top: calc(var(--header-h) + 8px); }
  .ip-title { position: relative; left: auto; top: auto; margin: 0 0 18px; font-size: 18px; line-height: 30px; }
  .ip-card {
    position: relative; left: auto; top: auto; bottom: auto; width: auto;
    padding: 28px 22px 26px; border-radius: 40px; box-shadow: none; transform: none; will-change: auto;
  }
  .ip-shade { display: none; }
  .ip-cap { position: relative; left: auto; top: auto; font-size: 14px; line-height: 22px; }
  .ip-img {
    position: relative; left: auto; top: auto; width: 100%; height: auto;
    aspect-ratio: calc(var(--w)) / calc(var(--h)); margin-top: 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ip-r { transition: none !important; opacity: 1; transform: none; }
  .ip-card { transform: none; }
  .ip-shade { display: none; }
}
`;