"use client";

/* components/ProjectConcept.tsx   (or src/components/ProjectConcept.tsx)
 *
 * CONCEPT section — built from her Canva pages 7–16 (1440 × 900 artboard).
 *
 * HOW IT WORKS (desktop ≥ 821px)
 *   The section is "pinned": the page scrolls, the stage stays. Every scroll stop (or arrow /
 *   dot click, or ← → key) moves to the next STEP:
 *
 *     0            both photos side by side (Canva page 7)
 *     1 … 4        left photo stays, the right photo goes off · caption on its right
 *                  (the 4 left images, one by one)
 *     5 … 9        left goes off, right comes in · caption on its left
 *                  (the 5 right images, one by one — the last one is the video)
 *     10           both photos back in the original layout. Scrolling DOWN from here starts again
 *                  at the first left image; scrolling UP goes to the intro (never in reverse).
 *
 *   Photos change instantly (no cross-fade, no slide). Dots / arrows / keys jump straight to the target.
 *
 * FIX v3 — "the story must ALWAYS start with the LEFT sequence" (scrolling up from FORM EXPLORATION)
 *   What was going wrong: on re-entry from below, the page sat on the END step (10), so the next bit of
 *   upward scroll played step 9 → 8 → 7 … = the RIGHT sequence backwards, then the left one.
 *   The previous fix did ONE teleport to step 0 and never checked that it worked. A single scrollTo can be
 *   ignored / overridden (trackpad momentum, scroll-snap re-snapping, browser scroll restoration).
 *   Now:
 *     1. While the section is BELOW the screen (FORM EXPLORATION on screen) the stage is forced to the
 *        both-photos layout and a "pending reset" flag is raised.
 *     2. The moment the stage is pinned again with the flag raised, we teleport to step 0 and VERIFY it on the
 *        next scroll sample. If it didn't land (still on a later step), we retry (max RESET_TRIES).
 *     3. Scroll-snap is switched off for SNAP_HOLD_MS after every teleport (was 2 frames — too short, the
 *        browser could snap straight back to the end step).
 *     4. The flag is only cleared when the reset is confirmed, or the user is back above the section.
 *   Step 0 looks identical to step 10 (both photos in original layout) so the teleport is invisible.
 *
 * DOTS
 *   - STATIC: the dot rows sit at one fixed spot on the artboard (see DOTS_Y / DOTS_LEFT_X / DOTS_RIGHT_X) —
 *     they never slide when the photo switches portrait ↔ landscape.
 *   - The active (black) dot is BIG — it fills the whole circle (same outline as the empty ones).
 *
 * UNITS  1u = 1 Canva px, scaled to fit the screen (identical to the artboard at 1440 × 900).
 *        Fonts scale with it too, so her line breaks + justified widths never drift.
 *
 * Gambetta is a Fontshare font (not on Google Fonts) → loaded via @import below.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Caption, ConceptData, ConceptSlide } from "../data/concept";

/* ------------------------------ TUNING ------------------------------ */
const HEADER_H = 96; // px — must match the HEADER_H in ProjectDetail.tsx
const FRAME_W = 430; // uniform frame (Canva px) — same for every image
const FRAME_H = 644;

/* STATIC dot rows (Canva px, inside the 1440 × 804 canvas).
 * Y = just under the portrait frame (43 + 644 + 26). Change these three numbers to nudge the dots. */
const DOTS_Y = 713;
const DOTS_LEFT_X = 446; // centre of the left portrait frame  (231 + 430/2)
const DOTS_RIGHT_X = 995; // centre of the right portrait frame (780 + 430/2)

/* after the section is re-entered from below, the scroll position is held on the intro for this long (ms)
 * so leftover trackpad momentum can't scroll the story forward / backward on its own */
const SETTLE_MS = 160;
/* scroll-snap stays OFF this long after every teleport (ms) so the browser can't snap back to the end step */
const SNAP_HOLD_MS = 120;
/* how many times a failed reset teleport is retried before giving up */
const RESET_TRIES = 6;

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

type Zone = "above" | "pinned" | "below";

/* ---------------------------- small helpers ---------------------------- */
/* "**bold**" → <strong> */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((p: string, i: number) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>
      )}
    </>
  );
}

/* desktop caption: one forced line per string, justified to --w */
function CaptionBlock({ caption }: { caption: Caption }) {
  return (
    <>
      {caption.paragraphs.map((lines: string[], pi: number) => (
        <p key={pi}>
          {lines.map((l: string, li: number) => (
            <span key={li} className={`pc-line${li === lines.length - 1 ? " pc-last" : ""}`}>
              <Rich text={l} />
              {li < lines.length - 1 ? " " : null}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

/* ---------- hand-drawn dots (deterministic, so server = client) ---------- */
function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function blob(seed: number, r: number, wobble: number): string {
  const R = rnd(seed * 7919 + 13);
  const n = 9;
  const start = R() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const rr = r * (1 + (R() - 0.5) * wobble);
    pts.push([11 + Math.cos(a) * rr, 11 + Math.sin(a) * rr]);
  }
  const f = (v: number) => v.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(
      p2[1] - (p3[1] - p1[1]) / 6
    )} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + "Z";
}
/* ring (empty, white) and fill (black) use the SAME seed → identical outline, so the black dot is simply
 * the ring filled in — and BIG: radius 8.4 vs the ring's 7.4, so it covers the ring's outline completely. */
const RINGS: string[] = Array.from({ length: 8 }, (_, i) => blob(i + 1, 7.4, 0.12));
const FILLS: string[] = Array.from({ length: 8 }, (_, i) => blob(i + 1, 5.4, 0.12));

function Dots({
  count, active, interactive, onPick, label, className = "",
}: { count: number; active: number; interactive: boolean; onPick: (i: number) => void; label: string; className?: string }) {
  return (
    <div className={`pc-dots ${className}`} role="group" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={`pc-dot${i === active ? " is-on" : ""}`}
          aria-label={`Image ${i + 1} of ${count}`}
          aria-current={i === active ? "true" : undefined}
          tabIndex={interactive ? 0 : -1}
          disabled={!interactive}
          onClick={() => onPick(i)}
        >
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <path className="pc-ring" d={RINGS[i % RINGS.length]} />
            <path className="pc-fill" d={FILLS[i % FILLS.length]} />
          </svg>
        </button>
      ))}
    </div>
  );
}

function Arrow({ dir, onClick, interactive }: { dir: "prev" | "next"; onClick: () => void; interactive: boolean }) {
  return (
    <button
      type="button"
      className={`pc-arrow pc-arrow-${dir}`}
      aria-label={dir === "prev" ? "Previous image" : "Next image"}
      tabIndex={interactive ? 0 : -1}
      disabled={!interactive}
      onClick={onClick}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M10 3 5 8l5 5" />
      </svg>
    </button>
  );
}

function Media({ slide, priority }: { slide: ConceptSlide; priority?: boolean }) {
  const pos = slide.position ?? "50% 50%";
  if (slide.type === "video") {
    return (
      <video
        className="pc-media"
        muted
        loop
        playsInline
        preload="auto"
        poster={slide.poster}
        tabIndex={-1}
        aria-label={slide.alt}
        disablePictureInPicture
        disableRemotePlayback
        style={{ objectPosition: pos }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <source src={slide.src} type="video/mp4" />
      </video>
    );
  }
  return (
    <Image
      className="pc-media"
      src={slide.src}
      alt={slide.alt}
      fill
      sizes="(max-width: 820px) 100vw, 45vw"
      quality={90}
      priority={priority}
      loading={priority ? undefined : "eager"}
      style={{ objectFit: "cover", objectPosition: pos }}
    />
  );
}

/* the frame: all slides stacked, only the active one is visible — instant swap, no transition */
function Frame({ slides, idx, playing, priority }: { slides: ConceptSlide[]; idx: number; playing: boolean; priority?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const vids = ref.current?.querySelectorAll<HTMLVideoElement>("video");
    vids?.forEach((v) => {
      v.muted = true;
      const slideIdx = Number(v.closest<HTMLElement>("[data-i]")?.dataset.i);
      if (playing && slideIdx === idx) v.play().catch(() => {});
      else v.pause();
    });
  }, [idx, playing]);

  return (
    <div className="pc-frame" ref={ref}>
      {slides.map((s: ConceptSlide, i: number) => (
        <div key={s.src} data-i={i} className={`pc-slide${i === idx ? " is-active" : ""}`}>
          <Media slide={s} priority={priority && i === 0} />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------- media query ----------------------------- */
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb: () => void) => {
      const mq = window.matchMedia("(max-width: 820px)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 820px)").matches,
    () => false
  );
}

/* =============================== MAIN =============================== */
export default function ProjectConcept({ concept }: { concept: ConceptData }) {
  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? <MobileConcept concept={concept} /> : <DesktopConcept concept={concept} />}
      <style>{CSS}</style>
    </>
  );
}

/* ------------------------------ DESKTOP ------------------------------ */
function DesktopConcept({ concept }: { concept: ConceptData }) {
  const { left, right, label } = concept;
  const L = left.length;
  const R = right.length;
  const LAST = L + R + 1; // final step = both photos back in place
  const trackRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState(false);
  const stepRef = useRef(0);
  const liveRef = useRef(false);

  /* where the page is relative to this section — decided from scroll geometry only */
  const zoneRef = useRef<Zone | null>(null);
  /* RESET PENDING: raised while the section is below the screen (FORM EXPLORATION on screen).
   * Cleared only when the teleport to step 0 is CONFIRMED, or the page is back above the section. */
  const needsResetRef = useRef(false);
  /* how many teleport retries are left for the current reset */
  const triesRef = useRef(RESET_TRIES);
  /* while now < until, the scroll position is held on the intro (kills trackpad momentum after a reset) */
  const settleUntilRef = useRef(0);
  /* last scrollY, for direction */
  const lastYRef = useRef(0);
  /* timer that switches scroll-snap back on */
  const snapTimerRef = useRef<number | undefined>(undefined);

  /* jump to a step — instantly, no smooth scrolling, so the dot turns black exactly where you click */
  const jumpTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track) return;
      const t = clamp(target, 0, LAST);
      const stepH = track.offsetHeight / (LAST + 1);
      const top = track.getBoundingClientRect().top + window.scrollY + t * stepH;
      const html = document.documentElement;
      stepRef.current = t;
      setStep(t);
      html.style.scrollSnapType = "none"; // no snapping fight while we teleport
      window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
      lastYRef.current = window.scrollY;
      window.clearTimeout(snapTimerRef.current);
      snapTimerRef.current = window.setTimeout(() => {
        html.style.scrollSnapType = "";
      }, SNAP_HOLD_MS);
    },
    [LAST]
  );

  /* never leave scroll-snap switched off if we unmount mid-teleport */
  useEffect(
    () => () => {
      window.clearTimeout(snapTimerRef.current);
      document.documentElement.style.scrollSnapType = "";
    },
    []
  );

  /* scroll position → step */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    lastYRef.current = window.scrollY;

    const update = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const stepH = track.offsetHeight / (LAST + 1); // = 100svh
      const rawStep = clamp(Math.round(-r.top / stepH), 0, LAST);
      lastYRef.current = window.scrollY;

      /* ---- where is the page relative to the section? ----
       *  above  : the section top is still below the top of the screen (intro / previous section on screen)
       *  below  : the section has been scrolled past (FORM EXPLORATION on screen)
       *  pinned : the stage is sticking to the screen — the story is playing */
      const zone: Zone = r.top > 2 ? "above" : r.bottom < stepH - 2 ? "below" : "pinned";
      const prevZone = zoneRef.current;
      zoneRef.current = zone;
      liveRef.current = r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;

      if (zone === "above") {
        needsResetRef.current = false; // came from the intro → natural order
        triesRef.current = RESET_TRIES;
      }

      /* BELOW the section: whatever is sliding past shows the both-photos layout, and a reset is pending */
      if (zone === "below") {
        if (!needsResetRef.current) triesRef.current = RESET_TRIES;
        needsResetRef.current = true;
        if (stepRef.current !== LAST) {
          stepRef.current = LAST;
          setStep(LAST);
        }
        return;
      }

      /* momentum guard: right after a reset, never let the page drift above the intro */
      if (performance.now() < settleUntilRef.current && zone === "above") {
        window.scrollTo({ top: r.top + window.scrollY, behavior: "instant" as ScrollBehavior });
        return;
      }

      if (zone === "pinned") {
        /* RE-ENTERED FROM BELOW, or the page was loaded / restored in the middle of the story:
         * always begin with the LEFT sequence. Step 0 looks exactly like the end state (both photos in the
         * original layout), so this teleport is invisible. */
        const restoredMidStory = prevZone === null && rawStep > 0 && rawStep < LAST;
        if (restoredMidStory) {
          needsResetRef.current = true;
          triesRef.current = RESET_TRIES;
        }
        if (needsResetRef.current) {
          if (rawStep === 0) {
            /* teleport landed → confirmed. */
            needsResetRef.current = false;
            triesRef.current = RESET_TRIES;
            if (stepRef.current !== 0) {
              stepRef.current = 0;
              setStep(0);
            }
            setSeen(true);
            return;
          }
          /* not on step 0 yet (first attempt, or the browser ignored / undid the teleport) → (re)try */
          if (triesRef.current > 0) {
            triesRef.current -= 1;
            settleUntilRef.current = performance.now() + SETTLE_MS;
            jumpTo(0);
            setSeen(true);
            return;
          }
          needsResetRef.current = false; // gave up — fall through to the normal logic below
        }
      }

      const s = rawStep;
      if (s === stepRef.current) {
        if (r.top < window.innerHeight * 0.7) setSeen(true);
        return;
      }
      /* scrolling UP from the end-state → show the intro and start over (never replay in reverse) */
      if (stepRef.current === LAST && s < LAST && s > 0) {
        jumpTo(0);
        return;
      }
      stepRef.current = s;
      setStep(s);
      if (r.top < window.innerHeight * 0.7) setSeen(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    /* at the very end (nothing below) → scrolling DOWN again restarts from the first left image.
     `liveRef` = the concept is what is on screen; without it, reaching the bottom of the section BELOW (form exploration)
     would throw the page back up here. */
    const atBottom = () => window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 0 && stepRef.current === LAST && liveRef.current && atBottom()) jumpTo(1);
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0]?.clientY ?? 0; };
    const onTouchEnd = (e: TouchEvent) => {
      const y = e.changedTouches[0]?.clientY ?? touchY;
      if (touchY - y > 50 && stepRef.current === LAST && liveRef.current && atBottom()) jumpTo(1);
    };
    /* coming back with the browser's back button (page restored from cache) → measure again */
    const onPageShow = () => onScroll();

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [LAST, jumpTo]);

  const go = jumpTo;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!liveRef.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const cur = stepRef.current;
      if (e.key === "ArrowRight") { e.preventDefault(); jumpTo(cur === LAST ? 1 : cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); jumpTo(cur === LAST ? 0 : cur - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jumpTo, LAST]);

  /* ---- everything on screen is derived from `step` ---- */
  const inLeft = step >= 1 && step <= L;
  const inRight = step > L && step <= L + R;
  const leftIdx = step === 0 || step === LAST ? 0 : Math.min(step - 1, L - 1);
  const rightIdx = step <= L || step === LAST ? 0 : step - L - 1;
  const leftOff = step > L && step < LAST; // gone to the left
  const rightOff = step >= 1 && step <= L; // gone to the right
  const leftLand = left[leftIdx].shape === "landscape";
  const rightLand = right[rightIdx].shape === "landscape";

  return (
    <section
      ref={trackRef}
      className={`pc-track${seen ? " is-in" : ""}`}
      style={cssVars({ "--steps": LAST + 1, "--header-h": `${HEADER_H}px` })}
      aria-label="Concept"
    >
      <div className="pc-snaps" aria-hidden="true">
        {Array.from({ length: LAST + 1 }, (_, i) => (
          <div key={i} className="pc-snap" />
        ))}
      </div>

      <div className="pc-stage">
        <div className="pc-canvas">
          <h2 className="pc-label">{label}</h2>

          {/* LEFT photo: landscape (workshop) or the uniform portrait frame, per image */}
          <div className={`pc-group pc-left${leftLand ? " is-land" : ""}${leftOff ? " is-off" : ""}`}>
            <Frame slides={left} idx={leftIdx} playing={false} priority />
            <Arrow dir="prev" interactive={inLeft} onClick={() => go(step - 1)} />
            <Arrow dir="next" interactive={inLeft} onClick={() => go(step + 1)} />
          </div>

          {/* RIGHT photo */}
          <div className={`pc-group pc-right${rightLand ? " is-land" : ""}${rightOff ? " is-off" : ""}`}>
            <Frame slides={right} idx={rightIdx} playing={!rightOff} priority />
            <Arrow dir="prev" interactive={inRight} onClick={() => go(step - 1)} />
            <Arrow dir="next" interactive={inRight} onClick={() => go(step + 1)} />
          </div>

          {/* STATIC dots — outside the photo groups, fixed position, never move */}
          <Dots
            className={`pc-dots-d${leftOff ? " is-off" : ""}`}
            count={L}
            active={leftIdx}
            interactive={inLeft}
            label="Left images"
            onPick={(i) => go(1 + i)}
          />
          <Dots
            className={`pc-dots-d pc-dots-r${rightOff ? " is-off" : ""}`}
            count={R}
            active={rightIdx}
            interactive={inRight}
            label="Right images"
            onPick={(i) => go(L + 1 + i)}
          />

          {/* captions: left photo → text on its right, right photo → text on its left */}
          {left.map((s: ConceptSlide, i: number) =>
            s.caption ? (
              <div
                key={`l${i}`}
                className={`pc-cap pc-cap-l${inLeft && leftIdx === i ? " is-on" : ""}`}
                style={cssVars({ "--w": s.caption.width, "--a": s.caption.anchor ?? 720, "--b": s.shape === "landscape" ? 248.5 : 115.5 })}
                aria-hidden={!(inLeft && leftIdx === i)}
              >
                <CaptionBlock caption={s.caption} />
              </div>
            ) : null
          )}
          {right.map((s: ConceptSlide, i: number) =>
            s.caption ? (
              <div
                key={`r${i}`}
                className={`pc-cap pc-cap-r${inRight && rightIdx === i ? " is-on" : ""}`}
                style={cssVars({ "--w": s.caption.width, "--a": s.caption.anchor ?? 720, "--b": s.shape === "landscape" ? 248.5 : 115.5 })}
                aria-hidden={!(inRight && rightIdx === i)}
              >
                <CaptionBlock caption={s.caption} />
              </div>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- MOBILE ------------------------------- */
function MobileSeries({ slides, name }: { slides: ConceptSlide[]; name: string }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  const cap = slides[i].caption;
  const mod = (k: number) => (k + n) % n;
  return (
    <div className="pc-m-series" aria-label={name}>
      <div className="pc-m-frame">
        <Frame slides={slides} idx={i} playing priority={false} />
      </div>
      <div className="pc-m-controls">
        <Arrow dir="prev" interactive onClick={() => setI(mod(i - 1))} />
        <Dots count={n} active={i} interactive onPick={setI} label={name} />
        <Arrow dir="next" interactive onClick={() => setI(mod(i + 1))} />
      </div>
      <div className="pc-m-cap" aria-live="polite">
        {cap
          ? cap.paragraphs.map((lines: string[], pi: number) => (
              <p key={pi}>
                <Rich text={lines.join(" ")} />
              </p>
            ))
          : null}
      </div>
    </div>
  );
}

function MobileConcept({ concept }: { concept: ConceptData }): ReactNode {
  /* left sequence first, right sequence second — the order of the narration */
  return (
    <section className="pc-m" aria-label="Concept">
      <h2 className="pc-m-label">{concept.label}</h2>
      <MobileSeries slides={concept.left} name="Concept images, part one" />
      <MobileSeries slides={concept.right} name="Concept images, part two" />
    </section>
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
@import url("https://api.fontshare.com/v2/css?f[]=gambetta@400,700&display=swap");

.pc-track {
  --serif: "Gambetta", "Iowan Old Style", Georgia, "Times New Roman", serif;
  --ease: cubic-bezier(.22, 1, .36, 1);
  --ease-io: cubic-bezier(.77, 0, .18, 1);
  /* 1u = 1 Canva px.  The artboard below the header is 1440 × 804 (900 − 96). */
  --u: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  position: relative;
  height: calc(100svh * var(--steps));
  background: #fff;
}

/* invisible scroll stops → one wheel / swipe = one step */
.pc-snaps { position: absolute; inset: 0; pointer-events: none; }
.pc-snap  { height: 100svh; scroll-snap-align: start; scroll-snap-stop: always; }

.pc-stage {
  position: sticky; top: 0; height: 100svh; overflow: hidden; z-index: 0;
  contain: layout paint;
}
.pc-canvas {
  position: absolute; left: 50%; top: var(--header-h);
  width: calc(1440 * var(--u)); height: calc(804 * var(--u));
  transform: translateX(-50%);
}

/* ---------------------------- label ---------------------------- */
.pc-label {
  position: absolute; left: calc(231 * var(--u)); top: calc(-4 * var(--u)); margin: 0;
  font-size: calc(18 * var(--u)); line-height: calc(24 * var(--u)); font-weight: 500;
  letter-spacing: 0; color: #000; white-space: nowrap;
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s var(--ease) .1s, transform 1.1s var(--ease) .1s;
}
.is-in .pc-label { opacity: 1; transform: none; }

/* ----------------------------- groups ----------------------------- */
.pc-group {
  position: absolute;
  /* only the slide-on / slide-off of the whole photo animates — never the size/position swap between images */
  transition: transform 1.1s var(--ease-io), opacity .7s ease;
  will-change: transform, opacity;
  backface-visibility: hidden;
}
/* portrait frame 430 × 644 — left at (231, 139), right at (780, 139) */
.pc-left  { left: calc(231 * var(--u)); top: calc(43 * var(--u)); width: calc(${FRAME_W} * var(--u)); height: calc(${FRAME_H} * var(--u)); }
.pc-right { left: calc(780 * var(--u)); top: calc(43 * var(--u)); width: calc(${FRAME_W} * var(--u)); height: calc(${FRAME_H} * var(--u)); }
/* landscape frame 597 × 398 at y = 250 (Canva).
   left  : x = 147  (dark workshop seesaw, Canva pages 7 / 8)
   right : x = 613  → its right edge is x = 1210, exactly the right edge of the portrait frames */
.pc-left.is-land  { left: calc(147 * var(--u)); top: calc(154 * var(--u)); width: calc(597 * var(--u)); height: calc(398 * var(--u)); }
.pc-right.is-land { left: calc(613 * var(--u)); top: calc(154 * var(--u)); width: calc(597 * var(--u)); height: calc(398 * var(--u)); }

.pc-left.is-off  { transform: translate3d(calc(-900 * var(--u)), 0, 0); opacity: 0; }
.pc-right.is-off { transform: translate3d(calc(900 * var(--u)), 0, 0);  opacity: 0; }

/* the frame (reveals from the bottom like the page-1 video) */
.pc-frame {
  position: absolute; inset: 0; overflow: hidden; background: #efefef;
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1.2s var(--ease-io);
}
.is-in .pc-frame { clip-path: inset(0 0 0 0); }
.pc-right .pc-frame { transition-delay: .15s; }

/* instant swap — a clean, single photo for every dot, no fade / flip in between */
.pc-slide { position: absolute; inset: 0; visibility: hidden; }
.pc-slide.is-active { visibility: visible; z-index: 2; }
.pc-media { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; user-select: none; }

/* --------------------------- arrows --------------------------- */
.pc-arrow {
  position: absolute; top: 50%; z-index: 3;
  width: calc(32 * var(--u)); height: calc(32 * var(--u)); margin-top: calc(-16 * var(--u));
  padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  display: grid; place-items: center;
  background: rgba(0, 0, 0, .5);           /* black, reduced opacity — not brown */
  opacity: 0; pointer-events: none;
  transition: background-color .3s ease, transform .3s var(--ease), opacity .45s ease;
}
.pc-arrow:disabled { cursor: default; }
.pc-arrow svg { width: 50%; height: 50%; fill: none; stroke: #fff; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.pc-arrow-prev { right: calc(100% + 12 * var(--u)); }
.pc-arrow-next { left:  calc(100% + 12 * var(--u)); }
.pc-arrow-next svg { transform: rotate(180deg); }
.pc-arrow:not(:disabled) { opacity: 1; pointer-events: auto; transition-delay: 0s, 0s, .55s; }
.pc-arrow:not(:disabled):hover { background: rgba(0, 0, 0, .8); }
.pc-arrow:not(:disabled):active { transform: scale(.94); }
.pc-arrow:focus-visible, .pc-dot:focus-visible { outline: 2px solid #000; outline-offset: 3px; }

/* ---------------------------- dots ----------------------------
   STATIC: absolutely placed on the canvas, outside the photo groups.
   No transform, no top/left transition, no scale — nothing moves. */
.pc-dots { display: flex; }
.pc-dots-d {
  position: absolute; z-index: 3;
  left: calc(${DOTS_LEFT_X} * var(--u)); top: calc(${DOTS_Y} * var(--u));
  translate: -50% 0;
  opacity: 0; transition: none;
}
.pc-dots-d.pc-dots-r { left: calc(${DOTS_RIGHT_X} * var(--u)); }
.is-in .pc-dots-d { opacity: 1; }
.is-in .pc-dots-d.is-off { opacity: 0; pointer-events: none; }

.pc-dot {
  width: calc(21 * var(--u)); height: calc(22 * var(--u)); padding: 0; border: 0; background: none; cursor: pointer; display: block;
}
.pc-dot:disabled { cursor: default; }
.pc-dot svg { width: 100%; height: 100%; display: block; overflow: visible; }
/* instant: the active dot is a BIG solid black circle (it covers the ring's outline), nothing slides or scales */
.pc-ring { fill: #fff; stroke: #000; stroke-width: 1.15; }
.pc-fill { fill: #000; }
.pc-dot .pc-fill { display: none; }
.pc-dot.is-on .pc-ring { display: none; }   /* ← restore: active dot = small black dot only */
.pc-dot.is-on .pc-fill { display: block; }

/* --------------------------- captions --------------------------- */
.pc-cap {
  position: absolute; bottom: calc(var(--b, 115.5) * var(--u)); width: calc(var(--w) * var(--u)); box-sizing: content-box;
  font-family: var(--serif); font-size: calc(18 * var(--u)); line-height: calc(33 * var(--u)); font-weight: 400;
  letter-spacing: 0; color: #000; text-align: left; font-synthesis: none;
  opacity: 0; visibility: hidden;
  transition: opacity .15s ease, visibility 0s linear .15s;
}
/* --a = Canva x of the block: its left edge (left photo) or its right edge (right photo) */
.pc-cap-l { left: calc(var(--a, 720) * var(--u)); }
.pc-cap-r { right: calc((1440 - var(--a, 720)) * var(--u)); }
.pc-cap.is-on { opacity: 1; visibility: visible; transition: opacity .4s ease .1s, visibility 0s; }
.pc-cap p { margin: 0 0 calc(33 * var(--u)); }
.pc-cap p:last-child { margin-bottom: 0; }
.pc-cap strong { font-weight: 700; }
.pc-line { display: block; white-space: nowrap; }
/* JUSTIFIED: every line stretches to the block width except the last line of a paragraph */
.pc-line:not(.pc-last) { text-align: justify; text-align-last: justify; }
.pc-line.pc-last { text-align: left; }

/* -------------------------- mobile (≤ 820px) -------------------------- */
.pc-m {
  --serif: "Gambetta", "Iowan Old Style", Georgia, "Times New Roman", serif;
  padding: 56px 16px 96px; display: grid; gap: 56px; background: #fff;
}
.pc-m-label { margin: 0; font-size: 16px; line-height: 24px; font-weight: 500; color: #000; }
.pc-m-series { display: grid; gap: 20px; max-width: 34rem; width: 100%; margin-inline: auto; }
.pc-m-series + .pc-m-series { margin-top: 8px; }
.pc-m-frame { position: relative; width: 100%; aspect-ratio: ${FRAME_W} / ${FRAME_H}; background: #efefef; overflow: hidden; }
.pc-m-frame .pc-frame { clip-path: none; transition: none; }
.pc-m-controls { display: flex; align-items: center; justify-content: center; gap: 16px; }
.pc-m-controls .pc-arrow { position: static; margin: 0; width: 36px; height: 36px; opacity: 1; pointer-events: auto; }
.pc-m-controls .pc-dots { position: static; opacity: 1; }
.pc-m-controls .pc-dot { width: 21px; height: 22px; }
.pc-m-cap { min-height: 4.5em; font-family: var(--serif); font-size: 17px; line-height: 28px; color: #000; text-align: justify; hyphens: none; }
.pc-m-cap p { margin: 0 0 28px; }
.pc-m-cap p:last-child { margin-bottom: 0; }
.pc-m-cap strong { font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .pc-label, .pc-group, .pc-frame, .pc-cap, .pc-arrow { transition: none !important; }
  .pc-label { opacity: 1; transform: none; }
  .pc-frame { clip-path: none; }
  .pc-dots-d { opacity: 1; }
}
`;