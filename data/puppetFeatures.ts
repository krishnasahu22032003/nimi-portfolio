/* -------------------------------------------------------------------------
 * data/puppetFeatures.ts  (or src/data/puppetFeatures.ts)
 * Project eight (Puppet theatre) — page 3: KEY FEATURES
 * Eleven features, numbered 01–11 automatically in the order below.
 *
 * The existing photos stay in their ORIGINAL order and keep their ORIGINAL
 * file names (so some names no longer describe the photo — ignore the names,
 * the captions are what matter). Only the captions were changed, and the one
 * new photo (11-nested-sheets.jpg) was inserted as card 6.
 *
 * pos (optional) = CSS object-position for the crop inside the 630 × 432 frame.
 * Images live in  public/projects/puppet-theatre/features/
 * ---------------------------------------------------------------------- */

export type FeatureItem = { src: string; alt: string; caption: string; pos?: string };
export type FeaturesData = { title: string; items: FeatureItem[] };

const D = "/projects/puppet-theatre/features";

export const PUPPET_FEATURES: FeaturesData = {
  title: "Key features",
  items: [
    {
      src: `${D}/01-flat-pack.jpg`,
      alt: "The theatre's green panels and its wavy base laid flat and stacked",
      caption: "Compact Flat-Pack Design.",
      pos: "50% 50%",
    },
    {
      src: `${D}/02-interlocking.jpg`,
      alt: "Two hands slide the slotted roof panel onto the theatre's interlocking tabs",
      caption: "Simple interlocking makes assembly and dismantling quick & effortless.",
      pos: "50% 70%",
    },
    {
      src: `${D}/03-joinery-holes.jpg`,
      alt: "Two green panels being aligned, with carved arrows on the edge of one of them",
      caption: "Directional arrows guide children in aligning & locking the panels together.",
      pos: "50% 50%",
    },
    {
      src: `${D}/04-knobs.jpg`,
      alt: "Grooved podiums resting on the wavy green base of the theatre",
      caption: "Window cut-outs are repurposed as grooved podiums for displaying characters.",
      pos: "50% 30%",
    },
    {
      src: `${D}/05-arrows.jpg`,
      alt: "A person carrying the theatre by its integrated grips, with the base on the floor in front",
      caption: "Easy to pick up and carry.",
      pos: "50% 50%",
    },
    {
      /* NEW photo — Canva page 94 / 11.jpg, uploaded as 11-nested-sheets.jpg */
      src: `${D}/11-nested-sheets.jpg`,
      alt: "Two 3 × 3 ft green sheets with the theatre's components cut out and nested closely together",
      caption: "Nested within two 3 × 3 ft sheets to minimise material waste.",
      pos: "50% 50%",
    },
    {
      src: `${D}/06-podiums.jpg`,
      alt: "A hand twisting the bottom panel out of the theatre's side panels",
      caption: "A twist-off bottom panel allows the base to be easily removed and replaced with an alternative platform.",
      pos: "50% 50%",
    },
    {
      src: `${D}/07-grip.jpg`,
      alt: "Two pairs of hands move stick puppets through the slots of the top panel",
      caption: "Slots in the top panel allow stick puppets to move across the stage.",
      pos: "50% 45%",
    },
    {
      src: `${D}/08-twist-off.jpg`,
      alt: "Six felt finger puppets sitting in the hidden compartment below the stage opening",
      caption: "Hidden compartments provide a surprise storage space for finger puppets.",
      pos: "50% 50%",
    },
    {
      src: `${D}/09-slots.jpg`,
      alt: "A theatre corner with pipe cleaners and a cut-out monkey attached through the joinery holes",
      caption: "Joinery holes allow children to attach additional elements and customise their theatre.",
      pos: "50% 50%",
    },
    {
      src: `${D}/10-hidden-compartments.jpg`,
      alt: "A wooden knob on the top panel above a stick puppet of a sun and storm cloud",
      caption: "Spherical knobs hold stick puppets in place or allow them to slide along the frame.",
      pos: "50% 50%",
    },
  ],
};