/* -------------------------------------------------------------------------
 * data/puppetEnd.ts  (or src/data/puppetEnd.ts)
 * Project eight (Puppet theatre) — END page: one looping video in a frame.
 * Frame (artboard px, 1440 × 900, from her Canva page): x 259 · y 139 · 922 × 621.
 * ---------------------------------------------------------------------- */

export type EndData = {
  video: {
    mp4: string;
    poster: string;
    label: string; // accessible description (silent, no controls)
    position?: string; // CSS object-position — which part stays visible when cropped, default "50% 50%"
  };
};

const BASE = "/projects/puppet-theatre/end";

export const PUPPET_END: EndData = {
  video: {
    mp4: `${BASE}/end.mp4`,
    poster: `${BASE}/end-poster.jpg`,
    label: "Visitors and a child gathered around the Fable Box puppet theatre at the exhibition",
    position: "50% 50%",
  },
};