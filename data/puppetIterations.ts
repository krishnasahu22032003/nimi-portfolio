/* -------------------------------------------------------------------------
 * data/puppetIterations.ts  (or src/data/puppetIterations.ts)
 * Project eight (Puppet theatre) — "ITERATIONS & PROTOTYPES" (six stacking slides)
 *
 * LINE BREAKS ARE DATA: every string in `caption` is ONE line, exactly as she broke it
 * in Canva (desktop ≥1280px). Below 1280px the lines reflow.
 *
 * Every image: x, y, w, h in ARTBOARD px (1440 × 900), measured from the top-left of
 * her Canva page (NOT from the card). Nudge these numbers to fine-tune.
 *
 * `bg` = the colour code she wrote on each slide.
 * ---------------------------------------------------------------------- */

export type IterImage = {
  src: string;
  alt: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type IterSlide = {
  id: string;
  bg: string;
  caption: string[];
  images: IterImage[];
};

export type IterationsData = {
  title: string;
  slides: IterSlide[];
};

const BASE = "/projects/puppet-theatre/iterations";

export const PUPPET_ITERATIONS: IterationsData = {
  title: "Iterations & Prototypes",
  slides: [
    {
      id: "cardboard",
      bg: "#F5DFE7",
      caption: [
        "The first prototype took inspiration from Nepali architecture,",
        "but felt too specific for a theatre meant to work across different themes.",
      ],
      images: [
        {
          src: `${BASE}/01-cardboard-front.png`,
          alt: "Cardboard prototype of the theatre seen from the front, with a scalloped stage mat and an arched opening",
          x: 128, y: 350, w: 612, h: 462,
        },
        {
          src: `${BASE}/01-cardboard-side.png`,
          alt: "The same cardboard prototype seen from above and the side, showing the sloped roof and side windows",
          x: 750, y: 250, w: 555, h: 508,
        },
      ],
    },
    {
      id: "frames",
      bg: "#E3E1C0",
      caption: [
        "Different frame shapes and openings were explored to find a form",
        "that felt more whimsical and playful.",
      ],
images: [
  {
    src: `${BASE}/02-frames-left.png`,
    alt: "Six line drawings of theatre frames with different openings and coloured or black accents",
    x: 175, y: 338, w: 513, h: 494,
  },
  {
    src: `${BASE}/02-frames-right.png`,
    alt: "A frame with red curtains and squiggle details beside its two side panels, and the same set in black outline below",
    x: 738, y: 411, w: 555, h: 352,
  },
],
    },
    {
      id: "mdf",
      bg: "#BCD0D8",
      caption: [
        "The selected form was built in MDF to see how the proportions,",
        "structure and interaction worked at full scale.",
      ],
      images: [
        {
          src: `${BASE}/03-mdf.png`,
          alt: "Full-scale MDF theatre with cut-out animal and tree scenes standing on the stage mat",
          x: 356, y: 290, w: 724, h: 558,
        },
      ],
    },
    {
      id: "colour",
      bg: "#F0E7E7",
      caption: [
        "Colour variations and side-panel detailing were explored, while a bottom panel with integrated",
        "puppet grooves was introduced to hold puppets and have surprise compartments.",
      ],
      images: [
        {
          src: `${BASE}/04-colour-variations.png`,
          alt: "Three renders of the theatre in cream and green, the front one with red curtains and puppet grooves on the stage mat",
          x: 170, y: 276, w: 1092, h: 576,
        },
      ],
    },
    {
      id: "final",
      bg: "#F6F3E9",
      caption: [
        "A final prototype was made with all the changes before moving to",
        "the recycled plastic for CNC cutting.",
      ],
      images: [
        {
          src: `${BASE}/05-final-prototype.png`,
          alt: "Green final prototype of the theatre with wavy stage mat, slotted roof and decorative cut-outs",
          x: 333, y: 270, w: 778, h: 594,
        },
      ],
    },
    {
      id: "plastic",
      bg: "#E9F1F6",
      caption: ["Product made from recycled plastic."],
      images: [
        {
          src: `${BASE}/06-recycled-plastic.png`,
          alt: "The finished theatre CNC-cut from dark green recycled plastic, with puppet grooves on the stage mat",
          x: 366, y: 283, w: 752, h: 534,
        },
      ],
    },
  ],
};