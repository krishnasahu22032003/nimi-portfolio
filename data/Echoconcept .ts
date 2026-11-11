/* -------------------------------------------------------------------------
 * data/echoConcept.ts        (or src/data/echoConcept.ts)
 *
 * Page 3 of project three (Echo Pan) — "CONCEPT".
 *
 * Images in  public/projects/echo-pan/ :
 *   what_happens.png     → concept-what-happens.png      (the question mark)
 *   to_observe.png       → concept-to-observe.png        (the eye)
 *   Puppet_theatre_6.png → concept-pan-plus-bansuri.png  (pan flute + bansuri sketch)
 *   sketch_.png          → concept-hybrid-sketch.png     (the Echo Pan sketch)
 *
 * LINE BREAKS ARE DATA: every string in `lines` is rendered as ONE line, exactly as she broke it.
 * Wrap text in **double asterisks** for semibold (one pair per line).
 * ---------------------------------------------------------------------- */

export type EchoConceptItem = {
  icon: string; // black PNG, drawn at 23% opacity
  label: string[]; // words laid over the icon — one string per line
  lines: string[]; // paragraph, one string per line, **bold** allowed
};

export type EchoConceptData = {
  heading: string;
  items: [EchoConceptItem, EchoConceptItem]; // [What happens (?), To observe (eye)]
  pair: { src: string; alt: string; captions: [string, string] };
  hybrid: { src: string; alt: string };
};

export const ECHO_PAN_CONCEPT: EchoConceptData = {
  heading: "CONCEPT",
  items: [
    {
      icon: "/projects/echo-pan/concept-what-happens.png",
      label: ["What", "happens"],
      lines: [
        "The pan flute and bansuri each have their own way of",
        "producing sound. By bringing them together in one",
        "instrument, Echo Pan **allows the player to move**",
        "**between the two and combine** their sounds, creating",
        "different possibilities for rhythm and melody.",
      ],
    },
    {
      icon: "/projects/echo-pan/concept-to-observe.png",
      label: ["To", "observe"],
      lines: [
        "How materials like wood and metal relate to the sound",
        "and pitch of the instrument, and how material choices",
        "can inform its construction.",
      ],
    },
  ],
  pair: {
    src: "/projects/echo-pan/concept-pan-plus-bansuri.png",
    alt: "Pencil sketch of a pan flute, a plus sign and a bansuri",
    /* her note: delete the pink words → the second caption is just "Bansuri (Indian Flute)" */
    captions: ["Pan Flute", "Bansuri (Indian Flute)"],
  },
  hybrid: {
    src: "/projects/echo-pan/concept-hybrid-sketch.png",
    alt: "Pencil sketch of Echo Pan: a flute with a row of five pan pipes joined to one end",
  },
};