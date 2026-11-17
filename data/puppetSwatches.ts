/* -------------------------------------------------------------------------
 * data/puppetSwatches.ts  (or src/data/puppetSwatches.ts)
 * Project eight (Puppet theatre): HDPE SWATCHES page
 *
 * raw     = the shredded plastic (her labels 1-9, shown at the start)
 * pressed = the heat-pressed result (her labels 11-99, shown after a click)
 * Order = reading order, left to right, top to bottom.
 * Images live in  public/projects/puppet-theatre/swatches/
 * Export every image at the same ratio, 304 : 183 (e.g. 1216 × 732 px).
 * ---------------------------------------------------------------------- */

export type SwatchItem = { raw: string; pressed: string; alt: string };
export type SwatchesData = { background: string; items: SwatchItem[] };

const D = "/projects/puppet-theatre/swatches";

export const PUPPET_SWATCHES: SwatchesData = {
  background: "#233239",
  items: [
    { raw: `${D}/1.jpg`, pressed: `${D}/11.jpg`, alt: "orange and blue" },
    { raw: `${D}/2.jpg`, pressed: `${D}/22.jpg`, alt: "green and cream waves" },
    { raw: `${D}/3.jpg`, pressed: `${D}/33.jpg`, alt: "rainbow bands around a pink and teal capsule" },
    { raw: `${D}/4.jpg`, pressed: `${D}/44.jpg`, alt: "cream with red, green and blue blotches" },
    { raw: `${D}/5.jpg`, pressed: `${D}/55.jpg`, alt: "dark grey with white flecks" },
    { raw: `${D}/6.jpg`, pressed: `${D}/66.jpg`, alt: "yellow with brown and gold chips" },
    { raw: `${D}/7.jpg`, pressed: `${D}/77.jpg`, alt: "white and pale grey" },
    { raw: `${D}/8.jpg`, pressed: `${D}/88.jpg`, alt: "pink, red and white stripes" },
    { raw: `${D}/9.jpg`, pressed: `${D}/99.jpg`, alt: "white with brown and grey speckles" },
  ],
};