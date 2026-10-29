/* -------------------------------------------------------------------------
 * data/projects.ts        (or src/data/projects.ts if you use a src folder)
 *
 * One entry per project (key = slug, must match the slug in the slider).
 * Hero media: EITHER `video` (project one) OR `image` (project two).
 * Optional `story`            → page 2 heading + paragraphs (project one).
 * Optional `colourStory`      → page 2 as colour-changing tiles + text (project two, data/colourStory.ts).
 * Optional `collage`          → page 3 collage (project two, data/collage.ts).
 * Optional `knotStory`        → page 4 knot photo + two paragraphs (project two, data/knotStory.ts).
 * Optional `behindScene`      → page 5 video + caption + text + sketch (project two, data/behindScene.ts).
 * NEW optional `joinery`      → page 6 three detail photos + three notes (project two, data/joinery.ts).
 * Optional `concept` · `formExploration` · `fabrication` · `ending` → the later sections.
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
import { ColourStoryData } from "./Colourstory ";
import { CHAIR_COLOUR_STORY } from "./Colourstory ";
import { CollageData } from "./Collage ";
import { CHAIR_COLLAGE } from "./Collage ";
import type { KnotStoryData } from "./knotStory";
import { CHAIR_KNOT_STORY } from "./knotStory";
import type { BehindSceneData } from "./behindScene";
import { CHAIR_BEHIND_SCENE } from "./behindScene";
import type { JoineryData } from "./joinery"; // NEW
import { CHAIR_JOINERY } from "./joinery"; // NEW

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
  /** hero PHOTO (project two). Same frame, same beige panel, same reveal as the video. */
  image?: {
    src: string;
    alt: string;
    position?: string; // CSS object-position, default "50% 50%"
  };
  story?: {
    heading: string[]; // 16 · Medium · #000 — one string per line
    paragraphs: string[][]; // 14 · Regular · #000 — one string per line
  };
  /** tiles that change colour one after another + text */
  colourStory?: ColourStoryData;
  /** collage page: chair cutouts, sketch, statement text (data/collage.ts) */
  collage?: CollageData;
  /** knot page: full-bleed photo + two paragraphs (data/knotStory.ts) */
  knotStory?: KnotStoryData;
  /** "Behind the scene" page: video + caption + text + sketch (data/behindScene.ts) */
  behindScene?: BehindSceneData;
  /** NEW — details page: three photos on beige / white / cream bands + three numbered notes (data/joinery.ts) */
  joinery?: JoineryData;
  /** optional CONCEPT section (pinned image sequence) */
  concept?: ConceptData;
  /** optional FORM EXPLORATION section (pinned sketch gallery) */
  formExploration?: FormExplorationData;
  /** optional FABRICATION section (clickable timeline) */
  fabrication?: FabricationData;
  /** optional ENDING: the closing landscape clip, centred, after fabrication */
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
      src: "/projects/chandigarh/hero.jpg", // 2000 × 2455 px (see notes)
      alt: "A woman sitting in the Chandigarh chair against a warm grey backdrop",
      position: "50% 50%",
    },
    colourStory: CHAIR_COLOUR_STORY,
    collage: CHAIR_COLLAGE,
    knotStory: CHAIR_KNOT_STORY,
    behindScene: CHAIR_BEHIND_SCENE,
    joinery: CHAIR_JOINERY, // NEW — page 6
    /* concept / formExploration / fabrication / ending → add later, same way as project one */
  },
};

export const PROJECT_SLUGS: string[] = Object.keys(PROJECT_DETAILS);