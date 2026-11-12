/* -------------------------------------------------------------------------
 * data/echoTesting.ts
 *
 * Page 8 — Echo Pan — TESTING (beige left half, white right half, two clips).
 * Positions and sizes live in components/ProjectEchoTesting.tsx (her Canva values).
 * FILES → public/projects/echo-pan/
 * ---------------------------------------------------------------------- */

const DIR = "/projects/echo-pan";

export type TestingMedia = {
  kind: "video" | "image"; // "video" = silent endless loop · "image" = still photo
  src: string;
  poster?: string; // optional still shown before the video loads
  label: string; // accessible description
  position?: string; // CSS object-position, default "50% 50%"
};

export type EchoTestingData = {
  heading: string;
  left: TestingMedia; // portrait clip, on the beige half
  right: TestingMedia; // landscape clip, straddling the beige / white edge
};

export const ECHO_PAN_TESTING: EchoTestingData = {
  heading: "Testing",
  left: {
    kind: "video",
    src: `${DIR}/testing-1.mp4`,
    poster: `${DIR}/testing-1.jpg`,
    label: "Testing the steel flute in the workshop",
    position: "50% 50%",
  },
  right: {
    kind: "video",
    src: `${DIR}/testing-2.mp4`,
    poster: `${DIR}/testing-2.jpg`,
    label: "Testing the wooden pan pipes",
    position: "50% 50%",
  },
};