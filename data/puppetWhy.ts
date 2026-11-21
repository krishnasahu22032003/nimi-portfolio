/* -------------------------------------------------------------------------
 * data/puppetWhy.ts  (or src/data/puppetWhy.ts)
 * Project eight (Puppet theatre) — page 115: "Why puppet theatre ?"
 *
 * LINE BREAKS ARE DATA: every inner array is ONE line, exactly as she broke it in Canva
 * (on desktop ≥1280px). Below 1280px the lines reflow.
 * { t: "…", b: true } = semibold. Everything else is regular.
 *
 * Per card (artboard px, 1440 × 900, measured from her Canva page, measured from the card's top-left):
 *   icon  = ix, iy (top-left) · iw, ih (size)
 *   head  = hx (left edge of the word) · hy (vertical centre)
 *   tx    = left edge of the three text lines
 * ---------------------------------------------------------------------- */

export type Seg = { t: string; b?: boolean };

export type WhyCard = {
  heading: string; // Playfair Display italic, 23.8
  color: string; // her colour code; the card is drawn at 50% transparency
  icon: { src: string; alt: string };
  lines: string[]; // three lines, Familjen Grotesk 16
  ix: number; iy: number; iw: number; ih: number;
  hx: number; hy: number;
  tx: number;
};

export type WhyData = {
  title: string;
  kicker: string[]; // orange text, one string per line
  headline: Seg[][]; // 24px, regular + semibold
  paragraph: Seg[][]; // 14px, regular + semibold
  cards: WhyCard[]; // order: top-left, top-right, bottom-left, bottom-right
};

const BASE = "/projects/puppet-theatre/why";

export const PUPPET_WHY: WhyData = {
  title: "Why puppet theatre ?",
  kicker: ["One of the strongest learning", "formats for 5–7 year olds."],
  headline: [
    [{ t: "At 5–7, children shift from" }],
    [{ t: "watching puppet", b: true }, { t: " shows to" }],
    [{ t: "becoming the storyteller.", b: true }],
  ],
  paragraph: [
    [{ t: "Research on puppet-led early learning shows" }],
    [{ t: "stronger gains in " }, { t: "language, behaviour, and", b: true }],
    [{ t: "empathy than storytelling alone because play", b: true }],
    [{ t: "engages imagination unconsciously.", b: true }],
  ],
  cards: [
    {
      heading: "Cognitive",
      color: "#E7B534",
      icon: { src: `${BASE}/cognitive.png`, alt: "A head in profile with a brain and a gear" },
      lines: ["Cause-effect thinking.", "Sequencing.", "“What happens next?”"],
      ix: 29.4, iy: 33.5, iw: 88, ih: 84,
      hx: 117.4, hy: 93.9,
      tx: 47.8,
    },
    {
      heading: "Language",
      color: "#D94136",
      icon: { src: `${BASE}/language.png`, alt: "A person surrounded by speech bubbles in different languages" },
      lines: ["Vocabulary growth.", "Sentence building.", "Expression."],
      ix: 29.4, iy: 28.5, iw: 113, ih: 86,
      hx: 154.3, hy: 93.9,
      tx: 43.6,
    },
    {
      heading: "Emotional",
      color: "#DC7B36",
      icon: { src: `${BASE}/emotional.png`, alt: "Two hands holding a heart" },
      lines: ["Empathy.", "Role-taking.", "Understanding situations."],
      ix: 29.4, iy: 36, iw: 102, ih: 91,
      hx: 135.9, hy: 109,
      tx: 47.8,
    },
    {
      heading: "Social",
      color: "#4A9399",
      icon: { src: `${BASE}/social.png`, alt: "A group of three people with speech bubbles" },
      lines: ["Turn-taking.", "Collaboration.", "Shared authorship."],
      ix: 29.4, iy: 37.7, iw: 90, ih: 84,
      hx: 155, hy: 102.3,
      tx: 44.4,
    },
  ],
};