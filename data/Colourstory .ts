/* data/colourStory.ts   (or src/data/colourStory.ts)
 *
 * Page 2 of "Chandigarh Chair": 2 × 2 tiles that change colour one after another + text.
 *
 * FILES → public/projects/chandigarh/
 *   AFTER  set (left grid on her reference):   1.jpg   2.jpg   3.jpg   4.jpg
 *   BEFORE set (right grid on her reference): 11.jpg  22.jpg  33.jpg  44.jpg
 *   Tile positions: 1 top-left · 2 top-right · 3 bottom-left · 4 bottom-right
 *   Same chair, SAME position in each pair — only the colour differs.
 *
 * WHAT THE PAGE DOES (her reference page: left grid = "after", right grid = "before")
 *   The page opens on the "before" set (11 · 22 · 33 · 44). Then, one tile at a time and in this order
 *   (timings are in ProjectColourStory.tsx):
 *        8 s  → the 2nd tile changes   (22 → 2)
 *        +3 s → the 3rd tile changes   (33 → 3)
 *        +3 s → the 4th tile changes   (44 → 4)
 *        +3 s → the 1st tile changes   (11 → 1)
 *   until the page shows the "after" set (1 · 2 · 3 · 4).
 *
 * ONE-WORD SWITCH: her reference page contradicts itself — its labels say before = 11-44 / after = 1-4,
 * but its sentences say "1 will be replaced by 11". If she wants the OTHER direction, change SHOW_FIRST below
 * to "after" (opens on 1·2·3·4 and changes into 11·22·33·44). Nothing else needs to change.
 */
const D = "/projects/chandigarh";
const EXT = "jpg"; // ← file type of the 8 chair images: "jpg" · "jpeg" · "png" · "webp"

const SHOW_FIRST: "before" | "after" = "before";

export type ColourTile = { from: string; to: string; alt: string };
export type ColourStoryData = {
  tiles: ColourTile[]; // exactly 4, in reading order (top-left, top-right, bottom-left, bottom-right)
  text: string[][]; // paragraphs → lines (one string = one line, as she broke it in Canva)
};

const BEFORE = [11, 22, 33, 44]; // right grid on her reference
const AFTER = [1, 2, 3, 4]; //      left grid on her reference
const ALT = [
  "Easy Armchair, side view",
  "Easy Armchair, front view",
  "Easy Armchair, back view",
  "Easy Armchair, three-quarter view",
];

const file = (n: number) => `${D}/${n}.${EXT}`;
const first = SHOW_FIRST === "before" ? BEFORE : AFTER;
const then = SHOW_FIRST === "before" ? AFTER : BEFORE;

export const CHAIR_COLOUR_STORY: ColourStoryData = {
  tiles: first.map((n, i) => ({ from: file(n), to: file(then[i]), alt: ALT[i] })),
  text: [
    [
      "Designed by Pierre Jeanneret in the 1950s, the Easy Armchair",
      "was used in offices and residences across Chandigarh and",
      "Ahmedabad. Its distinctive compass legs, teak frame and",
      "natural cane seat and back have made it a recognisable",
      "example of the period’s furniture design.",
    ],
    [
      "As part of a hands-on furniture-making workshop, I worked",
      "with this established design to explore the craft behind its",
      "construction. I was particularly interested in its joinery, how the",
      "wooden frame holds together, and how the cane is fitted into it.",
    ],
  ],
};