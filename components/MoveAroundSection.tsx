"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------
 * ASSETS – copy the /hero folder into  public/hero
 *
 * All layers are cut from the 1200 × 1200 illustration, flattened to be fully
 * opaque (the original watercolour alpha caused ghosting and white slivers).
 *
 *   toolbox      toolbox                      static, never rocks
 *   tape         tape measure                 static, never rocks
 *   base         girl, bench, rocker, hands   rocks with the bench
 *   phone        phone only                   rings
 *   paint        canvas only                  pops
 *   drill        drill only                   vibrates (a static copy sits
 *                                             underneath so no gap can show)
 *   phone-over   fingers in front of phone    static
 *   paint-over   hand + brush in front        static
 *
 * x / y / w / h = where each cropped PNG sits in the 1200 × 1200 artwork.
 * ---------------------------------------------------------------------- */
const L = {
  /* toolbox + tape sit on the floor, well clear of the bench shadow even at
     full tilt (they were moved outwards from the original artwork) */
  toolbox: { src: "/hero/Girl2-toolbox.png", x: -80, y: 933, w: 275, h: 236 },
  tape: { src: "/hero/Girl2-tape.png", x: 916, y: 1176, w: 313, h: 108 },
  base: { src: "/hero/Girl2-base.png", x: 183, y: 296, w: 1012, h: 904 },
  phone: { src: "/hero/Girl2-phone.png", x: 296, y: 279, w: 138, h: 217 },
  paint: { src: "/hero/Girl2-paint.png", x: 848, y: 304, w: 287, h: 255 },
  drill: { src: "/hero/Girl2-drill.png", x: 538, y: 587, w: 318, h: 211 },
  phoneOver: { src: "/hero/Girl2-phone-over.png", x: 312, y: 348, w: 55, h: 94 },
  paintOver: { src: "/hero/Girl2-paint-over.png", x: 840, y: 294, w: 176, h: 147 },
} as const;

type LayerKey = keyof typeof L;

/* Bounding box of the whole drawing at rest (artwork px). The visible window
   is cut to exactly this, so the drawing is centred in the frame. */
const COMP = { x: -80, y: 279, w: 1309, h: 1005 };

const box = (k: LayerKey): React.CSSProperties => ({
  left: `${(L[k].x / 1200) * 100}%`,
  top: `${(L[k].y / 1200) * 100}%`,
  width: `${(L[k].w / 1200) * 100}%`,
  height: `${(L[k].h / 1200) * 100}%`,
});

/* -------------------------------------------------------------------------
 * TUNING
 * ---------------------------------------------------------------------- */
const LABEL_SIZE = 16; // cursor label, px (design brief: 14 or 16 – change here)
const MAX_TILT = 7; // degrees the bench rocks at the screen edges
const MAX_SHIFT = 3.2; // % of artwork width the rocker rolls sideways
const STIFFNESS = 70; // spring: higher = snappier
const DAMPING = 9; // spring: lower = more bounce
const PIVOT = "55% 90%"; // rocker pivot (bottom centre of the runner)

/* -------------------------------------------------------------------------
 * HOTSPOTS – invisible hit areas (artwork px) around object + hand
 * ---------------------------------------------------------------------- */
type Pt = [number, number];
type Id = "about" | "contact" | "projects";

const toClip = (pts: Pt[]) =>
  `polygon(${pts
    .map(([x, y]) => `${(x / 12).toFixed(2)}% ${(y / 12).toFixed(2)}%`)
    .join(",")})`;

const HOTSPOTS: { id: Id; label: string; aria: string; href: string; clip: string }[] = [
  {
    id: "about",
    label: "About Me",
    aria: "About me",
    href: "/about",
    clip: toClip([
      [838, 292], [962, 305], [968, 352], [1140, 362], [1146, 470], [1100, 560],
      [935, 535], [925, 495], [935, 470], [990, 440], [985, 400], [900, 392], [868, 345],
    ]),
  },
  {
    id: "contact",
    label: "Contact",
    aria: "Contact",
    href: "/contact",
    clip: toClip([
      [300, 274], [442, 274], [442, 415], [420, 500], [335, 500], [322, 470],
      [285, 462], [268, 415], [290, 360], [303, 330],
    ]),
  },
  {
    id: "projects",
    label: "Projects",
    aria: "Projects",
    href: "/projects",
    clip: toClip([
      [565, 586], [640, 586], [700, 626], [742, 690], [862, 742], [866, 784],
      [745, 732], [700, 746], [655, 752], [615, 802], [536, 800], [536, 760],
      [556, 735], [560, 675],
    ]),
  },
];

const ACTIVE_CLASS: Record<Id, string> = {
  about: "hs-pop",
  contact: "hs-ring",
  projects: "hs-drill",
};

/* drill-bit sparks (px travel, stagger in s) */
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

  const [active, setActive] = useState<Id | null>(null);
  const [hinted, setHinted] = useState(true);

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
    let inside = false;

    const render = () => {
      rock.style.transform = `translate3d(${x * MAX_SHIFT}%,0,0) rotate(${x * MAX_TILT}deg)`;
    };

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

    const onLeave = () => {
      inside = false;
      target = 0;
      cursor.style.opacity = "0";
      if (reduce) {
        x = 0;
        render();
      } else {
        wake();
      }
    };

    /* Window-level listener so nothing layered on top can swallow movement.
       Only reacts while the pointer is over this section. */
    const onMove = (e: PointerEvent) => {
      const r = section.getBoundingClientRect();
      const inRect =
        e.clientX >= r.left &&
        e.clientX <= r.right &&
        e.clientY >= r.top &&
        e.clientY <= r.bottom;

      /* The fixed header (and mobile menu) sit on top of this section, so the
         pointer can be inside the section's box while hovering the nav.
         Treat that as "outside": no custom cursor, no label, no rocking. */
      const onChrome = !!(e.target as Element | null)?.closest?.("header, nav");
      const over = inRect && !onChrome;

      if (!over) {
        if (inside) onLeave();
        return;
      }
      inside = true;

      /* left half rocks left, right half rocks right; tanh keeps the centre
         calm and reaches full tilt near the edges */
      const nx = (e.clientX - r.left) / r.width;
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

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const engage = (id: Id) => {
    setActive(id);
    setHinted(false);
  };

  /* one image layer */
  const layer = (k: LayerKey, extra = "", style: React.CSSProperties = {}) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={L[k].src}
      alt=""
      draggable={false}
      decoding="async"
      className={`pointer-events-none absolute select-none ${extra}`}
      style={{ ...box(k), ...style }}
    />
  );

  /* moving layer of an object: pops / rings / vibrates only while active */
  const mover = (k: "phone" | "paint" | "drill", id: Id, origin: string, i: number) =>
    layer(
      k,
      `hs-layer ${active === id ? ACTIVE_CLASS[id] : hinted ? "hs-hint" : ""}`,
      {
        transformOrigin: origin,
        animationDelay: hinted && active !== id ? `${2.4 + i * 0.4}s` : undefined,
      }
    );

  return (
    <section
      id="explore"
      ref={sectionRef}
      className="hs-section relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-white pt-[72px] sm:pt-[84px]"
      style={{ touchAction: "pan-y" }}
    >
      <h2 className="sr-only">Explore: projects, about me, contact</h2>

      {/* Visible window – cut to the drawing's own bounding box (COMP) so the
          whole illustration sits centred in the frame */}
      <div
        className="relative"
        style={
          {
            "--art": `min(calc(92vw * ${1200 / COMP.w}), calc((100svh - 132px) * ${1200 / COMP.h}), 920px)`,
            width: `calc(var(--art) * ${COMP.w / 1200})`,
            height: `calc(var(--art) * ${COMP.h / 1200})`,
          } as React.CSSProperties
        }
      >
        <div
          className="absolute aspect-square"
          style={{
            width: "var(--art)",
            left: `calc(var(--art) * ${-COMP.x / 1200})`,
            top: `calc(var(--art) * ${-COMP.y / 1200})`,
          }}
        >
          {/* Everything inside rocks together: bench, girl, hands, objects */}
          <div
            ref={rockRef}
            className="absolute inset-0"
            style={{ transformOrigin: PIVOT, willChange: "transform" }}
          >
            {/* Girl, bench, rocker, hands (objects removed) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={L.base.src}
              alt="Nimi at work on a rocking bench, with six arms holding a phone, a paintbrush and palette, a drill, a toolbox and a tape measure"
              draggable={false}
              decoding="async"
              className="pointer-events-none absolute select-none"
              style={box("base")}
            />

            {/* Static copy of the drill: guarantees no gap shows while it vibrates */}
            {layer("drill")}

            {/* Moving objects */}
            {mover("phone", "contact", "41% 65%", 0)}
            {mover("paint", "about", "49% 49%", 1)}
            {mover("drill", "projects", "50% 51%", 2)}

            {/* Fingers + brush stay in front and never move */}
            {layer("phoneOver")}
            {layer("paintOver")}

            {/* Drill bit: glow + sparks */}
            {active === "projects" && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <span
                  className="hs-glow absolute"
                  style={{
                    left: "70.4%",
                    top: "63.5%",
                    width: "calc(var(--art) * 0.034)",
                    height: "calc(var(--art) * 0.034)",
                  }}
                />
                {SPARKS.map((s, i) => (
                  <span
                    key={i}
                    className="hs-spark absolute h-[3px] w-[3px] rounded-full"
                    style={
                      {
                        left: "70.4%",
                        top: "63.5%",
                        "--dx": `${s.dx}px`,
                        "--dy": `${s.dy}px`,
                        animationDelay: `${s.d}s`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            )}

            {/* Invisible click areas */}
            {HOTSPOTS.map((h) => (
              <Link
                key={h.id}
                href={h.href}
                aria-label={h.aria}
                onPointerEnter={() => engage(h.id)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => engage(h.id)}
                onBlur={() => setActive(null)}
                draggable={false}
                className="absolute inset-0 block outline-none"
                style={{ clipPath: h.clip }}
              />
            ))}
          </div>

          {/* Toolbox + tape measure: static, in front of the shadow, never rock */}
          {layer("toolbox")}
          {layer("tape")}
        </div>
      </div>

      {/* Custom cursor: arrow + plain label underneath. No box, no border. */}
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

        /* soft halo keeps the plain text legible over the artwork without a box */
        .hs-label {
          text-shadow: 0 0 6px #fff, 0 0 3px #fff;
          animation: hs-fade .16s ease-out both;
        }
        @keyframes hs-fade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }

        .hs-layer { transition: transform .45s cubic-bezier(.34,1.56,.64,1); will-change: transform; }

        /* About: canvas pops forward (brush + hand stay put) */
        .hs-pop { transform: scale(1.08) rotate(-1.2deg); }

        /* Contact: phone rings, fingers stay put */
        .hs-ring { animation: hs-ring 1s ease-in-out infinite; }
        @keyframes hs-ring {
          0%, 60%, 100% { transform: scale(1.04) rotate(0deg); }
          8%  { transform: scale(1.04) rotate(-5deg); }
          16% { transform: scale(1.04) rotate(5deg); }
          24% { transform: scale(1.04) rotate(-4deg); }
          32% { transform: scale(1.04) rotate(4deg); }
          42% { transform: scale(1.04) rotate(-2deg); }
          50% { transform: scale(1.04) rotate(1.5deg); }
        }

        /* Projects: drill vibrates, hand stays put */
        .hs-drill { animation: hs-drill .09s linear infinite; }
        @keyframes hs-drill {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1.2px, .8px) rotate(.25deg); }
          50% { transform: translate(1px, -.8px) rotate(0deg); }
          75% { transform: translate(-.8px, -1px) rotate(-.25deg); }
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

        /* Idle nudge until first hover: a quick, quiet pulse every few seconds */
        .hs-hint { animation: hs-hint 6s ease-in-out infinite; }
        @keyframes hs-hint {
          0%, 88%, 100% { transform: scale(1); }
          94% { transform: scale(1.04); }
        }

        @media (prefers-reduced-motion: reduce) {
          .hs-ring, .hs-drill, .hs-hint, .hs-glow, .hs-spark, .hs-label { animation: none; }
          .hs-spark { display: none; }
        }
      `}</style>
    </section>
  );
}