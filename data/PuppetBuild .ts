/* -------------------------------------------------------------------------
 * data/puppetBuild.ts  (or src/data/puppetBuild.ts)
 * Project eight (Puppet theatre) — page 102: HOW IT WORKS · BUILD
 *
 * Everything the 3D build needs, in one place.
 *
 * HOW IT WORKS
 *   Only ONE model is loaded: panel_flat.glb (all panels laid flat, on the left).
 *   The visitor clicks the highlighted panel and it flies to the right, into the
 *   theatre. Eight clicks build the theatre; the four loose pieces then glide to
 *   the corner by themselves, as in the Canva page.
 *   "to" and "q" were calculated from constructed_.glb, so every panel lands
 *   exactly where the designer placed it. Units are metres, model axes (Z up).
 *
 * THE ORDER (the client's numbers 1–8) is BUILD_STEPS below.
 * To change it, re-order the lines. Nothing else needs touching.
 * ---------------------------------------------------------------------- */

export const BUILD_MODEL_URL = "/projects/puppet-theatre/model/panel_flat.glb";

export type BuildStep = { key: string; label: string };

/* The eight panels the visitor clicks, in the client's order.
   key = mesh name inside panel_flat.glb. label = read out to screen-reader users only. */
export const BUILD_STEPS: BuildStep[] = [
  { key: "Body14", label: "Stage base" }, // 1
  { key: "Body1", label: "Front panel" }, // 2
  { key: "Body1.007", label: "Side panel, near end" }, // 3
  { key: "Body1.008", label: "Side panel, far end" }, // 4
  { key: "Body1.004", label: "Bottom shelf" }, // 5
  { key: "Body1.001", label: "Top panel" }, // 6
  { key: "Body1.010", label: "Podium, left" }, // 7
  { key: "Body1.009", label: "Podium, right" }, // 8
];

/* Not numbered by the client: they glide to the corner by themselves after step 8. */
export const BUILD_LOOSE: string[] = ["Body1.002", "Body1.003", "Body1.005", "Body1.006"];

export type BuildPose = {
  from: [number, number, number]; // centre of the flat panel
  to: [number, number, number]; // centre of the panel in the finished scene
  q: [number, number, number, number]; // rotation as a quaternion [x, y, z, w]
};

export const BUILD_POSES: Record<string, BuildPose> = {
  "Body14": { // stage base
    from: [1.34164, 1.59163, 0.00375],
    to: [1.33697, 1.68281, 0.00375],
    q: [0, 0, 0, 1],
  },
  "Body1": { // front panel
    from: [1.34166, 1.58078, 0.00375],
    to: [1.33825, 1.81003, 0.2],
    q: [0.70711, 0, 0, 0.70711],
  },
  "Body1.007": { // side panel at the near (right) end
    from: [2.46883, 1.56989, 0.00375],
    to: [1.70652, 1.9138, 0.21506],
    q: [0.58082, 0.4033, 0.4033, 0.58082],
  },
  "Body1.008": { // side panel at the far (left) end
    from: [2.12717, 1.56989, 0.00375],
    to: [0.96646, 1.91346, 0.21507],
    q: [0.58083, -0.40329, -0.40329, 0.58083],
  },
  "Body1.004": { // bottom panel, the inner shelf
    from: [2.28337, 1.92612, 0.00375],
    to: [1.33636, 1.9281, 0.06574],
    q: [0, 0, 0, 1],
  },
  "Body1.001": { // top panel
    from: [1.34161, 1.91629, 0.00375],
    to: [1.33693, 1.91454, 0.40375],
    q: [0, 0, 0, 1],
  },
  "Body1.010": { // podium that ends up on the left of the stage
    from: [2.48078, 1.65482, 0.00375],
    to: [1.18982, 1.73224, 0.01125],
    q: [0, 0, 0, 1],
  },
  "Body1.009": { // podium that ends up on the right of the stage
    from: [2.11478, 1.65482, 0.00375],
    to: [1.49189, 1.73247, 0.01125],
    q: [0, 0, -0.21644, 0.9763],
  },
  "Body1.002": { // loose window piece
    from: [1.82156, 1.63867, 0.00375],
    to: [1.92903, 1.89533, 0.00375],
    q: [0, 0, -0, 1],
  },
  "Body1.003": { // loose window piece
    from: [1.81456, 1.43823, 0.00375],
    to: [2.11481, 1.89513, 0.00375],
    q: [0, 0, -0, 1],
  },
  "Body1.005": { // loose podium
    from: [2.73077, 1.40711, 0.00375],
    to: [2.11481, 1.72513, 0.00375],
    q: [0, 0, 0, 1],
  },
  "Body1.006": { // loose podium
    from: [2.72857, 1.54782, 0.00375],
    to: [1.92903, 1.72533, 0.00375],
    q: [0, 0, 0, 1],
  },
};

/* Text from the Canva page (pg 102). */
export const BUILD_TEXT = {
  title: "How it works ?",
  step: "Build",
  hint: "Tap to start building, step by step.",
  paragraphs: [
    "The flat-pack pieces use simple slot-and-tab joints that lock together without glue, tools, or additional hardware.",
    "Children can assemble the theatre themselves, making the act of building the first part of the play.",
  ],
  done: ["The stage is set.", "Move around to explore it from every side."],
  alt: "3D model of the puppet theatre. Flat panels on the left are clicked one by one and fly to the right to build the theatre. When it is built, drag to look around it.",
};