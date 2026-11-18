/* -------------------------------------------------------------------------
 * data/puppetResearch.ts  (or src/data/puppetResearch.ts)
 * Project eight (Puppet theatre): "3. Primary research" page (last section)
 *
 * LINE BREAKS ARE DATA: every string is one line, as she broke it in Canva.
 * Images live in  public/projects/puppet-theatre/research/
 * The photos have no captions (the "REFERENCE TEXT" labels on Canva were only notes).
 * ---------------------------------------------------------------------- */

export type ResearchSlide = { src: string; alt: string; position?: string };

export type ResearchData = {
  heading: string; // "Primary research" (the "3." is added by the component)
  where: { title: string; lines: string[] };
  gap: { title: string; bullets: string[][] }; // one bullet = its lines
  top: ResearchSlide[];
  bottom: ResearchSlide[];
  intervalMs?: number; // default 5000
};

const D = "/projects/puppet-theatre/research";

export const PUPPET_RESEARCH: ResearchData = {
  heading: "Primary research",
  where: {
    title: "WHERE I WENT",
    lines: [
      "7 schools · Kathmandu + Lalitpur",
      "Government · Private · kindergarten / play-based",
      "",
      "Xavier International School ·  Learning Tree Montessori · Vidya",
      "Vikash Boarding High School · Euro Star · Mahendra Bouddha",
      "Higher Secondary School · Mountain Kidz School Kidzee",
    ],
  },
  gap: {
    title: "THE GAP",
    bullets: [
      ["Storytelling was already part of the classroom, but was", "largely teacher-led and centred around books."],
      ["Children responded to imagination, pretend play and", "interaction, but had few physical tools to support them."],
      ["Play held attention longer when children could touch,", "arrange and participate rather than simply listen."],
      ["This pointed to an opportunity to make storytelling", "something children could build, manipulate and perform."],
    ],
  },
  intervalMs: 5000,
  top: [
    {
      src: `${D}/1_TOP.jpg`,
      alt: "A play corner with a blue bear-shaped play fence, alphabet floor mats, a low red table with wooden puzzles and red cushions",
      position: "50% 50%",
    },
    {
      src: `${D}/2_TOP.jpg`,
      alt: "Tall wooden shelves filled with toys, puzzles and baskets, with soft toys on top and two child-sized tables in front",
      position: "50% 50%",
    },
    {
      src: `${D}/3_TOP.jpg`,
      alt: "A classroom with orange child-sized desks and chairs on a blue carpet, a rug and a jungle-painted window",
      position: "50% 50%",
    },
    {
      src: `${D}/4_TOP.jpg`,
      alt: "A bright classroom with a red rug, blue carpet and walls covered with alphabet, animal and word displays",
      position: "50% 50%",
    },
  ],
  bottom: [
    {
      src: `${D}/1_BOTTOM.jpg`,
      alt: "The designer smiling and holding up a tablet to show a concept to children in red woollen hats",
      position: "50% 40%",
    },
    {
      src: `${D}/2_BOTTOM.jpg`,
      alt: "A teacher stands beside rows of young children in red hats at orange desks in a green classroom",
      position: "50% 50%",
    },
    {
      src: `${D}/3_BOTTOM.jpg`,
      alt: "Children in red uniforms playing with number and letter puzzles at a blue table beside colourful shelves",
      position: "50% 50%",
    },
    {
      src: `${D}/4_BOTTOM.jpg`,
      alt: "Small children seated on bright plastic chairs around tables while a carer sits with them",
      position: "50% 55%",
    },
  ],
};