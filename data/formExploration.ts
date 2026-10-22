/* -------------------------------------------------------------------------
 * data/formExploration.ts      (or src/data/formExploration.ts)
 *
 * Everything for the FORM EXPLORATION section. Nothing is hard-coded in the component.
 *
 * COORDINATES — Canva px on the 1440 × 900 page (the exact page from her Canva file).
 *   x / y  = top-left corner of the sketch      w / h = its size
 *   The component scales the whole 1440 × 900 board evenly to the screen (1u = 1 Canva px at 1440 wide),
 *   so every sketch keeps its exact position and its exact size relative to the others.
 *
 * IMAGES — every file is a crop of her original photographed sheets (IMG_8131 … IMG_8150), cut to the
 *   same window she used in Canva, tone-matched to the Canva page and saved at 3× for sharp retina screens.
 *   Put the files in  public/projects/seesaw/form/
 *
 * ORDER — reading order of the board (top → bottom, left → right). It is also the order used on mobile.
 * ---------------------------------------------------------------------- */
export type FormTile = {
  src: string;
  alt: string;
  /** Canva px */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FormExplorationData = {
  /** the centred title — 18 · Medium · #000 */
  label: string;
  /** centre-x of the title and the y of its cap-height (top of the capital letters), Canva px */
  labelAt: { cx: number; capTop: number };
  /** the hand-lettered “3D MODEL” note (an SVG traced from her Canva page) */
  note?: { src: string; alt: string; x: number; y: number; w: number; h: number };
  tiles: FormTile[];
};

const D = "/projects/seesaw/form";

export const SEESAW_FORM_EXPLORATION: FormExplorationData = {
  label: "FORM EXPLORATION",
  labelAt: { cx: 717, capTop: 96 },
  note: { src: `${D}/3d-model.svg`, alt: "3D model", x: 1276.17, y: 762.17, w: 71.33, h: 45.92 },
  tiles: [
    { src: `${D}/form-06.jpg`, alt: "Perspective lines and an ellipse, the first rough frame for the bench", x: 640, y: 0, w: 270, h: 152 },
    { src: `${D}/form-01.jpg`, alt: "Winged bench form with two raised seat blocks, drawn in perspective", x: 40, y: 50, w: 410, h: 190 },
    { src: `${D}/form-12.jpg`, alt: "Seat profile resting on a circle with a vertical centre line", x: 1078, y: 45, w: 302, h: 115 },
    { src: `${D}/form-07.jpg`, alt: "Small bracket-shaped bench profile", x: 880, y: 143, w: 182, h: 55 },
    { src: `${D}/form-05.jpg`, alt: "Lens-shaped rocker in blue pencil", x: 372, y: 183, w: 260, h: 113 },
    { src: `${D}/form-08.jpg`, alt: "Faint curved seat with hatching", x: 676, y: 200, w: 204, h: 112 },
    { src: `${D}/form-11.jpg`, alt: "Overlapping rocker curves", x: 884, y: 198, w: 168, h: 94 },
    { src: `${D}/form-13.jpg`, alt: "Wedge-shaped seat profile, half shaded", x: 1072, y: 210, w: 308, h: 78 },
    { src: `${D}/form-03.jpg`, alt: "Small chair outline with a stepped seat", x: 50, y: 292, w: 208, h: 128 },
    { src: `${D}/form-02.jpg`, alt: "Two small seat-pad details", x: 160, y: 245, w: 90, h: 37 },
    { src: `${D}/form-09.jpg`, alt: "Narrow dark rocker with layered curves", x: 866, y: 288, w: 168, h: 62 },
    { src: `${D}/form-04.jpg`, alt: "U-shaped frame standing on a curved rocking base", x: 238, y: 328, w: 264, h: 190 },
    { src: `${D}/form-10.jpg`, alt: "Bowl-shaped seat on a curved base, front view", x: 572, y: 338, w: 306, h: 94 },
    { src: `${D}/form-14.jpg`, alt: "Stepped block profile with a shaded seat and dimension notes", x: 1072, y: 348, w: 320, h: 98 },
    { src: `${D}/form-15.jpg`, alt: "Two long rocker arcs", x: 768, y: 448, w: 244, h: 100 },
    { src: `${D}/form-16.jpg`, alt: "Small dome-shaped arc", x: 648, y: 492, w: 120, h: 40 },
    { src: `${D}/form-17.jpg`, alt: "Shallow bowl with a pivot circle", x: 1028, y: 482, w: 232, h: 96 },
    { src: `${D}/form-18.jpg`, alt: "Lens shape with a flat seat plank", x: 1232, y: 497, w: 156, h: 78 },
    { src: `${D}/form-19.jpg`, alt: "Small V-shaped seat", x: 55, y: 553, w: 173, h: 65 },
    { src: `${D}/form-20.jpg`, alt: "Dark arched bridge with a centre post", x: 243, y: 543, w: 219, h: 57 },
    { src: `${D}/form-22.jpg`, alt: "Height marked as 17 inches", x: 476, y: 566, w: 52, h: 88 },
    { src: `${D}/form-23.jpg`, alt: "Eye-shaped lens form with a vertical oval, shaded", x: 535, y: 545, w: 283, h: 97 },
    { src: `${D}/form-24.jpg`, alt: "Layered bowl in green pencil", x: 822, y: 580, w: 176, h: 88 },
    { src: `${D}/form-25.jpg`, alt: "Shaded bowl with a circle at its centre", x: 1008, y: 588, w: 224, h: 84 },
    { src: `${D}/form-21.jpg`, alt: "Dark bridge-shaped rocker, side view", x: 162, y: 653, w: 262, h: 69 },
    { src: `${D}/form-26.jpg`, alt: "Stack of soft, layered forms", x: 1238, y: 598, w: 150, h: 94 },
    { src: `${D}/form-27.jpg`, alt: "Block split in two halves with a C-shaped cut-out", x: 268, y: 728, w: 344, h: 130 },
    { src: `${D}/form-28.jpg`, alt: "Folded loop form in soft graphite", x: 672, y: 668, w: 222, h: 184 },
    { src: `${D}/form-29.jpg`, alt: "Wide bowl with a notch curving up through the centre", x: 935, y: 728, w: 323, h: 107 },
  ],
};
