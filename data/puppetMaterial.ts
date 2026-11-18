/* -------------------------------------------------------------------------
 * data/puppetMaterial.ts  (or src/data/puppetMaterial.ts)
 * Project eight (Puppet theatre): WHAT THE MATERIAL TAUGHT ME
 *
 * LINE BREAKS ARE DATA (desktop ≥1240px): every string is exactly one line, as she broke it.
 * strong: true → the bullet is semibold (her first bullet).
 * Images live in  public/projects/puppet-theatre/material/
 * ---------------------------------------------------------------------- */

export type MaterialBullet = { lines: string[]; strong?: boolean };
export type MaterialSlide = { src: string; alt: string; position?: string }; // position = CSS object-position

export type MaterialData = {
  label: string;
  bullets: MaterialBullet[];
  slides: MaterialSlide[];
  intervalMs?: number; // default 3000 (faster than the 5000 used on the earlier pages)
};

const D = "/projects/puppet-theatre/material";

export const PUPPET_MATERIAL: MaterialData = {
  label: "What the material taught me",
  intervalMs: 3000,
  bullets: [
    {
      strong: true,
      lines: [
        "Its colour makes it playful by nature, opening",
        "up possibilities for visually engaging",
        "products for children.",
      ],
    },
    {
      lines: [
        "The final surface responds to chip size, colour",
        "mix, heat and compression, giving each panel",
        "its own character.",
      ],
    },
    {
      lines: [
        "Shredded plastic can be arranged before",
        "pressing to create different patterns and",
        "compositions.",
      ],
    },
    {
      lines: [
        "Precise mixing ratios allow colour and",
        "composition to be controlled while retaining",
        "the material’s natural variation.",
      ],
    },
  ],
  slides: [
    {
      src: `${D}/01-collage.jpg`,
      alt: "A collage of the lab process: white HDPE bottles on a scale, buckets of colourful shredded plastic, mixing bowls and the blue heat press",
      position: "50% 50%",
    },
    {
      src: `${D}/02-pellets.jpg`,
      alt: "Nimi smiling as she lays white pellets into a green wave pattern, with loose shredded plastic beside it",
      position: "50% 60%",
    },
    {
      src: `${D}/03-smoothing.jpg`,
      alt: "Nimi levels a bed of white shredded plastic with a small red board before it goes into the press",
      position: "50% 75%",
    },
    {
      src: `${D}/04-panel.jpg`,
      alt: "Two people hold up a finished heat-pressed panel of bright orange, pink, yellow and red patterns",
      position: "50% 40%",
    },
  ],
};