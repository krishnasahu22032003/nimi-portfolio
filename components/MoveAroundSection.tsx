"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------
 * ASSET (public/hero/Girl2.png) – 1200 × 1200 artwork
 * ---------------------------------------------------------------------- */
const ART = "/hero/Girl2.png";

/* -------------------------------------------------------------------------
 * TUNING
 * ---------------------------------------------------------------------- */
const LABEL_SIZE = 14; // cursor label (px) – client's latest note: 14
const MAX_TILT = 4.5; // degrees the see-saw rocks at the screen edges
const MAX_SHIFT = 2.4; // % of artwork width the runner rolls sideways
const STIFFNESS = 70; // spring: higher = snappier
const DAMPING = 9; // spring: lower = more bounce (9 ≈ one soft overshoot)

/* Pivot of the rocker, as % of the artwork (bottom-centre of the runner) */
const PIVOT = "55% 90%";

/* -------------------------------------------------------------------------
 * HOTSPOTS
 * Polygons are traced in the 1200 × 1200 artwork space around each object
 * (plus the hand holding it). If you export each object as its own PNG
 * layer, replace `clip` with the layer's `src` and drop the clip-path.
 * ---------------------------------------------------------------------- */
type Pt = [number, number];
type HotspotId = "about" | "contact" | "projects";

const toClip = (pts: Pt[]) =>
  `polygon(${pts
    .map(([x, y]) => `${(x / 12).toFixed(2)}% ${(y / 12).toFixed(2)}%`)
    .join(",")})`;

const HOTSPOTS: {
  id: HotspotId;
  label: string;
  aria: string;
  href: string;
  origin: string;
  activeClass: string;
  clip: string;
}[] = [
  {
    id: "about",
    label: "About",
    aria: "About me",
    href: "/about",
    origin: "86% 36%",
    activeClass: "hs-pop",
    clip: toClip([
      [838, 292], [962, 305], [968, 352], [1132, 362], [1128, 545], [1088, 552],
      [935, 512], [932, 470], [990, 440], [985, 400], [900, 385], [868, 345],
    ]),
  },
  {
    id: "contact",
    label: "Contact",
    aria: "Contact",
    href: "/contact",
    origin: "29% 32%",
    activeClass: "hs-ring",
    clip: toClip([
      [300, 280], [435, 296], [435, 402], [415, 498], [345, 496], [336, 468],
      [285, 462], [268, 415], [290, 360], [303, 330],
    ]),
  },
  {
    id: "projects",
    label: "Projects",
    aria: "Projects",
    href: "/projects",
    origin: "57% 57%",
    activeClass: "hs-drill",
    clip: toClip([
      [565, 588], [640, 588], [700, 628], [740, 690], [860, 745], [862, 782],
      [745, 730], [700, 740], [655, 748], [615, 798], [540, 792], [540, 760],
      [558, 735], [560, 675],
    ]),
  },
];

/* drill-tip sparks: direction (px) and stagger (s) */
const SPARKS = [
  { dx: 26, dy: -22, d: 0 },
  { dx: 34, dy: -6, d: 0.12 },
  { dx: 20, dy: -34, d: 0.24 },
  { dx: 38, dy: 10, d: 0.08 },
  { dx: 12, dy: -28, d: 0.32 },
  { dx: 30, dy: -16, d: 0.18 },
];

/* -------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------- */
export default function MoveAroundSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const rockRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState<HotspotId | null>(null);
  const [hinted, setHinted] = useState(true); // idle "I'm clickable" nudge

  const label = HOTSPOTS.find((h) => h.id === active)?.label ?? "Move around";

  useEffect(() => {
    const section = sectionRef.current;
    const rock = rockRef.current;
    const cursor = cursorRef.current;
    if (!section || !rock || !cursor) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let target = 0; // −1 (left) … 1 (right)
    let x = 0;
    let v = 0;
    let raf = 0;
    let last = 0;

    const render = () => {
      rock.style.transform = `translate3d(${x * MAX_SHIFT}%,0,0) rotate(${x * MAX_TILT}deg)`;
    };

    /* spring → the see-saw settles with a small, natural overshoot */
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.034);
      last = now;
      v += (STIFFNESS * (target - x) - DAMPING * v) * dt;
      x += v * dt;
      render();

      if (Math.abs(target - x) < 0.0005 && Math.abs(v) < 0.0005) {
        x = target;
        v = 0;
        render();
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;

      /* left half → rocks left, right half → rocks right; tanh keeps the
         centre calm and reaches full tilt near the edges */
      target = Math.tanh((nx - 0.5) * 6);

      if (reduce) {
        x = target;
        render();
      } else {
        wake();
      }

      if (e.pointerType === "mouse") {
        cursor.style.opacity = "1";
        cursor.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`;
      }
    };

    const onLeave = () => {
      target = 0;
      cursor.style.opacity = "0";
      reduce ? ((x = 0), render()) : wake();
    };

    section.addEventListener("pointermove", onMove);
    section.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const engage = (id: HotspotId) => {
    setActive(id);
    setHinted(false);
  };

  return (
    <section
      id="explore"
      ref={sectionRef}
      className="hs-section relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-white pt-[72px] sm:pt-[84px]"
      style={{ touchAction: "pan-y" }}
    >
      <h2 className="sr-only">Explore: projects, about me, contact</h2>

      {/* Visible window: crops the empty top of the artwork so the figure
          sits optically centred, like the PDF layout */}
      <div className="relative h-[calc(var(--art)*0.8)] w-[var(--art)] [--art:min(92vw,calc((100svh-132px)*1.2),920px)]">
        <div className="absolute left-0 top-[calc(var(--art)*-0.21)] aspect-square w-full">
          {/* Everything inside rocks together: bench, girl, objects */}
          <div
            ref={rockRef}
            className="absolute inset-0 will-change-transform"
            style={{ transformOrigin: PIVOT }}
          >
            {/* Static artwork */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ART}
              alt="Nimi at work on a rocking bench, with six arms holding a phone, a paintbrush and palette, a drill, a toolbox and a tape measure"
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full select-none"
            />

            {/* Clickable copies of the three objects (clipped to their shape) */}
            {HOTSPOTS.map((h, i) => (
              <Link
                key={h.id}
                href={h.href}
                aria-label={h.aria}
                onPointerEnter={() => engage(h.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => engage(h.id)}
                onBlur={() => setActive(null)}
                draggable={false}
                className={`absolute inset-0 block outline-none will-change-transform ${
                  active === h.id ? h.activeClass : hinted ? "hs-hint" : ""
                }`}
                style={{
                  clipPath: h.clip,
                  transformOrigin: h.origin,
                  transition: "transform .45s cubic-bezier(.34,1.56,.64,1)",
                  animationDelay: hinted && active !== h.id ? `${2.4 + i * 0.4}s` : undefined,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ART}
                  alt=""
                  draggable={false}
                  className="pointer-events-none h-full w-full select-none"
                />
              </Link>
            ))}

            {/* Drill: glow + sparks at the bit */}
            {active === "projects" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute"
                style={{ left: "70.4%", top: "63.5%" }}
              >
                <span className="hs-glow absolute h-[3.2%] w-[3.2%]" />
                {SPARKS.map((s, i) => (
                  <span
                    key={i}
                    className="hs-spark absolute h-[3px] w-[3px] rounded-full"
                    style={
                      {
                        "--dx": `${s.dx}px`,
                        "--dy": `${s.dy}px`,
                        animationDelay: `${s.d}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom cursor: arrow + plain label, no box (fine pointers only) */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className="hs-cursor pointer-events-none fixed left-0 top-0 z-[100] opacity-0 transition-opacity duration-200"
      >
        <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className="block">
          <path
            d="M2 1.5v16.2l4.2-3.9 2.9 6.1 2.7-1.3-2.9-5.9 5.9-.3L2 1.5Z"
            fill="#000"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          key={label}
          className="hs-label absolute left-[10px] top-[26px] m-0 whitespace-nowrap font-normal leading-[1.4] text-[#555252]"
          style={{ fontSize: LABEL_SIZE }}
        >
          {label}
        </span>
      </div>

      <style>{`
        .hs-cursor { display: none; }
        @media (pointer: fine) {
          .hs-section, .hs-section a { cursor: none; }
          .hs-cursor { display: block; }
        }

        .hs-label { animation: hs-fade .16s ease-out both; }
        @keyframes hs-fade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }

        /* About: painting pops forward */
        .hs-pop { transform: scale(1.09) rotate(-1.5deg); }

        /* Contact: phone rings, then rests */
        .hs-ring { animation: hs-ring 1s ease-in-out infinite; }
        @keyframes hs-ring {
          0%, 60%, 100% { transform: scale(1.07) rotate(0deg); }
          8%  { transform: scale(1.07) rotate(-7deg); }
          16% { transform: scale(1.07) rotate(7deg); }
          24% { transform: scale(1.07) rotate(-6deg); }
          32% { transform: scale(1.07) rotate(6deg); }
          42% { transform: scale(1.07) rotate(-3deg); }
          50% { transform: scale(1.07) rotate(2deg); }
        }

        /* Projects: drill vibrates */
        .hs-drill { animation: hs-drill .09s linear infinite; }
        @keyframes hs-drill {
          0%, 100% { transform: scale(1.05) translate(0, 0); }
          25% { transform: scale(1.05) translate(-1.2px, .8px) rotate(.3deg); }
          50% { transform: scale(1.05) translate(1px, -.8px); }
          75% { transform: scale(1.05) translate(-.8px, -1px) rotate(-.3deg); }
        }
        .hs-glow {
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          background: radial-gradient(circle, #fff6c2 0%, #ffd35a 35%, rgba(255,138,31,.55) 60%, rgba(255,138,31,0) 75%);
          animation: hs-flicker .16s ease-in-out infinite alternate;
        }
        @keyframes hs-flicker { from { opacity: .75; scale: .85; } to { opacity: 1; scale: 1.25; } }
        .hs-spark {
          background: #ffb02e;
          box-shadow: 0 0 6px 1px rgba(255,138,31,.9);
          animation: hs-spark .5s ease-out infinite;
        }
        @keyframes hs-spark {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(.3); }
        }

        /* Idle nudge: a quick, quiet pulse every few seconds until first hover */
        .hs-hint { animation: hs-hint 6s ease-in-out infinite; }
        @keyframes hs-hint {
          0%, 88%, 100% { transform: scale(1); }
          94% { transform: scale(1.045); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hs-ring, .hs-drill, .hs-hint, .hs-glow, .hs-spark, .hs-label { animation: none; }
          .hs-spark { display: none; }
        }
      `}</style>
    </section>
  );
}