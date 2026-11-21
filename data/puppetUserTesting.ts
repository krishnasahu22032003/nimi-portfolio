/* -------------------------------------------------------------------------
 * data/puppetUserTesting.ts  (or src/data/puppetUserTesting.ts)
 * Project eight (Puppet theatre) — page 109: USER TESTING
 *
 * 13 numbers (01–13) = the 13 rows of her Canva table (rows 2–14; row 1 is the header).
 * Hover / click a number → the video on the left and the three texts on the right change.
 * The headings (OBSERVATION · INSIGHT · DESIGN DIRECTION) never move.
 *
 * VIDEOS (8 files). `video` below is the index in this list (0 = first):
 *   0 → 1.mp4      used by 01
 *   1 → 2-1.mp4    used by 02
 *   2 → 2-2.mp4    used by 03
 *   3 → 4.mp4      used by 04
 *   4 → 5.mp4      used by 05
 *   5 → 6.mp4      used by 06
 *   6 → 7.mp4      used by 07
 *   7 → 8-13.mp4   used by 08 – 13  (one shared video; it keeps playing while you move between them)
 * ---------------------------------------------------------------------- */

export type UserTestingVideo = {
  src: string;
  label: string; // accessible description (silent, no controls)
  position?: string; // CSS object-position, default "50% 50%"
};

export type UserTestingItem = {
  video: number; // index into `videos`
  observation: string;
  insight: string;
  direction: string;
};

export type UserTestingData = {
  title: string;
  videos: UserTestingVideo[];
  items: UserTestingItem[];
};

const BASE = "/projects/puppet-theatre/user-testing";

export const PUPPET_USER_TESTING: UserTestingData = {
  title: "User testing",
  videos: [
    { src: `${BASE}/1.mp4`, label: "A child welcomes the theatre falling and says it can be rebuilt" },
    { src: `${BASE}/2-1.mp4`, label: "Children assembling and disassembling the theatre" },
    { src: `${BASE}/2-2.mp4`, label: "Children approaching the theatre and engaging immediately" },
    { src: `${BASE}/4.mp4`, label: "Children choosing and customising characters" },
    { src: `${BASE}/5.mp4`, label: "Children grouping characters and creating stories" },
    { src: `${BASE}/6.mp4`, label: "Children mixing unrelated puppet elements" },
    { src: `${BASE}/7.mp4`, label: "Children hanging elements on the protruding joints", position: "50% 40%" },
    { src: `${BASE}/8-13.mp4`, label: "Children playing together with the puppet theatre" },
  ],
  items: [
    {
      video: 0, // 01
      observation: "A child welcomed the theatre falling, saying, “It’s okay, you can rebuild it.”",
      insight: "Building and rebuilding are enjoyed as part of the play itself.",
      /* TODO: this cell is EMPTY in her Canva table (row 2). This is a placeholder — ask her for the real line. */
      direction: "Design for rebuildable, resilient play.",
    },
    {
      video: 1, // 02
      observation: "Actively helped assemble & disassemble the theatre.",
      insight: "Building creates participation and ownership.",
      direction: "Make theatre flat-pack & buildable.",
    },
    {
      video: 2, // 03
      observation: "Children approached and engaged immediately.",
      insight: "Kids are naturally curious and exploratory.",
      direction: "Design for self-initiated play.",
    },
    {
      video: 3, // 04
      observation: "Preferred choosing and customizing.",
      insight: "Choice increases involvement.",
      direction: "Enable customization of characters.",
    },
    {
      video: 4, // 05
      observation: "Grouped characters and created stories.",
      insight: "Kids naturally construct narratives.",
      direction: "Support free storytelling systems.",
    },
    {
      video: 5, // 06
      observation: "Mixed unrelated elements freely.",
      insight: "Kids enjoy combining and experimenting.",
      direction: "Create modular, mix-and-match puppets.",
    },
    {
      video: 6, // 07
      observation: "Children used the protruding joints to attach and hang different elements.",
      insight: "Product features can be used in unexpected ways.",
      direction: "Encourage open-ended interaction.",
    },
    {
      video: 7, // 08
      observation: "Reacted to unexpected elements appearing.",
      insight: "Surprise creates curiosity and keeps the interaction engaging.",
      direction: "Introduce reveal and surprise elements.",
    },
    {
      video: 7, // 09
      observation: "Made sounds and voices while playing.",
      insight: "Play becomes expressive and performative.",
      direction: "Design for performative interaction.",
    },
    {
      video: 7, // 10
      observation: "Used puppets from all directions.",
      insight: "Interaction is not limited to one viewpoint.",
      direction: "Enable multi-directional play.",
    },
    {
      video: 7, // 11
      observation: "Played together in groups.",
      insight: "Play is social and collaborative.",
      direction: "Design for multi-user interaction.",
    },
    {
      video: 7, // 12
      observation: "Highly energetic, shifting attention.",
      insight: "Children move quickly between activities.",
      direction: "Design for quick, dynamic interactions.",
    },
    {
      video: 7, // 13
      observation: "Asked “what is this?” frequently.",
      insight: "Unclear forms can cause confusion.",
      direction: "Use clear, readable silhouettes.",
    },
  ],
};