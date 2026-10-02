"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

/* -------------------------------------------------------------------------
 * ASSETS (public/hero)
 *   Girl1.png               – static girl
 *   lines.png               – your "lines-exact-no-dots.png" (rename/copy it)
 *   dot-1.png … dot-6.png   – the six dots (any numbering, matched automatically)
 * ---------------------------------------------------------------------- */

const GIRL = "/hero/Girl1.png";
const LINES = "/hero/lines.png";

const DOTS = [
  "/hero/dot-1.png",
  "/hero/dot-2.png",
  "/hero/dot-3.png",
  "/hero/dot-4.png",
  "/hero/dot-5.png",
  "/hero/dot-6.png",
];

/* ---------------------------------------------------------------------------
 * LINE GEOMETRY (1200 × 1200 artwork space)
 * One continuous stroke traced through the artwork's own line pieces.
 * It runs through the dots in this order:
 *   dot 1 (lower left)  → dot 2 (top left)  → dot 3 (bottom)
 *   → dot 4 (right low) → dot 5 (right top) → dot 6 (far right)
 * ------------------------------------------------------------------------ */

const LINE_PATH =
  "M284 942C286 942 292 943 296 943C300 942 305 940 310 938C315 935 319 932 324 928C329 925 334 920 337 915C341 910 344 906 347 901C349 896 352 892 354 887C356 882 357 878 358 873C360 868 361 864 362 859C363 854 364 850 364 845C365 840 366 836 366 831C366 826 367 822 367 817C367 812 367 808 367 803C367 798 367 794 367 789C367 784 367 780 366 775C366 770 365 766 365 761C364 756 364 752 365 747C366 742 376 741 372 732C368 723 352 703 343 692C333 681 323 673 316 666C310 660 308 657 303 653C298 649 294 645 289 641C284 637 280 633 275 630C270 627 266 624 261 621C256 618 252 616 247 613C242 611 238 609 233 606C228 604 224 602 219 600C214 599 210 597 205 595C200 593 196 592 191 590C186 588 182 587 177 585C172 583 168 581 163 579C158 577 154 576 149 573C144 569 146 573 133 560C119 548 83 514 68 497C53 481 48 471 43 463C39 455 42 454 41 449C41 444 40 440 40 435C40 430 40 426 41 421C41 416 41 412 42 407C42 402 43 398 44 393C44 388 45 384 47 379C48 374 49 370 50 365C52 360 53 356 55 351C57 346 59 342 61 337C63 332 65 328 68 323C70 318 73 314 77 309C80 304 83 299 87 295C91 291 94 287 100 283C106 278 107 275 121 270C135 264 171 253 185 249C200 245 202 246 208 246C214 246 217 247 222 248C227 249 231 251 236 253C241 255 245 257 250 260C255 262 259 266 264 269C269 273 273 276 278 281C283 285 288 282 292 296C296 310 299 349 302 365C304 381 306 386 307 393C308 400 308 402 308 407C308 412 308 416 308 421C308 426 308 430 308 435C308 440 308 444 308 449C308 454 308 458 309 463C309 468 309 472 309 477C310 482 311 486 312 491C313 496 314 500 316 505C317 510 319 514 322 519C325 524 329 529 333 533C337 536 342 540 347 543C352 545 356 547 361 549C366 550 370 551 375 551C380 551 384 551 389 551C394 550 398 549 403 547C408 545 411 544 417 541C423 538 426 537 438 531C449 525 476 510 488 504C499 499 501 498 507 497C513 495 516 495 521 495C526 495 530 494 535 495C540 496 546 480 549 499C551 518 552 570 549 610C547 651 537 717 533 741C528 766 525 753 522 758C518 763 515 767 512 772C509 777 505 781 502 786C499 791 496 795 493 800C490 805 487 809 485 814C482 819 479 823 477 828C474 833 471 837 469 842C467 847 464 851 462 856C460 861 458 865 456 870C454 875 452 879 450 884C448 889 446 893 444 898C443 903 441 907 440 912C438 917 437 921 436 926C435 931 434 935 433 940C432 945 431 949 430 954C429 959 429 963 428 968C428 973 428 977 428 982C428 987 428 991 428 996C428 1001 429 1005 429 1010C430 1015 431 1019 432 1024C433 1029 435 1033 437 1038C438 1043 440 1047 443 1052C446 1057 443 1058 455 1068C467 1078 500 1102 515 1112C530 1123 538 1127 546 1131C553 1135 555 1135 560 1137C565 1138 569 1140 574 1141C579 1142 583 1144 588 1145C593 1146 597 1147 602 1148C607 1149 611 1150 616 1150C621 1151 625 1152 630 1152C635 1153 639 1153 644 1154C649 1154 653 1154 658 1154C663 1155 667 1154 672 1154C677 1154 681 1153 686 1153C691 1153 695 1153 700 1152C705 1152 709 1151 714 1150C719 1149 723 1148 728 1147C733 1146 737 1145 742 1143C747 1142 751 1141 756 1139C761 1138 765 1136 770 1134C775 1133 779 1131 784 1128C789 1126 793 1124 798 1121C803 1119 807 1116 812 1113C817 1110 821 1107 826 1104C831 1101 835 1097 840 1093C845 1089 849 1085 854 1080C859 1075 864 1071 868 1066C872 1061 876 1057 879 1052C883 1047 886 1043 889 1038C892 1033 895 1029 898 1024C900 1019 903 1015 905 1010C907 1005 909 1001 910 996C912 991 914 987 915 982C917 977 918 973 919 968C920 963 921 959 922 954C922 949 923 945 923 940C924 935 924 931 924 926C924 921 924 917 924 912C924 907 924 903 924 898C923 893 923 889 922 884C921 879 920 875 919 870C918 865 917 861 916 856C915 851 914 848 912 842C909 836 909 834 902 820C896 807 878 774 870 760C862 747 860 745 856 739C852 733 849 730 846 725C843 720 840 716 837 711C834 706 832 702 829 697C826 692 824 688 822 683C820 678 818 674 816 669C814 664 812 660 810 655C808 650 808 648 806 641C804 634 800 622 798 613C796 604 795 594 794 587C793 581 793 578 793 573C793 568 793 564 793 559C793 554 794 550 794 545C795 540 796 536 797 531C798 526 799 522 801 517C803 512 804 508 807 503C809 498 812 494 815 489C819 484 823 479 827 475C832 471 832 465 841 464C851 463 872 466 885 471C898 476 913 489 919 496C924 502 918 505 918 510C918 515 918 519 919 524C919 529 920 533 921 538C922 543 923 547 925 552C926 557 928 561 930 566C933 571 935 575 939 580C942 585 945 589 949 594C953 599 958 603 962 607C967 611 971 615 976 618C981 621 984 624 990 626C996 629 993 634 1013 632C1034 630 1093 620 1115 614C1136 608 1136 601 1141 596C1147 591 1146 587 1148 582C1150 577 1153 573 1155 568C1156 563 1157 559 1158 554C1159 549 1160 545 1161 540C1161 535 1161 531 1161 526C1161 521 1161 517 1160 512C1159 507 1161 507 1155 497C1149 487 1133 464 1123 452C1113 439 1104 427 1097 421C1090 414 1087 415 1083 414C1080 412 1078 411 1077 411";

/* Dot centres in draw order, normalised 0–1. Used to match each dot PNG to its step. */
const DOT_POINTS: [number, number][] = [
  [355 / 1200, 711 / 1200],
  [147 / 1200, 258 / 1200],
  [496 / 1200, 1100 / 1200],
  [888 / 1200, 789 / 1200],
  [885 / 1200, 455 / 1200],
  [1138 / 1200, 456 / 1200],
];

/* time (draw clock) → fraction of path length. Invisible bridges behind the
 * arms are sped through so the line never appears to stall mid-stroke. */
const TIME_TO_LENGTH: [number, number][] = [[0.0, 0.0], [0.0084, 0.007], [0.0198, 0.0165], [0.0299, 0.025], [0.0391, 0.0326], [0.048, 0.04], [0.0568, 0.0474], [0.0657, 0.0548], [0.0749, 0.0625], [0.0907, 0.0847], [0.1028, 0.0949], [0.1138, 0.104], [0.1238, 0.1124], [0.1334, 0.1203], [0.1428, 0.1282], [0.1524, 0.1362], [0.1662, 0.1673], [0.1793, 0.1794], [0.1881, 0.1867], [0.197, 0.1942], [0.2062, 0.2018], [0.2157, 0.2098], [0.2261, 0.2185], [0.2378, 0.2282], [0.2567, 0.2532], [0.2658, 0.2608], [0.276, 0.2693], [0.288, 0.2793], [0.3039, 0.3049], [0.3128, 0.3123], [0.3216, 0.3196], [0.3304, 0.327], [0.3396, 0.3346], [0.3503, 0.3435], [0.3601, 0.3517], [0.369, 0.3592], [0.3789, 0.3674], [0.3963, 0.3891], [0.4053, 0.3966], [0.4186, 0.4185], [0.4378, 0.4678], [0.4486, 0.4769], [0.4591, 0.4856], [0.4692, 0.494], [0.4789, 0.5022], [0.4884, 0.5101], [0.4976, 0.5178], [0.5066, 0.5253], [0.5155, 0.5327], [0.5244, 0.5401], [0.5337, 0.5479], [0.5516, 0.5657], [0.5686, 0.5856], [0.5778, 0.5933], [0.5868, 0.6009], [0.5957, 0.6083], [0.6046, 0.6157], [0.6134, 0.6231], [0.6224, 0.6306], [0.6316, 0.6382], [0.6412, 0.6462], [0.6513, 0.6547], [0.6625, 0.664], [0.6747, 0.6742], [0.6855, 0.6832], [0.6953, 0.6914], [0.7046, 0.6992], [0.7136, 0.7067], [0.7224, 0.714], [0.7313, 0.7214], [0.7404, 0.729], [0.753, 0.7396], [0.7697, 0.7632], [0.7803, 0.772], [0.7903, 0.7803], [0.7998, 0.7883], [0.813, 0.8018], [0.823, 0.8101], [0.8318, 0.8175], [0.8411, 0.8252], [0.8517, 0.8341], [0.8655, 0.8476], [0.8766, 0.8656], [0.8855, 0.873], [0.8948, 0.8808], [0.9055, 0.8897], [0.9168, 0.8991], [0.9316, 0.9128], [0.9447, 0.9447], [0.9545, 0.9528], [0.9634, 0.9603], [0.9723, 0.9677], [0.9902, 0.9918], [1.0, 1.0]];

/* draw-clock position of each dot along the stroke */
const DOT_CLOCK = [0.08, 0.2437, 0.5518, 0.7565, 0.8661, 0.9819];

/* 6 steps: free end → dot1, dot1 → dot2, … , dot5 → dot6 (+ small tail) */
const STEP_BOUNDS = [0, ...DOT_CLOCK.slice(0, 5), 1];

/* -------------------------------------------------------------------------
 * TIMING (scroll progress 0 → 1)
 * ---------------------------------------------------------------------- */

const SECTION_HEIGHT_SVH = 700; // total scroll length of the hero

const DOT_FADED_OPACITY = 0.22; // the "faded colour" the dots start in
const DOT_START = 0.0;
const DOT_STAGGER = 0.018; // gap between each dot starting to emerge
const DOT_DURATION = 0.1; // slow fade to full colour (2× the old speed)

const LINES_START = 0.22; // lines only begin once the dots are established
const LINES_END = 0.97;
const DRAW_SHARE = 0.74; // part of each slot spent drawing; rest = pause on the dot

const SMOOTHING = 9; // higher = snappier follow of the scroll

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

/* Finds which dot PNG sits at which point of the artwork, so the dots always
 * emerge in the same order the line reaches them – whatever the files are named. */
async function orderDotsByPosition(sources: string[]) {
  const centroids = await Promise.all(
    sources.map(
      (src) =>
        new Promise<[number, number] | null>((resolve) => {
          const img = new window.Image();

          img.onload = () => {
            const size = 160;
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;

            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) return resolve(null);

            ctx.drawImage(img, 0, 0, size, size);
            const { data } = ctx.getImageData(0, 0, size, size);

            let sum = 0;
            let sx = 0;
            let sy = 0;

            for (let y = 0; y < size; y++) {
              for (let x = 0; x < size; x++) {
                const a = data[(y * size + x) * 4 + 3];
                if (a > 20) {
                  sum += a;
                  sx += x * a;
                  sy += y * a;
                }
              }
            }

            resolve(sum ? [sx / sum / size, sy / sum / size] : null);
          };

          img.onerror = () => resolve(null);
          img.src = src;
        })
    )
  );

  if (centroids.some((c) => !c)) return sources;

  const remaining = sources.map((_, i) => i);
  const ordered: string[] = [];

  for (const [px, py] of DOT_POINTS) {
    let best = remaining[0];
    let bestDist = Infinity;

    for (const i of remaining) {
      const [cx, cy] = centroids[i] as [number, number];
      const d = (cx - px) ** 2 + (cy - py) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    ordered.push(sources[best]);
    remaining.splice(remaining.indexOf(best), 1);
  }

  return ordered;
}

/* -------------------------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------------------- */

export default function HeroSection() {
  const maskId = useId().replace(/:/g, "");

  const sectionRef = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const target = useRef(0);
  const current = useRef(0);

  const [orderedDots, setOrderedDots] = useState(DOTS);

  /* write the current progress straight to the DOM (no React re-render per frame) */
  const paint = useRef((p: number) => {
    const path = pathRef.current;

    if (path) {
      path.style.strokeDashoffset = String(1 - clockToLength(drawClock(p)));
    }

    dotRefs.current.forEach((el, i) => {
      if (el) el.style.opacity = String(dotOpacity(p, i));
    });
  });

  useEffect(() => {
    let alive = true;

    orderDotsByPosition(DOTS).then((order) => {
      if (alive) setOrderedDots(order);
    });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    paint.current(current.current);
  }, [orderedDots]);

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

  return (
    <section
      ref={sectionRef}
      className="relative bg-white"
      style={{ minHeight: `${SECTION_HEIGHT_SVH}svh` }}
    >
      <div className="sticky top-[72px] h-[calc(100svh-72px)] overflow-hidden sm:top-[84px] sm:h-[calc(100svh-84px)]">
        <div className="relative mx-auto h-full w-full max-w-[1440px]">
          {/* Heading – 32px / Medium (500) */}
          <div className="absolute left-1/2 top-[6%] z-50 -translate-x-1/2 text-center">
            <p className="m-0 whitespace-nowrap text-[26px] font-medium leading-[1.12] tracking-[-0.025em] text-black sm:text-[29px] md:text-[32px]">
              Hello,
            </p>
            <p className="mb-0 mt-[2px] whitespace-nowrap text-[26px] font-medium leading-[1.12] tracking-[-0.025em] text-black sm:text-[29px] md:text-[32px]">
              I am Nimi Desai
            </p>
          </div>

          {/* Artwork */}
          <div className="absolute bottom-0 left-1/2 z-10 w-[min(78vw,78vh,760px)] -translate-x-1/2 sm:w-[min(74vw,78vh,760px)] md:w-[min(70vw,78vh,760px)] lg:w-[min(760px,78vh)]">
            <div className="relative aspect-square w-full">
              {/* Lines: hidden until drawn, full colour the moment they appear */}
              <svg
                viewBox="0 0 1200 1200"
                className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
                aria-hidden="true"
              >
                <defs>
                  <mask
                    id={maskId}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="1200"
                    height="1200"
                  >
                    <path
                      ref={pathRef}
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
                  href={LINES}
                  x="0"
                  y="0"
                  width="1200"
                  height="1200"
                  preserveAspectRatio="xMidYMid meet"
                  mask={`url(#${maskId})`}
                />
              </svg>

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

              {/* Dots – always above the lines, so no line ever shows over a dot */}
              <div className="pointer-events-none absolute inset-0 z-30">
                {orderedDots.map((src, index) => (
                  <div
                    key={src}
                    ref={(el) => {
                      dotRefs.current[index] = el;
                    }}
                    className="absolute inset-0 will-change-[opacity]"
                    style={{ opacity: DOT_FADED_OPACITY }}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      priority
                      unoptimized
                      draggable={false}
                      className="select-none object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Captions – 16px / Regular / #555252 */}
          <p className="absolute bottom-[11%] left-[6.2%] z-50 m-0 text-[14px] font-normal leading-[1.4] text-[#555252] sm:text-[15px] md:text-[16px]">
            Curious about many things,
          </p>

          <p className="absolute bottom-[11%] right-[6.2%] z-50 m-0 text-right text-[14px] font-normal leading-[1.4] text-[#555252] sm:text-[15px] md:text-[16px]">
            stubborn enough to see an idea through.
          </p>
        </div>
      </div>
    </section>
  );
}