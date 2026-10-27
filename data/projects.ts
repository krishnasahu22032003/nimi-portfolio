/* -------------------------------------------------------------------------
 * data/projects.ts        (or src/data/projects.ts if you use a src folder)
 *
 * One entry per project (key = slug, must match the slug in the slider).
 * Optional `concept`          → the CONCEPT section           (content lives in data/concept.ts).
 * Optional `formExploration`  → the FORM EXPLORATION section  (content lives in data/formExploration.ts).
 * Optional `fabrication`      → the FABRICATION section       (content lives in data/fabrication.ts).
 * NEW: optional `ending`      → the closing landscape clip    (content lives in data/ending.ts).
 *
 * LINE BREAKS ARE DATA. On desktop (≥1280px) every string below is rendered as ONE line,
 * exactly as she broke it in Canva. Below 1280px the lines simply reflow.
 * ---------------------------------------------------------------------- */
import type { ConceptData } from "./concept";
import { SEESAW_CONCEPT } from "./concept";
import type { FormExplorationData } from "./formExploration";
import { SEESAW_FORM_EXPLORATION } from "./formExploration";
import type { FabricationData } from "./fabrication";
import { SEESAW_FABRICATION } from "./fabrication";
import type { EndingData } from "./ending"; // NEW
import { SEESAW_ENDING } from "./ending"; // NEW

export type ProjectDetailData = {
  slug: string;
  title: string; // 18 · Medium · #000
  tagline: string; // 18 · Medium · #000
  tags: string; // 14 · Regular · #404040
  meta: string; // 14 · Regular · #404040
  note: string[]; // 14 · Regular · #404040 — one string per line
  video: {
    mp4: string;
    webm?: string;
    label: string; // accessible description (silent, no controls)
    /** which part of the clip stays visible when it is cropped into the portrait frame */
    position?: string; // CSS object-position, default "50% 50%"
  };
  story: {
    heading: string[]; // 16 · Medium · #000 — one string per line
    paragraphs: string[][]; // 14 · Regular · #000 — one string per line
  };
  /** optional CONCEPT section (pinned image sequence) */
  concept?: ConceptData;
  /** optional FORM EXPLORATION section (pinned sketch gallery) */
  formExploration?: FormExplorationData;
  /** optional FABRICATION section (clickable timeline) */
  fabrication?: FabricationData;
  /** NEW — optional ENDING: the closing landscape clip, centred, after fabrication */
  ending?: EndingData;
};

export const PROJECT_DETAILS: Record<string, ProjectDetailData> = {
  one: {
    slug: "one",
    title: "Seesaw",
    tagline: "A bench in-between.",
    tags: "Playful · Interactive · Experience-led",
    meta: "Pre-Thesis Project · 2025–26",
    note: [
      "Exhibited at Venkataappa Art Gallery, Bengaluru · inviting visitors",
      "to sit, interact and experience the piece.",
    ],
    video: {
      mp4: "/projects/seesaw/seesaw.mp4",
      webm: undefined, // optional: "/projects/seesaw/seesaw.webm"
      label: "Children and visitors sitting and rocking on the Seesaw bench at the exhibition",
      position: "50% 50%",
    },
    story: {
      heading: ["What happens when a playground memory becomes", "furniture?"],
      paragraphs: [
        [
          "My process positions itself between logic and spontaneity:",
          "using tools to create stories, processes to create objects, and",
          "techniques to create experiences.",
        ],
        [
          "With Seesaw, I was interested in what happens when a familiar",
          "childhood experience is taken out of its original context and given a",
          "new purpose. Rather than simply designing a bench, I wanted to",
          "explore how an object could influence the way we sit, move and",
          "interact with it.",
        ],
        [
          "I took on the challenge of engineering a familiar surprise to create",
          "something that feels recognisable at first, yet unexpected through use.",
        ],
      ],
    },
    concept: SEESAW_CONCEPT,
    formExploration: SEESAW_FORM_EXPLORATION,
    fabrication: SEESAW_FABRICATION,
    ending: SEESAW_ENDING, // NEW
  },
};

export const PROJECT_SLUGS: string[] = Object.keys(PROJECT_DETAILS);