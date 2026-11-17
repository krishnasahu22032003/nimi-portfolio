/* -------------------------------------------------------------------------
 * data/puppetOpportunity.ts  (or src/data/puppetOpportunity.ts)
 * Project eight (Puppet theatre): OPPORTUNITY page
 *
 * Positions are in Canva artboard px (1440 × 900).
 *   step.x = left edge of that caption on her Canva page (the page-level x, not relative to the diagram)
 * LINE BREAKS ARE DATA: every string is one line, as she broke it.
 * Images live in  public/projects/puppet-theatre/opportunity/
 * ---------------------------------------------------------------------- */

export type OpportunityStep = { x: number; lines: string[] };
export type OpportunitySlide = { src: string; alt: string; caption: string[]; position?: string };

export type OpportunityData = {
  label: string;
  intro: string;
  flow: {
    title: string;
    image: { src: string; alt: string; width: number; height: number }; // natural pixel size of your export
    steps: OpportunityStep[];
  };
  slides: OpportunitySlide[];
  intervalMs?: number; // default 5000
  swatches: {
    title: string;
    paragraph: string[];
    hint: string;
  };
};

const D = "/projects/puppet-theatre/opportunity";

export const PUPPET_OPPORTUNITY: OpportunityData = {
  label: "Opportunity",
  intro: "The project began in Nepal, working with Moware.",
  flow: {
    title: "Waste Landscape in Nepal",
    image: {
      src: `${D}/waste-landscape.jpg`,
      alt: "A hand-drawn pipe diagram in six colours showing plastic waste moving through six stages, numbered 1 to 6",
      width: 1560, // ← your export's real width in px
      height: 520, // ← your export's real height in px
    },
    steps: [
      { x: 90, lines: ["Plastic waste", "arrives"] },
      { x: 210, lines: ["Waste is mixed", "& contaminated."] },
      { x: 353, lines: ["Workers segregate", "materials"] },
      { x: 500, lines: ["Large volumes", "remain underutilised"] },
      { x: 656, lines: ["Limited integration into", "value added systems"] },
      { x: 831, lines: ["Plastic treated as", "waste"] },
    ],
  },
  intervalMs: 5000,
  slides: [
    {
      src: `${D}/02-bw2v-board.jpg`,
      alt: "Information board at the BW2V compost production and processing centre showing how waste is segregated and processed",
      caption: ["Workers sorting mixed waste, both organic and dry waste by hand"],
      position: "50% 50%",
    },
    {
      src: `${D}/01-segregation.jpg`,
      alt: "Three workers in uniforms sorting a large pile of mixed waste beside a yellow truck inside a warehouse",
      caption: ["Waste segregation and processing system at BW2V facility, Kathmandu"], // placeholder: confirm with client
      position: "50% 62%",
    },
  ],
  swatches: {
    title: "HDPE panel swatches made at Moware lab.",
    paragraph: [
      "I experimented with different combinations of shredded plastic, exploring how colour and pattern could change when heat",
      "pressed into a panel.",
    ],
    hint: "Click each sample to see the heat-pressed result",
  },
};