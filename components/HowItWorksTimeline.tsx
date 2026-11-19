"use client";
/* components/HowItWorksTimeline.tsx   (or src/components/HowItWorksTimeline.tsx)
 *
 * BUILD — COMPOSE — INTERPRET — PERFORM
 * One timeline, fixed at the top centre, for pages 102–108 ("How it works").
 *
 *  - It finds the pages by themselves: every page of this part carries
 *    data-hiw-step="build" | "compose" | "interpret" | "perform".
 *    The timeline is only on screen while one of those pages is on screen.
 *  - Clicking a step scrolls to the first page of that step.
 *  - Black when it first appears, then it rests at reduced opacity (grey).
 *    Cursor near it (or keyboard focus / a tap) → black again.
 *  - Dots fill as the reader moves forward: current and earlier steps are filled.
 *
 * Put it ONCE on the project page, next to the pages, e.g.
 *    <HowItWorksTimeline />
 * It draws itself straight into <body> (a portal). This matters: .pd-root uses
 * container-type, which would otherwise make "position: fixed" scroll with the page.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const REST_OPACITY = 0.38; // resting "grey"; 1 = black
const AWAKE_MS = 2600; // how long it stays black after appearing
const NEAR_PX = 80; // cursor distance that wakes it (artboard px)

export type HowItWorksStepId = "build" | "compose" | "interpret" | "perform";

/* x values are artboard px measured from the Canva page (pg 102), relative to the
   left edge of the timeline (x = 563). dot / label = centre / left edge. */
const STEPS: { id: HowItWorksStepId; label: string; dot: number; labelX: number; labelW: number }[] = [
  { id: "build", label: "Build", dot: 16, labelX: 0, labelW: 42 },
  { id: "compose", label: "Compose", dot: 111, labelX: 58, labelW: 73 },
  { id: "interpret", label: "Interpret", dot: 196, labelX: 147, labelW: 85 },
  { id: "perform", label: "Perform", dot: 271, labelX: 241, labelW: 73 },
];
const DASHES = [68, 153, 228]; // centres of the three dashes
const BOX_W = 314;
const BOX_H = 50;
const DOT_Y = 12; // centre of the dots, from the top of the box
const LABEL_Y = 38; // centre of the labels
const DOT = 20;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

export default function HowItWorksTimeline() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<HowItWorksStepId>("build");
  const [awake, setAwake] = useState(false);
  const [near, setNear] = useState(false);
  const wakeTimer = useRef<number>(0);

  useEffect(() => setMounted(true), []);

  /* 1 — which page is on screen, and which step is it? */
  useEffect(() => {
    let io1: IntersectionObserver | null = null;
    let io2: IntersectionObserver | null = null;
    let retry = 0;

    const setup = () => {
      io1?.disconnect();
      io2?.disconnect();
      const pages = Array.from(document.querySelectorAll<HTMLElement>("[data-hiw-step]"));
      if (!pages.length) return false;

      const onScreen = new Set<Element>();
      /* visible while ANY page of the series touches the screen */
      io1 = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        });
        setVisible(onScreen.size > 0);
      });
      /* active step = the page crossing the middle line of the screen */
      io2 = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          entries.forEach((e: IntersectionObserverEntry) => {
            if (!e.isIntersecting) return;
            const id = (e.target as HTMLElement).dataset.hiwStep as HowItWorksStepId | undefined;
            if (id) setActive(id);
          });
        },
        { rootMargin: "-50% 0px -50% 0px" }
      );
      pages.forEach((p) => {
        io1?.observe(p);
        io2?.observe(p);
      });
      return true;
    };

    if (!setup()) retry = window.setTimeout(setup, 600); // pages mounted a moment later
    window.addEventListener("load", setup);
    return () => {
      window.clearTimeout(retry);
      window.removeEventListener("load", setup);
      io1?.disconnect();
      io2?.disconnect();
    };
  }, []);

  /* 2 — black for a moment when it appears, then rest */
  useEffect(() => {
    window.clearTimeout(wakeTimer.current);
    if (!visible) {
      setAwake(false);
      return;
    }
    setAwake(true);
    wakeTimer.current = window.setTimeout(() => setAwake(false), AWAKE_MS);
    return () => window.clearTimeout(wakeTimer.current);
  }, [visible]);

  /* 3 — cursor near it → black */
  useEffect(() => {
    const el = rootRef.current;
    if (!mounted || !el) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const check = () => {
      raf = 0;
      const box = el.querySelector<HTMLElement>(".hwt-box");
      if (!box) return;
      const r = box.getBoundingClientRect();
      const pad = (NEAR_PX * r.width) / BOX_W;
      setNear(x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad);
    };
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(check);
    };
    const onLeave = () => setNear(false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [mounted]);

  const go = (id: HowItWorksStepId) => {
    const target = document.querySelector<HTMLElement>(`[data-hiw-step="${id}"]`);
    if (!target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  /* a tap on a phone also counts as "interacted" */
  const wakeBriefly = () => {
    setAwake(true);
    window.clearTimeout(wakeTimer.current);
    wakeTimer.current = window.setTimeout(() => setAwake(false), AWAKE_MS);
  };

  const activeIndex = STEPS.findIndex((s) => s.id === active);
  const state = !visible ? "hidden" : awake || near ? "awake" : "rest";

  if (!mounted) return null;

  return createPortal(
    <div
      ref={rootRef}
      className="hwt"
      data-state={state}
      style={cssVars({ "--hwt-rest": REST_OPACITY })}
      onPointerDown={wakeBriefly}
    >
      <nav className="hwt-box" aria-label="How it works" aria-hidden={!visible}>
        {DASHES.map((x, i) => (
          <span
            key={i}
            className="hwt-dash"
            aria-hidden="true"
            style={cssVars({ "--x": x, "--y": DOT_Y })}
          />
        ))}

        {STEPS.map((s, i) => {
          const reached = i <= activeIndex;
          return (
            <div key={s.id} className="hwt-step">
              <span
                className={reached ? "hwt-dot is-on" : "hwt-dot"}
                aria-hidden="true"
                style={cssVars({ "--x": s.dot, "--y": DOT_Y })}
              />
              <span className="hwt-label" aria-hidden="true" style={cssVars({ "--x": s.labelX, "--y": LABEL_Y })}>
                {s.label}
              </span>
              {/* the click target covers the dot and its label */}
              <button
                type="button"
                className="hwt-hit"
                tabIndex={visible ? 0 : -1}
                aria-label={s.label}
                aria-current={s.id === active ? "step" : undefined}
                onClick={() => go(s.id)}
                onFocus={() => setNear(true)}
                onBlur={() => setNear(false)}
                style={cssVars({
                  "--x": Math.min(s.dot - DOT / 2, s.labelX) - 6,
                  "--w": Math.max(s.dot + DOT / 2, s.labelX + s.labelW) - Math.min(s.dot - DOT / 2, s.labelX) + 12,
                })}
              />
            </div>
          );
        })}
      </nav>
      <style>{CSS}</style>
    </div>,
    document.body
  );
}

const CSS = `
.hwt {
  position: fixed; z-index: 40; left: 0; right: 0; top: 0; height: 0;
  container-type: inline-size; pointer-events: none;
}
.hwt-box {
  --u: min(calc(100cqw / 1440), calc((100svh - 96px) / 804));
  position: absolute; box-sizing: border-box;
  left: calc(50% - ${BOX_W / 2} * var(--u));
  top: calc(96px - 5 * var(--u));              /* artboard y = 91 */
  width: calc(${BOX_W} * var(--u)); height: calc(${BOX_H} * var(--u));
  opacity: 0; transform: translate3d(0, -6px, 0); visibility: hidden;
  transition: opacity .55s cubic-bezier(.22, 1, .36, 1), transform .7s cubic-bezier(.22, 1, .36, 1), visibility 0s linear .7s;
  color: #000;
}
.hwt[data-state="rest"]  .hwt-box { opacity: var(--hwt-rest); transform: none; visibility: visible; transition-delay: 0s; }
.hwt[data-state="awake"] .hwt-box { opacity: 1;               transform: none; visibility: visible; transition-delay: 0s; }

.hwt-dot, .hwt-dash, .hwt-label { position: absolute; pointer-events: none; }

.hwt-dot {
  left: calc((var(--x) - ${DOT / 2}) * var(--u)); top: calc((var(--y) - ${DOT / 2}) * var(--u));
  width: calc(${DOT} * var(--u)); height: calc(${DOT} * var(--u));
  box-sizing: border-box; border-radius: 50%; border: calc(1.5 * var(--u)) solid currentColor; background: transparent;
  transition: background-color .35s ease;
}
.hwt-dot.is-on { background: currentColor; }

.hwt-dash {
  left: calc((var(--x) - 10) * var(--u)); top: calc((var(--y) - 1.25) * var(--u));
  width: calc(20 * var(--u)); height: calc(2.5 * var(--u)); border-radius: 2px; background: currentColor;
}

.hwt-label {
  left: calc(var(--x) * var(--u)); top: calc((var(--y) - 10) * var(--u));
  font-family: var(--font-hand, "Patrick Hand", "Gaegu", "Comic Sans MS", cursive);
  font-size: calc(17 * var(--u)); line-height: calc(20 * var(--u)); font-weight: 700;
  letter-spacing: .02em; text-transform: uppercase; white-space: nowrap;
}

.hwt-hit {
  position: absolute; pointer-events: auto; cursor: pointer; margin: 0; padding: 0; border: 0; background: transparent;
  left: calc(var(--x) * var(--u)); width: calc(var(--w) * var(--u));
  top: 0; height: 100%; border-radius: calc(8 * var(--u));
  -webkit-tap-highlight-color: transparent;
}
.hwt-hit:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }

@media (max-width: 820px) {
  .hwt-box { --u: .74px; top: calc(96px - 4px); }
}
@media (prefers-reduced-motion: reduce) {
  .hwt-box { transition: none; transform: none; }
}
`;