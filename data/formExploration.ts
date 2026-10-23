/* -------------------------------------------------------------------------
 * data/formExploration.ts      (or src/data/formExploration.ts)
 *
 * FORM EXPLORATION — a white field of free-floating frames (like the Celeste Noir reference).
 * Frames drift across the screen at different speeds; hovering a frame stops the drift. Nothing else
 * happens: no black & white → colour, no filters.
 *
 *   w / h   real pixel size of the image (aspect ratio only)
 *   size    "large" | "medium" | "small"   — "small" = the files she renamed "Small": the smallest frames
 *   lane    0–2  which drifting row the frame travels in (order inside a lane = order in this file)
 *   dy      vertical nudge from the lane's centre line, in u (1u = 1vw) — keeps the field loose, never leaves the band
 *
 * Images live in  public/projects/seesaw/form/
 * ---------------------------------------------------------------------- */
export type FrameSize = "large" | "medium" | "small";

export type FormTile = {
  src: string;
  alt: string;
  w: number;
  h: number;
  size: FrameSize;
  lane: number;
  dy: number;
};

export type FormExplorationData = {
  /** section title — 18 · Medium · #000 */
  label: string;
  tiles: FormTile[];
};

const D = "/projects/seesaw/form";

export const SEESAW_FORM_EXPLORATION: FormExplorationData = {
  label: "FORM EXPLORATION",
  tiles: [
    /* lane 1 */
    { src: `${D}/form-01.jpg`, alt: "Early bench studies with perspective lines, a circle and handwritten notes", w: 1600, h: 1196, size: "large", lane: 0, dy: -3 },
    { src: `${D}/form-04.jpg`, alt: "Tall sheet of small seat profiles with notes on earthquake and pendulum motion", w: 1070, h: 1600, size: "medium", lane: 0, dy: 4 },
    { src: `${D}/form-small-01.jpg`, alt: "Three small sketches of a bench form in soft pencil", w: 1600, h: 948, size: "small", lane: 0, dy: -4 },
    { src: `${D}/form-05.jpg`, alt: "Loose sheet of winged seat forms drawn in blue pencil", w: 1600, h: 1106, size: "medium", lane: 0, dy: 2 },
    { src: `${D}/form-13.jpg`, alt: "Overlapping rocker and bowl forms with a circle at the centre", w: 1600, h: 1078, size: "large", lane: 0, dy: -2 },
    { src: `${D}/form-08.jpg`, alt: "Three wedge-shaped seat profiles, two with hatched shading", w: 1600, h: 1062, size: "medium", lane: 0, dy: 5 },
    { src: `${D}/form-20.jpg`, alt: "Wide, faint sketches of layered rocker arcs", w: 1600, h: 860, size: "medium", lane: 0, dy: -3 },
    { src: `${D}/form-09.jpg`, alt: "Stacked looping rocker curves drawn in soft graphite", w: 1154, h: 1600, size: "medium", lane: 0, dy: 3 },
    /* lane 2 */
    { src: `${D}/form-03.jpg`, alt: "3D model of the bench: a wooden seat split over a grey base, shown in light", w: 1600, h: 966, size: "large", lane: 1, dy: 3 },
    { src: `${D}/form-12.jpg`, alt: "Six bench profile studies in pencil, from flat planks to arched bridges", w: 1600, h: 1046, size: "medium", lane: 1, dy: -4 },
    { src: `${D}/form-small-02.jpg`, alt: "Small sketches of bridge-like seat profiles in pencil", w: 1600, h: 833, size: "small", lane: 1, dy: 2 },
    { src: `${D}/form-16.jpg`, alt: "Bench side profile with a shaded block and handwritten dimensions", w: 1600, h: 1000, size: "medium", lane: 1, dy: -5 },
    { src: `${D}/form-02.jpg`, alt: "Rows of small rocker profiles, some shaded in graphite and blue pencil", w: 1600, h: 851, size: "large", lane: 1, dy: 4 },
    { src: `${D}/form-small-04.jpg`, alt: "Four small bench forms, one heavily shaded", w: 1600, h: 899, size: "small", lane: 1, dy: -2 },
    { src: `${D}/form-07.jpg`, alt: "A dense sheet of dozens of thumbnail seat and rocker silhouettes", w: 1600, h: 1104, size: "medium", lane: 1, dy: 5 },
    { src: `${D}/form-18.jpg`, alt: "Column of lens and bowl shaped forms in soft pencil", w: 1290, h: 1600, size: "medium", lane: 1, dy: -3 },
    /* lane 3 */
    { src: `${D}/form-14.jpg`, alt: "Narrow sheet of seat forms with dimension marks", w: 1141, h: 1600, size: "medium", lane: 2, dy: -2 },
    { src: `${D}/form-10.jpg`, alt: "Large sketch of a bench with a C-shaped cut-out, half hatched", w: 1600, h: 895, size: "large", lane: 2, dy: 4 },
    { src: `${D}/form-15.jpg`, alt: "Faint studies of a rocker with a flat seat plank, some lines in blue", w: 1600, h: 1003, size: "medium", lane: 2, dy: -3 },
    { src: `${D}/form-small-03.jpg`, alt: "Five small triangular and bowl-shaped seat sketches", w: 1600, h: 1364, size: "small", lane: 2, dy: 3 },
    { src: `${D}/form-17.jpg`, alt: "Two long curved rocker outlines drawn in graphite", w: 1600, h: 967, size: "medium", lane: 2, dy: -5 },
    { src: `${D}/form-11.jpg`, alt: "Rendering of the finished Seesaw bench with a walnut seat on a black steel base", w: 1600, h: 1057, size: "large", lane: 2, dy: 2 },
    { src: `${D}/form-19.jpg`, alt: "U-shaped frame and labelled seat blocks marked with the word top", w: 1600, h: 1551, size: "medium", lane: 2, dy: -4 },
    { src: `${D}/form-06.jpg`, alt: "Two long bench profiles, one lightly drawn above a heavily shaded one", w: 1600, h: 1380, size: "medium", lane: 2, dy: 5 },
  ],
};
