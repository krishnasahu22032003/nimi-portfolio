"use client";

/* components/ProjectEnvironment.tsx   (or src/components/ProjectEnvironment.tsx)
 *
 * Project eight — COMPOSE · "2. Build the environment"  (Canva page 104)
 *
 * RIGHT  the finished puppet theatre (3D, stationary, fixed camera angle — AZ_VIEW / EL_VIEW / FOV below).
 * LEFT   the character pieces, laid flat and facing the visitor, in rows (animals, plants, trees).
 * TAP a piece → it flies to the theatre and slides down into its GROOVE (the red lines on the foot pads and the
 *   shelf); the two monkeys hang on the side panels. The designer's pieces (and the client's ant and monkeys) go exactly where she put them; every other piece takes the first
 *   free spot in a shelf groove (if the shelf is full, the piece that has been there longest goes back).
 * TAP a placed piece, or "Reset" → pieces fly back to the left.
 * Keyboard / screen reader: a hidden list of buttons does the same (Tab, Enter).
 *
 * PERFORMANCE (this version): nothing 3D starts until the section is within ~800px of the screen, and the pieces are
 * built one per tick (yieldToMain) so the page never freezes. That way this section cannot delay the reveal of the
 * other sections while the page is loading.
 *
 * Same system as ProjectBuild: a 1440 × 900 artboard scaled by --cu, one WebGL canvas, three.js loaded on demand.
 * The page carries no data-hiw-step on purpose: the COMPOSE dot of the timeline still jumps to the first COMPOSE page.
 *
 * Needs:  three (already installed)   ·   data/puppetEnvironment.ts
 * Files:  public/projects/puppet-theatre/model/theatre-built.glb · characters-sheet.glb · characters-texture.jpg
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type * as ThreeNS from "three";
import {
  ENV_CHARACTERS_URL,
  ENV_PART_COLOUR,
  ENV_PIECES,
  ENV_SHELF,
  ENV_TEXT,
  ENV_TEXTURE_MAP,
  ENV_THEATRE_URL,
} from "../data/puppetEnvironment";
import type { EnvPiece } from "../data/puppetEnvironment";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const NUM_X = 108; //   "2."
const TITLE_X = 126; // "Build the environment"
const HEAD_Y = 90; //   top of the heading line (its centre is y = 104, as on Canva)
const PARA_X = 91;
const PARA_Y = 145; //  top of the first paragraph line (line centres 158 / 184)
const HINT_Y = 223; //  top of the red-underlined line "Click on the characters…" (line centre 236, one blank line below the paragraph)
/* hand-drawn underline (same recipe as the Build page / FABRICATION): distance from the bottom of the text line to the
   bottom of the underline strip. Bigger negative number = the line sits lower. */
const UL_OFFSET = -10;
const CANVAS_TOP = 190; // the 3D canvas covers the page from here to the bottom edge
const CANVAS_BOTTOM = 900;

/* the two boxes, in artboard px. SHEET = where the pieces lie · THEATRE = where the finished theatre is fitted */
const BOX_SHEET = { x0: 90, y0: 290, x1: 575, y1: 850 }; //   starts below the red-underlined line
const BOX_THEATRE = { x0: 590, y0: 215, x1: 1372, y1: 715 };
/* phones: the same two boxes, stacked (fractions of the canvas) */
const BOX_SHEET_NARROW = { x0: 0.03, y0: 0.5, x1: 0.97, y1: 0.99 };
const BOX_THEATRE_NARROW = { x0: 0.02, y0: 0.01, x1: 0.98, y1: 0.46 };
const NARROW_BELOW = 700; // canvas width (px) under which the stacked layout is used

/* camera (degrees). az > 0 = the camera stands a little to the RIGHT of the stage, as in the designer's render */
const AZ_VIEW = 12;
const EL_VIEW = 12;
const FOV = 28;

/* pieces on the left */
const ROW_GAP_M = 0.03; // metres between rows (on the sheet)
const PIECE_GAP_MIN = 0.02;
const PIECE_GAP_MAX = 0.06;
const SHEET_FILL = 0.98;
const HOVER_LIFT = 0.06; // a piece on the left grows 6% under the cursor

/* start building the 3D scene when the section is this close to the screen (px) — far enough that it is ready on arrival */
const START_MARGIN = "2500px";

/* soft shadow under every piece lying on the left (the reference render has one under each piece) */
const SHADOW_RES = 400; //       px per metre of the shadow picture
const SHADOW_MARGIN = 0.04; //   metres of room around a piece for the blur
const SHADOW_BLUR_M = 0.0075; // blur radius, metres (≈ 5 px on screen)
const SHADOW_DX = 0.01; //       shadow offset: to the right…
const SHADOW_DY = -0.012; //     …and down (metres, in the piece's own plane)
const SHADOW_OPACITY = 0.3;

/* motion */
const FLY_MIN = 1.3; // seconds
const FLY_MAX = 2.0;
const RESET_STAGGER = 70; // ms between two pieces on Reset

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (x: number) => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rad = (d: number) => (d * Math.PI) / 180;

/** Give the browser a chance to paint / run other animations before the next heavy step. */
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Download the two model files in the background (network only, no main-thread work), shared by prefetch and boot. */
let bufferJob: Promise<[ArrayBuffer, ArrayBuffer]> | null = null;
const getBuffers = (): Promise<[ArrayBuffer, ArrayBuffer]> => {
  if (!bufferJob) {
    const get = (url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`could not load ${url} (${r.status}) — is the file in public/projects/puppet-theatre/model/ with exactly this name?`);
        return r.arrayBuffer();
      });
    bufferJob = Promise.all([get(ENV_THEATRE_URL), get(ENV_CHARACTERS_URL)]);
    bufferJob.catch(() => {
      bufferJob = null;
    });
  }
  return bufferJob;
};

type Box = { x0: number; y0: number; x1: number; y1: number };
type Api = { toggle: (id: string) => void; reset: () => void };

/* ===================================================================================================
   PURE HELPERS (no DOM) — exported only so they can be unit-tested
   =================================================================================================== */

/** Window height at x (linear between the table's points). */
export function windowTopAt(x: number): number {
  const t = ENV_SHELF.windowTop;
  if (x <= t[0][0]) return t[0][1];
  for (let i = 1; i < t.length; i++) {
    if (x <= t[i][0]) {
      const k = (x - t[i - 1][0]) / (t[i][0] - t[i - 1][0]);
      return lerp(t[i - 1][1], t[i][1], k);
    }
  }
  return t[t.length - 1][1];
}

/** Can a piece w wide and h tall, standing on the shelf, slide in through the window centred at x? */
export function fitsWindow(x: number, w: number, h: number): boolean {
  if (x - w / 2 < ENV_SHELF.xMin || x + w / 2 > ENV_SHELF.xMax) return false;
  const need = ENV_SHELF.sillZ + 0.006 + h + 0.004;
  for (let s = x - w / 2; s <= x + w / 2 + 1e-9; s += 0.004) if (windowTopAt(s) < need) return false;
  return windowTopAt(x + w / 2) >= need;
}

export type ShelfItem = { groove: number; x0: number; x1: number };

/** First free spot on the shelf for a piece (w × h). Tall pieces prefer the back groove. */
export function findShelfSpot(w: number, h: number, taken: ShelfItem[]): { groove: number; x: number } | null {
  const order = h >= 0.14 ? [1, 0] : [0, 1];
  const gap = ENV_SHELF.gap;
  for (const g of order) {
    for (let x = ENV_SHELF.xMin + w / 2; x <= ENV_SHELF.xMax - w / 2 + 1e-9; x += 0.004) {
      if (!fitsWindow(x, w, h)) continue;
      const a = x - w / 2 - gap;
      const b = x + w / 2 + gap;
      const clash = [...ENV_SHELF.reserved, ...taken].some((o) => o.groove === g && a < o.x1 && b > o.x0);
      if (!clash) return { groove: g, x };
    }
  }
  return null;
}

/** The x where a shelf piece goes through the window: as near its seat as the window allows. */
export function windowEntryX(xSeat: number, w: number, h: number): number {
  if (fitsWindow(xSeat, w, h)) return xSeat;
  let best = xSeat;
  let bestD = Infinity;
  for (let x = ENV_SHELF.xMin + w / 2; x <= ENV_SHELF.xMax - w / 2 + 1e-9; x += 0.004) {
    if (!fitsWindow(x, w, h)) continue;
    const d = Math.abs(x - xSeat);
    if (d < bestD) {
      bestD = d;
      best = x;
    }
  }
  return best;
}

/** Fit the perspective camera so the theatre's bounding box fills `region` (canvas px) and sits in its centre.
    The camera always looks at the theatre; the image is moved with a lens shift, so flat things facing the camera
    are never skewed. Returns the distance from camera to target (= the depth of the sheet plane). */
export function fitCamera(
  THREE: typeof ThreeNS,
  camera: ThreeNS.PerspectiveCamera,
  corners: ThreeNS.Vector3[],
  target: ThreeNS.Vector3,
  dir: ThreeNS.Vector3,
  W: number,
  H: number,
  region: { x0: number; y0: number; x1: number; y1: number }
): number {
  const rw = region.x1 - region.x0;
  const rh = region.y1 - region.y0;
  let D = 3;
  const v = new THREE.Vector3();
  const bounds = () => {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of corners) {
      v.copy(c).project(camera);
      const px = ((v.x + 1) / 2) * W;
      const py = ((1 - v.y) / 2) * H;
      x0 = Math.min(x0, px); x1 = Math.max(x1, px);
      y0 = Math.min(y0, py); y1 = Math.max(y1, py);
    }
    return { x0, x1, y0, y1 };
  };
  const place = () => {
    camera.aspect = W / H;
    camera.position.copy(target).addScaledVector(dir, D);
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
    camera.updateProjectionMatrix(); // lens shift reset
    camera.updateMatrixWorld(true);
  };
  for (let i = 0; i < 10; i++) {
    place();
    const b = bounds();
    D = D / Math.min(rw / (b.x1 - b.x0), rh / (b.y1 - b.y0));
  }
  place();
  const b = bounds();
  const sx = ((region.x0 + region.x1) / 2 - (b.x0 + b.x1) / 2) / (W / 2); // NDC shift, right
  const sy = -(((region.y0 + region.y1) / 2 - (b.y0 + b.y1) / 2) / (H / 2)); // NDC shift, up
  camera.projectionMatrix.elements[8] = -sx;
  camera.projectionMatrix.elements[9] = -sy;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return D;
}

/** Point of the camera's image plane (at depth d) that is shown at canvas pixel (px, py), in scene space. */
export function planePoint(
  THREE: typeof ThreeNS,
  camera: ThreeNS.PerspectiveCamera,
  W: number,
  H: number,
  d: number,
  px: number,
  py: number
): ThreeNS.Vector3 {
  const e = camera.projectionMatrix.elements;
  const nx = (px / W) * 2 - 1;
  const ny = 1 - (py / H) * 2;
  const xc = ((nx + e[8]) * d) / e[0];
  const yc = ((ny + e[9]) * d) / e[5];
  return camera.localToWorld(new THREE.Vector3(xc, yc, -d));
}

/** Round the corners of a polyline (radius per point) so a piece glides instead of turning on the spot. */
export function roundedPath(THREE: typeof ThreeNS, P: ThreeNS.Vector3[], R: number[]): ThreeNS.Vector3[] {
  const out: ThreeNS.Vector3[] = [P[0].clone()];
  for (let i = 1; i < P.length - 1; i++) {
    const a = P[i - 1], b = P[i], c = P[i + 1];
    const r = Math.min(R[i] ?? 0, a.distanceTo(b) * 0.45, b.distanceTo(c) * 0.45);
    if (r < 1e-5) {
      out.push(b.clone());
      continue;
    }
    const e = b.clone().addScaledVector(a.clone().sub(b).normalize(), r);
    const x = b.clone().addScaledVector(c.clone().sub(b).normalize(), r);
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      out.push(
        new THREE.Vector3()
          .addScaledVector(e, (1 - t) * (1 - t))
          .addScaledVector(b, 2 * (1 - t) * t)
          .addScaledVector(x, t * t)
      );
    }
  }
  out.push(P[P.length - 1].clone());
  return out;
}

/** Blur the alpha channel of RGBA pixels in place (three box passes ≈ a Gaussian). */
export function blurAlpha(px: Uint8ClampedArray, w: number, h: number, radius: number): void {
  const n = w * h;
  let a = new Float32Array(n);
  let b = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = px[i * 4 + 3];
  const r = Math.max(1, Math.round(radius * 0.58));
  const win = 2 * r + 1;
  const pass = (src: Float32Array, dst: Float32Array, horizontal: boolean) => {
    const len = horizontal ? w : h;
    const lines = horizontal ? h : w;
    const step = horizontal ? 1 : w;
    const lineStep = horizontal ? w : 1;
    for (let l = 0; l < lines; l++) {
      const base = l * lineStep;
      let sum = 0;
      for (let i = 0; i <= r && i < len; i++) sum += src[base + i * step];
      for (let i = 0; i < len; i++) {
        dst[base + i * step] = sum / win;
        const add = i + r + 1;
        const rem = i - r;
        if (add < len) sum += src[base + add * step];
        if (rem >= 0) sum -= src[base + rem * step];
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(a, b, true);
    pass(b, a, false);
  }
  for (let i = 0; i < n; i++) px[i * 4 + 3] = a[i];
}

/** A soft, blurred silhouette of a piece as a flat plane to hang behind it (offset right and down). */
export function makeShadow(THREE: typeof ThreeNS, geoms: ThreeNS.BufferGeometry[], w: number, h: number) {
  const pw = Math.ceil((w + 2 * SHADOW_MARGIN) * SHADOW_RES);
  const ph = Math.ceil((h + 2 * SHADOW_MARGIN) * SHADOW_RES);
  const canvas = document.createElement("canvas");
  canvas.width = pw;
  canvas.height = ph;
  const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  ctx.fillStyle = "#000";
  const X = (x: number) => (x + w / 2 + SHADOW_MARGIN) * SHADOW_RES;
  const Y = (y: number) => (h / 2 - y + SHADOW_MARGIN) * SHADOW_RES;
  for (const g of geoms) {
    const pos = g.getAttribute("position");
    const ix = g.getIndex();
    const count = ix ? ix.count : pos.count;
    let inPath = 0;
    ctx.beginPath();
    for (let i = 0; i < count; i += 3) {
      const ia = ix ? ix.getX(i) : i;
      const ib = ix ? ix.getX(i + 1) : i + 1;
      const ic = ix ? ix.getX(i + 2) : i + 2;
      const ax = X(pos.getX(ia)), ay = Y(pos.getY(ia));
      let bx = X(pos.getX(ib)), by = Y(pos.getY(ib));
      let cx = X(pos.getX(ic)), cy = Y(pos.getY(ic));
      const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
      if (Math.abs(area) < 1e-4) continue;
      if (area < 0) {
        /* every triangle the same way round, so front and back faces add up instead of cancelling */
        [bx, cx] = [cx, bx];
        [by, cy] = [cy, by];
      }
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      if (++inPath >= 20000) {
        ctx.fill();
        ctx.beginPath();
        inPath = 0;
      }
    }
    ctx.fill();
  }
  const img = ctx.getImageData(0, 0, pw, ph);
  blurAlpha(img.data, pw, ph, SHADOW_BLUR_M * SHADOW_RES);
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, map: tex, transparent: true, opacity: SHADOW_OPACITY, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(pw / SHADOW_RES, ph / SHADOW_RES), mat);
  mesh.renderOrder = -1;
  mesh.position.set(SHADOW_DX, SHADOW_DY, -0.006); // a hair behind the piece
  mesh.raycast = () => {}; // never a tap target
  return { mesh, mat, tex };
}

/* ===================================================================================================
   COMPONENT
   =================================================================================================== */
export default function ProjectEnvironment() {
  const outerRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [onStage, setOnStage] = useState<string[]>([]);
  const flat: EnvPiece[] = ENV_PIECES.flat();

  /* reveal once, when the section first appears */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((e: IntersectionObserverEntry) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* the 3D scene — starts ONLY when the section is near the screen */
  useEffect(() => {
    const host = hostRef.current;
    const outer = outerRef.current;
    if (!host || !outer) return;

    let disposed = false;
    let started = false;
    let raf = 0;
    let teardown: (() => void) | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const boot = async () => {
      try {
        await yieldToMain(); // let the current frame (and the other sections' reveals) finish first
        if (disposed) return;
        const [THREE, { GLTFLoader }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (disposed) return;
        type V3 = ThreeNS.Vector3;
        type Q = ThreeNS.Quaternion;

        /* ---------- renderer, scene, lights ---------- */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap; // (PCFSoftShadowMap was removed in recent three.js; PCFShadowMap is soft there)
        const dom = renderer.domElement;
        dom.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
        host.appendChild(dom);

        const scene = new THREE.Scene();
        /* the models are exported Z up; this group turns them Y up.  model (x, y, z) → scene (x, z, −y) */
        const world = new THREE.Group();
        world.rotation.x = -Math.PI / 2;
        scene.add(world);

        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 40);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 1.15));
        const sun = new THREE.DirectionalLight(0xffffff, 2.1);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        const sc = sun.shadow.camera;
        sc.left = -1.1; sc.right = 1.1; sc.top = 1.1; sc.bottom = -1.1; sc.near = 0.3; sc.far = 8;
        sun.shadow.bias = -0.0003;
        sun.shadow.normalBias = 0.004;
        scene.add(sun, sun.target);

        /* soft floor shadow under the stage */
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }));
        ground.position.set(1.34, 1.8, 0.0243);
        ground.receiveShadow = true;
        world.add(ground);

        /* ---------- load everything ---------- */
        const loader = new GLTFLoader();
        const [bufs, texUrl] = await Promise.all([getBuffers(), import("../data/puppetEnvironmentTexture").then((m) => m.default)]);
        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }
        /* the colours: embedded in the code, so they cannot be missing */
        const tex: ThreeNS.Texture | null = await new THREE.TextureLoader().loadAsync(texUrl).catch((err: unknown): ThreeNS.Texture | null => {
          console.error("[ProjectEnvironment] the embedded texture could not be decoded:", err);
          return null;
        });
        await yieldToMain();
        const theatre = await loader.parseAsync(bufs[0].slice(0), "");
        await yieldToMain();
        const chars = await loader.parseAsync(bufs[1].slice(0), "");
        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }
        if (tex) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        }
        await yieldToMain();
        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }

        /* the theatre: static; green parts and grey parts as in the designer's render */
        const partMat = new Map<string, ThreeNS.MeshStandardMaterial>();
        theatre.scene.traverse((o: ThreeNS.Object3D) => {
          const m = o as ThreeNS.Mesh;
          if (!m.isMesh) return;
          const name = (m.userData as { name?: string }).name ?? m.name;
          const colour = ENV_PART_COLOUR[name] ?? "#3C6952";
          if (!partMat.has(colour)) {
            partMat.set(colour, new THREE.MeshStandardMaterial({ color: colour, roughness: 0.82, metalness: 0 }));
          }
          m.material = partMat.get(colour) as ThreeNS.MeshStandardMaterial;
          m.castShadow = true;
          m.receiveShadow = true;
        });
        world.add(theatre.scene);
        world.updateMatrixWorld(true);
        const theatreBox = new THREE.Box3().setFromObject(theatre.scene); // scene space
        const T = theatreBox.getCenter(new THREE.Vector3());
        const corners: V3[] = [];
        for (let i = 0; i < 8; i++) {
          corners.push(
            new THREE.Vector3(
              i & 1 ? theatreBox.max.x : theatreBox.min.x,
              i & 2 ? theatreBox.max.y : theatreBox.min.y,
              i & 4 ? theatreBox.max.z : theatreBox.min.z
            )
          );
        }
        sun.target.position.copy(T);
        sun.position.copy(T).add(new THREE.Vector3(-1.0, 2.4, 1.6));

        /* ---------- the character pieces ---------- */
        chars.scene.updateMatrixWorld(true);
        const byKey = new Map<string, ThreeNS.Mesh>();
        chars.scene.traverse((o: ThreeNS.Object3D) => {
          const m = o as ThreeNS.Mesh;
          if (m.isMesh) byKey.set((m.userData as { name?: string }).name ?? m.name, m);
        });

        const TM = ENV_TEXTURE_MAP;
        const hitMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
        type Anim = {
          t0: number;
          dur: number;
          pts: V3[];
          cum: number[];
          len: number;
          q0: Q;
          q1: Q;
          s0: number;
          s1: number;
          toStage: boolean;
        };
        type ShelfItemX = { groove: number; x0: number; x1: number; x: number };
        type Piece = {
          def: EnvPiece;
          pivot: ThreeNS.Group;
          meshes: ThreeNS.Mesh[];
          mat: ThreeNS.MeshStandardMaterial;
          size: V3; // model-space size of the flat piece: x = width, y = height
          home: V3; // where it lies on the left (model space)
          kHome: number; // its size on the left, relative to its real size
          qFlat: Q; // facing the camera
          qSeat: Q | null;
          state: "sheet" | "moving" | "stage";
          anim: Anim | null;
          wp: V3[] | null; // the way in (forward waypoints); reversed for the way back
          rad: number[];
          hover: number; // 0..1 smoothed
          wantHover: boolean;
          shadow: ThreeNS.Mesh; // soft shadow behind the piece while it lies on the left
          shadowMat: ThreeNS.MeshBasicMaterial;
          shelf: ShelfItemX | null; // place taken on the shelf (extras only)
        };

        const pieces: Piece[] = [];
        const rows: Piece[][] = [];
        const toDispose: ThreeNS.BufferGeometry[] = [];

        /* one piece per tick, so building the 22 pieces (and their soft shadows) never freezes the page */
        for (const row of ENV_PIECES) {
          const r: Piece[] = [];
          for (const def of row) {
            await yieldToMain();
            if (disposed) {
              renderer.dispose();
              dom.remove();
              return;
            }
            const ms = def.keys.map((k) => byKey.get(k)).filter((m): m is ThreeNS.Mesh => !!m);
            if (!ms.length) {
              console.warn(`[ProjectEnvironment] "${def.keys.join(", ")}" not found in ${ENV_CHARACTERS_URL}`);
              continue;
            }
            const box = new THREE.Box3();
            ms.forEach((m) => box.union(new THREE.Box3().setFromObject(m)));
            const c = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const mat = new THREE.MeshStandardMaterial({
              map: tex,
              color: tex ? 0xffffff : 0x5a9a6a,
              emissive: new THREE.Color(0xffffff),
              emissiveMap: tex,
              emissiveIntensity: 0,
              roughness: 0.78,
              metalness: 0,
              side: THREE.DoubleSide,
            });
            const pivot = new THREE.Group();
            const meshes: ThreeNS.Mesh[] = [];
            const finalGeoms: ThreeNS.BufferGeometry[] = [];
            ms.forEach((m) => {
              const g = m.geometry.clone();
              g.applyMatrix4(m.matrixWorld); // → model space
              const pos = g.getAttribute("position");
              const uv = new Float32Array(pos.count * 2);
              for (let i = 0; i < pos.count; i++) {
                uv[i * 2] = (pos.getX(i) * TM.s + TM.ox) / TM.w; // planar projection of the designer's top view
                uv[i * 2 + 1] = 1 - (TM.oy - pos.getY(i) * TM.s) / TM.h;
              }
              g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
              g.translate(-c.x, -c.y, -c.z); // the pivot is the piece's centre
              if (def.mirror) {
                /* the second monkey is the mirror image: flip x, then turn every triangle round so the front face stays the front */
                g.scale(-1, 1, 1);
                const ix = g.getIndex();
                if (ix) {
                  for (let i = 0; i < ix.count; i += 3) {
                    const t = ix.getX(i + 1);
                    ix.setX(i + 1, ix.getX(i + 2));
                    ix.setX(i + 2, t);
                  }
                  ix.needsUpdate = true;
                }
              }
              toDispose.push(g);
              finalGeoms.push(g);
              const mesh = new THREE.Mesh(g, mat);
              mesh.castShadow = false; // casts a shadow only once it stands in the theatre
              mesh.receiveShadow = false;
              pivot.add(mesh);
              meshes.push(mesh);
            });
            const sh = makeShadow(THREE, finalGeoms, size.x, size.y);
            toDispose.push(sh.mesh.geometry);
            pivot.add(sh.mesh);
            /* invisible, simple tap target (the real meshes have tens of thousands of triangles) */
            const hit = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 1.08, size.y * 1.08), hitMat);
            hit.userData.isHit = true;
            toDispose.push(hit.geometry);
            pivot.add(hit);
            pivot.position.copy(c);
            world.add(pivot);

            const p: Piece = {
              def,
              pivot,
              meshes,
              mat,
              size,
              home: c.clone(),
              kHome: 1,
              qFlat: new THREE.Quaternion(),
              qSeat: def.placed ? new THREE.Quaternion(...def.placed.q) : null,
              state: "sheet",
              anim: null,
              wp: null,
              rad: [],
              hover: 0,
              wantHover: false,
              shadow: sh.mesh,
              shadowMat: sh.mat,
              shelf: null,
            };
            pieces.push(p);
            r.push(p);
          }
          if (r.length) rows.push(r);
        }
        const hitToPiece = new Map<ThreeNS.Object3D, Piece>();
        pieces.forEach((p: Piece) => p.pivot.traverse((o: ThreeNS.Object3D) => o.userData.isHit && hitToPiece.set(o, p)));

        /* ---------- layout: camera, and where every piece lies on the left ---------- */
        const UP = new THREE.Vector3(0, 1, 0);
        const az = rad(AZ_VIEW);
        const el = rad(EL_VIEW);
        const dv = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)); // target → camera
        const right = new THREE.Vector3().crossVectors(UP, dv).normalize();
        const cup = new THREE.Vector3().crossVectors(dv, right).normalize();
        const toModel = (v: V3) => new THREE.Vector3(v.x, -v.z, v.y);
        /* flat pose: model X → screen right, model Y → screen up, model Z (the piece's face) → the camera */
        const qFlat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(toModel(right), toModel(cup), toModel(dv))
        );
        pieces.forEach((p: Piece) => p.qFlat.copy(qFlat));

        const boxPx = (b: Box, W: number, H: number, narrow: boolean) => {
          let f: Box;
          if (narrow) f = b;
          else f = { x0: b.x0 / 1440, y0: (b.y0 - CANVAS_TOP) / (CANVAS_BOTTOM - CANVAS_TOP), x1: b.x1 / 1440, y1: (b.y1 - CANVAS_TOP) / (CANVAS_BOTTOM - CANVAS_TOP) };
          return { x0: f.x0 * W, y0: f.y0 * H, x1: f.x1 * W, y1: f.y1 * H };
        };

        const place = (p: Piece) => {
          p.pivot.position.copy(p.home);
          p.pivot.quaternion.copy(p.qFlat);
          p.pivot.scale.setScalar(p.kHome * (1 + HOVER_LIFT * p.hover));
        };

        const layout = () => {
          const W = host.clientWidth || 1;
          const H = host.clientHeight || 1;
          const narrow = W < NARROW_BELOW;
          const bT = boxPx(narrow ? BOX_THEATRE_NARROW : BOX_THEATRE, W, H, narrow);
          const bS = boxPx(narrow ? BOX_SHEET_NARROW : BOX_SHEET, W, H, narrow);

          const d = fitCamera(THREE, camera, corners, T, dv, W, H, bT);
          const e = camera.projectionMatrix.elements;
          const pxPerM = ((e[0] / d) * W) / 2; // pixels per metre on the plane that holds the sheet

          /* rows: space-between inside the widest row, bottom-aligned, as large as the box allows */
          const wRow = (r: Piece[]) => r.reduce((s: number, p: Piece) => s + p.size.x, 0);
          const hRow = (r: Piece[]) => Math.max(...r.map((p: Piece) => p.size.y));
          const wMax = Math.max(...rows.map((r: Piece[]) => wRow(r) + (r.length - 1) * PIECE_GAP_MIN));
          const hTot = rows.reduce((s: number, r: Piece[]) => s + hRow(r), 0) + (rows.length - 1) * ROW_GAP_M;
          const k = Math.min((bS.x1 - bS.x0) / wMax, (bS.y1 - bS.y0) / hTot) * SHEET_FILL; // px per metre of the sheet
          const left = (bS.x0 + bS.x1) / 2 - (wMax * k) / 2;
          let top = (bS.y0 + bS.y1) / 2 - (hTot * k) / 2;

          rows.forEach((r: Piece[]) => {
            const hr = hRow(r);
            const gap = r.length > 1 ? Math.min(PIECE_GAP_MAX, (wMax - wRow(r)) / (r.length - 1)) : 0;
            let x = left;
            r.forEach((p: Piece) => {
              const cx = x + (p.size.x * k) / 2;
              const cy = top + (hr * k) - (p.size.y * k) / 2;
              const pt = planePoint(THREE, camera, W, H, d, cx, cy);
              p.home.copy(toModel(pt));
              p.kHome = k / pxPerM;
              if (p.state === "sheet") place(p);
              x += p.size.x * k + gap * k;
            });
            top += hr * k + ROW_GAP_M * k;
          });
        };

        /* ---------- the moves ---------- */
        const extras: Piece[] = []; // pieces on the shelf without a designer spot, oldest first
        const stageIds = () => pieces.filter((p: Piece) => p.state !== "sheet").map((p: Piece) => p.def.id);
        const sync = () => setOnStage(stageIds());

        const startAnim = (p: Piece, pts: V3[], radii: number[], q1: Q, s1: number, toStage: boolean, delay = 0) => {
          const path = roundedPath(THREE, pts, radii);
          const cum = [0];
          for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + path[i].distanceTo(path[i - 1]));
          const len = cum[cum.length - 1];
          p.anim = {
            t0: performance.now() + delay,
            dur: reduce ? 0.001 : clamp(0.9 + len * 0.45, FLY_MIN, FLY_MAX),
            pts: path,
            cum,
            len,
            q0: p.pivot.quaternion.clone(),
            q1,
            s0: p.pivot.scale.x,
            s1,
            toStage,
          };
          p.state = "moving";
          p.wantHover = false;
          p.hover = 0;
        };

        const pathAt = (a: Anim, s: number, out: V3) => {
          if (a.len < 1e-9) return out.copy(a.pts[0]);
          let lo = 0;
          let hi = a.cum.length - 1;
          while (hi - lo > 1) {
            const mid = (lo + hi) >> 1;
            if (a.cum[mid] <= s) lo = mid;
            else hi = mid;
          }
          const seg = a.cum[hi] - a.cum[lo];
          const t = seg < 1e-9 ? 0 : (s - a.cum[lo]) / seg;
          return out.lerpVectors(a.pts[lo], a.pts[hi], clamp(t, 0, 1));
        };

        const setCast = (p: Piece, on: boolean) => p.meshes.forEach((m: ThreeNS.Mesh) => (m.castShadow = on));

        /* take a piece to the theatre */
        const sendIn = (p: Piece, delay = 0) => {
          const S = p.home.clone();
          const half = p.size.y / 2;
          const pl = p.def.placed;
          let wp: V3[];
          let radii: number[];
          let q1: Q;

          if (pl && pl.where === "pad") {
            /* foot pads are in the open: fly over, then lower the piece straight down into its groove */
            const to = new THREE.Vector3(...pl.to);
            wp = [S, new THREE.Vector3(to.x, to.y, to.z + 0.34), to];
            radii = [0, 0.14, 0];
            q1 = (p.qSeat as Q).clone();
          } else if (pl && pl.where === "side") {
            /* hung on the outside of a side panel: come in from the front, then slide back onto the hook */
            const to = new THREE.Vector3(...pl.to);
            wp = [S, new THREE.Vector3(to.x, to.y - 0.24, to.z + 0.06), to];
            radii = [0, 0.14, 0];
            q1 = (p.qSeat as Q).clone();
          } else {
            /* shelf: in through the front window just above the shelf, then down into the groove, then along it */
            let groove: number;
            let xSeat: number;
            let zSeat: number;
            if (pl) {
              groove = Math.abs(pl.to[1] - ENV_SHELF.grooves[0]) < 0.01 ? 0 : 1;
              xSeat = pl.to[0];
              zSeat = pl.to[2];
              q1 = (p.qSeat as Q).clone();
            } else {
              const taken = extras.map((o: Piece) => o.shelf as ShelfItemX);
              let spot = findShelfSpot(p.size.x, p.size.y, taken);
              while (!spot) {
                /* the shelf is full: send back ONE piece — the oldest whose place would be big enough, else the oldest */
                const cands = extras.filter((o: Piece) => o.state === "stage");
                if (!cands.length) break;
                const pickOut =
                  cands.find((o: Piece) => findShelfSpot(p.size.x, p.size.y, taken.filter((t: ShelfItemX) => t !== o.shelf)) !== null) ?? cands[0];
                sendOut(pickOut, 0);
                spot = findShelfSpot(p.size.x, p.size.y, extras.map((o: Piece) => o.shelf as ShelfItemX));
              }
              if (!spot) return;
              groove = spot.groove;
              xSeat = spot.x;
              zSeat = ENV_SHELF.seatZ + half;
              q1 = new THREE.Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
              p.shelf = { groove, x0: xSeat - p.size.x / 2, x1: xSeat + p.size.x / 2, x: xSeat };
              extras.push(p);
            }
            const yG = ENV_SHELF.grooves[groove];
            const xIn = windowEntryX(xSeat, p.size.x, p.size.y);
            const zPass = ENV_SHELF.sillZ + 0.006 + half;
            wp = [
              S,
              new THREE.Vector3(xIn, 1.5, zPass + 0.24),
              new THREE.Vector3(xIn, 1.62, zPass),
              new THREE.Vector3(xIn, yG, zPass),
              new THREE.Vector3(xIn, yG, zSeat),
            ];
            radii = [0, 0.16, 0.03, 0.012, 0.01];
            if (Math.abs(xIn - xSeat) > 1e-4) {
              wp.push(new THREE.Vector3(xSeat, yG, zSeat));
              radii.push(0);
            }
          }
          p.wp = wp.map((v: V3) => v.clone());
          p.rad = radii.slice();
          startAnim(p, wp, radii, q1, 1, true, delay);
          setCast(p, true);
          sync();
        };

        /* take a piece back to the left: the way in, backwards */
        function sendOut(p: Piece, delay = 0) {
          if (p.state !== "stage" || !p.wp) return;
          const ex = extras.indexOf(p);
          if (ex >= 0) extras.splice(ex, 1);
          p.shelf = null;
          const wp = p.wp.map((v: V3) => v.clone()).reverse();
          wp[wp.length - 1].copy(p.home);
          const radii = p.rad.slice().reverse();
          startAnim(p, wp, radii, p.qFlat.clone(), p.kHome, false, delay);
          setCast(p, false);
          sync();
        }

        const toggle = (p: Piece) => {
          if (p.state === "sheet") sendIn(p);
          else if (p.state === "stage") sendOut(p);
        };
        api.current = {
          toggle: (id: string) => {
            const p = pieces.find((q: Piece) => q.def.id === id);
            if (p) toggle(p);
          },
          reset: () => {
            let i = 0;
            pieces.forEach((p: Piece) => {
              if (p.state === "stage") sendOut(p, i++ * RESET_STAGGER);
            });
          },
        };

        /* ---------- pointer: hover + tap ---------- */
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const pick = (ev: MouseEvent): Piece | null => {
          const r = dom.getBoundingClientRect();
          ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          const hits = ray.intersectObjects([...hitToPiece.keys()], false);
          for (const h of hits) {
            const p = hitToPiece.get(h.object);
            if (p && p.state !== "moving") return p;
          }
          return null;
        };
        let hovered: Piece | null = null;
        const onMove = (ev: PointerEvent) => {
          if (ev.pointerType === "touch") return;
          const p = pick(ev);
          if (p !== hovered) {
            if (hovered) hovered.wantHover = false;
            hovered = p;
            if (p) p.wantHover = true;
            dom.style.cursor = p ? "pointer" : "";
          }
        };
        const onLeave = () => {
          if (hovered) hovered.wantHover = false;
          hovered = null;
          dom.style.cursor = "";
        };
        const onClick = (ev: MouseEvent) => {
          const p = pick(ev);
          if (p) toggle(p);
        };
        dom.addEventListener("pointermove", onMove);
        dom.addEventListener("pointerleave", onLeave);
        dom.addEventListener("click", onClick);

        /* ---------- frame loop ---------- */
        const tmp = new THREE.Vector3();
        let onScreen = false; // becomes true only when the section is actually visible (see the observer below)
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          if (!onScreen) return;
          for (const p of pieces) {
            let shK = p.state === "sheet" ? 1 : 0; // how much of its soft shadow shows
            if (p.state === "moving" && p.anim) {
              const a = p.anim;
              const k = clamp((now - a.t0) / (a.dur * 1000), 0, 1);
              const e = ease(k);
              p.pivot.position.copy(pathAt(a, e * a.len, tmp));
              p.pivot.quaternion.slerpQuaternions(a.q0, a.q1, smooth(clamp(e / 0.6, 0, 1)));
              p.pivot.scale.setScalar(lerp(a.s0, a.s1, smooth(clamp(e / 0.7, 0, 1))));
              shK = a.toStage ? 1 - smooth(clamp(e / 0.25, 0, 1)) : smooth(clamp((e - 0.7) / 0.3, 0, 1));
              if (k >= 1) {
                p.state = a.toStage ? "stage" : "sheet";
                p.anim = null;
                if (p.state === "sheet") place(p);
                sync();
              }
            } else {
              const target = p.wantHover ? 1 : 0;
              if (Math.abs(p.hover - target) > 0.002) p.hover += (target - p.hover) * 0.22;
              else p.hover = target;
              if (p.state === "sheet") p.pivot.scale.setScalar(p.kHome * (1 + HOVER_LIFT * p.hover));
            }
            p.mat.emissiveIntensity = 0.22 * p.hover;
            p.shadowMat.opacity = SHADOW_OPACITY * shK * (1 + 0.35 * p.hover);
            p.shadow.visible = shK > 0.003;
            /* a piece that is lifted by the cursor casts its shadow a little further away */
            p.shadow.position.set(SHADOW_DX * (1 + 0.8 * p.hover), SHADOW_DY * (1 + 0.8 * p.hover), -0.006);
          }
          renderer.render(scene, camera);
        };

        /* ---------- size, visibility ---------- */
        const resize = () => {
          const W = host.clientWidth || 1;
          const H = host.clientHeight || 1;
          renderer.setSize(W, H, false);
          layout();
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);
        const io = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            if (entries[0]) onScreen = entries[0].isIntersecting;
          },
          { threshold: 0.05 }
        );
        io.observe(outer);

        raf = requestAnimationFrame(tick);

        teardown = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          ro.disconnect();
          dom.removeEventListener("pointermove", onMove);
          dom.removeEventListener("pointerleave", onLeave);
          dom.removeEventListener("click", onClick);
          toDispose.forEach((g: ThreeNS.BufferGeometry) => g.dispose());
          pieces.forEach((p: Piece) => {
            p.mat.dispose();
            p.shadowMat.map?.dispose();
            p.shadowMat.dispose();
          });
          partMat.forEach((m: ThreeNS.MeshStandardMaterial) => m.dispose());
          theatre.scene.traverse((o: ThreeNS.Object3D) => (o as ThreeNS.Mesh).geometry?.dispose());
          chars.scene.traverse((o: ThreeNS.Object3D) => (o as ThreeNS.Mesh).geometry?.dispose());
          hitMat.dispose();
          tex?.dispose();
          renderer.dispose();
          dom.remove();
          api.current = null;
        };
        /* the component was unmounted while the scene was still being built */
        if (disposed) teardown();
      } catch (err) {
        console.error("[ProjectEnvironment] could not start the 3D scene:", err instanceof Error ? err.message : err);
      }
    };

    /* download the models quietly once the page has finished loading (no main-thread cost), so they are ready on arrival */
    const startFetch = () => {
      getBuffers().catch((err: unknown) => console.error("[ProjectEnvironment]", err instanceof Error ? err.message : err));
    };
    const idle = (cb: () => void) => {
      const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout: 4000 });
      else setTimeout(cb, 1500);
    };
    if (document.readyState === "complete") idle(startFetch);
    else window.addEventListener("load", () => idle(startFetch), { once: true });

    /* do nothing 3D until the section is close to the screen */
    const gate = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          gate.disconnect();
          boot();
        }
      },
      { rootMargin: `${START_MARGIN} 0px ${START_MARGIN} 0px` }
    );
    gate.observe(outer);

    return () => {
      disposed = true;
      gate.disconnect();
      cancelAnimationFrame(raf);
      teardown?.();
    };
  }, []);

  return (
    <section
      ref={outerRef}
      className="pd-page pe"
      aria-label={`${ENV_TEXT.number} ${ENV_TEXT.title}`}
      style={cssVars({
        "--pe-num": NUM_X,
        "--pe-title": TITLE_X,
        "--pe-head-y": HEAD_Y,
        "--pe-para-x": PARA_X,
        "--pe-para-y": PARA_Y,
        "--pe-hint-y": HINT_Y,
        "--pe-ul": UL_OFFSET,
        "--pe-cv-top": CANVAS_TOP,
        "--pe-cv-h": CANVAS_BOTTOM - CANVAS_TOP,
      })}
    >
      <div className="pe-stage">
        <h2 className="pe-head pe-r">
          <span className="pe-head-n">{ENV_TEXT.number}</span>
          <span className="pe-head-t">{ENV_TEXT.title}</span>
        </h2>

        <p className="pe-para pe-r">
          {ENV_TEXT.paragraph.map((line: string, i: number) => (
            <span key={i} className="pe-line">
              {line}
              {i < ENV_TEXT.paragraph.length - 1 ? " " : null}
            </span>
          ))}
        </p>

        {/* second paragraph: the text hugs its own box, so the hand-drawn underline is exactly as wide as the text */}
        <p className="pe-hint pe-r">
          <span className="pe-ul-text">
            {ENV_TEXT.hint}
            <span className="pe-ul" aria-hidden="true" />
          </span>
        </p>

        <div className="pe-canvas pe-r" role="img" aria-label={ENV_TEXT.alt}>
          <div ref={hostRef} className="pe-host" />
        </div>

        {/* keyboard and screen-reader route: the same tap, without the mouse */}
        <ul className="pe-sr" aria-label="Character pieces">
          {flat.map((d: EnvPiece) => {
            const on = onStage.includes(d.id);
            return (
              <li key={d.id}>
                <button type="button" aria-pressed={on} onClick={() => api.current?.toggle(d.id)}>
                  {on ? `Take the ${d.label.toLowerCase()} off the stage` : `Put the ${d.label.toLowerCase()} on the stage`}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className={onStage.length ? "pe-reset is-on" : "pe-reset"}
          tabIndex={onStage.length ? 0 : -1}
          onClick={() => api.current?.reset()}
        >
          {ENV_TEXT.reset}
        </button>
      </div>

      <noscript>
        <style>{`.pe-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.pe {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu (same grid as the Build page) */
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
}
.pe-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; }

/* ---- heading: "2." regular + "Build the environment" semibold, as on the first COMPOSE page ---- */
.pe-head {
  position: absolute; z-index: 2; margin: 0; display: flex; align-items: baseline; gap: calc(6 * var(--cu));
  left: calc(var(--ax) + var(--pe-num) * var(--cu));
  top: calc(var(--y0) + var(--pe-head-y) * var(--cu));
  font-size: max(15px, calc(20 * var(--cu))); line-height: calc(28 * var(--cu)); letter-spacing: 0; color: var(--ink); white-space: nowrap;
}
.pe-head-n { font-weight: 400; }
.pe-head-t { font-weight: 600; }

.pe-para {
  position: absolute; z-index: 2; margin: 0; pointer-events: none;
  left: calc(var(--ax) + var(--pe-para-x) * var(--cu));
  top: calc(var(--y0) + var(--pe-para-y) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
}
.pe-line { display: block; white-space: nowrap; }

/* the red-underlined line: same type as the paragraph, one blank line below it */
.pe-hint {
  position: absolute; z-index: 2; margin: 0; pointer-events: none; white-space: nowrap;
  left: calc(var(--ax) + var(--pe-para-x) * var(--cu));
  top: calc(var(--y0) + var(--pe-hint-y) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
}
.pe-ul-text { display: inline-block; position: relative; white-space: nowrap; }
/* hand-drawn underline (client artwork, /public/nav-underline.png) — the same recipe as the Build page and FABRICATION.
   The PNG is a SQUARE canvas with the stroke at ~62.4% of its height, so it is scaled to the text's width (100% auto)
   and shifted so the stroke lands in the middle of a 12-artboard-px strip. Always visible. */
.pe-ul {
  position: absolute; left: 0; right: 0;
  bottom: calc(var(--pe-ul) * var(--cu));
  height: calc(12 * var(--cu));
  background-image: url('/nav-underline.png');
  background-size: 100% auto;
  background-position: center 62.4%;
  background-repeat: no-repeat;
  pointer-events: none;
}

/* ---- 3D canvas: full artboard width, behind the text ---- */
.pe-canvas {
  position: absolute; z-index: 1; left: var(--ax); width: calc(1440 * var(--cu));
  top: calc(var(--y0) + var(--pe-cv-top) * var(--cu)); height: calc(var(--pe-cv-h) * var(--cu));
}
.pe-host { position: absolute; inset: 0; }

/* ---- reset ---- */
.pe-reset {
  position: absolute; z-index: 3; margin: 0; padding: 0; border: 0; background: none; cursor: pointer;
  right: calc(var(--ax) + 90 * var(--cu)); top: calc(var(--y0) + var(--pe-head-y) * var(--cu));
  font: inherit; font-size: max(12px, calc(16 * var(--cu))); line-height: calc(28 * var(--cu)); font-weight: 500;
  color: #8A8A8A; text-decoration: underline; text-underline-offset: 3px;
  opacity: 0; pointer-events: none; transition: opacity .6s var(--ease), color .2s ease;
}
.pe-reset.is-on { opacity: 1; pointer-events: auto; }
.pe-reset:hover, .pe-reset:focus-visible { color: var(--ink); }

/* ---- hidden list for keyboard / screen readers ---- */
.pe-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); list-style: none; }
.pe-sr li { display: contents; }
.pe-sr button:focus-visible {
  position: fixed; z-index: 50; left: 16px; bottom: 16px; width: auto; height: auto; padding: 8px 12px;
  background: #fff; border: 1px solid var(--ink); color: var(--ink); font: inherit; font-size: 14px; clip: auto;
}

/* ---- reveal ---- */
.pe-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .pe-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
}
.is-in .pe-para { transition-delay: 110ms; }
.is-in .pe-hint { transition-delay: 200ms; }
.is-in .pe-canvas { transition-delay: 300ms; }

/* ---- phones: text on top, the theatre, then the pieces (all in one tall canvas) ---- */
@media (max-width: 820px) {
  .pe { --cu: 1px; --y0: 0px; }
  .pe-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 0 56px; }
  .pe-head, .pe-para, .pe-hint, .pe-canvas, .pe-reset { position: static; transform: none; }
  .pe-head { margin: 0 16px 16px; font-size: 18px; line-height: 28px; gap: 6px; }
  .pe-para { margin: 0 16px 14px; font-size: 14px; line-height: 22px; }
  .pe-hint { margin: 0 16px 24px; font-size: 14px; line-height: 22px; white-space: normal; }
  .pe-ul-text { white-space: normal; }
  .pe-ul { bottom: -9px; height: 12px; }
  .pe-line { display: inline; white-space: normal; }
  .pe-canvas { position: relative; left: 0; width: 100%; height: 150vw; min-height: 560px; }
  .pe-reset { display: block; margin: 14px 16px 0; font-size: 14px; line-height: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .pe-r { opacity: 1; transform: none; transition: none !important; }
}
`;