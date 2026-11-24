/* -------------------------------------------------------------------------
 * data/puppetCompose.ts  (or src/data/puppetCompose.ts)
 * Project eight (Puppet theatre) — HOW IT WORKS · COMPOSE
 *
 * All text is exactly as on the client's Canva page.
 * Card positions are artboard px (1440 × 900, the same grid as the Build page and the timeline):
 *   x / y  = centre of the card in its final fan      r = rotation in degrees (− = anticlockwise)
 *   from   = where the card starts, close to the others (the "deck" before the spread)
 * Tune any number here — nothing else needs touching.
 * ---------------------------------------------------------------------- */

export type ComposeCard = {
  key: string;
  world: string;
  src: string;
  alt: string;
  x: number;
  y: number;
  r: number;
  z: number; // stacking order in the fan (higher = on top)
  from: { x: number; y: number; r: number };
};

export type ComposeData = {
  kicker: string;
  tagline: string;
  step: { number: string; title: string };
  paragraph: string[]; // one string per line (desktop keeps her line break)
  note: string;
  cards: ComposeCard[];
  /** index in `cards` of the card that comes forward at the end */
  featured: number;
  /** where the featured card lands (artboard px) and how much it grows */
  featuredPose: { x: number; y: number; scale: number };
  caption: string[]; // two lines under the featured card
};

export const PUPPET_COMPOSE: ComposeData = {
  kicker: "COMPOSE",
  tagline: "Let’s build the world.",
  step: { number: "1.", title: "Pick a world" },
  paragraph: [
    "At the start of each session, the child draws one World Card. It tells",
    "them how to set the stage.",
  ],
  note: "The same modular system adapts across different story worlds.",
  cards: [
    {
      key: "ocean",
      world: "World 1 — Ocean",
      src: "/projects/puppet-theatre/cards/world-1-ocean.png",
      alt: "World card 1, Ocean: two children sail a wooden boat past a lighthouse, with a turtle and a whale below",
      x: 395, y: 646, r: -5, z: 4,
      from: { x: 690, y: 652, r: -3 },
    },
    {
      key: "forest",
      world: "World 2 — Forest",
      src: "/projects/puppet-theatre/cards/world-2-forest.png",
      alt: "World card 2, Forest: an owl, a monkey, a deer and a butterfly among leaves and berries",
      x: 625, y: 622, r: -13, z: 3,
      from: { x: 708, y: 646, r: -1 },
    },
    {
      key: "town",
      world: "World 3 — Town",
      src: "/projects/puppet-theatre/cards/world-3-town.png",
      alt: "World card 3, Town: a signpost in a square with a fountain, clock tower, bus stop and market stall",
      x: 835, y: 604, r: -2, z: 2,
      from: { x: 732, y: 642, r: 2 },
    },
    {
      key: "space",
      world: "World 4 — Space",
      src: "/projects/puppet-theatre/cards/world-4-space.png",
      alt: "World card 4, Space: an astronaut and a dog on the moon, with a rocket, Saturn and a friendly alien",
      x: 1060, y: 624, r: 13, z: 1,
      from: { x: 752, y: 652, r: 4 },
    },
  ],
  featured: 1, // Forest
  featuredPose: { x: 690, y: 596, scale: 1.04 },
  caption: ["FOREST", "Now create the setting"],
};