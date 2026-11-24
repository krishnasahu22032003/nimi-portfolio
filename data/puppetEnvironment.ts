/* -------------------------------------------------------------------------
 * data/puppetEnvironment.ts  (or src/data/puppetEnvironment.ts)
 * Project eight (Puppet theatre) — COMPOSE · "2. Build the environment"  (Canva page 104)
 *
 * What the page does
 *   RIGHT  the finished theatre (theatre-built.glb), stationary, seen from a fixed camera.
 *   LEFT   the character pieces (characters-sheet.glb) laid out flat, facing the visitor.
 *   TAP a piece → it flies to the theatre and slides into a GROOVE (the red lines the client drew):
 *          · the two foot pads in front of the stage have 3 grooves each
 *          · the shelf inside the stage has 2 long grooves
 *   TAP a placed piece (or Reset) → it flies back to the left.
 *
 * All coordinates are in METRES, model axes (X right, Y away from the visitor, Z up) — the same
 * space as data/puppetBuild.ts. Nothing here needs touching unless the designer moves a piece.
 * ---------------------------------------------------------------------- */

export const ENV_THEATRE_URL = "/projects/puppet-theatre/model/theatre-built.glb";
export const ENV_CHARACTERS_URL = "/projects/puppet-theatre/model/characters-sheet.glb";
export const ENV_TEXTURE_URL = "/projects/puppet-theatre/model/characters-texture.jpg";

/* The characters GLB has no colours (Fusion decals were not exported), so the artwork is projected from the
   designer's top-view screenshot of the sheet: pixel = metre × s + (ox, oy)  (y is flipped). Measured by fitting
   the 3D outlines onto the screenshot. If you ever re-export a sharper top view, change the file and these 5 numbers. */
export const ENV_TEXTURE_MAP = { s: 1157, ox: -720, oy: 826, w: 1440, h: 900 };

/* colours of the theatre parts (names = mesh names inside theatre-built.glb) */
export const ENV_GREEN = "#3C6952"; // same green as the Build page
export const ENV_TAUPE = "#8A8478"; // the side panels and foot pads are grey in the designer's render
export const ENV_PART_COLOUR: Record<string, string> = {
  "Body1": ENV_GREEN, //     front panel
  "Body1.001": ENV_GREEN, // top panel
  "Body1.002": ENV_GREEN, // shelf
  "Body1.003": ENV_GREEN, // wavy stage base
  "Body1.004": ENV_TAUPE, // left foot pad
  "Body1.007": ENV_TAUPE, // right foot pad
  "Body1.005": ENV_TAUPE, // side panel
  "Body1.006": ENV_TAUPE, // side panel
};

export type EnvPiece = {
  id: string;
  /** mesh name(s) inside characters-sheet.glb (the original names, with their spaces and brackets) */
  keys: string[];
  label: string; // read out to screen-reader users
  /** the spot the DESIGNER chose (from the Fusion file). Pieces without one take the first free spot on the shelf. */
  placed?: {
    where: "pad" | "shelf";
    to: [number, number, number]; // centre of the piece when it stands in its groove
    q: [number, number, number, number]; // rotation as a quaternion [x, y, z, w]
  };
};

/* The pieces, grouped in the rows they take on the left (as in the Canva page: animals, then plants, then trees). */
export const ENV_PIECES: EnvPiece[][] = [
  [
    { id: "house", keys: ["Body260"], label: "House", placed: { where: "pad", to: [1.51194, 1.73235, 0.0819], q: [0.69035, -0.15305, -0.15305, 0.69035] } },
    { id: "frog", keys: ["Body212", "Body213"], label: "Frog" },
    { id: "ant", keys: ["Body253"], label: "Ant" },
    { id: "monkey", keys: ["Body261"], label: "Monkey" },
    { id: "lion", keys: ["lion"], label: "Lion", placed: { where: "shelf", to: [1.34392, 1.94508, 0.16422], q: [0.70711, 0, 0, 0.70711] } },
  ],
  [
    { id: "turtle", keys: ["trutle"], label: "Turtle" },
    { id: "croc", keys: ["croc"], label: "Crocodile", placed: { where: "pad", to: [1.47721, 1.70387, 0.05279], q: [0.69035, -0.15305, -0.15305, 0.69035] } },
    { id: "mushroom", keys: ["mushroom"], label: "Mushroom", placed: { where: "pad", to: [1.49374, 1.76202, 0.10526], q: [0.68728, -0.16627, -0.16627, 0.68728] } },
    { id: "flower", keys: ["flower"], label: "Red flower", placed: { where: "shelf", to: [1.19484, 1.94508, 0.15035], q: [0.70711, 0, 0, 0.70711] } },
    { id: "flower2", keys: ["flower (2)"], label: "Small red flowers", placed: { where: "shelf", to: [1.51201, 1.99285, 0.12917], q: [0.70711, 0, 0, 0.70711] } },
  ],
  [
    { id: "bush", keys: ["bush"], label: "Bush", placed: { where: "pad", to: [1.16654, 1.73308, 0.06239], q: [0.70711, 0, 0, 0.70711] } },
    { id: "grass", keys: ["grass"], label: "Grass" },
    { id: "tree5", keys: ["tree (5)"], label: "Topiary tree" },
    { id: "tree3", keys: ["tree (3)"], label: "Round tree" },
    { id: "tree4", keys: ["tree (4)"], label: "Spotted tree", placed: { where: "pad", to: [1.24132, 1.70697, 0.10688], q: [0.70711, 0, 0, 0.70711] } },
  ],
  [
    { id: "tree1", keys: ["tree (1)"], label: "Leaf" },
    { id: "tree2", keys: ["tree (2)"], label: "Fern" },
    { id: "tree6", keys: ["tree (6)"], label: "Wavy tree" },
    { id: "tree0", keys: ["tree"], label: "Dark bushy tree" },
    { id: "tree7", keys: ["tree (7)"], label: "Lollipop tree" },
    { id: "tree8", keys: ["tree (8)"], label: "Large leafy plant", placed: { where: "pad", to: [1.17458, 1.76026, 0.15974], q: [0.70711, -0.00062, -0.00062, 0.70711] } },
  ],
];

/* ---------------- the shelf (for pieces without a designer spot) ---------------- */
export const ENV_SHELF = {
  grooves: [1.94508, 1.99285], //   y of the two grooves, front one first
  xMin: 1.062, //                    the pieces slide in through the front window, so they must sit inside it:
  xMax: 1.614, //                    window width at shelf level
  seatZ: 0.0876, //                  lowest point of a piece standing in a groove
  sillZ: 0.0955, //                  lowest edge of the window (just above the shelf)
  gap: 0.006, //                     space left between two neighbours (m)
  /* the designer's own pieces keep their spots even while they are still on the left */
  reserved: [
    { groove: 0, x0: 1.2578, x1: 1.4303 }, // lion
    { groove: 0, x0: 1.1464, x1: 1.2432 }, // red flower
    { groove: 1, x0: 1.4646, x1: 1.5594 }, // small red flowers
  ],
  /* height of the window's top edge, every few cm: a piece must fit under it to slide in */
  windowTop: [
    [1.062, 0.29], [1.1, 0.297], [1.15, 0.298], [1.2, 0.362], [1.25, 0.376], [1.3, 0.354], [1.34, 0.338],
    [1.4, 0.372], [1.45, 0.373], [1.5, 0.33], [1.55, 0.296], [1.6, 0.288], [1.614, 0.285],
  ] as [number, number][],
};

/* Text from the Canva page (pg 104) */
export const ENV_TEXT = {
  number: "2.",
  title: "Build the environment",
  paragraph: [
    "The environment is made to be rearranged, so the same",
    "elements can create different settings and stories.",
  ],
  reset: "Reset",
  alt: "The finished puppet theatre on the right and the character pieces on the left. Tap a piece and it flies into a groove on the stage; tap it again to take it back.",
};