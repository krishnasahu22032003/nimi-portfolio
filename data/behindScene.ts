/* data/behindScene.ts   (or src/data/behindScene.ts)
 *
 * Page 5 of "Chandigarh Chair": video + caption (left, on beige) and heading + text + sketch (right).
 * Canva 1440 × 900 artboard. Each string = one line, exactly as she broke it in Canva.
 *
 * FILES → public/projects/chandigarh/making.mp4 · making-poster.jpg · making-sketch.webp
 */
const D = "/projects/chandigarh";

export type BehindSceneData = {
  video: { mp4: string; poster: string; label: string };
  caption: string;
  heading: string;
  paragraphs: string[][];
  /** Canva px (top-left corner + size); opacity 0.6 = her "transparency: 60" */
  sketch: { src: string; alt: string; x: number; y: number; w: number; h: number; opacity: number };
};

export const CHAIR_BEHIND_SCENE: BehindSceneData = {
  video: {
    mp4: `${D}/making.mp4`,
    poster: `${D}/making-poster.jpg`,
    label: "A time-lapse of the Chandigarh chair being made in the workshop",
  },
  caption: "Wait till you see me covered in sawdust…",
  heading: "Construction",
  paragraphs: [
    [
      "Making my first chair turned out to be a puzzle of parts,",
      "measurements and joinery. Unlike digital work, wood offers no",
      "Command Z; a broken piece meant starting over, while managing",
      "multiple stages taught me the importance of planning.",
    ],
    [
      "From reading teak grain to using Japanese saws and carving tools,",
      "every stage was a lesson. Despite the occasional frustration,",
      "watching the pieces come together as a chair made it worthwhile.",
    ],
  ],
  sketch: {
    src: `${D}/making-sketch.webp`,
    alt: "Hand-drawn joinery diagram of the chair, numbering each part and marking the mortice and tenon joints",
    x: 586, y: 330, w: 861, h: 574,
    opacity: 0.6,
  },
};