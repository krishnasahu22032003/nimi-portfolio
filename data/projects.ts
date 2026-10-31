/* -------------------------------------------------------------------------
 * data/projects.ts        (or src/data/projects.ts if you use a src folder)
 *
 * One entry per project (key = slug, must match the slug in the slider).
 * Hero media: EITHER `video` (project one) OR `image` (project two, three).
 * Optional `story`            → page 2 heading + paragraphs (project one).
 * Optional `statement`        → page 2 centred uppercase statement (project three).
 * Optional `colourStory`      → page 2 as colour-changing tiles + text (project two, data/colourStory.ts).
 * Optional `collage`          → page 3 collage (project two, data/collage.ts).
 * Optional `knotStory`        → page 4 knot photo + two paragraphs (project two, data/knotStory.ts).
 * Optional `behindScene`      → page 5 video + caption + text + sketch (project two, data/behindScene.ts).
 * Optional `joinery`          → page 6 three detail photos + three notes (project two, data/joinery.ts).
 * Optional `concept` · `formExploration` · `fabrication` · `ending` → the later sections.
 *   project two's `ending` (data/endingChair.ts) is the closing clip, right after the joinery page.
 *
 * Project three (Echo Pan) currently has pages 1–2 — add its sections here when her next pages are ready.
 *
 * LINE BREAKS ARE DATA. On desktop (≥1280px) every string below is rendered as ONE line,
 * exactly as she broke it in Canva. Below 1280px the lines reflow.
 * ---------------------------------------------------------------------- */
import type { ConceptData } from "./concept";
import { SEESAW_CONCEPT } from "./concept";
import type { FormExplorationData } from "./formExploration";
import { SEESAW_FORM_EXPLORATION } from "./formExploration";
import type { FabricationData } from "./fabrication";
import { SEESAW_FABRICATION } from "./fabrication";
import type { EndingData } from "./ending";
import { SEESAW_ENDING } from "./ending";
import type { ColourStoryData } from "./Colourstory ";
import { CHAIR_COLOUR_STORY } from "./Colourstory ";
import type { CollageData } from "./Collage ";
import { CHAIR_COLLAGE } from "./Collage ";
import type { KnotStoryData } from "./knotStory";
import { CHAIR_KNOT_STORY } from "./knotStory";
import type { BehindSceneData } from "./behindScene";
import { CHAIR_BEHIND_SCENE } from "./behindScene";
import type { JoineryData } from "./joinery";
import { CHAIR_JOINERY } from "./joinery";
import { CHAIR_ENDING } from "./Endingchair";
import { StatementData } from "../components/Projectstatement";

export type ProjectDetailData = {
  slug: string;
  title: string; // 18 · Medium · #000
  tagline: string; // 18 · Medium · #000
  tags: string; // 14 · Regular · #404040
  meta?: string; // 14 · Regular · #404040
  note?: string[]; // 14 · Regular · #404040 — one string per line
  /** hero VIDEO (project one) */
  video?: {
    mp4: string;
    webm?: string;
    label: string; // accessible description (silent, no controls)
    /** which part of the clip stays visible when it is cropped into the portrait frame */
    position?: string; // CSS object-position, default "50% 50%"
  };
  /** hero PHOTO (project two, three). Same frame, same beige panel, same reveal as the video. */
  image?: {
    src: string;
    alt: string;
    position?: string; // CSS object-position, default "50% 50%"
    sizes?: string; // next/image `sizes`; override when a wide photo is cropped into the portrait frame
  };
  story?: {
    heading: string[]; // 16 · Medium · #000 — one string per line
    paragraphs: string[][]; // 14 · Regular · #000 — one string per line
  };
  /** a single centred uppercase statement page (project three, page 2) */
  statement?: StatementData; // NEW
  /** tiles that change colour one after another + text */
  colourStory?: ColourStoryData;
  /** collage page: chair cutouts, sketch, statement text (data/collage.ts) */
  collage?: CollageData;
  /** knot page: full-bleed photo + two paragraphs (data/knotStory.ts) */
  knotStory?: KnotStoryData;
  /** "Behind the scene" page: video + caption + text + sketch (data/behindScene.ts) */
  behindScene?: BehindSceneData;
  /** details page: three photos on beige / white / cream bands + three numbered notes (data/joinery.ts) */
  joinery?: JoineryData;
  /** optional CONCEPT section (pinned image sequence) */
  concept?: ConceptData;
  /** optional FORM EXPLORATION section (pinned sketch gallery) */
  formExploration?: FormExplorationData;
  /** optional FABRICATION section (clickable timeline) */
  fabrication?: FabricationData;
  /** optional ENDING: the closing clip, centred, after the last section */
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
    ending: SEESAW_ENDING,
  },

  /* ============================ project two ============================ */
  two: {
    slug: "two",
    title: "Beso. “to sit”",
    tagline: "Chandigarh Chair",
    tags: "Skill-based project · Furniture making",
    /* page 1 on her Canva has only these three lines → no `meta`, no `note` */
    image: {
      src: "/projects/chandigarh/hero.jpg", // 2000 × 2455 px
      alt: "A woman sitting in the Chandigarh chair against a warm grey backdrop",
      position: "50% 50%",
    },
    colourStory: CHAIR_COLOUR_STORY,
    collage: CHAIR_COLLAGE,
    knotStory: CHAIR_KNOT_STORY,
    behindScene: CHAIR_BEHIND_SCENE,
    joinery: CHAIR_JOINERY, // page 6
    ending: CHAIR_ENDING, // the closing clip, right after the joinery page
    /* concept / formExploration / fabrication → not used for this project */
  },

  /* ============================ project three ============================ */
  three: {
    slug: "three",
    title: "Echo Pan",
    tagline: "A handcrafted hybrid flute",
    tags: "Instrument Design · Sound Exploration · Material Studies",
    /* page 1 has only these three lines → no `meta`, no `note` */
    image: {
      src: "/projects/echo-pan/hero.jpg", // 2576 × 1375 px landscape render
      alt: "Echo Pan: a black flute joined to a row of five walnut and curly maple pan pipes on a soft peach backdrop",
      /* The render is landscape but the frame is portrait (0.8146), so cover-cropping shows only ~43.5% of
         the width. 63% slides the crop to the right: the flute enters from the left edge and the pipes
         finish just before the right edge, as in her layout. Nudge ±2% to fine-tune. */
      position: "63% 50%",
      /* the image is drawn ~1.15× the viewport wide inside the frame, so next/image must pick a big source */
      sizes: "(max-width: 820px) 230vw, 115vw",
    },
    /* page 2 — centred uppercase statement (components/ProjectStatement.tsx) */
    statement: { text: "Can two instruments become one?" }, // NEW
    /* no colourStory / collage / etc. yet → add sections here when her next pages are ready */
  },
};

export const PROJECT_SLUGS: string[] = Object.keys(PROJECT_DETAILS);