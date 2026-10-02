"use client";

import Image from "next/image";
import { useEffect, useId, useRef } from "react";

/* -------------------------------------------------------------------------
 * ASSETS (public/hero)
 *   Girl1.png               – static girl
 *   lines-back.png          – line art that stays BEHIND the girl
 *   lines-front.png         – the part of the lines that crosses OVER her trousers
 *   (dots are drawn in code as perfect circles – no dot PNGs needed)
 * ---------------------------------------------------------------------- */

const GIRL = "/hero/Girl1.png";
const LINES_BACK = "/hero/lines-back.png";
const LINES_FRONT = "/hero/lines-front.png";

/* ---------------------------------------------------------------------------
 * LINE GEOMETRY (1200 × 1200 artwork space)
 * One continuous stroke traced through the artwork's own line pieces.
 * It runs through the dots in this order:
 *   dot 1 (lower left)  → dot 2 (top left)  → dot 3 (bottom)
 *   → dot 4 (right low) → dot 5 (right top) → dot 6 (far right)
 * ------------------------------------------------------------------------ */

const LINE_PATH =
  "M245 927C252 930 277 940 287 942C296 944 298 942 303 941C308 939 312 937 317 934C322 931 327 926 331 922C335 918 339 913 342 908C346 903 348 899 350 894C353 889 355 885 356 880C358 875 359 871 360 866C362 861 362 857 363 852C364 847 365 843 365 838C366 833 366 829 367 824C367 819 367 815 367 810C367 805 367 801 367 796C367 791 367 787 367 782C367 777 366 773 366 768C365 763 363 759 364 754C364 749 368 746 369 740C369 734 372 727 365 716C358 705 334 684 325 675C315 665 315 664 310 659C305 655 301 651 296 647C291 643 287 639 282 635C277 632 273 628 268 625C263 622 259 620 254 617C249 614 245 612 240 610C235 607 231 605 226 603C221 601 217 599 212 598C207 596 203 594 198 593C193 591 189 589 184 587C179 586 175 584 170 582C165 580 161 578 156 576C151 574 150 575 142 568C134 562 124 552 108 537C92 521 58 486 47 473C36 459 43 461 42 456C41 451 41 447 40 442C40 437 40 433 40 428C40 423 41 419 41 414C41 409 42 405 43 400C43 395 44 391 45 386C46 381 47 377 48 372C50 367 51 363 53 358C54 353 56 349 58 344C60 339 62 335 64 330C67 325 69 321 72 316C75 311 78 307 81 302C85 297 89 293 93 288C98 284 98 282 107 277C117 272 137 263 153 258C168 253 190 248 200 246C211 244 210 246 215 247C220 248 224 249 229 250C234 252 238 254 243 256C248 258 252 261 257 264C262 267 266 271 271 275C276 279 281 277 285 286C289 294 294 310 297 327C301 343 303 372 305 385C307 397 307 395 308 400C308 405 308 409 308 414C308 419 308 423 308 428C308 433 308 437 308 442C308 447 308 451 308 456C308 461 309 465 309 470C309 475 310 479 310 484C311 489 312 493 313 498C315 503 316 507 319 512C321 517 324 522 327 526C331 530 336 535 340 538C344 542 349 544 354 546C359 548 363 549 368 550C373 551 377 552 382 551C387 551 391 550 396 549C401 548 405 546 410 544C415 542 416 542 425 537C434 533 451 524 464 517C476 511 491 503 500 499C508 496 509 496 514 496C519 495 523 495 528 495C533 495 538 491 542 496C546 501 554 489 553 524C553 559 544 668 540 706C536 743 531 741 527 751C523 761 520 760 517 765C514 770 510 774 507 779C504 784 501 788 498 793C495 798 492 802 489 807C486 812 483 816 481 821C478 826 475 830 473 835C470 840 468 844 465 849C463 854 461 858 459 863C457 868 455 872 453 877C451 882 449 886 447 891C445 896 444 900 442 905C441 910 439 914 438 919C436 924 435 928 434 933C433 938 432 942 431 947C430 952 430 956 429 961C429 966 428 970 428 975C428 980 428 984 428 989C428 994 428 998 428 1003C429 1008 430 1012 431 1017C432 1022 433 1026 434 1031C436 1036 437 1040 440 1045C442 1050 441 1052 447 1059C454 1066 464 1076 479 1087C494 1098 524 1119 537 1127C549 1134 548 1132 553 1134C558 1136 562 1137 567 1139C572 1140 576 1142 581 1143C586 1144 590 1145 595 1146C600 1148 604 1148 609 1149C614 1150 618 1151 623 1152C628 1152 632 1153 637 1153C642 1154 646 1154 651 1154C656 1154 660 1155 665 1154C670 1154 674 1154 679 1154C684 1153 688 1153 693 1153C698 1152 702 1152 707 1151C712 1151 716 1150 721 1149C726 1148 730 1147 735 1145C740 1144 744 1143 749 1141C754 1140 758 1139 763 1137C768 1135 772 1134 777 1131C782 1129 786 1127 791 1125C796 1123 800 1120 805 1117C810 1115 814 1112 819 1109C824 1106 828 1102 833 1099C838 1095 842 1091 847 1087C852 1083 857 1078 861 1073C865 1068 870 1064 874 1059C878 1054 881 1050 884 1045C888 1040 891 1036 894 1031C896 1026 899 1022 901 1017C904 1012 906 1008 908 1003C910 998 911 994 913 989C915 984 916 980 917 975C919 970 920 966 921 961C921 956 922 952 923 947C923 942 924 938 924 933C924 928 924 924 924 919C924 914 924 910 924 905C924 900 924 896 923 891C923 886 922 882 921 877C920 872 919 868 918 863C917 858 915 854 914 849C912 844 913 844 909 834C904 825 895 805 887 790C879 776 867 756 862 747C856 737 854 737 851 732C848 727 844 723 841 718C839 713 836 709 833 704C830 699 828 695 825 690C823 685 821 681 819 676C817 671 815 667 813 662C811 657 809 653 808 648C806 643 805 639 803 630C801 622 796 605 794 597C793 588 794 585 793 580C793 575 793 571 793 566C793 561 793 557 794 552C794 547 795 543 796 538C796 533 797 529 799 524C800 519 802 515 804 510C806 505 808 501 811 496C813 491 817 486 821 482C825 478 828 472 834 469C840 466 842 460 855 462C868 465 901 479 912 486C922 492 917 498 918 503C920 508 918 512 918 517C918 522 919 526 920 531C920 536 921 540 923 545C924 550 925 554 927 559C929 564 931 568 934 573C937 578 940 582 943 587C947 592 951 597 955 601C959 605 964 609 969 613C974 616 978 619 983 622C988 625 985 629 998 630C1010 631 1036 631 1059 627C1082 622 1123 610 1137 603C1151 597 1142 594 1144 589C1147 584 1150 580 1152 575C1154 570 1155 566 1157 561C1158 556 1159 552 1160 547C1160 542 1161 538 1161 533C1161 528 1161 524 1161 519C1160 514 1162 511 1159 505C1156 499 1152 494 1144 481C1135 468 1115 440 1106 429C1097 418 1096 420 1090 417C1084 413 1076 410 1073 408C1069 406 1070 406 1069 405";

/* Dot centres in draw order (artwork space). Fitted to the circular cut-outs
 * in the line artwork, so each dot sits exactly where its line ends. */
const DOT_CENTERS: [number, number][] = [
  [354, 710],
  [147, 258],
  [496, 1101],
  [888, 789],
  [884, 458],
  [1137, 458],
];

const DOT_RADIUS = 32.5; // perfectly round, a hair larger than the cut-out

/* time (draw clock) → fraction of path length. Invisible bridges behind the
 * arms are sped through so the line never appears to stall mid-stroke. */
const TIME_TO_LENGTH: [number, number][] = [[0.0, 0.0], [0.0171, 0.0158], [0.0283, 0.0251], [0.0389, 0.034], [0.0483, 0.0419], [0.0574, 0.0495], [0.0665, 0.057], [0.0755, 0.0646], [0.085, 0.0725], [0.1012, 0.095], [0.1133, 0.1051], [0.1243, 0.1143], [0.1345, 0.1228], [0.1442, 0.1308], [0.1538, 0.1389], [0.164, 0.1474], [0.1813, 0.1823], [0.1905, 0.19], [0.1996, 0.1976], [0.2087, 0.2052], [0.2182, 0.2131], [0.2283, 0.2215], [0.2395, 0.2309], [0.2546, 0.2527], [0.2691, 0.2648], [0.2789, 0.2729], [0.2902, 0.2823], [0.3068, 0.3083], [0.3168, 0.3167], [0.3258, 0.3242], [0.3348, 0.3317], [0.344, 0.3394], [0.3547, 0.3483], [0.3649, 0.3569], [0.374, 0.3645], [0.384, 0.3728], [0.4016, 0.3945], [0.4108, 0.4021], [0.4246, 0.4307], [0.4436, 0.4732], [0.4546, 0.4824], [0.4652, 0.4912], [0.4755, 0.4998], [0.4854, 0.508], [0.495, 0.5161], [0.5043, 0.5238], [0.5134, 0.5315], [0.5224, 0.539], [0.5316, 0.5467], [0.5416, 0.555], [0.5663, 0.5841], [0.5762, 0.5925], [0.5855, 0.6002], [0.5947, 0.6078], [0.6037, 0.6154], [0.6127, 0.6229], [0.6218, 0.6305], [0.6311, 0.6383], [0.6408, 0.6463], [0.6509, 0.6549], [0.6621, 0.6641], [0.6746, 0.6746], [0.6857, 0.6839], [0.6958, 0.6924], [0.7054, 0.7003], [0.7145, 0.708], [0.7235, 0.7155], [0.7326, 0.723], [0.7418, 0.7308], [0.7564, 0.7452], [0.7717, 0.7653], [0.7824, 0.7742], [0.7924, 0.7826], [0.8021, 0.7907], [0.8163, 0.805], [0.8254, 0.8126], [0.8345, 0.8202], [0.8443, 0.8284], [0.8558, 0.838], [0.8704, 0.8607], [0.8798, 0.8686], [0.889, 0.8763], [0.8992, 0.8848], [0.9109, 0.8946], [0.9216, 0.9035], [0.9394, 0.9404], [0.9495, 0.9488], [0.9588, 0.9565], [0.9678, 0.9641], [0.9825, 0.9854], [0.9976, 0.998], [1.0, 1.0]];

/* draw-clock position of each dot along the stroke */
const DOT_CLOCK = [0.0896, 0.2511, 0.548, 0.7568, 0.8649, 0.9791];

/* 6 steps: free end → dot1, dot1 → dot2, … , dot5 → dot6 (+ small tail) */
const STEP_BOUNDS = [0, ...DOT_CLOCK.slice(0, 5), 1];

/* -------------------------------------------------------------------------
 * TIMING (scroll progress 0 → 1)
 * ---------------------------------------------------------------------- */

const SECTION_HEIGHT_SVH = 900; // total scroll length of the hero

const DOT_FADED_OPACITY = 0.22; // the "faded colour" the dots start in
const DOT_START = 0.0;
const DOT_STAGGER = 0.018; // gap between each dot starting to emerge
const DOT_DURATION = 0.1; // slow fade to full colour (2× the old speed)

const LINES_START = 0.22; // lines only begin once the dots are established
const LINES_END = 0.97;
const DRAW_SHARE = 0.66; // part of each slot spent drawing; rest = pause on the dot

const SMOOTHING = 7; // higher = snappier follow of the scroll

/* -------------------------------------------------------------------------
 * HELPERS
 * ---------------------------------------------------------------------- */

const clamp = (v: number, min = 0, max = 1) => Math.min(Math.max(v, min), max);

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

/* Step slots: longer strokes get a little more scroll, not proportionally more */
const STEP_WEIGHTS = STEP_BOUNDS.slice(0, -1).map((b, i) =>
  Math.sqrt(STEP_BOUNDS[i + 1] - b)
);
const WEIGHT_SUM = STEP_WEIGHTS.reduce((a, b) => a + b, 0);

const STEP_SLOTS = (() => {
  let cursor = LINES_START;
  return STEP_WEIGHTS.map((w) => {
    const slot = ((LINES_END - LINES_START) * w) / WEIGHT_SUM;
    const start = cursor;
    cursor += slot;
    return { start, drawEnd: start + slot * DRAW_SHARE };
  });
})();

/* progress → draw clock (0–1). Holds at each dot between steps. */
function drawClock(progress: number) {
  if (progress <= LINES_START) return 0;

  let clock = 0;

  for (let i = 0; i < STEP_SLOTS.length; i++) {
    const { start, drawEnd } = STEP_SLOTS[i];
    const from = STEP_BOUNDS[i];
    const to = STEP_BOUNDS[i + 1];

    if (progress >= drawEnd) {
      clock = to;
      continue;
    }

    if (progress > start) {
      const local = (progress - start) / (drawEnd - start);
      clock = from + (to - from) * easeInOutSine(clamp(local));
    }

    break;
  }

  return clock;
}

function clockToLength(clock: number) {
  const t = TIME_TO_LENGTH;

  if (clock <= 0) return 0;
  if (clock >= 1) return 1;

  let lo = 0;
  let hi = t.length - 1;

  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (t[mid][0] <= clock) lo = mid;
    else hi = mid;
  }

  const [t0, l0] = t[lo];
  const [t1, l1] = t[hi];
  const k = t1 === t0 ? 0 : (clock - t0) / (t1 - t0);

  return l0 + (l1 - l0) * k;
}

function dotOpacity(progress: number, index: number) {
  const start = DOT_START + index * DOT_STAGGER;
  const k = easeInOutCubic(clamp((progress - start) / DOT_DURATION));

  return DOT_FADED_OPACITY + (1 - DOT_FADED_OPACITY) * k;
}

/* -------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------- */

export default function HeroSection() {
  const maskId = useId().replace(/:/g, "");

  const sectionRef = useRef<HTMLElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);

  const target = useRef(0);
  const current = useRef(0);

  /* write the current progress straight to the DOM (no React re-render per frame) */
  const paint = useRef((p: number) => {
    const offset = String(1 - clockToLength(drawClock(p)));

    pathRefs.current.forEach((path) => {
      if (path) path.style.strokeDashoffset = offset;
    });

    dotRefs.current.forEach((el, i) => {
      if (el) el.style.opacity = String(dotOpacity(p, i));
    });
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let last = 0;

    const readScroll = () => {
      const rect = section.getBoundingClientRect();
      const header = window.innerWidth >= 640 ? 84 : 72;
      const distance = section.offsetHeight - (window.innerHeight - header);

      target.current = distance > 0 ? clamp(-rect.top / distance) : 0;
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.05);
      last = now;

      const diff = target.current - current.current;

      if (reduceMotion || Math.abs(diff) < 0.00008) {
        current.current = target.current;
        paint.current(current.current);
        raf = 0;
        return;
      }

      current.current += diff * (1 - Math.exp(-SMOOTHING * dt));
      paint.current(current.current);
      raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      readScroll();

      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    readScroll();
    current.current = target.current;
    paint.current(current.current);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  /* One reveal-mask + line image. The same stroke drives both layers. */
  const renderLines = (id: string, src: string, zClass: string, index: number) => (
    <svg
      viewBox="0 0 1200 1200"
      className={`pointer-events-none absolute inset-0 ${zClass} h-full w-full select-none`}
      aria-hidden="true"
    >
      <defs>
        <mask
          id={id}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1200"
          height="1200"
        >
          <path
            ref={(el) => {
              pathRefs.current[index] = el;
            }}
            d={LINE_PATH}
            pathLength={1}
            fill="none"
            stroke="#fff"
            strokeWidth={72}
            strokeLinecap="butt"
            strokeLinejoin="round"
            style={{
              strokeDasharray: "1 2",
              strokeDashoffset: 1,
            }}
          />
        </mask>
      </defs>

      <image
        href={src}
        x="0"
        y="0"
        width="1200"
        height="1200"
        preserveAspectRatio="xMidYMid meet"
        mask={`url(#${id})`}
      />
    </svg>
  );

  return (
    <section
      ref={sectionRef}
      className="relative bg-white"
      style={{ minHeight: `${SECTION_HEIGHT_SVH}svh` }}
    >
      <div className="sticky top-[72px] h-[calc(100svh-72px)] overflow-hidden sm:top-[84px] sm:h-[calc(100svh-84px)]">
        <div className="relative h-full w-full [--art:min(92svh,90vw)]">
          {/* Heading – Medium. Size and position are tied to the artwork, so the
              composition is identical at every screen size */}
          <div className="absolute bottom-[calc(var(--art)*0.7405)] left-1/2 z-50 -translate-x-1/2 text-center">
            <p className="m-0 whitespace-nowrap font-medium leading-[1.37] text-black [font-size:clamp(22px,calc(var(--art)*0.0516),44px)]">
              Hello,
            </p>
            <p className="m-0 whitespace-nowrap font-medium leading-[1.37] text-black [font-size:clamp(22px,calc(var(--art)*0.0516),44px)]">
              I am Nimi Desai
            </p>
          </div>

          {/* Artwork */}
          <div className="absolute bottom-0 left-1/2 z-10 w-[var(--art)] -translate-x-1/2">
            <div className="relative aspect-square w-full">
              {/* Lines behind the girl */}
              {renderLines(`${maskId}-back`, LINES_BACK, "z-10", 0)}

              {/* Girl – completely static */}
              <Image
                src={GIRL}
                alt="Nimi Desai"
                fill
                priority
                unoptimized
                draggable={false}
                className="pointer-events-none absolute inset-0 z-20 select-none object-contain"
              />

              {/* Lines crossing over her trousers – above the girl, still under the dots */}
              {renderLines(`${maskId}-front`, LINES_FRONT, "z-[25]", 1)}

              {/* Dots – drawn as true circles, always above the lines */}
              <svg
                viewBox="0 0 1200 1200"
                className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id={`${maskId}-dot`} cx="46%" cy="42%" r="62%">
                    <stop offset="0%" stopColor="#97594a" />
                    <stop offset="55%" stopColor="#87493b" />
                    <stop offset="100%" stopColor="#7c3f33" />
                  </radialGradient>

                  {/* soft watercolour grain – changes the colour only, never the shape */}
                  <filter
                    id={`${maskId}-grain`}
                    x="-5%"
                    y="-5%"
                    width="110%"
                    height="110%"
                    colorInterpolationFilters="sRGB"
                  >
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.09"
                      numOctaves="3"
                      seed="7"
                      result="noise"
                    />
                    <feColorMatrix
                      in="noise"
                      type="matrix"
                      values="0 0 0 0 0.35  0 0 0 0 0.12  0 0 0 0 0.09  0 0 0 -1.1 0.75"
                      result="shade"
                    />
                    <feComposite in="shade" in2="SourceGraphic" operator="over" result="mix" />
                    <feComposite in="mix" in2="SourceAlpha" operator="in" />
                  </filter>
                </defs>

              {DOT_CENTERS.map(([cx, cy], index) => (
  <g
    key={index}
    ref={(el) => {
      dotRefs.current[index] = el;
    }}
    style={{ opacity: DOT_FADED_OPACITY }}
  >
    {/* Solid base guarantees that no line can show through the dot */}
    <circle
      cx={cx}
      cy={cy}
      r={DOT_RADIUS}
      fill={`url(#${maskId}-dot)`}
    />

    {/* Watercolour texture stays on top of the solid dot */}
    <circle
      cx={cx}
      cy={cy}
      r={DOT_RADIUS}
      fill={`url(#${maskId}-dot)`}
      filter={`url(#${maskId}-grain)`}
    />
  </g>
))}
              </svg>
            </div>
          </div>

          {/* Captions – Regular / #555252 */}
          <p className="absolute bottom-[calc(var(--art)*0.14)] left-[max(16px,calc(50%_-_var(--art)*0.4665_-_11.5em))] z-50 m-0 whitespace-nowrap font-normal leading-[1.4] text-[#555252] [font-size:clamp(12px,calc(var(--art)*0.0258),20px)]">
            Curious about many things,
          </p>

          <p className="absolute bottom-[calc(var(--art)*0.14)] right-[max(16px,calc(50%_-_var(--art)*0.3235_-_16.9em))] z-50 m-0 whitespace-nowrap text-right font-normal leading-[1.4] text-[#555252] [font-size:clamp(12px,calc(var(--art)*0.0258),20px)]">
            stubborn enough to see an idea through.
          </p>
        </div>
      </div>
    </section>
  );
}