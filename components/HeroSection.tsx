"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const DOTS = [
  "/hero/dot-1.png",
  "/hero/dot-2.png",
  "/hero/dot-3.png",
  "/hero/dot-4.png",
  "/hero/dot-5.png",
  "/hero/dot-6.png",
];

const CONNECTIONS = [
  {
    start: 0.17,
    end: 0.29,
    paths: [
      "M 145 259 C 110 275 72 325 50 390 C 40 425 39 460 45 486",
      "M 294 369 C 295 420 296 478 315 520 C 335 552 375 560 431 531",
      "M 126 550 C 185 575 250 592 300 625 C 325 643 345 675 354 710",
    ],
  },
  {
    start: 0.35,
    end: 0.47,
    paths: [
      "M 354 710 C 365 765 370 820 350 875 C 335 915 310 940 270 930",
      "M 545 730 C 500 790 468 845 443 915 C 421 978 434 1038 495 1100",
      "M 480 505 C 510 490 545 486 570 505",
    ],
  },
  {
    start: 0.53,
    end: 0.65,
    paths: [
      "M 495 1100 C 555 1132 625 1150 700 1155 C 780 1155 850 1125 885 1060 C 918 1000 930 910 900 820 C 895 805 891 796 888 790",
    ],
  },
  {
    start: 0.71,
    end: 0.83,
    paths: [
      "M 888 790 C 858 748 825 690 806 625 C 792 580 791 530 806 495 C 822 468 852 455 884 458",
    ],
  },
  {
    start: 0.89,
    end: 0.99,
    paths: [
      "M 923 482 C 920 530 940 575 978 606 C 994 620 1008 630 1020 635",
      "M 1085 407 C 1100 420 1118 436 1138 458",
    ],
  },
];

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function smooth(value: number) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function stageProgress(
  progress: number,
  start: number,
  end: number
) {
  return smooth((progress - start) / (end - start));
}

function dotProgress(
  progress: number,
  index: number
) {
  const start = 0.015 + index * 0.008;
  const end = 0.085 + index * 0.008;

  return smooth(
    (progress - start) / (end - start)
  );
}

function AnimatedConnection({
  connection,
  index,
  progress,
}: {
  connection: (typeof CONNECTIONS)[number];
  index: number;
  progress: number;
}) {
  const reveal = stageProgress(
    progress,
    connection.start,
    connection.end
  );

  return (
    <svg
      viewBox="0 0 1200 1200"
      preserveAspectRatio="none"
      className="
        pointer-events-none
        absolute
        inset-0
        h-full
        w-full
      "
      aria-hidden="true"
    >
      <defs>
        <mask
          id={`hero-line-mask-${index}`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1200"
          height="1200"
        >
          <rect
            width="1200"
            height="1200"
            fill="black"
          />

          {connection.paths.map(
            (path, pathIndex) => (
              <path
                key={`${index}-${pathIndex}`}
                d={path}
                pathLength="1"
                fill="none"
                stroke="white"
                strokeWidth="86"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="1"
                strokeDashoffset={1 - reveal}
              />
            )
          )}
        </mask>
      </defs>

      <image
        href="/hero/lines-exact-no-dots.png"
        x="0"
        y="0"
        width="1200"
        height="1200"
        preserveAspectRatio="none"
        mask={`url(#hero-line-mask-${index})`}
      />
    </svg>
  );
}

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    let frame = 0;

    const updateProgress = () => {
      const rect =
        section.getBoundingClientRect();

      const headerHeight =
        window.innerWidth >= 640 ? 84 : 72;

      const availableHeight =
        window.innerHeight - headerHeight;

      const scrollDistance =
        section.offsetHeight -
        availableHeight;

      if (scrollDistance <= 0) {
        setProgress(0);
        return;
      }

      const travelled =
        -rect.top;

      setProgress(
        clamp(travelled / scrollDistance)
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);

      frame =
        requestAnimationFrame(
          updateProgress
        );
    };

    updateProgress();

    window.addEventListener(
      "scroll",
      onScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      onScroll
    );

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener(
        "scroll",
        onScroll
      );

      window.removeEventListener(
        "resize",
        onScroll
      );
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        min-h-[300svh]
        bg-white
      "
    >
      <div
        className="
          sticky
          top-[72px]
          h-[calc(100svh-72px)]
          overflow-hidden
          sm:top-[84px]
          sm:h-[calc(100svh-84px)]
        "
      >
        <div
          className="
            relative
            mx-auto
            h-full
            w-full
            max-w-[1440px]
          "
        >
          <div
            className="
              absolute
              left-1/2
              top-[7%]
              z-50
              -translate-x-1/2
              text-center
            "
          >
            <p
              className="
                m-0
                whitespace-nowrap
                text-[26px]
                leading-[1.12]
                font-medium
                tracking-[-0.025em]
                text-black
                sm:text-[29px]
                md:text-[32px]
              "
            >
              Hello,
            </p>

            <p
              className="
                mt-[2px]
                mb-0
                whitespace-nowrap
                text-[26px]
                leading-[1.12]
                font-medium
                tracking-[-0.025em]
                text-black
                sm:text-[29px]
                md:text-[32px]
              "
            >
              I am Nimi Desai
            </p>
          </div>

          <div
            className="
              absolute
              bottom-0
              left-1/2
              z-10
              -translate-x-1/2
              w-[min(78vw,78vh,760px)]
              sm:w-[min(74vw,78vh,760px)]
              md:w-[min(70vw,78vh,760px)]
              lg:w-[min(760px,78vh)]
            "
          >
            <div
              className="
                relative
                aspect-square
                w-full
              "
            >
              <Image
                src="/hero/lines-exact-no-dots.png"
                alt=""
                fill
                priority
                unoptimized
                draggable={false}
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-0
                  select-none
                  object-contain
                "
                style={{
                  opacity: 0.1,
                }}
              />

              {CONNECTIONS.map(
                (connection, index) => (
                  <AnimatedConnection
                    key={index}
                    connection={connection}
                    index={index}
                    progress={progress}
                  />
                )
              )}

              <Image
                src="/hero/Girl1.png"
                alt="Nimi Desai"
                fill
                priority
                unoptimized
                draggable={false}
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-20
                  select-none
                  object-contain
                "
              />

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-0
                  z-30
                "
              >
                {DOTS.map(
                  (src, index) => (
                    <Image
                      key={src}
                      src={src}
                      alt=""
                      fill
                      priority
                      unoptimized
                      draggable={false}
                      className="
                        absolute
                        inset-0
                        select-none
                        object-contain
                      "
                      style={{
                        opacity:
                          dotProgress(
                            progress,
                            index
                          ),
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          <p
            className="
              absolute
              bottom-[11%]
              left-[6.2%]
              z-50
              m-0
              text-[14px]
              leading-[1.4]
              font-normal
              text-[#555252]
              sm:text-[15px]
              md:text-[16px]
            "
          >
            Curious about many things,
          </p>

          <p
            className="
              absolute
              right-[6.2%]
              bottom-[11%]
              z-50
              m-0
              text-right
              text-[14px]
              leading-[1.4]
              font-normal
              text-[#555252]
              sm:text-[15px]
              md:text-[16px]
            "
          >
            stubborn enough to see an idea through.
          </p>
        </div>
      </div>
    </section>
  );
}