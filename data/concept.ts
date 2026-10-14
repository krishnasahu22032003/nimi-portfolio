/* -------------------------------------------------------------------------
 * data/concept.ts      (or src/data/concept.ts)
 *
 * Everything for the CONCEPT section. Nothing is hard-coded in the component.
 *
 * CAPTIONS
 *  - one string = one line, exactly as she broke it in Canva
 *  - **double asterisks** = bold
 *  - paragraphs: string[][]  (a blank line is inserted between paragraphs)
 *  - width = text-block width in Canva px (1440 × 900 artboard). Every line except the
 *    last line of a paragraph is stretched to this width → JUSTIFIED.
 *
 * MEDIA
 *  - all frames share ONE size (430 × 644, the portrait frame). Photos are scaled evenly
 *    to fill it (object-fit: cover). Use `position` to choose which part stays visible.
 *  - put the files in  public/projects/seesaw/concept/
 * ---------------------------------------------------------------------- */
export type Caption = { width: number; paragraphs: string[][] };

export type ConceptSlide = {
  type: "image" | "video";
  src: string;
  alt: string;
  /** CSS object-position, default "50% 50%" */
  position?: string;
  /** video only: first-frame image shown until it plays */
  poster?: string;
  caption?: Caption;
};

export type ConceptData = {
  label: string;
  /** shown on the LEFT, caption sits on its RIGHT  (4 images) */
  left: ConceptSlide[];
  /** shown on the RIGHT, caption sits on its LEFT  (5 items) */
  right: ConceptSlide[];
};

const D = "/projects/seesaw/concept";

export const SEESAW_CONCEPT: ConceptData = {
  label: "CONCEPT",
  left: [
    {
      type: "image",
      src: `${D}/01-workshop.JPG`,
      alt: "The seesaw bench in the workshop, lit by a single lamp",
      position: "50% 60%",
      caption: {
        width: 449,
        paragraphs: [
          ["The seesaw bench takes shape **in between.**"],
          [
            "It is neither a playground object nor a",
            "conventional bench, but a form that",
            "**carries a little of both.**",
          ],
        ],
      },
    },
    {
      type: "image",
      src: `${D}/02-night-sitting.jpg`,
      alt: "Two friends sitting on the bench at night among banana trees",
      position: "50% 70%",
      caption: {
        width: 502,
        paragraphs: [
          [
            "As adults, we often want to **return to** childhood.",
            "As children, we are eager to **step into** adulthood.",
          ],
        ],
      },
    },
    {
      type: "image",
      src: `${D}/03-night-motion.jpg`,
      alt: "The same two friends caught mid-motion as the bench tips",
      position: "50% 70%",
      caption: {
        width: 449,
        paragraphs: [["**This contradiction is deliberately built**", "**into the furniture.**"]],
      },
    },
    {
      type: "image",
      src: `${D}/04-night-bench.jpg`,
      alt: "The empty bench glowing in the dark",
      position: "50% 50%",
      caption: {
        width: 491,
        paragraphs: [
          [
            "The bench appears stable at first, yet it is **never**",
            "**completely still.** Balance is **found,** then",
            "**released.**",
          ],
          [
            "That momentary balance is central to the",
            "piece. Not play, and not rest, but a state in",
            "between that asks for awareness.",
          ],
          ["You are not simply sitting on the furniture.", "**You are experiencing it.**"],
        ],
      },
    },
  ],
  right: [
    {
      type: "image",
      src: `${D}/05-sunlit-closeup.jpg`,
      alt: "Close-up of the pine seat in dappled sunlight",
      position: "50% 50%",
      caption: {
        width: 234,
        paragraphs: [["Unlike most furniture,", "It **responds to you.**"]],
      },
    },
    {
      type: "image",
      src: `${D}/06-split-colour-mono.jpg`,
      alt: "The bench shown half in colour and half in black and white",
      position: "50% 50%",
      caption: {
        width: 476,
        paragraphs: [
          [
            "Borrowing **movement** from a seesaw. it is",
            "**less static** than the furniture we are **used to**",
            "**living with.**",
          ],
        ],
      },
    },
    {
      type: "image",
      src: `${D}/07-two-people-day.jpg`,
      alt: "Two people talking while sitting on opposite ends of the bench",
      position: "50% 50%",
      caption: {
        width: 425,
        paragraphs: [
          [
            "**when you sit, your weight shifts the**",
            "**balance, and your body instinctively**",
            "**responds.**",
          ],
        ],
      },
    },
    {
      type: "image",
      src: `${D}/08-garden.jpg`,
      alt: "The bench resting on the lawn in afternoon light",
      position: "50% 60%",
      caption: {
        width: 425,
        paragraphs: [["And for a moment it feels **familiar,** like", "the **playground again.**"]],
      },
    },
    {
      type: "video",
      src: `${D}/09-rocking.mp4`,
      poster: `${D}/09-rocking-poster.jpg`,
      alt: "The bench rocking on the terrace",
      position: "50% 50%",
    },
  ],
};