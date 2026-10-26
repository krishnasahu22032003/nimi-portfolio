/* -------------------------------------------------------------------------
 * data/fabrication.ts      (or src/data/fabrication.ts)
 *
 * FABRICATION — a clickable timeline. One entry per dot on the timeline.
 *
 *   id        unique key
 *   group     "metal" | "wood"            which half of the timeline the dot sits in
 *   label     text under the dot          (shown uppercase by the CSS)
 *   groups    the photo blocks of that stage, left → right. Each block = 1 or more photos + ONE caption.
 *             A caption under two photos (e.g. Welding) is simply a block with two images.
 *   images    src = null → an empty grey frame (photo still to come). Frames are ALWAYS the same size.
 *   caption   one string, or an array of strings (= separate paragraphs)
 *
 * Images live in  public/projects/seesaw/fabrication/
 * ---------------------------------------------------------------------- */
/* pos (optional) = CSS object-position for the crop, e.g. "50% 30%" keeps more of the top of a tall photo */
export type FabImage = { src: string | null; alt: string; pos?: string };
export type FabGroup = { images: FabImage[]; caption: string | string[] };
export type FabStage = {
  id: string;
  group: "metal" | "wood";
  label: string;
  groups: FabGroup[];
};
export type FabricationData = {
  title: string;
  intro: [string, string];
  stages: FabStage[];
};

const D = "/projects/seesaw/fabrication";
const img = (name: string, alt: string): FabImage => ({ src: `${D}/${name}.jpg`, alt });
/* kept for any stage whose photo is still to come: src = null → an empty grey frame */
export const empty = (alt: string): FabImage => ({ src: null, alt });

export const SEESAW_FABRICATION: FabricationData = {
  title: "FABRICATION",
  intro: ["Key construction details and challenges faced.", "Click through the timeline to explore each stage."],
  stages: [
    /* ------------------------------ METAL FRAME ------------------------------ */
    {
      id: "radius",
      group: "metal",
      label: "Radius",
      groups: [
        { images: [img("radius-1", "A 40 mm pipe standing upright on the workshop floor, cut along the required radius")], caption: "The tight end curve was created using a 40 mm pipe cut along the required radius." },
        { images: [img("radius-2", "A hand marking the curve on a 20 mm pipe placed inside the cut pipe")], caption: "A 20 mm pipe was placed inside as a support to hold the curved form." },
        { images: [img("radius-3", "Two curved pipe halves welded and capped with sheet on the workbench")], caption: "The structure was welded together and capped with sheet, creating a continuous metal curve." },
      ],
    },
    {
      id: "bending",
      group: "metal",
      label: "Bending",
      groups: [
        { images: [img("bending-1", "A heated pipe being bent over a hand pulley on the bending table")], caption: "Bending the 30 mm MS pipe using the heated hand pulley created bumps and an uneven curve because the pulley groove did not match the pipe diameter, so the method was rejected." },
        { images: [img("bending-2", "Bending the pipe on a manual hand press in the workshop")], caption: "The process was switched to manual hand-press bending, marking the pipe at 3-inch intervals and pressing gradually at each point to achieve a smooth, continuous curve." },
      ],
    },
    {
      id: "alignment",
      group: "metal",
      label: "Alignment",
      groups: [
        {
          images: [img("alignment-1", "A bent pipe laid over the 1:1 floor drawing of the ellipse")],
          caption: ["Bent pipes were checked against the 1:1 floor drawing to match the exact ellipse and arc before assembly.", "End curves were positioned and tack-welded to form the frame."],
        },
        {
          images: [
            img("alignment-2", "The tack-welded frame lying on the workshop floor"),
            img("alignment-3", "Two workshop technicians checking the standing welded frame"),
          ],
          caption: "The welded frame was checked with the workshop technicians to ensure all four arcs were symmetrically aligned, maintaining stable rocking and preventing lateral twist or imbalance.",
        },
      ],
    },
    {
      id: "welding",
      group: "metal",
      label: "Welding",
      groups: [
        {
          images: [
            img("welding-1", "The metal sheet tack-welded onto the pipe frame"),
            img("welding-2", "A welder working on the frame at the workbench"),
          ],
          caption: "The metal sheet was tack-welded to the pipe frame with ARC welding to hold it securely in position.",
        },
        {
          images: [
            img("welding-3", "Close view of the continuous ARC weld along the pipe edge"),
            img("welding-4", "The welded frame outdoors, with a seamless joint between sheet and pipe"),
          ],
          caption: "The joints were then continuously ARC-welded along the pipe to create a strong, even and seamless connection between the sheet and frame.",
        },
      ],
    },
    {
      id: "metal-finishing",
      group: "metal",
      label: "Finishing",
      groups: [
        { images: [img("finishing-1", "Grinding the welds on the frame with an angle grinder")], caption: "Grinding the welding to make it even and smooth." },
        { images: [img("finishing-2", "Sanding the metal frame on a wooden workbench")], caption: "Sanding the metal surface to remove rust and prepare it for finishing." },
        { images: [img("finishing-3", "Buffing the metal frame at the workbench")], caption: "Buffing the metal surface to bring out a smooth, polished shine." },
        { images: [img("finishing-4", "The finished metal frame coated with lacquer")], caption: "The metal frame was coated with lacquer to protect it from rust and improve its durability for external use." },
      ],
    },

    /* ------------------------------- WOOD SEAT ------------------------------- */
    {
      id: "cutting",
      group: "wood",
      label: "Cutting",
      groups: [
        { images: [img("cutting-1", "Cutting the dovetail joint by hand with a saw, the timber held in a vice")], caption: "The dovetail joint was cut by hand, using a saw to shape the tail." },
      ],
    },
    {
      id: "joinery",
      group: "wood",
      label: "Joinery",
      groups: [
        { images: [img("joinery-1", "A timber plank with chiselled tails and sockets at its end")], caption: "Each tail and socket was carefully chiselled to a 135° angle to match the upturned ends." },
        { images: [img("joinery-2", "Two finished timber pieces fitted together by hand")], caption: "The finished pieces were fitted together by hand, creating a clean, crafted connection." },
      ],
    },
    /* "Assembly" was removed — there is no photo for it */
    {
      id: "reinforcement",
      group: "wood",
      label: "Reinforcement",
      groups: [
        { images: [img("reinforcement-1", "Metal spacers reinforcing the wooden seat")], caption: "Four metal spacers were added on each side to reinforce the wooden seat, providing firm support and distributing the load across the structure." },
      ],
    },
    {
      id: "wood-finishing",
      group: "wood",
      label: "Finishing",
      groups: [
        { images: [img("wood-finishing-1", "Applying lacquer to the wooden seat")], caption: "Applying a semi-gloss automotive lacquer to seal and protect the wood surface, while giving it a durable finish suited for outdoor use." },
      ],
    },
  ],
};