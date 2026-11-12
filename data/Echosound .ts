/* -------------------------------------------------------------------------
 * data/echoSound.ts        (or src/data/echoSound.ts)
 *
 * Page 5 of project three (Echo Pan) —
 *   left  (beige) : "How the dimensions are calculated ?"
 *   right (white) : "How it affects the sound ?"
 *
 * IMAGES → public/projects/echo-pan/   (9 files, already renamed in the download; same pixels as hers)
 *
 *   sound-flute-all-open.png      sound-flute-some-closed.png     sound-flute-more-closed.png
 *   sound-pan-render.png          sound-pan-tube.png              sound-bansuri-side.png
 *   sound-wave-bansuri.png        sound-wave-states.png           sound-wave-tube.png
 *
 * (her originals: pg_72-_2 / _3 / _4 / _5 / _6, pg_720-_1, Pg_72_-1, Pg_72-_2-3-4, Pg_72-_6 — two of them
 *  differ only by capital letters, which is why they had to be renamed)
 *
 * LINE BREAKS ARE DATA: every string is rendered as ONE line, exactly as she broke it in Canva.
 * An empty string "" = one blank line.
 * ---------------------------------------------------------------------- */

const DIR = "/projects/echo-pan";

export type EchoSoundData = {
  headingLeft: string;
  headingRight: string;
  calc: {
    bansuri: {
      title: string;
      openEnd: [string, string]; // "Open end" / "(to blow)"
      closedEnd: string;
      closedTube: string; // "With all holes closed (…):"
      holeLines: string[]; // paragraph, one string per line, "" = blank line
      correction: string;
      side: string; // bansuri side view
      wave: string; // blue wave
      label: string; // accessible description of the diagram
    };
    pan: {
      title: string;
      openEnd: string;
      closedEnd: string;
      tube: string;
      wave: string;
      label: string;
      definitions: string[][]; // each definition: one string per line
    };
  };
  sound: {
    bansuri: {
      title: string;
      text: string[];
      wave: string;
      states: { img: string; alt: string; label: string; note: string }[];
    };
    pan: {
      title: string;
      text: string[];
      render: string;
      alt: string;
      /** note names under the pipes, LEFT → RIGHT (shortest pipe → longest pipe) */
      notes: string[][];
      left: [string, string]; // [“Shorter tube”, “Higher pitch”]
      right: [string, string]; // [“Longer tube”, “Lower pitch”]
    };
  };
};

export const ECHO_PAN_SOUND: EchoSoundData = {
  headingLeft: "What shapes a note ?",
  headingRight: "How it affects the sound ?",
  calc: {
    bansuri: {
      title: "Bansuri",
      openEnd: ["Open end", "(to blow)"],
      closedEnd: "Closed end",
      closedTube: "With all holes closed (acts as a closed tube):",
      holeLines: [
        "When a finger hole is opened:",
        "The hole shortens the effective length of the",
        "air column.",
        "",
        "For a hole at a distanced from the blowing",
        "end:",
      ],
      correction: "( △Lend = end correction, ~ 0.6r)",
      side: `${DIR}/sound-bansuri-side.png`,
      wave: `${DIR}/sound-wave-bansuri.png`,
      label: "Bansuri with all holes closed, with the standing wave inside the tube",
    },
    pan: {
      title: "Pan flute",
      openEnd: "Open end",
      closedEnd: "Closed end",
      tube: `${DIR}/sound-pan-tube.png`,
      wave: `${DIR}/sound-wave-tube.png`,
      label: "A single pan flute tube, open at the top and closed at the bottom, with the standing wave inside",
      definitions: [
        ["f = fundamental", "frequency (Hz)"],
        ["v = speed of sound in air", "(~ 343m/s at 20°C)"],
        ["L = length of tube"],
      ],
    },
  },
  sound: {
    bansuri: {
      title: "Bansuri",
      text: ["Changing the effective air", "column length with finger", "holes."],
      wave: `${DIR}/sound-wave-states.png`,
      states: [
        {
          img: `${DIR}/sound-flute-all-open.png`,
          alt: "Bansuri with all finger holes open",
          label: "All holes open",
          note: "(shortest effective length → higher pitch)",
        },
        {
          img: `${DIR}/sound-flute-some-closed.png`,
          alt: "Bansuri with the first two finger holes closed",
          label: "Some holes closed",
          note: "(longer effective length → lower pitch)",
        },
        {
          img: `${DIR}/sound-flute-more-closed.png`,
          alt: "Bansuri with the first five finger holes closed",
          label: "More holes closed",
          note: "(even longer effective length → even lower pitch)",
        },
      ],
    },
    pan: {
      title: "Pan flute",
      text: ["Each tube length produces", "a different note."],
      render: `${DIR}/sound-pan-render.png`,
      alt: "The five pan pipes of Echo Pan, from the shortest on the left to the longest on the right",
      notes: [["F#6/", "Gb6"], ["E6"], ["D6"], ["C6"], ["A#5/", "bB5"]],
      left: ["Shorter tube", "Higher pitch"],
      right: ["Longer tube", "Lower pitch"],
    },
  },
};