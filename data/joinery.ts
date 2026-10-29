/* data/joinery.ts   (or src/data/joinery.ts)
 *
 * Page 6 of "Chandigarh Chair": three photos on beige / white / cream bands + three numbered notes.
 * Canva 1440 × 900 artboard. Every number was MEASURED from her clean reference page.
 *
 * FILES → public/projects/chandigarh/details/armrest.jpg · box-joint.jpg · compass-legs.jpg
 *
 * Photo box  : x / y / w / h = top-left corner + size on the artboard (Canva px)
 * crop       : only when her photo is zoomed — the scaled image size (w, h) and its offset (left, top)
 *              inside the box. Leave it out and the photo simply covers the box.
 * z          : paint order (the box-joint photo sits on top of the other two)
 * d          : reveal order (0 = first)
 * noteY      : top of the text block on the artboard (number line + blank line + paragraphs)
 * Text       : paragraphs → lines → segments. One line = one line as she broke it in Canva; b = bold (medium 500).
 */
const D = "/projects/chandigarh/details";

export type Seg = { t: string; b?: boolean };
export type JoineryPhoto = {
  src: string;
  alt: string;
  x: number; y: number; w: number; h: number; // Canva px
  crop?: { w: number; h: number; left: number; top: number }; // Canva px, relative to the box
  z: number;
  d: number;
};
export type JoineryItem = {
  n: string; // "01"
  noteY: number; // Canva px
  photo: JoineryPhoto;
  paragraphs: Seg[][][];
};
export type JoineryData = { items: JoineryItem[] };

export const CHAIR_JOINERY: JoineryData = {
  items: [
    {
      n: "01",
      noteY: 87,
      photo: {
        src: `${D}/armrest.jpg`,
        alt: "Close-up of the rounded end of the armrest, sanded smooth, with the cane backrest softly out of focus",
        x: 90, y: 90, w: 494.5, h: 330,
        crop: { w: 592, h: 395.1, left: -14, top: -57 },
        z: 1, d: 0,
      },
      paragraphs: [
        [
          [{ t: "The armrest edges were sanded and shaped to" }],
          [{ t: "create a " }, { t: "smooth, rounded", b: true }, { t: " finish, softening the" }],
          [{ t: "otherwise angular wooden frame." }],
        ],
      ],
    },
    {
      n: "02",
      noteY: 373,
      photo: {
        src: `${D}/box-joint.jpg`,
        alt: "The visible box joint at the corner of the cane seat frame, interlocking teak fingers in two tones",
        x: 514.75, y: 285, w: 463.7, h: 330,
        crop: { w: 481.1, h: 330, left: -5, top: 0 },
        z: 2, d: 2,
      },
      paragraphs: [
        [
          [{ t: "The box joint", b: true }, { t: " was deliberately left visible, turning" }],
          [{ t: "a structural connection into a detail worth" }],
          [{ t: "noticing." }],
        ],
        [
          [{ t: "Its interlocking geometry brings both precision" }],
          [{ t: "and visual interest to the seat frame." }],
        ],
      ],
    },
    {
      n: "03",
      noteY: 659,
      photo: {
        src: `${D}/compass-legs.jpg`,
        alt: "The chair from the side: the compass legs meeting the armrest support, with the cane seat and backrest behind",
        x: 90, y: 475.3, w: 501.6, h: 334.7,
        z: 1, d: 1,
      },
      paragraphs: [
        [
          [{ t: "The compass legs are joined to each other with a" }],
          [
            { t: "half-lap joint", b: true },
            { t: ", while " },
            { t: "mortise and tenon joints", b: true },
          ],
          [{ t: "connect them to the armrest. Together, these" }],
          [{ t: "joints bring the frame into a single, cohesive" }],
          [{ t: "structure." }],
        ],
      ],
    },
  ],
};