/* -------------------------------------------------------------------------
 * data/puppetPerform.ts
 *
 * Project eight · PERFORM page (follows BUILD · COMPOSE · INTERPRET).
 * Positions and sizes live in components/ProjectPerform.tsx (her Canva values).
 * FILES → public/projects/puppet-theatre/
 * ---------------------------------------------------------------------- */

const DIR = "/projects/puppet-theatre";

export type PerformMedia = {
  src: string;
  poster?: string;
  label: string; // accessible description
  position?: string; // CSS object-position, default "50% 50%"
};

export type PerformData = {
  heading: string;
  lines: string[]; // one string per line, exactly as broken in Canva
  left: PerformMedia; // landscape clip
  right: PerformMedia; // portrait-ish clip
};

export const PUPPET_PERFORM: PerformData = {
  heading: "Perform",
  lines: [
    "Once the theatre is built, the world is set and the story has a",
    "direction, the child takes over. They narrate, move the characters,",
    "change the scene and decide where the story goes next.",
  ],
  left: {
    src: `${DIR}/perform-1.mp4`,
    poster: `${DIR}/perform-1.jpg`,
    label: "Children playing with the puppet theatre at the exhibition",
    position: "50% 50%",
  },
  right: {
    src: `${DIR}/perform-2.mp4`,
    poster: `${DIR}/perform-2.jpg`,
    label: "Close-up of a child moving the lion puppet inside the stage",
    position: "50% 50%",
  },
};