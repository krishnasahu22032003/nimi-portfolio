"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Projects", href: "/projects" },
  { label: "About me", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const FRAMES = [0, 1, 2, 3, 4, 5].map((i) => `/hourglass/frame-${i}.webp`);

const LAST = FRAMES.length - 1;

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/*
  HOURGLASS FILL
  The sand does not move during the hero. Once the visitor scrolls past it, the
  sand drops gradually the further they go down the landing page, and it is full
  only at the very bottom.

  It does NOT depend on how the other sections are built. It only needs to know
  where the hero ends:
    - the hero is the element with [data-hero-section] (preferred), otherwise
      the first <section> on the page
    - the sand starts moving when the hero's bottom edge enters the screen

  EXPECTED_SECTIONS is how many sections the finished landing page will have
  (hero included) and SECTION_HEIGHT_VH is roughly how tall each one is, in
  screen-heights. Together they set the minimum scroll length the sand is spread
  over, so a half-built page (e.g. only two sections) does not fill it early.
  Once the real page is longer than that, the real length is used.

  Optional exact mode: put data-section on every landing section (hero too) and
  the sand will step down section by section instead.
*/
const EXPECTED_SECTIONS = 5;
const SECTION_HEIGHT_VH = 1;

const findHero = (): HTMLElement | null =>
  document.querySelector<HTMLElement>("[data-hero-section]") ??
  document.querySelector<HTMLElement>("section");

type Keyframe = { y: number; level: number };

const SMOOTHING_MS = 160; // how softly the sand follows the scroll

export default function Header() {
  const pathname = usePathname() ?? "";

  const headerRef = useRef<HTMLElement>(null);
  const frameRefs = useRef<(HTMLImageElement | null)[]>([]);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let target = 0;
    let current = 0;
    let raf: number | null = null;
    let last = 0;

    let keyframes: Keyframe[] = [];
    let pageScroll = 0;

    /* Reads positions. Runs on mount and whenever the layout changes. */
    const layout = () => {
      const vh = window.innerHeight;
      pageScroll = Math.max(document.documentElement.scrollHeight - vh, 0);

      keyframes = [];

      const marked = Array.from(
        document.querySelectorAll<HTMLElement>("[data-section]")
      );

      if (marked.length >= 2) {
        /* Exact mode: one step per marked section */
        const count = marked.length;
        const total = Math.max(count, EXPECTED_SECTIONS);
        const tops = marked.map(
          (el) => el.getBoundingClientRect().top + window.scrollY
        );

        keyframes.push({ y: Math.max(tops[1] - vh, 0), level: 0 });

        for (let k = 1; k < count; k++) {
          keyframes.push({
            y: Math.min(tops[k], pageScroll),
            level: k / total,
          });
        }

        keyframes.push({ y: pageScroll, level: count / total });
        keyframes.sort((a, b) => a.y - b.y || a.level - b.level);
        return;
      }

      const hero = findHero();
      if (!hero) return; /* no hero (other pages): plain page progress */

      /* Empty until the hero ends, then one even run down the rest of the page */
      const heroBottom = hero.getBoundingClientRect().bottom + window.scrollY;
      const start = Math.max(heroBottom - vh, 0);
      const length = Math.max(
        pageScroll - start,
        (EXPECTED_SECTIONS - 1) * SECTION_HEIGHT_VH * vh
      );

      keyframes = [
        { y: start, level: 0 },
        { y: start + length, level: 1 },
      ];
    };

    const levelAt = (y: number) => {
      if (!keyframes.length) {
        /* No sections to key off (e.g. a short page): plain page progress */
        return pageScroll > 0 ? Math.min(Math.max(y / pageScroll, 0), 1) : 0;
      }

      if (y <= keyframes[0].y) return keyframes[0].level;

      for (let i = 1; i < keyframes.length; i++) {
        const a = keyframes[i - 1];
        const b = keyframes[i];

        if (y <= b.y) {
          return b.y === a.y
            ? b.level
            : a.level + ((y - a.y) / (b.y - a.y)) * (b.level - a.level);
        }
      }

      return keyframes[keyframes.length - 1].level;
    };

    const measure = () => {
      target = Math.min(Math.max(levelAt(window.scrollY), 0), 1);
      header.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };

    const paint = () => {
      const frameProgress = current * LAST;

      frameRefs.current.forEach((image, index) => {
        if (!image || index === 0) return;

        const opacity = Math.min(Math.max(frameProgress - (index - 1), 0), 1);

        image.style.opacity = opacity.toFixed(3);
      });
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;

      current += reduceMotion
        ? target - current
        : (target - current) * (1 - Math.exp(-dt / SMOOTHING_MS));

      if (Math.abs(target - current) < 0.0004) {
        current = target;
      }

      paint();

      if (current !== target) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
        last = 0;
      }
    };

    const onScroll = () => {
      measure();

      if (raf === null) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onLayout = () => {
      layout();
      onScroll();
    };

    /* Set the correct sand level immediately (e.g. after a reload mid-page) */
    layout();
    measure();
    current = target;
    paint();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onLayout);

    const resizeObserver = new ResizeObserver(onLayout);
    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onLayout);

      resizeObserver.disconnect();

      if (raf !== null) {
        cancelAnimationFrame(raf);
      }
    };
  }, [pathname]);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const onResize = () => {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);

      document.body.style.overflow = "";
    };
  }, [menuOpen, closeMenu]);

  const onLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMenu();

    if (pathname === "/") {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <header
        ref={headerRef}
        data-scrolled="false"
        className={cn(
          "group/header fixed inset-x-0 top-0 z-[100]",
          "h-16 md:h-[72px] min-[1100px]:h-24",
          "font-[family-name:var(--font-familjen)]",
          "text-[#555252]",
          "bg-transparent",
          "transition-[background-color,backdrop-filter]",
          "duration-500 ease-out",
          "data-[scrolled=true]:bg-white/[.86]",
          "data-[scrolled=true]:backdrop-blur-[14px]",
          "data-[scrolled=true]:backdrop-saturate-[1.4]",
          menuOpen && "bg-white/[.92] backdrop-blur-[14px]"
        )}
      >
        <div
          className={cn(
            "relative z-[2] mx-auto flex h-full w-full items-center justify-between",
            "px-6 sm:px-8 md:px-12",
            "lg:px-[8vw] xl:px-[8.5vw]"
          )}
        >
          <Link
            href="/"
            aria-label="Nimi Desai, home"
            onClick={onLogoClick}
            className={cn(
              "group/logo inline-flex shrink-0",
              "aspect-[248/336]",
              "h-9 md:h-10 min-[1100px]:h-11",
              "items-center rounded-lg",
              "outline-offset-[6px]",
              "focus-visible:outline-2",
              "focus-visible:outline-black",
              "transition-transform duration-[600ms]",
              EASE,
              "hover:-rotate-[2deg] hover:scale-[1.04]",
              "motion-reduce:transition-none",
              "motion-reduce:hover:transform-none"
            )}
          >
            <span
              aria-hidden="true"
              className="relative block h-full w-full mix-blend-multiply"
            >
              {FRAMES.map((src, index) => (
                <Image
                  key={src}
                  ref={(element) => {
                    frameRefs.current[index] = element;
                  }}
                  src={src}
                  alt=""
                  width={248}
                  height={336}
                  priority
                  unoptimized
                  draggable={false}
                  style={{
                    opacity: index === 0 ? 1 : 0,
                  }}
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    "h-full w-full max-w-none",
                    "select-none object-contain",
                    "will-change-[opacity]"
                  )}
                />
              ))}
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden md:block">
            <ul
              className={cn(
                "m-0 flex list-none items-center p-0",
                "gap-7 lg:gap-9"
              )}
            >
              {NAV_LINKS.map(({ label, href }) => {
                const isActive =
                  pathname === href || pathname.startsWith(`${href}/`);

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group/nav relative inline-flex items-center",
                        "px-2 py-2",
                        "text-[16px] leading-6 font-normal",
                        "text-[#555252]",
                        "no-underline",
                        "outline-none",
                        "transition-[color,transform]",
                        "duration-300",
                        EASE,
                        "hover:-translate-y-[1px]",
                        "hover:scale-[1.015]",
                        "hover:text-black",
                        "focus-visible:-translate-y-[1px]",
                        "focus-visible:scale-[1.015]",
                        "focus-visible:text-black",
                        "aria-[current=page]:text-black",
                        "motion-reduce:transition-none",
                        "motion-reduce:hover:translate-y-0",
                        "motion-reduce:hover:scale-100",
                        "motion-reduce:focus-visible:translate-y-0",
                        "motion-reduce:focus-visible:scale-100"
                      )}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((value) => !value)}
            className={cn(
              "relative -mr-3 h-12 w-12",
              "cursor-pointer rounded-lg",
              "border-0 bg-transparent p-0",
              "outline-offset-2",
              "focus-visible:outline-2",
              "focus-visible:outline-black",
              "md:hidden",
              menuOpen ? "text-black" : "text-[#555252]"
            )}
          >
            {["top-[19px]", "top-[28px]"].map((position, index) => (
              <span
                key={position}
                className={cn(
                  "absolute inset-x-3 h-[1.5px]",
                  "bg-current",
                  "transition-transform duration-500",
                  EASE,
                  position,
                  menuOpen &&
                    (index === 0
                      ? "translate-y-[4.25px] rotate-45"
                      : "-translate-y-[4.25px] -rotate-45")
                )}
              />
            ))}
          </button>
        </div>
      </header>

      <nav
        id="mobile-menu"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-[99]",
          "bg-white px-6 pb-12 pt-8",
          "md:hidden",
          "transition-[clip-path,opacity,visibility]",
          "duration-500",
          EASE,
          menuOpen
            ? "visible opacity-100 [clip-path:inset(0_0_0_0)]"
            : "invisible opacity-0 [clip-path:inset(0_0_100%_0)]"
        )}
      >
        <ul className="m-0 flex list-none flex-col p-0">
          {NAV_LINKS.map(({ label, href }, index) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);

            return (
              <li
                key={href}
                style={{
                  transitionDelay: menuOpen ? `${100 + index * 60}ms` : "0ms",
                }}
                className={cn(
                  "transition-[opacity,transform]",
                  "duration-500",
                  EASE,
                  menuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                )}
              >
                <Link
                  href={href}
                  tabIndex={menuOpen ? 0 : -1}
                  aria-current={isActive ? "page" : undefined}
                  onClick={closeMenu}
                  className={cn(
                    "group/mobile relative block",
                    "border-b border-[#555252]/15",
                    "py-5",
                    "text-2xl leading-8 font-normal",
                    "text-[#555252]",
                    "no-underline",
                    "outline-none",
                    "transition-[color,transform]",
                    "duration-300",
                    EASE,
                    "hover:translate-x-1",
                    "hover:text-black",
                    "focus-visible:translate-x-1",
                    "focus-visible:text-black",
                    isActive && "text-black",
                    "motion-reduce:transition-none",
                    "motion-reduce:hover:translate-x-0",
                    "motion-reduce:focus-visible:translate-x-0"
                  )}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}