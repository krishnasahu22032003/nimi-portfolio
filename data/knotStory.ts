/* data/knotStory.ts   (or src/data/knotStory.ts)
 *
 * Page 4 of "Chandigarh Chair": full-bleed photo + two short paragraphs (Canva 1440 × 900 artboard).
 *
 * FILE → public/projects/chandigarh/knot.jpg   (her photo _DSC3072, ideally resized to ~2400 px wide)
 *
 * Each string = one line, exactly as she broke it in Canva.
 */
const D = "/projects/chandigarh";
const EXT = "jpg"; // ← "jpg" · "jpeg" · "png" · "webp"

export type KnotStoryData = {
  src: string;
  alt: string;
  intro: string[]; // paragraph 1 — semibold, #FFF8E3 @ 80 %
  body: string[]; //  paragraph 2 — regular, black
};

export const CHAIR_KNOT_STORY: KnotStoryData = {
  src: `${D}/knot.${EXT}`,
  alt: "Close-up of the chair's cane backrest and teak frame, with the knot in the wood at the centre of the top rail",
  intro: [
    "At the centre, a knot marks the origin.",
    "From here, the wood’s veins flow outward,",
    "branching left and right,",
    "just as nature intended.",
  ],
  body: [
    "Noticing this natural pattern, I positioned the knot at",
    "the centre of the backrest, allowing the grain to",
    "create a simple, organic flow in the chair’s form,",
    "telling its own quiet story.",
  ],
};