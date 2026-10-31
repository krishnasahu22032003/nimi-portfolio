"use client";
/* components/ProjectStatement.tsx   (or src/components/ProjectStatement.tsx)
 *
 * Page 2 of project three (Echo Pan): one uppercase statement, centred on the page both ways.
 * Full-viewport page, white background, nothing else. Same snap / reveal behaviour as the other pages.
 *
 * Type: 22px · SemiBold (600) · UPPERCASE · var(--ink) (#000, same ink as titles and headings)
 * Font family is inherited from ProjectDetail's <main> (Familjen Grotesk, weight 600 is already loaded there).
 */
import { useEffect, useRef } from "react";

export type StatementData = {
  text: string; // written in normal case; CSS uppercases it (screen readers read it naturally)
};

/* ------------------------------ TUNING ------------------------------ */
const FONT_SIZE = 22; // px (desktop)
const FONT_SIZE_MOBILE = 18; // px (≤820px)
const FONT_WEIGHT = 600;
const LINE_HEIGHT = 30; // px

export default function ProjectStatement({ data }: { data: StatementData }) {
  const ref = useRef<HTMLElement>(null);

  /* reveal when the page scrolls into view */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) =>
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            io.disconnect();
          }
        }),
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="pd-page pst-page" aria-label="Echo Pan — question">
      <h2 className="pst-text">{data.text}</h2>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.pst-page {
  min-height: var(--page-h);
  display: grid;
  place-items: center;          /* centred horizontally AND vertically in the viewport */
  padding: 72px 24px;
  background: #fff;
}

.pst-text {
  margin: 0;
  font-size: ${FONT_SIZE}px;
  line-height: ${LINE_HEIGHT}px;
  font-weight: ${FONT_WEIGHT};
  letter-spacing: 0;
  text-transform: uppercase;
  text-align: center;
  color: var(--ink);
  white-space: nowrap;           /* one line on desktop, exactly as in her layout */

  opacity: 0;
  transform: translate3d(0, 14px, 0);
  transition: opacity .9s cubic-bezier(.22, 1, .36, 1), transform 1.1s cubic-bezier(.22, 1, .36, 1);
  transition-delay: 100ms;
}
.pst-page.is-in .pst-text { opacity: 1; transform: none; }

/* small screens: allow the sentence to wrap, balanced */
@media (max-width: 820px) {
  .pst-page { min-height: 70svh; padding: 56px 16px; }
  .pst-text { font-size: ${FONT_SIZE_MOBILE}px; line-height: 26px; white-space: normal; text-wrap: balance; }
}

@media (prefers-reduced-motion: reduce) {
  .pst-text { transition: none !important; opacity: 1; transform: none; }
}
`;