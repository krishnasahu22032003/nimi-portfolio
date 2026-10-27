"use client";
//update code 
/* components/ProjectDetail.tsx   (or src/components/ProjectDetail.tsx)
 *
 * Type spec — straight from her Canva annotations, used as LITERAL CSS px (no fluid scaling):
 *   PAGE 1   title + tagline ........ 18 Medium  #000
 *            tags / meta / note ..... 14 Regular #404040
 *   PAGE 2   heading ................ 16 Medium  #000
 *            body ................... 14 Regular #000  (JUSTIFIED)
 *
 * Layout — from her latest annotations:
 *   BLACK LINE : video's left edge starts exactly at the logo's left edge  → VIDEO_LEFT
 *   GREEN LINE : distance between the video frame and the text block       → TEXT_GAP
 *   PAGE 2     : body text is justified (her line breaks are kept; every line except the
 *                last of each paragraph is stretched to the block width)
 *
 * NEW — project cover: beige #E0D5C0 rectangle sitting UNDER the photo (same on every project, because
 *   every project renders through this component). Measured from her marked Canva screenshot
 *   (1440 × 900 page, photo 694 × 852):  25px of beige above, below and to the left of the photo  →  BEIGE_PAD,
 *   and the beige STOPS at her green marks, 71.4% of the way across the photo (the rest is hidden behind
 *   the photo, so the top/bottom strips end there)  →  BEIGE_REACH.
 */
import { Familjen_Grotesk } from "next/font/google";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type { ProjectDetailData } from "../data/projects";
import ProjectConcept from "./ProjectConcept";
import ProjectFormExploration from "./ProjectFormExploration";
import ProjectFabrication from "./ProjectFabrication";
import ProjectEnding from "./ProjectEnding"; // NEW
const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const HEADER_H = 96; // px — height of your site header. The video starts BELOW it.
const COLOR_INK = "#000";
const COLOR_GREY = "#404040";
const COLOR_BEIGE = "#E0D5C0"; // NEW — the rectangle under the photo (her colour code)

/* NEW — how far the beige rectangle reaches past the photo on the TOP, LEFT and BOTTOM (right edge is flush).
   Canva: ~25px on a 1440-wide page → 25 / 1440 = 1.74cqw (the same token as the page-1 bottom margin below).
   On phones (≤820px) it switches to a fixed 16px so the panel meets the screen edge. */
const BEIGE_PAD = 1.74;

/* NEW — where the beige ENDS on the right, as a share of the photo's width, counted from the photo's left edge.
   Her green marks sit at 282px of the 395px-wide photo in the screenshot → 0.714.
   0.714 = ends at her marks · 1 = flush with the photo's right edge · 0.5 = ends at the middle. */
const BEIGE_REACH = 0.714;

/* BLACK LINE — video left edge = logo left edge.
   Measured: logo left x=137 on a 1600-wide screenshot → 8.56cqw.
   If your header's logo has a different left padding, change this number (in cqw = % of page width). */
const VIDEO_LEFT = 8.56;

/* GREEN LINE — gap between the video's right edge and the text.
   Measured: ~117px on a 1600-wide screenshot → 7.3cqw. */
const TEXT_GAP = 7.3;

/* page-1 text block, relative to the video:  v: "center" | "end"   h: "center" | "start" */
const INTRO_V: "center" | "end" = "end";
const INTRO_H: "center" | "start" = "start";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;

/* one forced line per string (desktop); below 1280px the lines reflow as one paragraph.
   The last line of each block gets .pd-last so it is NOT stretched when justified. */
function Lines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((text: string, i: number) => (
        <span key={i} className={`pd-line${i === lines.length - 1 ? " pd-last" : ""}`}>
          {text}
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

export default function ProjectDetail({ project }: { project: ProjectDetailData }) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  /* page 1 reveals on mount, page 2 when it scrolls into view; two-page snap on desktop */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const pages = Array.from(root.querySelectorAll<HTMLElement>(".pd-page"));

    const html = document.documentElement;
    const mq = window.matchMedia("(min-width: 821px) and (min-height: 560px)");
    const applySnap = () => html.classList.toggle("pd-snap", mq.matches);
    applySnap();
    mq.addEventListener("change", applySnap);

    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.35 }
    );
    if (pages[1]) io.observe(pages[1]);

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => pages[0]?.classList.add("is-in"));
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      io.disconnect();
      mq.removeEventListener("change", applySnap);
      html.classList.remove("pd-snap");
    };
  }, []);

  /* video: silent endless loop, fades in once the first frame is ready, pauses off-screen */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // React doesn't always render the muted attribute → force it, or autoplay is blocked
    v.defaultMuted = true;

    const show = () => v.classList.add("ready");
    if (v.readyState >= 2) show();
    v.addEventListener("loadeddata", show);
    v.addEventListener("canplay", show);
    const fallback = window.setTimeout(show, 2500);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let io: IntersectionObserver | undefined;
    if (!reduce) {
      v.play().catch(() => {});
      io = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          const e = entries[0];
          if (!e) return;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        },
        { threshold: 0.15 }
      );
      io.observe(v);
    }

    return () => {
      window.clearTimeout(fallback);
      v.removeEventListener("loadeddata", show);
      v.removeEventListener("canplay", show);
      io?.disconnect();
    };
  }, []);

  const { video, story } = project;

  return (
    <main
      ref={rootRef}
      className={`pd-root ${grotesk.className}`}
      style={cssVars({
        "--header-h": `${HEADER_H}px`,
        "--ink": COLOR_INK,
        "--grey": COLOR_GREY,
        "--beige": COLOR_BEIGE,
        "--beige-pad": `${BEIGE_PAD}cqw`,
        "--beige-reach": BEIGE_REACH,
        "--video-left": `${VIDEO_LEFT}cqw`,
        "--text-gap": `${TEXT_GAP}cqw`,
        "--intro-align": INTRO_V === "center" ? "center" : "end",
        "--intro-justify": INTRO_H === "center" ? "center" : "start",
        "--intro-pb": INTRO_V === "end" ? "calc(var(--vid-h) * 0.074)" : "0px",
      })}
    >
      {/* ============================ PAGE 1 — video + intro ============================ */}
      <section className="pd-page pd-hero" aria-label={`${project.title} — overview`}>
        {/* NEW — .pd-cover wraps the photo and carries the beige rectangle behind it */}
        <div className="pd-cover">
          <div className="pd-cover-bg" aria-hidden="true" />
          <div className="pd-video">
            <video
              ref={videoRef}
              className="pd-video-el"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              tabIndex={-1}
              aria-label={video.label}
              disablePictureInPicture
              disableRemotePlayback
              style={{ objectPosition: video.position ?? "50% 50%" }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {video.webm && <source src={video.webm} type="video/webm" />}
              <source src={video.mp4} type="video/mp4" />
            </video>
          </div>
        </div>

        <div className="pd-intro">
          <h1 className="pd-title pd-reveal" style={cssVars({ "--d": 0 })}>
            <span className="pd-block">{project.title}</span>
            <span className="pd-block">{project.tagline}</span>
          </h1>

          <p className="pd-meta pd-tags pd-reveal" style={cssVars({ "--d": 1 })}>
            <span className="pd-block">{project.tags}</span>
            <span className="pd-block">{project.meta}</span>
          </p>

          <p className="pd-meta pd-note pd-reveal" style={cssVars({ "--d": 2 })}>
            <Lines lines={project.note} />
          </p>
        </div>
      </section>

      {/* ============================ PAGE 2 — story ============================ */}
      <section className="pd-page pd-story" aria-label={`${project.title} — story`}>
        <div className="pd-read">
          <h2 className="pd-heading pd-reveal" style={cssVars({ "--d": 0 })}>
            <Lines lines={story.heading} />
          </h2>

          <div className="pd-body">
            {story.paragraphs.map((lines: string[], i: number) => (
              <p key={i} className="pd-reveal" style={cssVars({ "--d": i + 1 })}>
                <Lines lines={lines} />
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PAGE 3 — concept (pinned, scroll-driven) ============================ */}
      {project.concept ? <ProjectConcept concept={project.concept} /> : null}

      {/* ============================ PAGE 4 — form exploration (pinned, scroll-driven gallery) ============================ */}
      {project.formExploration ? <ProjectFormExploration data={project.formExploration} /> : null}

      {/* ============================ PAGE 5 — fabrication (clickable timeline, no scroll-driven motion) ============================ */}
      {project.fabrication ? <ProjectFabrication data={project.fabrication} /> : null}

      {/* ============================ PAGE 6 — ending (landscape clip, centred; the project ends here) ============================ */}
      {project.ending ? <ProjectEnding data={project.ending} /> : null}

      <noscript>
        <style>{`.pd-reveal{opacity:1!important;transform:none!important}.pd-video{clip-path:none!important}.pd-video-el{opacity:1!important;transform:none!important}`}</style>
      </noscript>

      <style>{CSS}</style>
    </main>
  );
}

/* Static CSS — every tunable arrives as a custom property, so there is nothing to interpolate. */
const CSS = `
html.pd-snap { scroll-snap-type: y mandatory; }

.pd-root {
  container-type: inline-size;
  background: #fff; color: var(--ink);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility; font-synthesis: none;
}

.pd-page {
  --page-h: max(100svh, 560px);
  position: relative; box-sizing: border-box;
  scroll-snap-align: start; scroll-snap-stop: always;
}

.pd-block { display: block; }

/* ------------------------------- type (literal px) ------------------------------- */
.pd-title   { margin: 0; font-size: 18px; line-height: 30px; font-weight: 500; letter-spacing: 0; color: var(--ink); }
.pd-heading { margin: 0; font-size: 16px; line-height: 27px; font-weight: 500; letter-spacing: 0; color: var(--ink); text-align: left; }
.pd-meta    { margin: 0; font-size: 14px; line-height: 24px; font-weight: 400; letter-spacing: 0; color: var(--grey); }
/* body text: JUSTIFIED (left + right edges aligned) */
.pd-body p  { margin: 0; font-size: 14px; line-height: 24px; font-weight: 400; letter-spacing: 0; color: var(--ink); text-align: justify; hyphens: none; }

/* ------------------------------ PAGE 1 ------------------------------ */
.pd-hero {
  /* BLACK LINE: video starts at --video-left (the logo's left edge).
     Video fills the screen below the header; bottom margin 25/1440 like the Canva page. */
  --pad-b: 1.74cqw;
  --vid-h: min(calc(var(--page-h) - var(--header-h) - var(--pad-b)), 59.17cqw);
  --vid-w: calc(var(--vid-h) * 0.8146);
  height: var(--page-h);
  padding: var(--header-h) 0 0 var(--video-left);
  display: grid;
  grid-template-columns: var(--vid-w) minmax(0, 1fr);
  grid-template-rows: var(--vid-h);
  align-content: start;
}

/* NEW — the cover = photo + beige rectangle. It takes over the photo's old size and grid cell. */
.pd-cover {
  position: relative;
  width: var(--vid-w); height: var(--vid-h);
}
/* beige rectangle: reaches --beige-pad past the photo on top / left / bottom and ends at --beige-reach of the photo's width */
.pd-cover-bg {
  position: absolute; z-index: 0;
  top: calc(-1 * var(--beige-pad)); bottom: calc(-1 * var(--beige-pad));
  left: calc(-1 * var(--beige-pad)); right: calc((1 - var(--beige-reach)) * 100%);
  background: var(--beige);
  pointer-events: none;
}

.pd-video {
  position: relative; z-index: 1; overflow: hidden; background: #efefef;
  width: 100%; height: 100%;
  clip-path: inset(100% 0 0 0);
  transition: clip-path 1.2s cubic-bezier(.77, 0, .18, 1);
}
.pd-video-el {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; display: block;
  opacity: 0; transform: scale(1.08);
  transition: opacity .6s ease, transform 1.8s cubic-bezier(.22, 1, .36, 1) .2s;
  pointer-events: none; user-select: none;
}
.pd-video-el.ready { opacity: 1; }

/* text block beside the video.
   GREEN LINE: padding-left = --text-gap = distance between the video's right edge and the text. */
.pd-intro {
  grid-column: 2;
  grid-row: 1;
  align-self: var(--intro-align, end);
  justify-self: stretch;

  width: auto;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  padding:
    0
    clamp(24px, 3cqw, 56px)
    var(--intro-pb, calc(var(--vid-h) * 0.074))
    var(--text-gap);

  text-align: left;
}

.pd-title,
.pd-tags,
.pd-note {
  text-align: left;
}

.pd-tags { margin-top: 12px; }
.pd-note { margin-top: 12px; }

/* ------------------------------ PAGE 2 ------------------------------ */
.pd-story { min-height: var(--page-h); display: grid; place-items: center; padding: 72px 24px; }
.pd-read  { width: max-content; max-width: 100%; } /* block is exactly as wide as its longest line → truly centred, and the justified edges line up with it */
.pd-heading { margin-bottom: 20px; }
.pd-body  { display: flex; flex-direction: column; gap: 24px; } /* one blank line between paragraphs */

/* ------------------------------ reveal ------------------------------ */
.pd-reveal {
  opacity: 0; transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: calc(var(--d, 0) * 90ms + 500ms);
}
.pd-story .pd-reveal { transition-delay: calc(var(--d, 0) * 110ms + 100ms); }
.is-in .pd-reveal { opacity: 1; transform: none; }
.is-in .pd-video { clip-path: inset(0 0 0 0); }
.is-in .pd-video-el { transform: scale(1); }

/* ---------- ≥1280px: DESIGN MODE — every string is exactly one line, as she broke it in Canva ---------- */
@media (min-width: 1280px) {
  .pd-line { display: block; white-space: nowrap; }

  /* JUSTIFY: stretch every line of a body paragraph to the full block width,
     except the last line of the paragraph (stays left-aligned, like normal justified text). */
  .pd-body .pd-line:not(.pd-last) {
    text-align: justify;
    text-align-last: justify;
  }
  .pd-body .pd-line.pd-last { text-align: left; }
}

/* ---------- 821–1279px: same layout, text reflows naturally (and stays justified) ---------- */
@media (max-width: 1279.98px) {
  .pd-read  { width: min(100%, 34rem); }
  .pd-intro { width: auto; }
  .pd-heading { text-wrap: balance; }
  .pd-meta { text-wrap: pretty; }
}

/* ---------- ≤820px: single column ---------- */
@media (max-width: 820px) {
  .pd-page { scroll-snap-align: none; scroll-snap-stop: normal; }
  .pd-hero {
    --vid-w: min(100%, calc(72svh * 0.8146));
    height: auto; padding: var(--header-h) 16px 40px;
    grid-template-columns: minmax(0, 1fr); grid-template-rows: auto;
    row-gap: 32px; align-content: start;
  }
  .pd-hero { --beige-pad: 16px; } /* NEW — meets the screen edge, same as the hero's 16px side padding */
  .pd-cover { width: var(--vid-w); height: auto; }
  .pd-video { width: 100%; height: auto; aspect-ratio: 694 / 852; }
  .pd-intro { align-self: start; justify-self: start; padding: 0; width: 100%; }
  .pd-story { min-height: 0; place-items: start center; padding: 56px 16px 96px; }
  .pd-read  { width: 100%; max-width: 34rem; }
}

@media (prefers-reduced-motion: reduce) {
  .pd-reveal, .pd-video, .pd-video-el { transition: none !important; }
  .pd-reveal { opacity: 1; transform: none; }
  .pd-video { clip-path: none; }
  .pd-video-el { transform: none; }
}
`;