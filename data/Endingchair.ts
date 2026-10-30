/* -------------------------------------------------------------------------
 * data/endingChair.ts      (or src/data/endingChair.ts)          — NEW FILE
 *
 * ENDING of "Chandigarh Chair" — one silent, looping clip in a frame, centred on the screen,
 * right after the joinery page. Uses the SAME component (ProjectEnding) and the SAME type (EndingData)
 * as the SeeSaw project, so nothing else changes.
 *
 * Files live in  public/projects/chandigarh/end/
 *     end.mp4          the clip (H.264, silent)
 *     end-poster.jpg   first frame, shown while the video loads
 * (keep the file names lowercase — Vercel is case-sensitive)
 * ---------------------------------------------------------------------- */
import type { EndingData } from "./ending";

const D = "/projects/chandigarh/end";

export const CHAIR_ENDING: EndingData = {
  video: {
    mp4: `${D}/end1.mp4`,
    webm: undefined, // optional: `${D}/end.webm`
    poster: `${D}/end-poster.jpeg`,
    label: "The finished Chandigarh chair, teak and woven cane",
    position: "50% 50%", // only matters if `ratio` differs from the clip's own shape
  },
  /* ⚠ SET THIS to the clip's real pixel size, [width, height] (right-click the file → Get Info → More Info → Dimensions).
     The frame takes exactly that shape, so the whole video shows and nothing is cropped.
     [1072, 932] is only the SeeSaw clip's size, kept here as a placeholder. */
  ratio: [1072, 932],
};