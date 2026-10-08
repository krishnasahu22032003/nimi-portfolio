"use client";

import Link from "next/link";
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------
 * ASSETS  (PNGs are black; CSS inverts them to white and the overlay uses
 * mix-blend-mode: difference → black on light images, white on dark ones)
 *   public/projects/cursor-small.png    <- Small_.png   (solid small flower)
 *   public/projects/cursor-big.png      <- Big.png      (flower with diamond hole)
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
  `https://picsum.photos/seed/${seed}/${o === "v" ? "1100/1600" : "1600/900"}`;

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

const N = PROJECTS.length;
/* three copies back to back → endless loop (we always rest in the middle copy) */
const LOOP = [...PROJECTS, ...PROJECTS, ...PROJECTS];

/* -------------------------------------------------------------------------
 * TUNING  (all frame sizes in --u, where 1u = 1vw capped by viewport height)
 * ---------------------------------------------------------------------- */
const U_BASE = 45.7; // sizes the unit --u (unchanged → horizontal frames stay exactly the same)
const V_W = 32; // vertical frame width (unchanged)
const V_H = 41; // vertical frame height (unchanged)
const H_W = 48; // horizontal frame width (unchanged)
const H_H = 27; // horizontal frame height (unchanged)
const EASE = 0.085; // slider smoothing (lower = floatier)
const WHEEL_SPEED = 1.15; // wheel px -> slider px
const PARALLAX = 0.12; // image drifts inside its frame
const LABEL = "OPEN PROJECT";

/* flower / diamond */
const ICON_PX = 24; // size of the big flower (after interaction, unchanged)
const SMALL_SCALE = 0.6; // resting size of the flower (fraction of ICON_PX)

/* ROTATION — 90 / 180 / 360. The diamond is positioned from this value (see geometry below),
   so any multiple of 90 stays perfectly aligned.  360 = full turn · 180 = half · 90 = quarter. */
const ROTATE_DEG = 180;

/* label vertical alignment: lifts the text so its cap-height centre sits on the flower's centre */
const LABEL_NUDGE_EM = 0.14;

/* ENTER timings (unchanged) */
const ENTER_MS = 1400; // flower grow + rotate on hover
const DIAMOND_IN_DELAY = 550; // diamond appears this long after the flower starts growing
const DIAMOND_IN_MS = 900;
const LABEL_IN_DELAY = 250; // label rises (from below) this long after hover starts
const LABEL_IN_MS = 650;

/* LEAVE timings — measured from her reference recordings */
const LEAVE_DELAY = 200; // short hold before the flower moves
const LEAVE_MS = 1800; // flower shrink + rotate back (long, steady)
const DIAMOND_OUT_DELAY = 200;
const DIAMOND_OUT_MS = 600; // diamond gone by ~0.8s
const LABEL_OUT_DELAY = 450; // label slides UP and out through the top of its mask ~0.45s → ~1.0s
const LABEL_OUT_MS = 550;
const SWAP_OUT_DELAY = 750; // big-flower-with-hole → solid flower once the diamond is gone

/* -------------------------------------------------------------------------
 * DIAMOND GEOMETRY — measured from the 3000×3000 PNGs
 *   hole in Big.png  : bbox x 1002–2001, y 1086–2112  → centre (1501.5, 1599), 999 × 1026
 *   Diamond.png ink  : bbox x 1061–2149, y 972–2021   → centre (1605, 1496.5), 1088 × 1049
 * The flower rotates about the canvas centre, so the hole moves when it rotates. We therefore
 * park the diamond where the hole ENDS UP, and stretch it to the hole's exact width/height
 * (+1.2 % overlap so no hairline gap shows). The diamond's outer edge then merges with the
 * petals and the lines read clean.
 * ---------------------------------------------------------------------- */
const CANVAS = 3000;
const HOLE_C = { x: 1501.5, y: 1599 };
const HOLE_SZ = { w: 999, h: 1026 };
const DIA_C = { x: 1605, y: 1496.5 };
const DIA_SZ = { w: 1088, h: 1049 };
const OVERLAP = 1.012;

const RAD = (ROTATE_DEG * Math.PI) / 180;
const HX = HOLE_C.x / CANVAS - 0.5;
const HY = HOLE_C.y / CANVAS - 0.5;
const END_X = 0.5 + HX * Math.cos(RAD) - HY * Math.sin(RAD); // hole centre after rotation (fraction of icon)
const END_Y = 0.5 + HX * Math.sin(RAD) + HY * Math.cos(RAD);
const QUARTER = Math.round(ROTATE_DEG / 90) % 2 === 1; // 90°/270° swap the hole's width and height
const D_SX = ((QUARTER ? HOLE_SZ.h : HOLE_SZ.w) / DIA_SZ.w) * OVERLAP;
const D_SY = ((QUARTER ? HOLE_SZ.w : HOLE_SZ.h) / DIA_SZ.h) * OVERLAP;
const D_TX = ((END_X - DIA_C.x / CANVAS) * 100).toFixed(3); // % translate: diamond centre → hole centre
const D_TY = ((END_Y - DIA_C.y / CANVAS) * 100).toFixed(3);
const D_OX = (END_X * 100).toFixed(3); // scale-in origin = where the hole ends up
const D_OY = (END_Y * 100).toFixed(3);
const D_IMG_OX = ((DIA_C.x / CANVAS) * 100).toFixed(3); // stretch about the diamond's own centre
const D_IMG_OY = ((DIA_C.y / CANVAS) * 100).toFixed(3);

const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const mod = (a: number, b: number) => ((a % b) + b) % b;

/* current translateY (px) of an element, even mid-animation */
const currentY = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform;
  return !t || t === "none" ? 0 : new DOMMatrixReadOnly(t).m42;
};

/* -------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------- */
export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);

  const api = useRef({
    centers: [] as number[],
    widths: [] as number[],
    loop: 0, // width of one full set of 8 frames
    f: 0, // current focus (track px at viewport centre)
    target: 0,
    raf: 0,
    active: N + 1,
    dragged: false,
    wake: () => {},
    goTo: (_i: number) => {},
  });

  /* ---------- slider engine (unchanged) ---------- */
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const s = api.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vw = window.innerWidth;
    let last = 0;
    let snapTimer: number | undefined;

    // drag state (declared up-front because wrap() shifts startF too)
    let down = false;
    let startX = 0;
    let startF = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0;

    /* keep the focus inside the middle copy; shifting by exactly one loop is invisible */
    const wrap = () => {
      const L = s.loop;
      if (!L) return;
      const lo = s.centers[N] - L / 2;
      const hi = lo + L;
      while (s.f < lo) {
        s.f += L;
        s.target += L;
        startF += L;
      }
      while (s.f >= hi) {
        s.f -= L;
        s.target -= L;
        startF -= L;
      }
    };

    const nearest = (f: number) => {
      let best = 0;
      s.centers.forEach((c, i) => {
        if (Math.abs(c - f) < Math.abs(s.centers[best] - f)) best = i;
      });
      return best;
    };

    /* px position of the frame centre closest to t (works even if t is beyond the 3 copies) */
    const snapPx = (t: number) => {
      const L = s.loop;
      if (!L) return t;
      const lo = s.centers[N] - L / 2;
      const m = mod(t - lo, L) + lo;
      return s.centers[nearest(m)] + (t - m);
    };

    const render = () => {
      track.style.transform = `translate3d(${vw / 2 - s.f}px,0,0)`;
      const L = s.loop;
      s.centers.forEach((c, i) => {
        const img = imgRefs.current[i];
        if (!img) return;
        let d = c - s.f;
        if (L) d = mod(d + L / 2, L) - L / 2; // wrap-safe distance → no parallax jump at the seam
        const max = s.widths[i] * 0.09;
        img.style.transform = `translate3d(${clamp(-d * PARALLAX, -max, max)}px,0,0)`;
      });
      s.active = nearest(s.f);
    };

    const measure = () => {
      vw = section.clientWidth;
      const t0 = track.getBoundingClientRect().left;
      const rects = frameRefs.current.map((el) => el?.getBoundingClientRect());
      s.centers = rects.map((r) => (r ? r.left - t0 + r.width / 2 : 0));
      s.widths = rects.map((r) => r?.width ?? 0);
      s.loop = (s.centers[N] ?? 0) - (s.centers[0] ?? 0);
      // stay on the same frame after a resize
      s.f = s.target = s.centers[s.active] ?? 0;
      wrap();
      render();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;
      const k = reduce ? 1 : 1 - Math.pow(1 - EASE, dt * 60);
      s.f += (s.target - s.f) * k;
      if (Math.abs(s.target - s.f) < 0.1) s.f = s.target;
      wrap();
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

    const snap = () => {
      s.target = snapPx(s.target);
      s.wake();
    };

    /* wheel / trackpad — endless, so it always drives the slider */
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      s.target += d * WHEEL_SPEED;
      s.wake();
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snap, 140);
    };

    /* drag / swipe */
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
      s.target = startF - dx;
      s.wake();
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (s.dragged) {
        s.target = snapPx(s.target + vel * 280);
        s.wake();
        window.setTimeout(() => (s.dragged = false), 0);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!section.matches(":hover")) return;
      if (e.key === "ArrowRight") s.goTo(s.active + 1);
      if (e.key === "ArrowLeft") s.goTo(s.active - 1);
    };

    // start with the first horizontal frame of the middle copy centred: V · [H] · V
    s.active = N + 1;
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(section);
    section.addEventListener("wheel", onWheel, { passive: false });
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onDragMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
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

  const onFrameClick = (e: React.MouseEvent, i: number) => {
    const s = api.current;
    if (s.dragged) return e.preventDefault();
    if (i !== s.active) {
      e.preventDefault();
      s.goTo(i);
    }
  };

  /* ---------- label: two different motions ----------
     enter → rises in from BELOW · leave → slides UP and out through the top of the mask.
     We read the label's live position so leaving/entering mid-animation never jumps. */
  const labelEnter = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const a = e.currentTarget;
    const el = a.querySelector<HTMLElement>(".ps-label-in");
    if (!el) return;
    const h = el.offsetHeight;
    const y = currentY(el);
    const hidden = y >= h * 0.98 || y <= -h * 0.98; // fully clipped (below or above) → start from below
    el.style.setProperty("--ly0", `${hidden ? h * 1.1 : y}px`);
    a.classList.remove("is-out", "is-in");
    void el.offsetWidth; // restart the animation
    a.classList.add("is-in");
  };

  const labelLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const a = e.currentTarget;
    const el = a.querySelector<HTMLElement>(".ps-label-in");
    if (!el) return;
    const h = el.offsetHeight;
    const y = currentY(el);
    if (y >= h * 0.98) {
      // never became visible → nothing to exit
      a.classList.remove("is-in", "is-out");
      return;
    }
    el.style.setProperty("--ly0", `${y}px`);
    el.style.setProperty("--ly1", `${-h * 1.1}px`);
    a.classList.remove("is-in", "is-out");
    void el.offsetWidth;
    a.classList.add("is-out");
  };

  return (
    <section
      id="projects"
      ref={sectionRef}
      className={`ps-section ${grotesk.className} relative flex h-[100svh] min-h-[480px] items-center overflow-hidden bg-white`}
      style={{
        touchAction: "pan-y",
        // --u is sized from U_BASE (not V_H) so horizontal frames never change when V_H changes
        ["--u" as string]: `min(1vw, calc((100svh - 140px) / ${U_BASE}))`,
      }}
    >
      <h2 className="sr-only">Projects</h2>

      <div ref={trackRef} className="ps-track flex w-max items-center" style={{ willChange: "transform" }}>
        {LOOP.map((p, i) => {
          const v = p.orientation === "v";
          const isMain = i >= N && i < N * 2; // only the middle copy is exposed to AT / keyboard
          return (
            <Link
              key={`${p.slug}-${Math.floor(i / N)}`}
              href={p.href}
              ref={(el) => {
                frameRefs.current[i] = el;
              }}
              aria-label={`Open project: ${p.title}`}
              aria-hidden={isMain ? undefined : true}
              tabIndex={isMain ? undefined : -1}
              draggable={false}
              onClick={(e) => onFrameClick(e, i)}
              onPointerEnter={labelEnter}
              onPointerLeave={labelLeave}
              className="ps-frame relative block shrink-0 overflow-hidden bg-[#efefef]"
              style={{
                width: `calc(var(--u) * ${v ? V_W : H_W})`,
                height: `calc(var(--u) * ${v ? V_H : H_H})`,
                ["--i" as string]: i % N,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                src={p.img}
                alt={isMain ? p.title : ""}
                draggable={false}
                loading="eager"
                className="pointer-events-none absolute top-0 h-full max-w-none select-none object-cover"
                style={{ width: "120%", left: "-10%", willChange: "transform" }}
              />

              {/* flower + label: anchored to the exact centre of the frame */}
              <div className="ps-hover" aria-hidden="true">
                <div className="ps-icon">
                  {/* rotating + scaling layer */}
                  <div className="ps-flower">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ps-solid" src={ICON_SMALL} alt="" draggable={false} />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="ps-big" src={ICON_BIG} alt="" draggable={false} />
                  </div>
                  {/* diamond: scales only, never rotates; parked exactly on the hole */}
                  <div className="ps-diamond">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ICON_DIAMOND} alt="" draggable={false} />
                  </div>
                </div>
                <span className="ps-label">
                  <span className="ps-label-in">{LABEL}</span>
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
        .ps-frame:focus { outline: none; }
        .ps-frame:focus-visible { outline: 2px solid #000; outline-offset: -2px; }

        /* overlay — zero-size anchor at the frame's centre; difference blend = black on light, white on dark */
        .ps-hover {
          position: absolute; left: 50%; top: 50%; width: 0; height: 0;
          z-index: 2; pointer-events: none;
          color: #fff; mix-blend-mode: difference;
        }

        .ps-icon { position: absolute; left: -${ICON_PX / 2}px; top: -${ICON_PX / 2}px; width: ${ICON_PX}px; height: ${ICON_PX}px; }
        .ps-icon img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          filter: invert(1); user-select: none; -webkit-user-drag: none;
        }

        /* ---------- RESTING / LEAVE state (these transitions play when the cursor leaves) ---------- */

        /* flower: always there, small, in the centre — slow steady shrink + rotate back */
        .ps-flower {
          position: absolute; inset: 0;
          transform-origin: 50% 50%;
          transform: scale(${SMALL_SCALE}) rotate(0deg);
          transition: transform ${LEAVE_MS}ms cubic-bezier(.4,0,.2,1) ${LEAVE_DELAY}ms;
          will-change: transform;
        }
        /* solid flower ↔ flower with the diamond hole (same silhouette) — swap once the diamond is gone */
        .ps-solid { opacity: 1; transition: opacity .25s ease ${SWAP_OUT_DELAY}ms; }
        .ps-big   { opacity: 0; transition: opacity .25s ease ${SWAP_OUT_DELAY}ms; }

        /* diamond: scales about the hole's final centre, no rotation.
           The inner img is stretched to the hole's exact size so the outline merges cleanly with the petals. */
        .ps-diamond {
          position: absolute; inset: 0;
          transform-origin: ${D_OX}% ${D_OY}%;
          transform: scale(0);
          transition: transform ${DIAMOND_OUT_MS}ms cubic-bezier(.4,0,.2,1) ${DIAMOND_OUT_DELAY}ms;
          will-change: transform;
        }
        .ps-diamond img {
          transform-origin: ${D_IMG_OX}% ${D_IMG_OY}%;
          transform: translate(${D_TX}%, ${D_TY}%) scale(${D_SX.toFixed(4)}, ${D_SY.toFixed(4)});
        }

        /* label: one line in a mask, to the right of the flower, optically centred on it */
        .ps-label {
          position: absolute; left: ${ICON_PX / 2 + 8}px; top: 0;
          transform: translateY(calc(-50% - ${LABEL_NUDGE_EM}em));
          display: block; overflow: hidden; white-space: nowrap;
          font-size: 12px; line-height: 1.5; font-weight: 500;
          letter-spacing: .02em; text-transform: uppercase;
        }
        .ps-label-in { display: block; transform: translateY(110%); } /* idle: hidden below the mask */

        /* enter: rises from below · leave: slides up and out through the top (positions set live by JS) */
        @keyframes ps-lab-in  { from { transform: translateY(var(--ly0, 110%)); } to { transform: translateY(0); } }
        @keyframes ps-lab-out { from { transform: translateY(var(--ly0, 0px)); }  to { transform: translateY(var(--ly1, -110%)); } }
        .ps-frame.is-in  .ps-label-in { animation: ps-lab-in  ${LABEL_IN_MS}ms cubic-bezier(.22,1,.36,1) ${LABEL_IN_DELAY}ms both; }
        .ps-frame.is-out .ps-label-in { animation: ps-lab-out ${LABEL_OUT_MS}ms cubic-bezier(.45,0,.2,1) ${LABEL_OUT_DELAY}ms both; }

        /* ---------- HOVER / ENTER state (flower + diamond; unchanged) ---------- */
        @media (hover: hover) and (pointer: fine) {
          .ps-frame:hover .ps-flower {
            transform: scale(1) rotate(${ROTATE_DEG}deg);
            transition: transform ${ENTER_MS}ms cubic-bezier(.22,1,.36,1);
          }
          .ps-frame:hover .ps-solid { opacity: 0; transition: opacity .3s ease ${DIAMOND_IN_DELAY - 50}ms; }
          .ps-frame:hover .ps-big   { opacity: 1; transition: opacity .3s ease ${DIAMOND_IN_DELAY - 50}ms; }
          .ps-frame:hover .ps-diamond {
            transform: scale(1);
            transition: transform ${DIAMOND_IN_MS}ms cubic-bezier(.22,1,.36,1) ${DIAMOND_IN_DELAY}ms;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ps-frame { animation: none; }
          .ps-flower, .ps-diamond, .ps-solid, .ps-big { transition-duration: .01s !important; transition-delay: 0s !important; }
          .ps-frame.is-in .ps-label-in, .ps-frame.is-out .ps-label-in { animation-duration: .01s !important; animation-delay: 0s !important; }
        }
      `}</style>
    </section>
  );
}