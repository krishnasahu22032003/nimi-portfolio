
/* -------------------------------------------------------------------------
 * data/construction.ts
 *
 * Page 7 — Echo Pan — Construction
 *
 * Layout: 3 × 2
 *
 * MEDIA → public/projects/echo-pan/
 *
 * Videos:
 *   construction-1.mp4
 *   construction-3.mp4
 *
 * Images:
 *   construction-2.jpg
 *   construction-4.jpg
 *   construction-5.jpg
 *   construction-6.jpg
 *
 * Videos autoplay silently, loop continuously and pause when off-screen.
 * ---------------------------------------------------------------------- */

const DIR = "/projects/echo-pan";

export type ConstructionTile = {
  alt: string;
  position?: string;
  image?: string;
  video?: {
    mp4: string;
    webm?: string;
    poster?: string;
  };
};

export type ConstructionData = {
  heading: string;
  tiles: ConstructionTile[];
};

// Static image helper
const img = (
  file: string,
  alt: string,
  position?: string
): ConstructionTile => ({
  alt,
  position,
  image: `${DIR}/${file}`,
});

// Video helper
const vid = (
  file: string,
  alt: string,
  opts: {
    webm?: string;
    poster?: string;
    position?: string;
  } = {}
): ConstructionTile => ({
  alt,
  position: opts.position,
  video: {
    mp4: `${DIR}/${file}`,
    webm: opts.webm ? `${DIR}/${opts.webm}` : undefined,
    poster: opts.poster ? `${DIR}/${opts.poster}` : undefined,
  },
});

export const ECHO_PAN_CONSTRUCTION: ConstructionData = {
  heading: "Construction",

  tiles: [
    // 1. VIDEO — Sanding bamboo tube
    vid(
      "construction-1.mp4",
      "Sanding a bamboo tube on a bench machine in the workshop",
      {
        poster: "construction-1.jpg",
      }
    ),

    // 2. IMAGE — Cutting tube with hacksaw
    img(
      "construction-2.jpg",
      "Cutting a tube with a hacksaw held in a bench vice"
    ),

    // 3. VIDEO — Shaping tube on lathe
    vid(
      "construction-3.mp4",
      "A tube turning on a lathe while it is shaped",
      {
        poster: "construction-3.jpg",
      }
    ),

    // 4. IMAGE — Tube clamped in bench vice
    img(
      "construction-4.jpg",
      "A thin tube clamped in a red bench vice"
    ),

    // 5. IMAGE — Cutting metal with angle grinder
    img(
      "construction-5.jpg",
      "Cutting metal tube with an angle grinder, sparks flying"
    ),

    // 6. IMAGE — Polishing steel tube
    img(
      "construction-6.jpg",
      "Polishing a steel tube on a buffing wheel"
    ),
  ],
};
