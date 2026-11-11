
/* -------------------------------------------------------------------------
 * data/materialExploration.ts
 *
 * Page 6 — Echo Pan — Material Exploration
 *
 * Hover a material tile (1–6) → the left side switches to that material.
 *
 * IMAGES → public/projects/echo-pan/
 *
 * Drawing positions, sizes, crops and captions are preserved.
 * ---------------------------------------------------------------------- */

const DIR = "/projects/echo-pan";

/* ------------------------------ TYPES ------------------------------ */

export type Ink = {
  l: number;
  t: number;
  w: number;
  h: number;
};

export type Diagram = {
  src: string;
  ink: Ink;
  x: number;
  y: number;
  w: number;
};

export type DotsSpec = {
  src: string;
  pick: number[];
  x: number;
  y: number;
  size?: number;
};

export type MaterialItem = {
  id: string;
  name: string;
  tagline: string;
  img: string;
  alt: string;
  acoustic: {
    caption: string[];
    wave: Diagram;
  };
  form: {
    caption: string[];
    form: Diagram;
  };
  object: {
    caption: string[];
    capX: number;
    dots: DotsSpec;
  };
};

export type MaterialExplorationData = {
  heading: string;
  hint: string;
  rows: [
    { title: string; sub: string },
    { title: string; sub: string },
    { title: string; sub: string },
  ];
  materials: MaterialItem[];
};

/* ------------------------------ IMAGE CROPS ------------------------------ */

const INK = {
  waveClassic: {
    l: 0.013,
    t: 0.357,
    w: 0.973,
    h: 0.238,
  },

  waveHardwood: {
    l: 0.018,
    t: 0.365,
    w: 0.96,
    h: 0.242,
  },

  waveCarbon: {
    l: 0.01,
    t: 0.339,
    w: 0.969,
    h: 0.287,
  },

  formBamboo: {
    l: 0.026,
    t: 0.398,
    w: 0.95,
    h: 0.246,
  },

  formPlain: {
    l: 0.031,
    t: 0.406,
    w: 0.947,
    h: 0.236,
  },

  formCarbon: {
    l: 0.034,
    t: 0.406,
    w: 0.943,
    h: 0.236,
  },
};

/* ------------------------------ DATA ------------------------------ */

export const ECHO_PAN_MATERIALS: MaterialExplorationData = {
  heading: "Material exploration",

  hint: "Hover over a material to learn more.",

  rows: [
    {
      title: "Acoustic behaviour",
      sub: "How it interacts with sound",
    },
    {
      title: "Making & form",
      sub: "Fabrication, accuracy and design",
    },
    {
      title: "Object experience",
      sub: "Weight, touch, maintenance",
    },
  ],

  materials: [
    /* ====================== 1 · BAMBOO ====================== */

    {
      id: "bamboo",
      name: "Bamboo",
      tagline: "Traditional and resonant",

      img: `${DIR}/material-1-bamboo.jpg`,
      alt: "Close-up of four bamboo canes with their nodes",

      acoustic: {
        caption: [
          "Low internal damping, can give",
          "a responsive, open sound.",
        ],

        wave: {
          src: `${DIR}/diagram-wave.png`,
          ink: INK.waveClassic,
          x: 522,
          y: 300,
          w: 188,
        },
      },

      form: {
        caption: [
          "Ready hollow form but naturally variable",
          "in bore, taper and wall thickness.",
        ],

        form: {
          src: `${DIR}/diagram-form.png`,
          ink: INK.formBamboo,
          x: 554,
          y: 483,
          w: 152,
        },
      },

      object: {
        caption: [
          "Natural, warm to hold; lightweight.",
        ],

        capX: 491,

        dots: {
          src: `${DIR}/diagram-dots.png`,
          pick: [0, 1, 2, 3, 4],
          x: 531.2,
          y: 670,
        },
      },
    },

    /* ====================== 2 · HARDWOOD ====================== */

    {
      id: "hardwood",
      name: "Hardwood",
      tagline: "Craftable and expressive",

      img: `${DIR}/material-2-hardwood.jpg`,
      alt: "Oak boards with a warm brown grain",

      // CORRECTED: Acoustic row uses the wave illustration.
      acoustic: {
        caption: [
          "Moderate damping that helps a",
          "focused and rounded tone.",
        ],

        wave: {
          src: `${DIR}/Hardwood_2_.png`,
          ink: INK.waveHardwood,
          x: 523,
          y: 300,
          w: 170,
        },
      },

      // CORRECTED: Making row uses the hollow tube illustration.
      form: {
        caption: [
          "Can be shaped to a precise form and finish;",
          "more control over diameter and thickness.",
        ],

        form: {
          src: `${DIR}/Hardwood_2.png`,
          ink: INK.formBamboo,
          x: 561,
          y: 488,
          w: 150,
        },
      },

      object: {
        caption: [
          "Tactile and warm; adds a crafted",
          "character.",
        ],

        capX: 491,

        dots: {
          src: `${DIR}/Hardwood_2__1_.png`,
          pick: [0, 1, 2, 3, 4],
          x: 531.2,
          y: 678,
        },
      },
    },

    /* ====================== 3 · STAINLESS STEEL ====================== */

    {
      id: "steel",
      name: "Stainless steel",
      tagline: "Stable and durable",

      img: `${DIR}/material-3-steel.jpg`,
      alt: "Brushed steel surface with soft highlights",

      // CORRECTED: Acoustic row uses the wave illustration.
      acoustic: {
        caption: [
          "Reflective surface and rigid wall → efficient",
          "resonance (louder projection).",
        ],

        wave: {
          src: `${DIR}/Stainless_Steel_3___1_.png`,
          ink: INK.waveClassic,
          x: 523,
          y: 303,
          w: 187,
        },
      },

      form: {
        caption: [
          "Available in precise tube sections;",
          "strong and consistent for long lengths.",
        ],

        form: {
          src: `${DIR}/Stainless_Steel_3___2_.png`,
          ink: INK.formPlain,
          x: 555,
          y: 486,
          w: 149,
        },
      },

      // CORRECTED: Object row uses the dots illustration.
      object: {
        caption: [
          "Solid, durable;",
          "with a clean, modern finish.",
        ],

        capX: 491,

        dots: {
          src: `${DIR}/Stainless_Steel_3_.png`,
          pick: [0, 1, 2, 3, 4],
          x: 531.2,
          y: 671,
        },
      },
    },

/* ---------------------------------- 4 · ALUMINIUM ---------------------------------- */
{
  id: "aluminium",
  name: "Aluminium",
  tagline: "Lightweight and versatile",
  img: `${DIR}/material-4-aluminium.jpg`,
  alt: "Light brushed aluminium surface",

  acoustic: {
    caption: [
      "Similar to steel but with slightly higher",
      "damping (softer response).",
    ],
    wave: {
      src: `${DIR}/Aluminium_4___.png`,
      ink: INK.waveClassic,
      x: 526,
      y: 302,
      w: 179,
    },
  },

  form: {
    caption: [
      "Easy to machine and drill; lightweight",
      "but prone to denting.",
    ],
    form: {
      src: `${DIR}/Aluminium_4__.png`,
      ink: INK.formPlain,
      x: 555,
      y: 485,
      w: 148,
    },
  },

  object: {
    caption: [
      "Light and comfortable;",
      "requires surface finish.",
    ],
    capX: 521,
    dots: {
      src: `${DIR}/Aluminium_4___1.png`,
      pick: [0, 1, 2, 3, 4],
      x: 534.3,
      y: 671,
      size: 157.6,
    },
  },
},


    /* ====================== 5 · PVC ====================== */

    {
      id: "pvc",
      name: "PVC",
      tagline: "Consistent and accessible",

      img: `${DIR}/material-5-pvc.jpg`,
      alt: "White PVC pipes of different diameters with a red stripe",

      acoustic: {
        caption: [
          "Higher damping → quicker decay, less",
          "projection.",
        ],

        wave: {
          src: `${DIR}/PVC_5___1_.png`,
          ink: INK.waveClassic,
          x: 523,
          y: 302,
          w: 187,
        },
      },

      form: {
        caption: [
          "Standard, ready-made tubes; quick for",
          "prototyping but limited in fine detailing",
          "and finishing.",
        ],

        form: {
          src: `${DIR}/PVC__5_.png`,
          ink: INK.formPlain,
          x: 554,
          y: 484,
          w: 154,
        },
      },

      object: {
        caption: [
          "Very light; functional but",
          "less premium in feel.",
        ],

        capX: 521,

        dots: {
          src: `${DIR}/PVC_5_.png`,
          pick: [0, 1, 2, 3, 4],
          x: 531.2,
          y: 670,
        },
      },
    },

    /* ====================== 6 · CARBON FIBRE ====================== */

    {
      id: "carbon",
      name: "Carbon-fibre composite",
      tagline: "High strength, low mass",

      img: `${DIR}/material-6-carbon.jpg`,
      alt: "Black woven carbon fibre tubes of different diameters",

      acoustic: {
        caption: [
          "High stiffness with low vibration",
          "loss → clear and responsive.",
        ],

        wave: {
          src: `${DIR}/Carbon_Fibre_6_.png`,
          ink: INK.waveCarbon,
          x: 517,
          y: 296,
          w: 199,
        },
      },

      form: {
        caption: [
          "High strength-to-weight ratio; allows thin,",
          "rigid walls but is fabrication-intensive.",
        ],

        form: {
          src: `${DIR}/Carbon_Fibre_6___2_.png`,
          ink: INK.formCarbon,
          x: 553,
          y: 485,
          w: 154,
        },
      },

      object: {
        caption: [
          "synthetic feel; not suitable",
          "for direct mouth contact.",
        ],

        capX: 524,

        dots: {
          src: `${DIR}/Carbon_Fibre_6___1_.png`,
          pick: [0, 1, 2, 3, 4],
          x: 531.2,
          y: 670,
        },
      },
    },
  ],
};
