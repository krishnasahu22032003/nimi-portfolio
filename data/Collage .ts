/* data/collage.ts   (or src/data/collage.ts)
 *
 * Page 3 of "Chandigarh Chair" — the collage page (Canva 1440 × 900 artboard).
 *
 * Every x / y / w / h below was MEASURED by fitting each new cutout (trimmed to its visible pixels)
 * against the clean Canva export (option_1.jpg). Units are Canva px:
 *   x, y = top-left corner of the visible cutout, w, h = its size.
 * Fit error is ≈ 1 px for sketch / top / backrest / back.
 *
 * FILES → public/projects/chandigarh/collage/
 *   top-upside.webp, backrest.webp, side.webp, back.webp, sketch.webp
 * (already trimmed to the visible chair and exported at 2× their artboard size — retina-sharp, light.
 *  Do NOT use the original 7360 px files on the site.)
 */
const D = "/projects/chandigarh/collage";

export type CollageItem = {
  id: string;
  src: string;
  alt: string; // "" = decorative
  x: number; y: number; w: number; h: number; // Canva px
  rotate?: number; // degrees, negative = counter-clockwise (CSS)
  opacity?: number; // 0–1 (sketch = 0.55, her "transparency: 55")
  clipRight?: boolean; // cut shadow + image exactly at the item's right edge (so nothing leaks over the beige | white seam)
  shadow?: boolean; // her note: "add shadows for all the 4 chair pngs" (the sketch has none)
};

export type Seg = { t: string; b?: boolean; white?: boolean };
export type CollageData = {
  items: CollageItem[]; // painted back → front
  statement: Seg[][]; // lines; an empty array = blank line
  spec: string[]; // bottom lines
};

export const CHAIR_COLLAGE: CollageData = {
  items: [
    // sketch: 55 % opacity, no shadow — placement must stay exactly here
    { id: "sketch", src: `${D}/sketch.webp`, alt: "", x: 845, y: 46, w: 361, h: 437.5, opacity: 0.55 },
    // chair upside down (beige panel, top)
    { id: "top", src: `${D}/top-upside.webp`, alt: "The chair turned upside down, showing the cane seat from below", x: 175.8, y: 11.4, w: 360.9, h: 324.4, shadow: true },
    // backrest close-up — bleeds off the bottom edge (y + h = 900); its right edge now ends at x = 643.7,
    // just inside the beige panel (644) so the armrest no longer pokes out over the seam
    { id: "backrest", src: `${D}/backrest.webp`, alt: "Close-up of the cane backrest and teak frame", x: 39.8, y: 490.3, w: 603.9, h: 409.7, shadow: true, clipRight: true },
    // side view, straddles the beige / white seam
    { id: "side", src: `${D}/side.webp`, alt: "The chair in side view, showing the compass legs", x: 538.3, y: 259.4, w: 367.5, h: 369.3, rotate: -3.5, shadow: true },
    // chair tipped over, from behind — bleeds off the bottom AND right edge
    { id: "back", src: `${D}/back.webp`, alt: "The chair tipped over, seen from behind", x: 835.3, y: 465.2, w: 567.4, h: 434.8, shadow: true },
  ],
  statement: [
    [{ t: "Every", white: true }, { t: " " }, { t: "curve,", b: true }],
    [{ t: "every", white: true }, { t: " " }, { t: "joint,", b: true }],
    [{ t: "every", white: true }, { t: " " }, { t: "detail", b: true }],
    [],
    [{ t: "crafted with " }, { t: "precision,", b: true }],
    [{ t: "not just to " }, { t: "add up,", b: true }],
    [{ t: "but to " }, { t: "define", b: true }, { t: " the chair." }],
  ],
  spec: ["Teak wood / natural rattan cane", "H 70 / D 74 / W 57  (in cm)"],
};