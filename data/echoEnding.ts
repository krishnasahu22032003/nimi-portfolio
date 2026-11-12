/* -------------------------------------------------------------------------
 * data/echoEnding.ts
 *
 * Page 9 — Echo Pan — END. Two videos on one page; arrows left / right switch between them.
 * FILES → public/projects/echo-pan/
 * ---------------------------------------------------------------------- */

const DIR = "/projects/echo-pan";

export type EchoEndVideo = {
  src: string;
  poster?: string;
  label: string; // accessible description
};

export type EchoEndData = {
  videos: EchoEndVideo[]; // 2 videos (works with more; arrows cycle through them)
};

export const ECHO_PAN_END: EchoEndData = {
  videos: [
    {
      src: `${DIR}/end-1.mp4`,
      poster: `${DIR}/end-1.jpg`,
      label: "Playing the Echo Pan under a tree, flute and pan pipes together",
    },
    {
      src: `${DIR}/end-2.mp4`,
      poster: `${DIR}/end-2.jpg`,
      label: "Playing the Echo Pan under a tree, second take",
    },
  ],
};