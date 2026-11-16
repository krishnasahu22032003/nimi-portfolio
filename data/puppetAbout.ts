/* -------------------------------------------------------------------------
 * data/puppetAbout.ts  (or src/data/puppetAbout.ts)
 * Project eight (Puppet theatre) — page 2: ABOUT
 *
 * LINE BREAKS ARE DATA (desktop ≥1280px): every string is exactly one line, as the client broke it.
 *   · **bold**                    → semibold run
 *   · { text, end: true }         → a line that is NOT stretched when justified (the line before a forced break)
 *   · the last line of a paragraph is never stretched either
 * ---------------------------------------------------------------------- */

export type AboutLine = string | { text: string; end?: boolean };

export type AboutData = {
  label: string; // "ABOUT" (rendered uppercase)
  heading: string[]; // one string per line
  paragraphs: AboutLine[][]; // one array per paragraph, one entry per line
  slides: { src: string; alt: string; position?: string }[]; // position = CSS object-position
  intervalMs?: number; // default 5000
};

export const PUPPET_ABOUT: AboutData = {
  label: "About",
  heading: ["Kids today don’t want to watch a story.", "They want to build one."],
  paragraphs: [
    ["Traditional puppet theatre asks children to sit still and watch."],
    [
      "Children today are increasingly familiar with **swipe, tap, remix,**",
      { text: "**interacting with, changing and choosing** what happens next.", end: true },
      "I wanted to bring that sense of **agency, surprise** and **choice**",
      "into storytelling.",
    ],
    [
      "So I started looking at the theatre itself as part of the play, not",
      "just a stage for the story. The result is an open-ended system",
      "that children can build, change and shape as they play, making",
      "it different every time it is used.",
    ],
    [
      "Made from Moware’s recycled HDPE, the entire theatre is",
      "nested into two 3 × 3 ft panels, using the negative spaces as",
      "functional parts rather than leaving them as waste.",
    ],
  ],
  intervalMs: 5000,
  slides: [
    {
      src: "/projects/puppet-theatre/about-01-theatre.jpg",
      alt: "The puppet theatre in dark green recycled HDPE, seen from a three-quarter angle, with its wavy stage opening and floor mat",
      position: "50% 50%",
    },
    {
      src: "/projects/puppet-theatre/about-02-front.jpg",
      alt: "Front view of the green theatre with its curved stage opening and carved wave details",
      position: "50% 55%",
    },
    {
      src: "/projects/puppet-theatre/about-03-assembly.jpg",
      alt: "Two pairs of hands lift the slotted roof panel onto the assembled theatre",
      position: "50% 45%",
    },
    {
      src: "/projects/puppet-theatre/about-04-detail.jpg",
      alt: "Close view of the theatre's corner joint and tabs as the designer looks along its top edge",
      position: "50% 50%",
    },
  ],
};