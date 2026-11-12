/* -------------------------------------------------------------------------
 * data/echoShapes.ts        (or src/data/echoShapes.ts)
 *
 * Page 4 of project three (Echo Pan) — "What shapes a note?"
 * One render + measurements that draw themselves in as the visitor scrolls.
 *
 * Image → public/projects/echo-pan/shapes-render.png      (her pg_70___1_.png)
 *
 * Only the WORDS live here. Where each arrow / label sits is her Canva layout
 * and lives in components/ProjectEchoShapes.tsx.
 * ---------------------------------------------------------------------- */

export type EchoShapesData = {
  heading: string;
  image: { src: string; alt: string };
  bansuri: {
    title: string;
    total: string; // "Total length :  41 cm"
    diameter: string;
    /** the six finger holes, left → right (one label under each arrow) */
    holes: [string, string, string, string, string, string];
    /** the blow / tuning hole near the joint */
    tuning: string;
    /** bracket caption, one string per line */
    span: [string, string];
  };
  pan: {
    title: string;
    total: string;
    /** "Tube / diameter / : 2 cm" — one string per line */
    tube: [string, string, string];
    lengthLabel: string; // "Length :"
    /** [number, unit] — shown on two lines under each pipe, left → right */
    lengths: [string, string][];
  };
};

export const ECHO_PAN_SHAPES: EchoShapesData = {
  heading: "How the dimensions are calculated ?",
  image: {
    src: "/projects/echo-pan/shapes-render.png",
    alt: "Render of Echo Pan: a black bansuri with six finger holes and a tuning hole, joined to five walnut and curly maple pan pipes",
  },
  bansuri: {
    title: "Bansuri",
    total: "Total length :  41 cm",
    diameter: "Diameter : 2 cm",
    holes: ["6 cm", "9 cm", "11cm", "14.8 cm", "17.5 cm", "20 cm"],
    tuning: "34.6 cm",
    span: ["Finger hole positions", "(measured from left end)"],
  },
  pan: {
    title: "Pan Flute",
    total: "Total width :  10 cm",
    tube: ["Tube", "diameter", ": 2 cm"],
    lengthLabel: "Length :",
    lengths: [
      ["10.5", "cm"],
      ["11.9", "cm"],
      ["13", "cm"],
      ["14.2", "cm"],
      ["15.5", "cm"],
    ],
  },
};