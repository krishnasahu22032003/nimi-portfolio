"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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

const FRAMES = [0, 1, 2, 3, 4, 5].map(
  (i) => `/hourglass/frame-${i}.webp`
);

const LAST = FRAMES.length - 1;

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

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

    const measure = () => {
      const max =
        document.documentElement.scrollHeight -
        window.innerHeight;

      target =
        max > 0
          ? Math.min(Math.max(window.scrollY / max, 0), 1)
          : 0;

      header.dataset.scrolled =
        window.scrollY > 8 ? "true" : "false";
    };

    const paint = () => {
      const frameProgress = current * LAST;

      frameRefs.current.forEach((image, index) => {
        if (!image || index === 0) return;

        const opacity = Math.min(
          Math.max(frameProgress - (index - 1), 0),
          1
        );

        image.style.opacity = opacity.toFixed(3);
      });

      header.style.setProperty(
        "--scroll-progress",
        current.toFixed(4)
      );
    };

    const tick = () => {
      current +=
        (target - current) *
        (reduceMotion ? 1 : 0.1);

      if (Math.abs(target - current) < 0.0004) {
        current = target;
      }

      paint();

      raf =
        current !== target
          ? requestAnimationFrame(tick)
          : null;
    };

    const onScroll = () => {
      measure();

      if (raf === null) {
        raf = requestAnimationFrame(tick);
      }
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    window.addEventListener("resize", onScroll);

    const resizeObserver = new ResizeObserver(onScroll);

    resizeObserver.observe(document.body);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);

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

  const onLogoClick = (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
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
          menuOpen &&
            "bg-white/[.92] backdrop-blur-[14px]"
        )}
        style={
          {
            "--scroll-progress": 0,
          } as CSSProperties
        }
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

          <nav
            aria-label="Primary navigation"
            className="hidden md:block"
          >
            <ul
              className={cn(
                "m-0 flex list-none items-center p-0",
                "gap-7 lg:gap-9"
              )}
            >
              {NAV_LINKS.map(({ label, href }) => {
                const isActive =
                  pathname === href ||
                  pathname.startsWith(`${href}/`);

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
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            onClick={() =>
              setMenuOpen((value) => !value)
            }
            className={cn(
              "relative -mr-3 h-12 w-12",
              "cursor-pointer rounded-lg",
              "border-0 bg-transparent p-0",
              "outline-offset-2",
              "focus-visible:outline-2",
              "focus-visible:outline-black",
              "md:hidden",
              menuOpen
                ? "text-black"
                : "text-[#555252]"
            )}
          >
            {["top-[19px]", "top-[28px]"].map(
              (position, index) => (
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
              )
            )}
          </button>
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 bottom-0 z-[1]",
            "h-px origin-left",
            "bg-[#555252]",
            "opacity-0",
            "transition-opacity duration-500",
            "group-data-[scrolled=true]/header:opacity-20"
          )}
          style={{
            transform:
              "scaleX(var(--scroll-progress))",
          }}
        />
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
          {NAV_LINKS.map(
            ({ label, href }, index) => {
              const isActive =
                pathname === href ||
                pathname.startsWith(`${href}/`);

              return (
                <li
                  key={href}
                  style={{
                    transitionDelay: menuOpen
                      ? `${100 + index * 60}ms`
                      : "0ms",
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
            }
          )}
        </ul>
      </nav>
    </>
  );
}