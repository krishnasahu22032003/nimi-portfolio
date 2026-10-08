"use client";

import Link from "next/link";
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------
 * ASSETS  (all PNGs are black; CSS inverts them to white and the overlay
 * uses mix-blend-mode: difference → black on light images, white on dark)
 *   public/projects/cursor-small.png    <- Small_.png   (solid small flower)
 *   public/projects/cursor-big.png      <- Big.png      (big flower w/ diamond hole)
 *   public/projects/cursor-diamond.png  <- Diamond.png  (outlined diamond)
 * ---------------------------------------------------------------------- */
const ICON_SMALL = "/projects/cursor-small.png";
const ICON_BIG = "/projects/cursor-big.png";
const ICON_DIAMOND = "/projects/cursor-diamond.png";

const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["500"], display: "swap" });

/* -------------------------------------------------------------------------
 * PROJECTS – 4 vertical + 4 horizontal, alternating (V H V H …)
 * ---------------------------------------------------------------------- */
type Project = { slug: string; title: string; orientation: "v" | "h"; img: string; href: string };

const seedImg = (seed: string, o: "v" | "h") =>
  `https://picsum.photos/seed/${seed}/${o === "v" ? "900/1600" : "1600/900"}`;

const PROJECTS: Project[] = [
  { slug: "one", title: "Project One", orientation: "v" },
  { slug: "two", title: "Project Two", orientation: "h" },
  { slug: "three", title: "Project Three", orientation: "v" },
  { slug: "four", title: "Project Four", orientation: "h" },
  { slug: "five", title: "Project Five", orientation: "v" },
  { slug: "six", title: "Project Six", orientation: "h" },
  { slug: "seven", title: "Project Seven", orientation: "v" },
  { slug: "eight", title: "Project Eight", orientation: "h" },
].map((p) => ({
  ...p,
  orientation: p.orientation as "v" | "h",
  img: seedImg(`nimi-${p.slug}`, p.orientation as "v" | "h"),
  href: `/projects/${p.slug}`,
}));

/* -------------------------------------------------------------------------
 * TUNING
 * Reference at 1280px: vertical 329px (25.7vw) · horizontal 622px (48.6vw)
 * ---------------------------------------------------------------------- */
const V_W = 25.7; // vertical frame width, in --u
const H_W = 48.6; // horizontal frame width, in --u
const EASE = 0.085; // slider smoothing (lower = floatier)
const WHEEL_SPEED = 1.15; // wheel px -> slider px
const PARALLAX = 0.12; // image drifts inside its frame
const DWELL_MS = 380; // time on an image before "OPEN PROJECT" + big flower
const LABEL = "OPEN PROJECT";

/* Diamond sits inside the big flower's hole. Both PNGs share a square canvas,
   but the hole is not exactly where the diamond is drawn, so we offset it.
   Nudge these (in % of icon size) if you want to fine-tune the fit. */
const DIAMOND_X = -3.4;
const DIAMOND_Y = 2.2;

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

/* -------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------- */
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  // which frame is hovered + animation stage (0 idle · 1 small flower · 2 label + big flower + diamond)
  const [hover, setHover] = useState<{ i: number; stage: 0 | 1 | 2 }>({ i: -1, stage: 0 });

  const api = useRef({
    centers: [] as number[],
    widths: [] as number[],
    f: 0,
    target: 0,
    raf: 0,
    active: 0,
    dragged: false,
    wake: () => {},
    goTo: (_i: number) => {},
  });
  const dwell = useRef<number | undefined>(undefined);

  /* ---------- slider engine ---------- */
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const s = api.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vw = window.innerWidth;
    let last = 0;
    let snapTimer: number | undefined;

    const measure = () => {
      vw = section.clientWidth;
      s.centers = frameRefs.current.map((el) => (el ? el.offsetLeft + el.offsetWidth / 2 : 0));
      s.widths = frameRefs.current.map((el) => el?.offsetWidth ?? 0);
      const lo = s.centers[0] ?? 0;
      const hi = s.centers[s.centers.length - 1] ?? 0;
      s.target = clamp(s.target, lo, hi);
      s.f = clamp(s.f, lo, hi);
      render();
    };

    const bounds = () => [s.centers[0] ?? 0, s.centers[s.centers.length - 1] ?? 0] as const;

    const nearest = (f: number) => {
      let best = 0;
      s.centers.forEach((c, i) => {
        if (Math.abs(c - f) < Math.abs(s.centers[best] - f)) best = i;
      });
      return best;
    };

    const render = () => {
      track.style.transform = `translate3d(${vw / 2 - s.f}px,0,0)`;
      s.centers.forEach((c, i) => {
        const img = imgRefs.current[i];
        if (!img) return;
        const max = s.widths[i] * 0.09;
        const shift = clamp(-(c - s.f) * PARALLAX, -max, max);
        img.style.transform = `translate3d(${shift}px,0,0)`;
      });
      s.active = nearest(s.f);
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      const k = reduce ? 1 : 1 - Math.pow(1 - EASE, dt * 60);
      s.f += (s.target - s.f) * k;
      if (Math.abs(s.target - s.f) < 0.1) s.f = s.target;
      render();
      s.raf = s.f !== s.target ? requestAnimationFrame(tick) : 0;
    };

    s.wake = () => {
      if (!s.raf) {
        last = performance.now();
        s.raf = requestAnimationFrame(tick);
      }
    };

    s.goTo = (i: number) => {
      s.target = s.centers[clamp(i, 0, s.centers.length - 1)];
      s.wake();
    };

    const snap = () => s.goTo(nearest(s.target));

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const [lo, hi] = bounds();
      if ((d < 0 && s.target <= lo + 0.5) || (d > 0 && s.target >= hi - 0.5)) return;
      e.preventDefault();
      s.target = clamp(s.target + d * WHEEL_SPEED, lo, hi);
      s.wake();
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    };

    let down = false;
    let startX = 0;
    let startF = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      down = true;
      s.dragged = false;
      startX = lastX = e.clientX;
      startF = s.target;
      lastT = performance.now();
      vel = 0;
    };
    const onDragMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6) s.dragged = true;
      if (!s.dragged) return;
      const now = performance.now();
      vel = (lastX - e.clientX) / Math.max(now - lastT, 1);
      lastX = e.clientX;
      lastT = now;
      const [lo, hi] = bounds();
      s.target = clamp(startF - dx, lo, hi);
      s.wake();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (s.dragged) {
        const [lo, hi] = bounds();
        const thrown = clamp(s.target + vel * 280, lo, hi);
        s.goTo(nearest(thrown));
        window.setTimeout(() => (s.dragged = false), 0);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!section.matches(":hover")) return;
      if (e.key === "ArrowRight") s.goTo(s.active + 1);
      if (e.key === "ArrowLeft") s.goTo(s.active - 1);
    };

    measure();
    // start with the first horizontal frame centred: V · [H] · V
    s.f = s.target = s.centers[1] ?? s.centers[0] ?? 0;
    render();

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(track);
    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(s.raf);
      window.clearTimeout(snapTimer);
      ro.disconnect();
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onDragMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => () => window.clearTimeout(dwell.current), []);

  /* ---------- hover: icon + label live in the CENTRE of the hovered frame ---------- */
  const enter = (e: React.PointerEvent, i: number) => {
    if (e.pointerType !== "mouse") return;
    setHover({ i, stage: 1 });
    window.clearTimeout(dwell.current);
    dwell.current = window.setTimeout(() => setHover({ i, stage: 2 }), DWELL_MS);
  };
  const leave = () => {
    window.clearTimeout(dwell.current);
    setHover({ i: -1, stage: 0 });
  };

  const onFrameClick = (e: React.MouseEvent, i: number) => {
    const s = api.current;
    if (s.dragged) return e.preventDefault();
    if (i !== s.active) {
      e.preventDefault();
      s.goTo(i);
    }
  };

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={`ps-section ${grotesk.className} relative flex h-[100svh] min-h-[480px] items-center overflow-hidden bg-white`}
      style={{
        touchAction: "pan-y",
        // frame height = 100svh − 200px → 100px of white above and below, carousel dead-centre
        ["--u" as string]: "min(1vw, calc((100svh - 200px) / 45.7))",
      }}
    >
      <h2 className="sr-only">Projects</h2>

      <div ref={trackRef} className="ps-track flex w-max items-center" style={{ willChange: "transform" }}>
        {PROJECTS.map((p, i) => {
          const v = p.orientation === "v";
          const stage = hover.i === i ? hover.stage : 0;
          return (
            <Link
              key={p.slug}
              href={p.href}
              ref={(el) => {
                frameRefs.current[i] = el;
              }}
              aria-label={`Open project: ${p.title}`}
              draggable={false}
              onClick={(e) => onFrameClick(e, i)}
              onPointerEnter={(e) => enter(e, i)}
              onPointerLeave={leave}
              className="ps-frame relative block shrink-0 overflow-hidden bg-[#efefef]"
              style={{
                width: `calc(var(--u) * ${v ? V_W : H_W})`,
                aspectRatio: v ? "9 / 16" : "16 / 9",
                ["--i" as string]: i,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                src={p.img}
                alt={p.title}
                draggable={false}
                loading={i < 4 ? "eager" : "lazy"}
                className="pointer-events-none absolute top-0 h-full max-w-none select-none object-cover"
                style={{ width: "120%", left: "-10%", willChange: "transform" }}
              />

              {/* centred hover overlay (icon + label) */}
              <div className="ps-hover" aria-hidden="true" data-stage={stage}>
                <div className="ps-icon">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="ps-small" src={ICON_SMALL} alt="" draggable={false} />
                  <div className="ps-big">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ps-flower" src={ICON_BIG} alt="" draggable={false} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ps-diamond" src={ICON_DIAMOND} alt="" draggable={false} />
                  </div>
                </div>
                <span className="ps-label">
                  {LABEL.split("").map((ch, k) => (
                    <span key={k} style={{ transitionDelay: `${k * 18}ms` }}>
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  ))}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        /* intro: frames unveil left → right */
        .ps-frame { animation: ps-in 1.1s cubic-bezier(.77,0,.18,1) both; animation-delay: calc(var(--i) * 70ms); }
        @keyframes ps-in { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0 0 0 0); } }

        /* hover overlay — centred in the frame, hidden on touch devices */
        .ps-hover { display: none; }
        @media (pointer: fine) {
          .ps-hover {
            display: flex; align-items: center; gap: 8px;
            position: absolute; left: 50%; top: 50%;
            transform: translate(-50%, -50%);
            z-index: 2; pointer-events: none;
            color: #fff; mix-blend-mode: difference;   /* white on dark, black on light */
          }
        }

        .ps-icon { position: relative; width: 24px; height: 24px; flex: none; }
        .ps-icon img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          filter: invert(1); user-select: none;
        }
        .ps-small, .ps-big {
          position: absolute; inset: 0;
          transform-origin: 0 100%;                 /* swings from the bottom-left corner */
          opacity: 0;
          transition: transform .8s cubic-bezier(.22,1,.36,1), opacity .4s ease;
        }
        .ps-small { transform: rotate(-90deg) scale(.55); }
        .ps-big   { transform: rotate(-90deg) scale(.55); }

        /* stage 1: small flower swings in */
        .ps-hover[data-stage="1"] .ps-small { transform: rotate(0) scale(.55); opacity: 1; }

        /* stage 2: small flower grows + rotates away, big flower takes over */
        .ps-hover[data-stage="2"] .ps-small { transform: rotate(90deg) scale(1); opacity: 0; }
        .ps-hover[data-stage="2"] .ps-big   { transform: rotate(0) scale(1); opacity: 1; }

        /* diamond grows inside the flower's hole (rotates together with the flower) */
        .ps-diamond {
          transform-origin: 53.6% 50%;               /* diamond's own centre in its canvas */
          transform: translate(${DIAMOND_X}%, ${DIAMOND_Y}%) scale(0);
          transition: transform .7s cubic-bezier(.22,1,.36,1) 0s;
        }
        .ps-hover[data-stage="2"] .ps-diamond {
          transform: translate(${DIAMOND_X}%, ${DIAMOND_Y}%) scale(1);
          transition-delay: .35s;
        }

        .ps-label {
          display: flex; overflow: hidden; white-space: nowrap;
          font-size: 12px; line-height: 1.5; font-weight: 500;
          letter-spacing: .02em; text-transform: uppercase;
        }
        .ps-label span {
          display: inline-block; transform: translateY(110%);
          transition: transform .55s cubic-bezier(.22,1,.36,1);
        }
        .ps-hover[data-stage="2"] .ps-label span { transform: translateY(0); }

        @media (prefers-reduced-motion: reduce) {
          .ps-frame { animation: none; }
          .ps-small, .ps-big, .ps-diamond, .ps-label span { transition-duration: .01s; transition-delay: 0s !important; }
        }
      `}</style>
    </section>
  );
}