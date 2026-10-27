/* -------------------------------------------------------------------------
 * data/ending.ts      (or src/data/ending.ts)          — NEW FILE
 *
 * ENDING — the project closes with one silent, looping clip in a landscape frame,
 * centred on the screen, right after the FABRICATION section.
 *
 * Files live in  public/projects/seesaw/end/
 *     end.mp4          the clip (H.264, silent)
 *     end-poster.jpg   first frame, shown while the video loads
 * (keep the file names lowercase — Vercel is case-sensitive)
 * ---------------------------------------------------------------------- */
export type EndingData = {
  video: {
    mp4: string;
    webm?: string;
    /** still image shown until the clip is ready (and for visitors who prefer reduced motion) */
    poster?: string;
    /** accessible description (silent, no controls) */
    label: string;
    /** which part of the clip stays visible when it is cropped into the landscape frame — CSS object-position */
    position?: string; // default "50% 50%"
  };
  /** shape of the frame as [width, height]. Use the clip's own size → the whole video shows, nothing is cropped.
   *  A different shape (e.g. [16, 9]) crops the clip to fit — then `video.position` chooses what stays. */
  ratio?: [number, number];
};

const D = "/projects/seesaw/end";

export const SEESAW_ENDING: EndingData = {
  video: {
    mp4: `${D}/end.mp4`,
    webm: undefined, // optional: `${D}/end.webm`
    poster: `${D}/end-poster.jpg`,
    label: "Schoolchildren walking past the SeeSaw exhibition board, with the wooden bench seat in the foreground",
    position: "50% 50%", // only matters if `ratio` differs from the clip's own shape
  },
  ratio: [1072, 932], // the clip's own size (1072 × 932) → shown in full, no crop
};