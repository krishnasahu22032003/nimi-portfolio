/* -------------------------------------------------------------------------
 * data/puppetTargetUser.ts  (or src/data/puppetTargetUser.ts)
 * Project eight (Puppet theatre) — page "TARGET USER"
 *
 * LINE BREAKS ARE DATA: every inner string is ONE line, exactly as she broke it in Canva
 * (on desktop ≥1280px). Below 1280px the lines reflow.
 * `x` of an age = the centre of that number on her 1440 px artboard.
 * ---------------------------------------------------------------------- */

export type TargetUserCard = {
  heading: string; // Playfair Display italic
  tone: 0 | 1 | 2; // 0 = 40% orange · 1 = 80% · 2 = 100%
  bullets: string[][]; // one array per bullet, one string per line
  outcome: string[]; // the last bullet (has a gap above it)
};

export type TargetUserData = {
  title: string;
  subtitle: string; // keeps her double spaces
  sweetLabel: string; // written inside the middle part of the bar
  ages: { label: string; x: number }[];
  cards: TargetUserCard[];
  alt: string;
};

export const PUPPET_TARGET_USER: TargetUserData = {
  title: "Target user",
  subtitle: "Works  for 3–9, designed for  5–7.",
  sweetLabel: "Sweet spot: 5–7",
  ages: [
    { label: "3", x: 116 },
    { label: "4", x: 301 },
    { label: "5", x: 458 },
    { label: "6", x: 658 },
    { label: "7", x: 872 },
    { label: "8", x: 1115 },
    { label: "9", x: 1315 },
  ],
  cards: [
    {
      heading: "3–4 ; NURSERY",
      tone: 0,
      bullets: [
        ["Sensory + repetitive play."],
        ["Ignores cards, can’t sequence."],
        ["Adult must lead the session."],
      ],
      outcome: ["Outcome: assembled by teacher,", "child plays freely."],
    },
    {
      heading: "5–7 ; UKG–GRADE 1",
      tone: 1,
      bullets: [
        ["Builds and narrates stories", "independently."],
        ["Reads symbols + short prompts."],
        ["Loves role-play, cards,", "randomness."],
      ],
      outcome: ["Outcome: the whole product", "comes alive."],
    },
    {
      heading: "7–9; GRADE 2–3",
      tone: 2,
      bullets: [
        ["Wants rules, logic, challenge."],
        ["May read puppets as ‘younger", "play’."],
        ["Still engages when given", "complexity."],
      ],
      outcome: ["Outcome: works with harder card", "decks."],
    },
  ],
  alt: "A bar from age 3 to 9. Ages 3 to 4 are lightest, the sweet spot of 5 to 7 is in the middle, and 7 to 9 is the darkest. Below it, three cards describe each age group.",
};