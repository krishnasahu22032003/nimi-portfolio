/* data/collage.ts   (or src/data/collage.ts)
 *
 * Page 3 of "Chandigarh Chair" — the collage page (Canva 1440 × 900 artboard).
 * Every number below was MEASURED from her clean design by matching each cutout against it,
 * so x / y / w / h are Canva px (top-left corner + size of the visible cutout).
 *
 * FILES → public/projects/chandigarh/collage/   (already trimmed + resized for you: top-upside.webp, side.webp,
 *   backrest.webp, back.webp, sketch.webp — the original 7360 px PNGs are far too heavy for a website)
 */
const D = "/projects/chandigarh/collage";

export type CollageItem = {
  id: string;
  src: string;
  alt: string; // "" = decorative
  x: number; y: number; w: number; h: number; // Canva px
  rotate?: number; // degrees, negative = counter-clockwise (CSS)
  opacity?: number; // 0–1 (sketch = 0.55, her "transparency: 55")
  shadow?: boolean; // her note: "add shadows for all the 4 chair pngs" (the sketch has none)
};

export type Seg = { t: string; b?: boolean; white?: boolean };
export type CollageData = {
  items: CollageItem[]; // painted back → front
  statement: Seg[][]; // lines; an empty array = blank line
  spec: string[]; // bottom-right lines
};

export const CHAIR_COLLAGE: CollageData = {
  items: [
    { id: "sketch", src: `${D}/sketch.webp`, alt: "", x: 845, y: 47, w: 358.7, h: 434.8, opacity: 0.55 },
    { id: "top", src: `${D}/top-upside.webp`, alt: "The chair turned upside down, showing the cane seat from below", x: 173.4, y: 10.3, w: 363.5, h: 326.8, shadow: true },
    { id: "backrest", src: `${D}/backrest.webp`, alt: "Close-up of the cane backrest and teak frame", x: 38.3, y: 488.7, w: 608.9, h: 411.3, shadow: true },
    { id: "side", src: `${D}/side.webp`, alt: "The chair in side view, showing the compass legs", x: 542.6, y: 255.6, w: 365.8, h: 367.8, rotate: -3, shadow: true },
    { id: "back", src: `${D}/back.webp`, alt: "The chair tipped over, seen from behind", x: 835.3, y: 464.7, w: 570.4, h: 435.7, shadow: true },
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