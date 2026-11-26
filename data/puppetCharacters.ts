/* -------------------------------------------------------------------------
 * data/puppetCharacters.ts  (or src/data/puppetCharacters.ts)
 * Project eight (Puppet theatre) — COMPOSE · "3. Pick your characters"  (Canva page 107)
 *
 * What the page does
 *   · Group 1 (the stick puppets) is a real 3D model. When the visitor arrives it shows the BUNCH pose
 *     (sticks leaning together) for HOLD_MS, then every puppet glides into the OPEN pose (standing in a row).
 *   · Every puppet has a soft shadow on the "wall" behind it.
 *   · The other four groups (2 dragon, 3 small dragon, 4 rooster, 5 snake) are listed in CHAR_PENDING with
 *     their Canva boxes. They need their own .glb files — see the note at the bottom.
 *
 * Coordinates: ARTBOARD pixels of the 1440 × 900 Canva page (x right, y down). The canvas is drawn with an
 * orthographic camera in these same pixels, so a box here is exactly the box on Canva.
 * ---------------------------------------------------------------------- */

export type Box = { x0: number; y0: number; x1: number; y1: number };

export const CHAR_TEXT = {
  number: "3.",
  title: "Pick your characters",
  paragraph: [
    "I explored different puppet mechanisms to give each",
    "character its own way of moving and being performed.",
  ],
  alt: "Five groups of puppets with different mechanisms: stick puppets, two dragon puppets, a rooster and a snake. The stick puppets begin bunched together and then stand in a row.",
};

/* ---------------- timing ---------------- */
export const CHAR_HOLD_MS = 3000; //   the "bunch" is shown this long (client: 2–4 s) before the animation starts
export const CHAR_MOVE_MS = 1500; //   each puppet's own travel time, bunch → open
export const CHAR_STAGGER_MS = 70; //  delay between one puppet and the next

/* ---------------- files (put them in public/projects/puppet-theatre/characters/) ---------------- */
export const CHAR_BUNCH_URL = "/projects/puppet-theatre/characters/stick-puppets-bunch.glb";

/* Where the stick-puppet group sits on the Canva page.
   bunch = measured around the puppets + sticks in the designer's screenshot (x 50–555, y 243–815).
   open  = where the lined-up pose is fitted. Same area by default; the open pose is wider, so it is
           fitted with "contain" (it becomes a little smaller than the bunch). Change it freely. */
export const CHAR_STICKS_BOX: { bunch: Box; open: Box } = {
  bunch: { x0: 50, y0: 243, x1: 555, y1: 815 },
  open: { x0: 40, y0: 300, x1: 560, y1: 760 },
};

/* bounding boxes of the two poses in the model's own metres (x = right, y = up) — measured from the two files */
export const CHAR_BOUNDS = {
  bunch: { x0: 0.4612, x1: 0.86645, y0: 0.76124, y1: 1.22326 },
  open: { x0: 0.40157, x1: 1.03477, y0: 0.77038, y1: 1.21646 },
};

/* Every mesh of the model, its movement between the two poses (measured exactly from the two .glb files),
   and its colour/material picture.  deg = turn around the vertical axis of the plate, from → to = centre (file units).
   texFrac = how much of the picture one puppet shows: smaller = bigger speckles. */
export type CharPart = {
  key: string;
  deg: number;
  from: [number, number, number];
  to: [number, number, number];
  tex?: string;
  texFrac?: number;
  fallback?: string;
};
const T = "/projects/puppet-theatre/characters/";
export const CHAR_PARTS: CharPart[] = [
  { key: "alien", deg: 10, from: [63.03428, 0.25, -91.91638], to: [46.53143, 0.25, -85.88097], tex: T + "tex-mouse.jpg", texFrac: 0.5, fallback: "#b9b8a8" }, //   mouse
  { key: "Body249", deg: 20, from: [56.17312, -0.75, -87.86419], to: [92.89809, 0.25, -84.26565], tex: T + "tex-truck.jpg", texFrac: 0.5, fallback: "#3f69ac" }, //  truck
  { key: "dance fig", deg: -15, from: [79.98363, -0.75, -85.84137], to: [79.01627, 0.25, -86.93475], tex: T + "tex-dancer.jpg", texFrac: 0.55, fallback: "#c46e5f" }, // dancer
  { key: "dino", deg: 0, from: [68.81683, 0.25, -88.48945], to: [63.81683, 0.25, -88.48945], tex: T + "tex-dino.jpg", texFrac: 0.6, fallback: "#336663" }, //  dino
  { key: "honeybee", deg: -20, from: [82.8974, 0.25, -94.22108], to: [54.87837, 0.25, -87.27646], tex: T + "tex-bee.jpg", texFrac: 0.3, fallback: "#e3ce6f" }, // bee
  /* the five wooden sticks keep the maple colour that is already inside the file */
  { key: "Body284", deg: 0, from: [70.21675, 0.25, -108.34562], to: [65.21675, 0.25, -108.34562] },
  { key: "Body285", deg: -15, from: [74.66432, -0.75, -104.90377], to: [78.81192, 0.25, -106.72436] },
  { key: "Body286", deg: 10, from: [65.65813, 0.25, -109.52658], to: [46.05745, 0.25, -103.67925] },
  { key: "Body287", deg: -20, from: [75.58315, 0.25, -108.65688], to: [52.94255, 0.25, -103.34329] },
  { key: "Body288", deg: 20, from: [62.60452, -0.75, -106.56354], to: [92.54606, 0.25, -104.03696] },
];

/* ---------------- shadow (px of the artboard) ---------------- */
export const CHAR_SHADOW = {
  dx: -34, //       shadow falls this far to the LEFT (negative = left)…
  dy: 30, //        …and this far UP (positive = up), as in the Canva render
  depth: 80, //     distance of the invisible wall behind the puppets
  opacity: 0.24, // darkness
  blur: 10, //      softness
};

/* Groups 2–5 on the Canva page — NOT built yet, because their 3D files were not sent.
   When you have the .glb for one, tell me and I add it as a new entry next to the stick puppets.
   (boxes measured from the Canva page, shadows excluded) */
export const CHAR_PENDING: { id: string; label: string; box: Box }[] = [
  { id: "dragon-long", label: "Dragon puppet (extended)", box: { x0: 540, y0: 228, x1: 1047, y1: 460 } },
  { id: "dragon-short", label: "Dragon puppet (folded)", box: { x0: 585, y0: 508, x1: 945, y1: 668 } },
  { id: "rooster", label: "Rooster", box: { x0: 1120, y0: 128, x1: 1285, y1: 470 } },
  { id: "snake", label: "Snake", box: { x0: 828, y0: 455, x1: 1388, y1: 800 } },
];