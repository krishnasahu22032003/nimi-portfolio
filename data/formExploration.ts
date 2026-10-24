/* -------------------------------------------------------------------------
 * data/formExploration.ts      (or src/data/formExploration.ts)
 *
 * FORM EXPLORATION — a white field of free-floating frames (like the Celeste Noir reference).
 * Frames drift across the screen at different speeds. Hover a frame → the drift stops and that frame
 * comes to the front. Press and drag → the field follows your hand (with a little glide on release).
 *
 *   w / h   real pixel size of the image (aspect ratio only)
 *   size    "large" | "medium" | "small"   — "small" = the files she renamed "Small": the smallest frames
 *   lane    0–2  which drifting row the frame travels in (order inside a lane = order in this file)
 *   dy      vertical nudge from the lane's centre line, in u (1u = 1vw) — keeps the field loose, never leaves the band
 *   scale   optional fine-tune of ONE frame on top of its size: 1 = as the size says, 1.2 = 20 % larger,
 *           0.85 = 15 % smaller. Width and height scale together, the ratio never changes.
 *
 *   model   NEW — the "3D MODEL" text at the bottom right. Click → the 3D viewer opens.
 *
 * Images live in  public/projects/seesaw/form/
 * 3D model lives in  public/projects/seesaw/model/seesaw.obj
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
  scale?: number;
};

/** NEW — the 3D model that opens from the "3D MODEL" text */
export type FormModel = {
  /** the clickable text, Comico 16 */
  label: string;
  /** .obj file inside /public */
  src: string;
  /** accessible description of the 3D scene */
  alt: string;
};

export type FormExplorationData = {
  /** section title — 18 · Medium · #000 */
  label: string;
  tiles: FormTile[];
  /** NEW — optional 3D model (leave out and the text + viewer simply don't appear) */
  model?: FormModel;
};

const D = "/projects/seesaw/form";

export const SEESAW_FORM_EXPLORATION: FormExplorationData = {
  label: "FORM EXPLORATION",
  /* NEW */
  model: {
    label: "3D MODEL",
    src: "/projects/seesaw/model/seesaw.fbx",   // was seesaw.obj — switch back any time to compare
    alt: "Interactive 3D model of the Seesaw bench: ...",   // leave as is
  },
  tiles: [
    /* lane 1 */
    { src: `${D}/form-01.jpg`, alt: "Early bench studies with perspective lines, a circle and handwritten notes", w: 1600, h: 1196, size: "large", lane: 0, dy: -3 },
    { src: `${D}/form-04.jpg`, alt: "Tall sheet of small seat profiles with notes on earthquake and pendulum motion", w: 1070, h: 1600, size: "medium", lane: 0, dy: 4 },
    { src: `${D}/form-small-01.jpg`, alt: "Three small sketches of a bench form in soft pencil", w: 1600, h: 948, size: "small", lane: 0, dy: -4 },
    /* CHANGED: the sheet of winged seat forms (marked green by her) — scale 1.2 → 1.4 */
    { src: `${D}/form-05.jpg`, alt: "Loose sheet of winged seat forms drawn in blue pencil", w: 1600, h: 1106, size: "medium", lane: 0, dy: 2, scale: 1.4 },
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
    { src: `${D}/form-07.jpg`, alt: "A dense sheet of dozens of thumbnail seat and rocker silhouettes", w: 1600, h: 1104, size: "medium", lane: 1, dy: 5, scale: 1.5 },
    { src: `${D}/form-18.jpg`, alt: "Column of lens and bowl shaped forms in soft pencil", w: 1290, h: 1600, size: "medium", lane: 1, dy: -3 },
    /* lane 3 */
    { src: `${D}/form-14.jpg`, alt: "Narrow sheet of seat forms with dimension marks", w: 1141, h: 1600, size: "medium", lane: 2, dy: -2 },
    { src: `${D}/form-10.jpg`, alt: "Large sketch of a bench with a C-shaped cut-out, half hatched", w: 1600, h: 895, size: "large", lane: 2, dy: 4, scale: 0.85 },
    { src: `${D}/form-15.jpg`, alt: "Faint studies of a rocker with a flat seat plank, some lines in blue", w: 1600, h: 1003, size: "medium", lane: 2, dy: -3 },
    { src: `${D}/form-small-03.jpg`, alt: "Five small triangular and bowl-shaped seat sketches", w: 1600, h: 1364, size: "small", lane: 2, dy: 3 },
    { src: `${D}/form-17.jpg`, alt: "Two long curved rocker outlines drawn in graphite", w: 1600, h: 967, size: "medium", lane: 2, dy: -5 },
    { src: `${D}/form-11.jpg`, alt: "Rendering of the finished Seesaw bench with a walnut seat on a black steel base", w: 1600, h: 1057, size: "large", lane: 2, dy: 2 },
    { src: `${D}/form-19.jpg`, alt: "U-shaped frame and labelled seat blocks marked with the word top", w: 1600, h: 1551, size: "medium", lane: 2, dy: -4 },
    { src: `${D}/ad.jpg`, alt: "Rendering of the Seesaw bench in profile: walnut-faced on the left, black steel on the right, with a loop handle at each end", w: 1600, h: 927, size: "medium", lane: 2, dy: 3 },
    { src: `${D}/form-06.jpg`, alt: "Two long bench profiles, one lightly drawn above a heavily shaded one", w: 1600, h: 1380, size: "medium", lane: 2, dy: 5 },
  ],
};