"use client";
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
 * Project cover: beige #E0D5C0 rectangle sitting UNDER the photo (same on every project, because
 *   every project renders through this component). 25px of beige above, below and to the left of the photo
 *   → BEIGE_PAD, and the beige STOPS at 71.4% of the way across the photo → BEIGE_REACH.
 *
 * Project two / three — what changed in this file:
 *   1. the hero media can be a PHOTO (`project.image`) instead of a video — same frame, same beige panel, same reveal
 *   2. `meta`, `note` and `story` are optional
 *   3. `project.colourStory` renders page 2 as the colour-changing tiles (ProjectColourStory)
 *   4. `project.collage` renders page 3 (ProjectCollage)
 *   5. `project.knotStory` renders page 4 — knot photo + text (ProjectKnotStory)
 *   6. `project.behindScene` renders page 5 — video + sketch + text (ProjectBehindScene)
 *   7. `project.joinery` renders page 6 — three detail photos + three notes (ProjectJoinery)
 *   8. font weight 600 is loaded (the knot page's first paragraph is semibold)
 *   9. `project.image.sizes` overrides next/image `sizes` for wide photos cropped into the portrait frame
 *  10. `project.echoConcept` renders page 3 — CONCEPT (ProjectEchoConcept)
 *  11. `project.echoShapes` renders page 4 — scroll-drawn measurements (ProjectEchoShapes)
 *  12. `project.echoSound` renders page 5 — dimensions + sound (ProjectEchoSound)
 *  13. `project.materialExploration` (project three) renders page 6 — hover-to-explore materials (ProjectMaterialExploration)
 *
 * Project eight (Puppet theatre):
 *  14. `project.gallery` turns the hero into an AUTO-CHANGING SLIDESHOW: same frame, same beige panel, same reveal.
 *      · crossfade every `intervalMs` (default 5000, the 5.0s on her Canva page)
 *      · small translucent arrows inside the photo, SAME SIZE as the Research page:
 *        32px circle, 16px chevron, 10px from the photo edge, vertically centred
 *      · keeps playing after an arrow click (the timer simply restarts). It only pauses for KEYBOARD focus,
 *        when scrolled off-screen, or when the browser tab is hidden. Swipe on touch.
 *      · reduced-motion: the photos still advance, but swap instantly instead of fading
 *  15. `project.badge` places the small circular client logo at the bottom-right, measured from her Canva page
 *  16. `project.noteGap` sets the space between the tags / meta block and the note (default 12px)
 *  17. `project.introPb` lifts the page-1 text block (share of the photo height, default 0.074)
 *  18. `project.research` renders the last page — "3. Primary research" (ProjectResearch)
 *  19. `project.howItWorks` renders page 102 — "HOW IT WORKS · BUILD" (ProjectBuild: 3D panels, click to build)
 *      together with the fixed BUILD / COMPOSE / INTERPRET / PERFORM timeline (HowItWorksTimeline).
 *      The timeline draws itself into <body>, so `container-type` on .pd-root cannot trap its position:fixed.
 *      Pages 103–108 only need  data-hiw-step="compose" | "interpret" | "perform"  on their root <section>.
 */
import Image from "next/image";
import { Familjen_Grotesk } from "next/font/google";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ProjectDetailData } from "../data/projects";
import ProjectConcept from "./ProjectConcept";
import ProjectFormExploration from "./ProjectFormExploration";
import ProjectFabrication from "./ProjectFabrication";
import ProjectEnding from "./ProjectEnding";
import ProjectColourStory from "./ProjectColourStory";
import ProjectCollage from "./ProjectCollage";
import ProjectKnotStory from "./ProjectKnotStory";
import ProjectBehindScene from "./ProjectBehindScene";
import ProjectJoinery from "./ProjectJoinery";
import ProjectStatement from "./Projectstatement";
import ProjectEchoConcept from "./ProjectEchoConcept";
import ProjectEchoShapes from "./ProjectEchoShapes";
import ProjectEchoSound from "./Projectechosound ";
import ProjectMaterialExploration from "./ProjectMaterialExploration";
import ProjectConstruction from "./ProjectConstruction";
import ProjectEchoTesting from "./ProjectEchoTesting";
import ProjectEchoEnd from "./ProjectEchoEnd";
import ProjectAbout from "./ProjectAbout";
import ProjectFeatures from "./ProjectFeatures";
import ProjectOpportunity from "./ProjectOpportunity";
import ProjectSwatches from "./ProjectSwatches";
import ProjectMaterial from "./ProjectMaterial";
import ProjectResearch from "./ProjectResearch";
import ProjectBuild from "./ProjectBuild ";
import ProjectUserTesting from "./ProjectUserTesting";
import ProjectWhy from "./ProjectWhy";
import ProjectIterations from "./ProjectIterations";
import ProjectEnd from "./ProjectEnd";
import ProjectCompose from "./ProjectCompose";
import ProjectEnvironment from "./ProjectEnvironment ";
/* "600" is loaded because the knot page's first paragraph is semibold (and the Echo Pan concept
   page's bold phrase). Without it the browser falls back to 500 (font-synthesis is off below),
   and the text would not match her reference. */
   import ProjectTargetUser from "./ProjectTargetUser";
const grotesk = Familjen_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });

/* ------------------------------ TUNING ------------------------------ */
const HEADER_H = 96; // px — height of your site header. The video starts BELOW it.
const COLOR_INK = "#000";
const COLOR_GREY = "#404040";
const COLOR_BEIGE = "#E0D5C0"; // the rectangle under the photo (her colour code)

/* how far the beige rectangle reaches past the photo on the TOP, LEFT and BOTTOM (right edge is flush).
   Canva: ~25px on a 1440-wide page → 25 / 1440 = 1.74cqw (the same token as the page-1 bottom margin below).
   On phones (≤820px) it switches to a fixed 16px so the panel meets the screen edge. */
const BEIGE_PAD = 1.74;

/* where the beige ENDS on the right, as a share of the photo's width, counted from the photo's left edge.
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

/* default distance of the text block's last line from the photo's bottom edge (share of the photo height) */
const INTRO_PB_DEFAULT = 0.074;

/* ---------------------- SLIDESHOW (project eight) ---------------------- */
const SLIDE_INTERVAL = 5000; // ms per photo (overridden by gallery.intervalMs) — her Canva page timer says 5.0s
const SLIDE_FADE_MS = 1000; // crossfade duration
const SWIPE_PX = 40; // minimum horizontal swipe on touch screens

/* arrows — SAME as the Research page: small indicator, 10px from the photo edge, vertically centred */
const ARROW_SIZE = 32; // px — diameter of the grey circle
const ARROW_INSET = 10; // px from the photo's left / right edge
const ARROW_BG = "rgba(0, 0, 0, 0.5)"; // translucent grey, as in her reference
const ARROW_BG_HOVER = "rgba(0, 0, 0, 0.68)";

/* ------------------------ CLIENT BADGE (project eight) ------------------------ */
/* Measured on her Canva page (1440 × 900, photo 830px tall, 35 → 865):
     logo 99px wide → 6.9cqw · right edge 90px from the page edge → 6.25cqw
     bottom edge 54px above the photo's bottom → 54 / 830 = 0.065 of the photo height */
const BADGE_SIZE = "clamp(72px, 6.9cqw, 100px)";
const BADGE_RIGHT = 6.25; // cqw
const BADGE_BOTTOM = 0.065; // share of the photo height, measured from the photo's bottom edge
/* from this width up the badge sits bottom-right (as in Canva); below it, it flows UNDER the text so nothing collides */
const BADGE_ABSOLUTE_FROM = 1400; // px

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

/* open chevron inside the grey circle (16px, same as the Research page) */
function Chevron({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
      <polyline
        points={dir === "prev" ? "14.5,6 8.5,12 14.5,18" : "9.5,6 15.5,12 9.5,18"}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProjectDetail({ project }: { project: ProjectDetailData }) {
  const rootRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);

  /* ---------- slideshow state (project eight) ---------- */
  const slides = project.gallery?.slides ?? [];
  const count = slides.length;
  const interval = project.gallery?.intervalMs ?? SLIDE_INTERVAL;
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (count < 2) return;
      setSlide((i: number) => (i + dir + count) % count);
    },
    [count]
  );

  /* autoplay — the timer restarts on every change (auto or arrow click), so it never jumps twice in a row.
     It does NOT depend on prefers-reduced-motion: with reduced motion the CSS swaps photos instantly. */
  useEffect(() => {
    if (count < 2 || paused || !inView || !tabVisible) return;

    const t = window.setTimeout(() => setSlide((i: number) => (i + 1) % count), interval);

    return () => window.clearTimeout(t);
  }, [slide, count, paused, inView, tabVisible, interval]);

  /* stop advancing while the slideshow is mostly off-screen */
  useEffect(() => {
    const el = coverRef.current;
    if (!el || count < 2) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        const e = entries[0];
        if (e) setInView(e.isIntersecting);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count]);

  /* …and while the browser tab is hidden */
  useEffect(() => {
    if (count < 2) return;
    const onVis = () => setTabVisible(!document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [count]);

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

  /* video: silent endless loop, fades in once the first frame is ready, pauses off-screen.
     (projects two, three and eight have photos instead → videoRef is null → nothing to do) */
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
      v.play().catch(() => { });
      io = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          const e = entries[0];
          if (!e) return;
          if (e.isIntersecting) v.play().catch(() => { });
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

  const {
    video,
    image,
    story,
    statement,
    echoConcept,
    echoShapes,
    echoSound,
    materialExploration,
    construction,
    echoTesting,
    echoEnd,
    colourStory,
    collage,
    knotStory,
    behindScene,
    joinery,
    badge,
    about,
    features,
    opportunity,
    swatches,
    materialTaught,
    research,
    howItWorks,
    compose,
    environment,
    userTesting,
    targetUser,
    whyPuppet,
    iterations,
        endPage
  } = project;

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
        "--intro-k": INTRO_V === "end" ? (project.introPb ?? INTRO_PB_DEFAULT) : 0,
        "--note-gap": `${project.noteGap ?? 12}px`,
        "--fade": `${SLIDE_FADE_MS}ms`,
        "--arrow-size": `${ARROW_SIZE}px`,
        "--arrow-inset": `${ARROW_INSET}px`,
        "--arrow-bg": ARROW_BG,
        "--arrow-bg-hover": ARROW_BG_HOVER,
        "--badge": BADGE_SIZE,
        "--badge-right": `${BADGE_RIGHT}cqw`,
        "--badge-k": BADGE_BOTTOM,
      })}
    >
      {/* ============================ PAGE 1 — video / photo / slideshow + intro ============================ */}
      <section className="pd-page pd-hero" aria-label={`${project.title} — overview`}>
        {/* .pd-cover wraps the media and carries the beige rectangle behind it */}
        <div
          ref={coverRef}
          className="pd-cover"
          {...(count > 1
            ? {
              role: "group",
              "aria-roledescription": "carousel",
              "aria-label": `${project.title} — photos`,
              /* pause only for KEYBOARD focus. A mouse click on an arrow also focuses the button,
                 and that must NOT stop the autoplay. */
              onFocus: (e: React.FocusEvent<HTMLDivElement>) => {
                if ((e.target as HTMLElement).matches(":focus-visible")) setPaused(true);
              },
              onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
              },
              onTouchStart: (e: React.TouchEvent) => {
                touchX.current = e.touches[0]?.clientX ?? null;
              },
              onTouchEnd: (e: React.TouchEvent) => {
                if (touchX.current === null) return;
                const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
                touchX.current = null;
                if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
              },
            }
            : {})}
        >
          <div className="pd-cover-bg" aria-hidden="true" />
          <div className="pd-video">
            {count > 0 ? (
              /* slideshow: every photo is stacked in the same frame; only the active one is visible (crossfade) */
              <>
                <div className="pd-slides">
                  {slides.map((s, i: number) => (
                    <div
                      key={s.src}
                      className={`pd-slide${i === slide ? " is-active" : ""}`}
                      role={count > 1 ? "group" : undefined}
                      aria-roledescription={count > 1 ? "slide" : undefined}
                      aria-label={count > 1 ? `${i + 1} of ${count}` : undefined}
                      aria-hidden={i === slide ? undefined : true}
                    >
                      <Image
                        src={s.src}
                        alt={s.alt}
                        fill
                        {...(i === 0 ? { priority: true } : { loading: "eager" as const })}
                        sizes="(max-width: 820px) 100vw, 50vw"
                        quality={90}
                        draggable={false}
                        style={{ objectFit: "cover", objectPosition: s.position ?? "50% 50%" }}
                      />
                    </div>
                  ))}
                </div>

                {count > 1 ? (
                  <>
                    <button
                      type="button"
                      className="pd-arrow pd-arrow--prev"
                      aria-label="Previous photo"
                      onClick={() => go(-1)}
                    >
                      <Chevron dir="prev" />
                    </button>
                    <button
                      type="button"
                      className="pd-arrow pd-arrow--next"
                      aria-label="Next photo"
                      onClick={() => go(1)}
                    >
                      <Chevron dir="next" />
                    </button>
                  </>
                ) : null}
              </>
            ) : image ? (
              /* photo instead of video: same frame, same reveal (clip-path + slow zoom-out) */
              <Image
                className="pd-video-el ready"
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes={image.sizes ?? "(max-width: 820px) 100vw, 50vw"}
                quality={90}
                style={{ objectFit: "cover", objectPosition: image.position ?? "50% 50%" }}
              />
            ) : video ? (
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
            ) : null}
          </div>
        </div>

        <div className="pd-intro">
          <h1 className="pd-title pd-reveal" style={cssVars({ "--d": 0 })}>
            <span className="pd-block">{project.title}</span>
            <span className="pd-block">{project.tagline}</span>
          </h1>

          <p className="pd-meta pd-tags pd-reveal" style={cssVars({ "--d": 1 })}>
            <span className="pd-block">{project.tags}</span>
            {project.meta ? <span className="pd-block">{project.meta}</span> : null}
          </p>

          {project.note ? (
            <p className="pd-meta pd-note pd-reveal" style={cssVars({ "--d": 2 })}>
              <Lines lines={project.note} />
            </p>
          ) : null}

          {badge ? (
            <div className="pd-badge pd-reveal" style={cssVars({ "--d": 3 })}>
              <Image src={badge.src} alt={badge.alt} fill sizes="100px" quality={90} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ============================ PAGE 2 — story (heading + paragraphs) ============================ */}
      {story ? (
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
      ) : null}

      {/* ============================ PAGE 2 (project eight) — ABOUT: text + auto-changing photos ============================ */}
      {about ? <ProjectAbout data={about} /> : null}

      {/* ============================ PAGE 3 (project eight) — KEY FEATURES: pinned, scroll moves the cards sideways ============================ */}
      {features ? <ProjectFeatures data={features} /> : null}

      {/* ============================ (project eight) OPPORTUNITY: diagram + changing photos ============================ */}
      {opportunity ? <ProjectOpportunity data={opportunity} /> : null}

      {/* ============================ (project eight) HDPE SWATCHES: click a tile to flip it ============================ */}
      {swatches ? <ProjectSwatches data={swatches} /> : null}

      {/* ============================ (project eight) WHAT THE MATERIAL TAUGHT ME: bullets + changing photos ============================ */}
      {materialTaught ? <ProjectMaterial data={materialTaught} /> : null}

      {/* ============================ (project eight) PRIMARY RESEARCH: two boxes + two changing photo frames ============================ */}
      {research ? <ProjectResearch data={research} /> : null}

      {/* ============================ (project eight) PAGE 102 — HOW IT WORKS · BUILD: click the lighter panel to build the theatre.
          The timeline (BUILD · COMPOSE · INTERPRET · PERFORM) is fixed at the top centre while pages 102–108 are on screen. ============================ */}
{howItWorks ? <ProjectBuild /> : null}
{compose ? <ProjectCompose data={compose} /> : null}
{environment ? <ProjectEnvironment /> : null}
      {/* ============================ (project eight) PAGE 109 — USER TESTING: hover a number, the video + texts change ============================ */}
      {userTesting ? <ProjectUserTesting data={userTesting} /> : null}
            {/* ============================ (project eight) TARGET USER: age bar + three age-group cards ============================ */}
      {targetUser ? <ProjectTargetUser data={targetUser} /> : null}
            {/* ============================ (project eight) PAGE 115 — WHY PUPPET THEATRE ? ============================ */}
      {whyPuppet ? <ProjectWhy data={whyPuppet} /> : null}
           {iterations ? <ProjectIterations data={iterations} hold={!!endPage} /> : null}

      {/* ============================ (project eight) END: video in a frame, slides over the last Iterations slide after a pause ============================ */}
      {endPage ? <ProjectEnd data={endPage} /> : null}
      {/* ============================ PAGE 2 (project three) — centred statement ============================ */}
      {statement ? <ProjectStatement data={statement} /> : null}

      {/* ============================ PAGE 3 (project three) — CONCEPT: icons + text + sketches ============================ */}
      {echoConcept ? <ProjectEchoConcept data={echoConcept} /> : null}

      {/* ============================ PAGE 4 (project three) — WHAT SHAPES A NOTE: render + scroll-drawn measurements ============================ */}
      {echoShapes ? <ProjectEchoShapes data={echoShapes} /> : null}

      {/* ============================ PAGE 5 (project three) — HOW THE DIMENSIONS ARE CALCULATED | HOW IT AFFECTS THE SOUND ============================ */}
      {echoSound ? <ProjectEchoSound data={echoSound} /> : null}

      {/* ============================ PAGE 6 (project three) — MATERIAL EXPLORATION: hover a material to learn more ============================ */}
      {materialExploration ? <ProjectMaterialExploration data={materialExploration} /> : null}

      {/* ============================ PAGE 2 (project two) — colour-changing tiles + text ============================ */}
      {colourStory ? <ProjectColourStory data={colourStory} /> : null}

      {/* ============================ PAGE 3 (project two) — collage: chair cutouts + sketch + statement ============================ */}
      {collage ? <ProjectCollage data={collage} /> : null}

      {/* ============================ PAGE 4 (project two) — knot photo + two paragraphs ============================ */}
      {knotStory ? <ProjectKnotStory data={knotStory} /> : null}

      {/* ============================ PAGE 5 (project two) — behind the scene: video + sketch + text ============================ */}
      {behindScene ? <ProjectBehindScene data={behindScene} /> : null}

      {/* ============================ PAGE 6 (project two) — details: armrest · box joint · compass legs ============================ */}
      {joinery ? <ProjectJoinery data={joinery} /> : null}

      {/* ============================ PAGE 3 — concept (pinned, scroll-driven) ============================ */}
      {project.concept ? <ProjectConcept concept={project.concept} /> : null}

      {/* ============================ PAGE 4 — form exploration (pinned, scroll-driven gallery) ============================ */}
      {project.formExploration ? <ProjectFormExploration data={project.formExploration} /> : null}

      {/* ============================ PAGE 5 — fabrication (clickable timeline, no scroll-driven motion) ============================ */}
      {project.fabrication ? <ProjectFabrication data={project.fabrication} /> : null}

      {/* ============================ PAGE 6 — ending (landscape clip, centred; the project ends here) ============================ */}
      {project.ending ? <ProjectEnding data={project.ending} /> : null}

      {/* ============================ PAGE 7 (project three) — CONSTRUCTION: workshop photos / clips ============================ */}
      {construction ? <ProjectConstruction data={construction} /> : null}

      {/* ============================ PAGE 8 (project three) — TESTING: two clips on a beige / white split ============================ */}
      {echoTesting ? <ProjectEchoTesting data={echoTesting} /> : null}

      {/* ============================ PAGE 9 (project three) — END: two videos, arrows to switch ============================ */}
      {echoEnd ? <ProjectEchoEnd data={echoEnd} /> : null}

      <noscript>
        <style>{`.pd-reveal{opacity:1!important;transform:none!important}.pd-video{clip-path:none!important}.pd-video-el{opacity:1!important;transform:none!important}.pd-slides{transform:none!important}.pd-arrow{opacity:1!important}`}</style>
      </noscript>

      <style>{CSS}</style>
    </main>
  );
}

/* Static CSS — every tunable arrives as a custom property, so there is nothing to interpolate
   (except BADGE_ABSOLUTE_FROM, which a media query cannot read from a variable). */
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

/* the cover = photo + beige rectangle. It takes over the photo's old size and grid cell. */
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

/* ---- slideshow (project eight): same reveal as the single photo (clip-path wipe + slow zoom-out) ---- */
.pd-slides {
  position: absolute; inset: 0;
  transform: scale(1.08);
  transition: transform 1.8s cubic-bezier(.22, 1, .36, 1) .2s;
}
.pd-slide {
  position: absolute; inset: 0;
  opacity: 0;
  transition: opacity var(--fade) cubic-bezier(.4, 0, .2, 1);
  pointer-events: none; user-select: none;
}
.pd-slide.is-active { opacity: 1; }
.pd-slide img { -webkit-user-drag: none; }

/* arrows: SAME as the Research page. 32px translucent circle + 16px white chevron,
   10px from the photo edge, vertically centred. They appear after the photo has wiped in. */
.pd-arrow {
  position: absolute; z-index: 3; top: 50%;
  width: var(--arrow-size); height: var(--arrow-size);
  margin-top: calc(var(--arrow-size) / -2);
  padding: 0; border: 0; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--arrow-bg); color: #fff;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  opacity: 0;
  transition: opacity .7s ease 1.3s, background-color .35s ease;
}
.pd-arrow--prev { left: var(--arrow-inset); }
.pd-arrow--next { right: var(--arrow-inset); }
.pd-arrow svg { display: block; transition: transform .5s cubic-bezier(.22, 1, .36, 1); }
.pd-arrow:focus { outline: none; }
.pd-arrow:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
@media (hover: hover) and (pointer: fine) {
  .pd-arrow:hover { background: var(--arrow-bg-hover); }
  .pd-arrow--prev:hover svg { transform: translateX(-1.5px); }
  .pd-arrow--next:hover svg { transform: translateX(1.5px); }
}
.pd-arrow:active svg { transform: scale(.92); }

/* text block beside the video.
   GREEN LINE: padding-left = --text-gap = distance between the video's right edge and the text. */
.pd-intro {
  position: relative; /* anchors the client badge */
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
    calc(var(--vid-h) * var(--intro-k, 0.074))
    var(--text-gap);

  text-align: left;
}

.pd-title,
.pd-tags,
.pd-note {
  text-align: left;
}

.pd-tags { margin-top: 12px; }
.pd-note { margin-top: var(--note-gap, 12px); }

/* client badge: circular logo. Narrow screens → flows under the text; wide screens (below) → bottom-right, as in Canva */
.pd-badge {
  position: relative; display: block; overflow: hidden;
  width: var(--badge); height: var(--badge);
  margin-top: 24px; border-radius: 50%;
  background: #9fc5bd; /* matches the logo's teal so no white edge can show */
}
.pd-badge img { object-fit: cover; transform: scale(1.06); user-select: none; -webkit-user-drag: none; }

@media (min-width: ${BADGE_ABSOLUTE_FROM}px) {
  .pd-badge {
    position: absolute; margin: 0;
    right: var(--badge-right);
    /* Canva: the logo's bottom edge sits 6.5% of the photo height above the photo's bottom edge.
       .pd-intro ends exactly at the photo's bottom, so this is measured from there. */
    bottom: calc(var(--vid-h) * var(--badge-k));
  }
}

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
.is-in .pd-slides { transform: scale(1); }
.is-in .pd-arrow { opacity: 1; }

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
  .pd-hero { --beige-pad: 16px; } /* meets the screen edge, same as the hero's 16px side padding */
  .pd-cover { width: var(--vid-w); height: auto; }
  .pd-video { width: 100%; height: auto; aspect-ratio: 694 / 852; }
  .pd-intro { align-self: start; justify-self: start; padding: 0; width: 100%; }
  .pd-story { min-height: 0; place-items: start center; padding: 56px 16px 96px; }
  .pd-read  { width: 100%; max-width: 34rem; }
  .pd-badge { --badge: 72px; }
}

/* reduced motion: no fades or slides, but the slideshow still advances (photos swap instantly) */
@media (prefers-reduced-motion: reduce) {
  .pd-reveal, .pd-video, .pd-video-el, .pd-slides, .pd-slide, .pd-arrow, .pd-arrow svg { transition: none !important; }
  .pd-reveal { opacity: 1; transform: none; }
  .pd-video { clip-path: none; }
  .pd-video-el { transform: none; }
  .pd-slides { transform: none; }
  .pd-arrow { opacity: 1; }
}
`;