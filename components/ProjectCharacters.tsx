"use client";

/* components/ProjectCharacters.tsx   (or src/components/ProjectCharacters.tsx)
 *
 * Project eight — COMPOSE · "3. Pick your characters"  (Canva page 107)
 *
 * · 1440 × 900 artboard scaled by --cu, one WebGL canvas, three.js loaded on demand,
 *   nothing starts until the section is near the screen.
 * · Orthographic camera measured in artboard pixels → every box lands exactly where it is on Canva.
 * · Arrival: stick puppets show the BUNCH pose for CHAR_HOLD_MS, then glide (staggered) to the OPEN pose.
 * · DRAGON 1 (big, blue/yellow/red/green) is a real SCISSOR (lazy-tongs) mechanism. It is visible from the
 *   first frame in its FOLDED pose and opens into the Canva pose; the motion starts 2 s before the puppets
 *   reach their final position. All 6 bars and all 8 rivets are driven by ONE solved linkage
 *   (data/dragonMechanism.ts), so nothing can drift apart.
 * · DRAGON 2 (small, pink/orange/grey) is stationary, visible from the first frame.
 * · prefers-reduced-motion: no animation, final poses are shown straight away.
 *
 * Needs:  three · data/puppetCharacters.ts · data/dragonMechanism.ts
 * Files:  public/projects/puppet-theatre/characters/
 *           stick-puppets-bunch.glb, dragon.glb, tex-*.jpg
 *           dragon-materials/dragon1-{blue,yellow,red,green}.jpg
 *           dragon-materials/dragon2-{pink,orange,light}.jpg
 */

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import type * as ThreeNS from "three";
import {
  CHAR_BOUNDS,
  CHAR_BUNCH_URL,
  CHAR_HOLD_MS,
  CHAR_MOVE_MS,
  CHAR_PARTS,
  CHAR_SHADOW,
  CHAR_STAGGER_MS,
  CHAR_STICKS_BOX,
  CHAR_TEXT,
} from "../data/puppetCharacters";
import type { Box } from "../data/puppetCharacters";
import { DRAGON_BAR_ORDER, DRAGON_FRAMES } from "../data/dragonMechanism";

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const NUM_X = 108; //   "3."
const TITLE_X = 126; // "Pick your characters"
const HEAD_Y = 90; //   top of the heading line (its centre is y = 104, as on Canva)
const PARA_X = 91;
const PARA_Y = 138; //  top of the first paragraph line (line centres 151 / 177 on Canva)
const CANVAS_TOP = 96;
const CANVAS_BOTTOM = 900;
const DESIGN_W = 1440;

/* Dragons: both use the same GLB, only the paper materials differ. Boxes are measured on the Canva page. */
const DRAGON_GLB_URL = "/projects/puppet-theatre/characters/dragon.glb";
const DRAGON1_BOX: Box = { x0: 540, y0: 228, x1: 1047, y1: 460 };
const DRAGON2_BOX: Box = { x0: 585, y0: 508, x1: 945, y1: 668 };
const DRAGON_ARRIVAL_MS = 2000; // the scissor opens during the 2 s BEFORE the puppets reach their place
const DRAGON_TEX_SPAN = 150; //   GLB units covered by one picture: smaller = bigger speckles

const DM = "/projects/puppet-theatre/characters/dragon-materials/";
/* Order = DRAGON_BAR_ORDER: Body1 head+neck · .001 centre · .002 · .003 · .004 tail · .005 end bar.
   Dragon 1 follows the Canva render:  blue head/neck, yellow centre, red, green (top-right), green tail, blue end bar. */
const DRAGON1_TEXTURES = [
  DM + "dragon1-blue.jpg",
  DM + "dragon1-yellow.jpg",
  DM + "dragon1-red.jpg",
  DM + "dragon1-green.jpg",
  DM + "dragon1-green.jpg",
  DM + "dragon1-blue.jpg",
];
/* Dragon 2 follows the designer's new reference: pink head + pink upper bars, grey centre bar, orange tail + orange lower bars. */
const DRAGON2_TEXTURES = [
  DM + "dragon2-pink.jpg", //   Body1      head + neck
  DM + "dragon2-light.jpg", //  Body1.001  centre bar
  DM + "dragon2-orange.jpg", // Body1.002
  DM + "dragon2-pink.jpg", //   Body1.003
  DM + "dragon2-orange.jpg", // Body1.004  tail
  DM + "dragon2-orange.jpg", // Body1.005
];
const DRAGON1_FALLBACK = ["#243d78", "#e3c75c", "#c94f3c", "#176c5c", "#176c5c", "#243d78"];
const DRAGON2_FALLBACK = ["#e7a9bd", "#d9d7d0", "#c96e59", "#e7a9bd", "#c96e59", "#c96e59"];

/* phones: the canvas turns into one tall column (design width 720) */
const NARROW_BELOW = 700;
const NARROW_W = 720;
const NARROW_ROW_H = 1040;
const NARROW_PAD = 24;

/* lighting */
const LIGHT_HEMI = 2.2;
const LIGHT_FRONT = 1.5;
const LIGHT_SHADOW = 0.35;

const START_MARGIN = "1500px";

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInOut = (x: number) => x * x * (3 - 2 * x);
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const norm = (s: string) => s.toLowerCase().replace(/\.\d+$/, "").replace(/[^a-z0-9]/g, "");

/* three.js strips "." from node names ("Body1.001" → "Body1001"); the original name lives in userData.name */
const origName = (o: ThreeNS.Object3D) => ((o.userData as { name?: string }).name ?? o.name) || "";

/** Scale and centre that make a model box (metres) fill a page box (px) with "contain". */
export function fitBox(page: Box, b: { x0: number; x1: number; y0: number; y1: number }) {
  const w = page.x1 - page.x0;
  const h = page.y1 - page.y0;
  return {
    k: Math.min(w / (b.x1 - b.x0), h / (b.y1 - b.y0)),
    cx: (page.x0 + page.x1) / 2,
    cy: (page.y0 + page.y1) / 2,
  };
}

export default function ProjectCharacters() {
  const outerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

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

  /* the 3D scene — starts only when the section is near the screen */
  useEffect(() => {
    const host = hostRef.current;
    const outer = outerRef.current;
    const cv = canvasRef.current;
    if (!host || !outer || !cv) return;

    let disposed = false;
    let started = false;
    let raf = 0;
    let teardown: (() => void) | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const boot = async () => {
      try {
        await yieldToMain();
        if (disposed) return;
        const [THREE, { GLTFLoader }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (disposed) return;

        /* ---------- renderer, scene, lights ---------- */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        const dom = renderer.domElement;
        dom.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
        host.appendChild(dom);

        const scene = new THREE.Scene();
        /* scene units = artboard px; scene y = −(artboard y) */
        const camera = new THREE.OrthographicCamera(0, DESIGN_W, -CANVAS_TOP, -CANVAS_BOTTOM, 1, 4000);
        camera.position.set(0, 0, 1500);

        scene.add(new THREE.HemisphereLight(0xffffff, 0xffffff, LIGHT_HEMI));
        const front = new THREE.DirectionalLight(0xffffff, LIGHT_FRONT);
        front.position.set(0, 0, 1000);
        scene.add(front);

        const sun = new THREE.DirectionalLight(0xffffff, LIGHT_SHADOW);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        sun.shadow.radius = CHAR_SHADOW.blur;
        sun.shadow.blurSamples = 16;
        sun.shadow.bias = -0.0005;
        scene.add(sun, sun.target);

        const wall = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.ShadowMaterial({ opacity: CHAR_SHADOW.opacity })
        );
        wall.receiveShadow = true;
        scene.add(wall);

        /* ---------- load the models and the colour pictures ---------- */
        const loader = new GLTFLoader();
        const texLoader = new THREE.TextureLoader();
        const texCache = new Map<string, ThreeNS.Texture | null>();
        const getTex = (url: string) =>
          texLoader
            .loadAsync(url)
            .then((t: ThreeNS.Texture) => {
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
              t.wrapS = THREE.MirroredRepeatWrapping; // mirrored → no visible seam if a bar is longer than the picture
              t.wrapT = THREE.MirroredRepeatWrapping;
              texCache.set(url, t);
              return t;
            })
            .catch((err: unknown) => {
              console.error("[ProjectCharacters] texture missing:", url, err);
              texCache.set(url, null);
              return null;
            });

        const urls = Array.from(
          new Set([
            ...CHAR_PARTS.map((p) => p.tex).filter((u): u is string => !!u),
            ...DRAGON1_TEXTURES,
            ...DRAGON2_TEXTURES,
          ])
        );

        const [gltf, dragonGltf] = await Promise.all([
          loader.loadAsync(CHAR_BUNCH_URL),
          loader.loadAsync(DRAGON_GLB_URL),
          Promise.all(urls.map(getTex)),
        ] as const);

        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }
        await yieldToMain();

        /* ---------- build the stick puppets ---------- */
        const byKey = new Map<string, ThreeNS.Mesh>();
        gltf.scene.traverse((o: ThreeNS.Object3D) => {
          const m = o as ThreeNS.Mesh;
          if (m.isMesh) byKey.set(norm(origName(m)), m);
        });

        type Part = { key: string; mesh: ThreeNS.Mesh; deg: number; a: ThreeNS.Vector3; b: ThreeNS.Vector3 };
        const parts: Part[] = [];
        const ownMats: ThreeNS.Material[] = [];

        // Each wooden control stick uses exactly the same stagger/progress as its puppet.
        const STICK_TO_PUPPET: Record<string, string> = {
          Body284: "dino",
          Body285: "dance fig",
          Body286: "alien",
          Body287: "honeybee",
          Body288: "Body249",
        };
        const PUPPET_ORDER = ["alien", "Body249", "dance fig", "dino", "honeybee"];
        const puppetOrderIndex = new Map<string, number>(PUPPET_ORDER.map((key, index): [string, number] => [key, index]));
        const getAnimationIndex = (key: string) => puppetOrderIndex.get(STICK_TO_PUPPET[key] ?? key) ?? 0;

        CHAR_PARTS.forEach((def) => {
          const mesh = byKey.get(norm(def.key));
          if (!mesh) {
            console.warn(`[ProjectCharacters] "${def.key}" not found in ${CHAR_BUNCH_URL}`);
            return;
          }
          const s = mesh.scale.x; // the file stores every piece at scale 10
          const g = mesh.geometry;
          g.translate(-def.from[0], -def.from[1], -def.from[2]); // the pivot is the piece's centre
          const tex = def.tex ? texCache.get(def.tex) ?? null : null;
          if (def.tex) {
            if (tex) {
              /* planar picture projection in the plate's own plane: the swatch moves with the piece */
              const img = tex.image as { width: number; height: number };
              const iw = img.width;
              const ih = img.height;
              const mn = Math.min(iw, ih);
              const pos = g.getAttribute("position");
              let ext = 0;
              for (let i = 0; i < pos.count; i++) ext = Math.max(ext, Math.abs(pos.getX(i)), Math.abs(pos.getZ(i)));
              ext *= 2;
              const f = def.texFrac ?? 0.6;
              const uv = new Float32Array(pos.count * 2);
              for (let i = 0; i < pos.count; i++) {
                uv[i * 2] = 0.5 + (pos.getX(i) / ext) * f * (mn / iw);
                uv[i * 2 + 1] = 0.5 + (-pos.getZ(i) / ext) * f * (mn / ih);
              }
              g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
            }
            const mat = new THREE.MeshStandardMaterial({
              map: tex,
              color: tex ? 0xffffff : def.fallback ?? "#999999",
              roughness: 0.72,
              metalness: 0,
              side: THREE.DoubleSide,
            });
            mesh.material = mat;
            ownMats.push(mat);
          } else {
            (mesh.material as ThreeNS.MeshStandardMaterial).side = THREE.DoubleSide;
          }
          mesh.castShadow = true;
          mesh.receiveShadow = false;
          const a = new THREE.Vector3(def.from[0] * s, def.from[1] * s, def.from[2] * s);
          const b = new THREE.Vector3(def.to[0] * s, def.to[1] * s, def.to[2] * s);
          mesh.position.copy(a);
          parts.push({ key: def.key, mesh, deg: def.deg, a, b });
        });

        const holder = new THREE.Group(); // scale = px per metre, position = page position
        holder.add(gltf.scene);
        scene.add(holder);

        /* ---------- the two dragons (same GLB, different paper) ---------- */
        type DragonRig = {
          root: ThreeNS.Group;
          model: ThreeNS.Group;
          bars: ThreeNS.Object3D[]; //   6 bar groups, in DRAGON_BAR_ORDER
          rivets: ThreeNS.Object3D[]; // 8 rivet groups, Body4 … Body4.007
          rivetY: number[];
          finalX: number;
          finalY: number;
          baseWidth: number;
          baseHeight: number;
        };

        /* The dragon is a flat paper/CAD model: its plane is X/Z and Y is the paper thickness.
           The picture is projected on that plane at a constant physical size, in the bar's own space,
           so the paper pattern travels with the bar while the scissor moves. */
        const planarUv = (geometry: ThreeNS.BufferGeometry) => {
          const position = geometry.getAttribute("position");
          if (!position) return;
          let minX = Infinity;
          let minZ = Infinity;
          let maxZ = -Infinity;
          for (let i = 0; i < position.count; i++) {
            minX = Math.min(minX, position.getX(i));
            minZ = Math.min(minZ, position.getZ(i));
            maxZ = Math.max(maxZ, position.getZ(i));
          }
          const uv = new Float32Array(position.count * 2);
          for (let i = 0; i < position.count; i++) {
            uv[i * 2] = ((position.getX(i) - minX) * 10) / DRAGON_TEX_SPAN;
            uv[i * 2 + 1] = ((maxZ - position.getZ(i)) * 10) / DRAGON_TEX_SPAN;
          }
          geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        };

        const rivetMat = new THREE.MeshStandardMaterial({ color: 0xe8eff0, roughness: 0.38, metalness: 0.25 });
        ownMats.push(rivetMat);

        const makeDragon = (textures: string[], fallback: string[]): DragonRig => {
          const model = dragonGltf.scene.clone(true) as ThreeNS.Group;
          const top = model.children[0]; // the single root node of the CAD file
          const ownerOf = (o: ThreeNS.Object3D) => {
            let n: ThreeNS.Object3D = o;
            while (n.parent && n.parent !== top) n = n.parent;
            return n;
          };

          const barOwner: (ThreeNS.Object3D | null)[] = DRAGON_BAR_ORDER.map(() => null);
          const rivetList: { n: number; owner: ThreeNS.Object3D; mesh: ThreeNS.Mesh }[] = [];

          model.traverse((object: ThreeNS.Object3D) => {
            const mesh = object as ThreeNS.Mesh;
            if (!mesh.isMesh) return;
            const name = origName(mesh);
            mesh.castShadow = true;
            mesh.receiveShadow = false;
            mesh.geometry = mesh.geometry.clone();

            const barIndex = DRAGON_BAR_ORDER.indexOf(name);
            if (barIndex >= 0) {
              barOwner[barIndex] = ownerOf(mesh);
              planarUv(mesh.geometry);
              const texture = texCache.get(textures[barIndex]) ?? null;
              const material = new THREE.MeshBasicMaterial({
                map: texture,
                color: texture ? 0xffffff : fallback[barIndex],
                side: THREE.DoubleSide,
                toneMapped: false,
              });
              mesh.material = material;
              ownMats.push(material);
              return;
            }
            const rm = /^Body4(?:\.(\d+))?$/.exec(name);
            if (rm) {
              mesh.material = rivetMat;
              rivetList.push({ n: rm[1] ? parseInt(rm[1], 10) : 0, owner: ownerOf(mesh), mesh });
            }
          });

          rivetList.sort((a, b) => a.n - b.n);
          if (barOwner.some((b) => !b)) console.warn("[ProjectCharacters] dragon: some bars were not found.");
          if (rivetList.length !== 8) console.warn(`[ProjectCharacters] Expected 8 dragon rivets, found ${rivetList.length}.`);

          model.updateMatrixWorld(true);
          const bounds = new THREE.Box3().setFromObject(model);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          bounds.getSize(size);
          bounds.getCenter(center);

          const root = new THREE.Group();
          model.position.sub(center);
          root.add(model);
          root.visible = true; // present from the very first frame
          scene.add(root);

          return {
            root,
            model,
            bars: barOwner.filter((b): b is ThreeNS.Object3D => !!b),
            rivets: rivetList.map((r) => r.owner),
            rivetY: rivetList.map((r) => r.owner.position.y),
            finalX: 0,
            finalY: 0,
            baseWidth: size.x,
            baseHeight: size.y,
          };
        };

        const dragon1 = makeDragon(DRAGON1_TEXTURES, DRAGON1_FALLBACK);
        const dragon2 = makeDragon(DRAGON2_TEXTURES, DRAGON2_FALLBACK);

        /* Scissor mechanism: open = 0 (folded) … 1 (extended = the Canva pose).
           Every bar and every rivet comes from the same solved frame, so all joints move together. */
        const LAST = DRAGON_FRAMES.length - 1;
        const setScissor = (rig: DragonRig, open: number) => {
          const f = (1 - clamp(open, 0, 1)) * LAST;
          const i0 = Math.floor(f);
          const i1 = Math.min(i0 + 1, LAST);
          const k = f - i0;
          const A = DRAGON_FRAMES[i0];
          const B = DRAGON_FRAMES[i1];
          rig.bars.forEach((g, i) => {
            const a = lerp(A[0][i][0], B[0][i][0], k);
            g.rotation.set(0, -a, 0); // model plane angle (x→z)  =  −rotation about the model's Y axis
            g.position.set(lerp(A[0][i][1], B[0][i][1], k), 0, lerp(A[0][i][2], B[0][i][2], k));
          });
          rig.rivets.forEach((g, i) => {
            g.position.set(lerp(A[1][i][0], B[1][i][0], k), rig.rivetY[i], lerp(A[1][i][1], B[1][i][1], k));
          });
        };

        /* progress 0 → 1 : folded → extended (Canva pose) */
        const setDragonPose = (progress: number) => setScissor(dragon1, easeInOut(clamp(progress, 0, 1)));

        /* ---------- layout ---------- */
        let boxB: Box = CHAR_STICKS_BOX.bunch;
        let boxO: Box = CHAR_STICKS_BOX.open;
        let fitB = fitBox(boxB, CHAR_BOUNDS.bunch);
        let fitO = fitBox(boxO, CHAR_BOUNDS.open);
        const cB = { x: (CHAR_BOUNDS.bunch.x0 + CHAR_BOUNDS.bunch.x1) / 2, y: (CHAR_BOUNDS.bunch.y0 + CHAR_BOUNDS.bunch.y1) / 2 };
        const cO = { x: (CHAR_BOUNDS.open.x0 + CHAR_BOUNDS.open.x1) / 2, y: (CHAR_BOUNDS.open.y0 + CHAR_BOUNDS.open.y1) / 2 };

        const placeDragon = (dragon: DragonRig, box: Box, narrow: boolean, second: boolean) => {
          let target = box;
          if (narrow) {
            /* Mobile: stick-puppet row first, then both dragons stacked below it. */
            const top = NARROW_PAD + NARROW_ROW_H * 0.58;
            const rowH = 190;
            target = !second
              ? { x0: 28, y0: top, x1: NARROW_W - 28, y1: top + rowH }
              : { x0: 100, y0: top + rowH + 28, x1: NARROW_W - 100, y1: top + rowH + 28 + rowH * 0.72 };
          }
          const scale = Math.min(
            (target.x1 - target.x0) / Math.max(dragon.baseWidth, 0.0001),
            (target.y1 - target.y0) / Math.max(dragon.baseHeight, 0.0001)
          );
          dragon.root.scale.setScalar(scale);
          dragon.finalX = (target.x0 + target.x1) / 2;
          dragon.finalY = -(target.y0 + target.y1) / 2;
          dragon.root.position.set(dragon.finalX, dragon.finalY, second ? 3 : 4);
        };

        const layout = () => {
          const W = host.clientWidth || 1;
          const narrow = W < NARROW_BELOW;
          let dw = DESIGN_W;
          let yTop = CANVAS_TOP;
          let yBot = CANVAS_BOTTOM;
          if (narrow) {
            dw = NARROW_W;
            yTop = 0;
            yBot = NARROW_PAD * 2 + NARROW_ROW_H;
            boxB = { x0: NARROW_PAD, y0: NARROW_PAD, x1: NARROW_W - NARROW_PAD, y1: NARROW_PAD + NARROW_ROW_H };
            boxO = boxB;
            cv.style.setProperty("--pc-nh", String((yBot / dw) * 100));
          } else {
            boxB = CHAR_STICKS_BOX.bunch;
            boxO = CHAR_STICKS_BOX.open;
            cv.style.removeProperty("--pc-nh");
          }
          const H = host.clientHeight || 1;
          renderer.setSize(W, H, false);
          camera.left = 0;
          camera.right = dw;
          camera.top = -yTop;
          camera.bottom = -yBot;
          camera.updateProjectionMatrix();
          fitB = fitBox(boxB, CHAR_BOUNDS.bunch);
          fitO = fitBox(boxO, CHAR_BOUNDS.open);

          /* the wall and the light that throws the shadow up-left */
          const tx = dw / 2;
          const ty = -(yTop + yBot) / 2;
          const dd = CHAR_SHADOW.depth;
          wall.scale.set(dw * 3, (yBot - yTop) * 3, 1);
          wall.position.set(tx, ty, -dd);
          sun.target.position.set(tx, ty, 0);
          const pz = 1500;
          sun.position.set(tx - (CHAR_SHADOW.dx * pz) / dd, ty - (CHAR_SHADOW.dy * pz) / dd, pz);
          const half = Math.max(dw, yBot - yTop) * 0.8;
          const sc = sun.shadow.camera;
          sc.left = -half;
          sc.right = half;
          sc.top = half;
          sc.bottom = -half;
          sc.near = 100;
          sc.far = 3500;
          sc.updateProjectionMatrix();

          setPose(poseG, poseK);
          placeDragon(dragon1, DRAGON1_BOX, narrow, false);
          placeDragon(dragon2, DRAGON2_BOX, narrow, true);
        };

        /* ---------- the stick-puppet pose ---------- */
        let poseG = reduce ? 1 : 0;
        let poseK: number[] = parts.map(() => (reduce ? 1 : 0));

        function setPose(g: number, k: number[]) {
          poseG = g;
          poseK = k;
          const s = lerp(fitB.k, fitO.k, g);
          holder.scale.setScalar(s);
          holder.position.set(lerp(fitB.cx, fitO.cx, g), -lerp(fitB.cy, fitO.cy, g), 0);
          gltf.scene.position.set(-lerp(cB.x, cO.x, g), -lerp(cB.y, cO.y, g), 0);
          parts.forEach((p: Part, i: number) => {
            const e = k[i] ?? g;
            p.mesh.position.lerpVectors(p.a, p.b, e);
            p.mesh.rotation.y = (p.deg * Math.PI * e) / 180;
          });
        }

        /* ---------- sequence: arrive → hold the bunch → open (dragon opens 2 s earlier) ---------- */
        let phase: "idle" | "hold" | "move" | "done" = reduce ? "done" : "idle";
        let t0 = 0;
        let sequenceStart = 0;
        const total = CHAR_MOVE_MS + CHAR_STAGGER_MS * Math.max(PUPPET_ORDER.length - 1, 0);
        let onScreen = false;

        /* the dragons are on screen from the first frame: dragon 2 is static, dragon 1 waits folded */
        setScissor(dragon2, 1);
        setDragonPose(reduce ? 1 : 0);

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          if (!onScreen) return;

          if (phase === "hold" && now - t0 >= CHAR_HOLD_MS) {
            phase = "move";
            t0 = now;
          }
          if (phase === "move") {
            const el = now - t0;
            const per = parts.map((part: Part) => {
              const animationIndex = getAnimationIndex(part.key);
              return ease(clamp((el - animationIndex * CHAR_STAGGER_MS) / CHAR_MOVE_MS, 0, 1));
            });
            setPose(ease(clamp(el / total, 0, 1)), per);
            if (el >= total) {
              phase = "done";
              setPose(1, parts.map(() => 1));
            }
          }

          if (!reduce && phase !== "idle") {
            /* puppets arrive at CHAR_HOLD_MS + total → the scissor starts DRAGON_ARRIVAL_MS before that */
            const dragonStartDelay = Math.max(0, CHAR_HOLD_MS + total - DRAGON_ARRIVAL_MS);
            const dragonElapsed = now - (sequenceStart + dragonStartDelay);
            setDragonPose(clamp(dragonElapsed / DRAGON_ARRIVAL_MS, 0, 1));
          }
          renderer.render(scene, camera);
        };

        const resize = () => layout();
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        /* arrival: start the hold when the page is mostly visible; reset when it has fully left */
        const io = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            const e = entries[entries.length - 1];
            if (!e) return;
            onScreen = e.isIntersecting;
            if (reduce) return;
            if (!e.isIntersecting) {
              phase = "idle";
              sequenceStart = 0;
              setDragonPose(0);
              setPose(0, parts.map(() => 0));
            } else if (e.intersectionRatio >= 0.55 && phase === "idle") {
              phase = "hold";
              t0 = performance.now();
              sequenceStart = t0;
              setDragonPose(0);
            }
          },
          { threshold: [0, 0.01, 0.55] }
        );
        io.observe(outer);

        raf = requestAnimationFrame(tick);

        teardown = () => {
          cancelAnimationFrame(raf);
          io.disconnect();
          ro.disconnect();
          parts.forEach((p: Part) => p.mesh.geometry.dispose());
          [dragon1, dragon2].forEach((d) =>
            d.model.traverse((o: ThreeNS.Object3D) => {
              const mesh = o as ThreeNS.Mesh;
              if (mesh.isMesh) mesh.geometry.dispose();
            })
          );
          ownMats.forEach((m: ThreeNS.Material) => m.dispose());
          texCache.forEach((t) => t?.dispose());
          wall.geometry.dispose();
          (wall.material as ThreeNS.Material).dispose();
          sun.shadow.map?.dispose();
          renderer.dispose();
          dom.remove();
        };
        if (disposed) teardown();
      } catch (err) {
        console.error("[ProjectCharacters] could not start the 3D scene:", err instanceof Error ? err.message : err);
      }
    };

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
      className="pd-page pc"
      aria-label={`${CHAR_TEXT.number} ${CHAR_TEXT.title}`}
      style={cssVars({
        "--pc-num": NUM_X,
        "--pc-title": TITLE_X,
        "--pc-head-y": HEAD_Y,
        "--pc-para-x": PARA_X,
        "--pc-para-y": PARA_Y,
        "--pc-cv-top": CANVAS_TOP,
        "--pc-cv-h": CANVAS_BOTTOM - CANVAS_TOP,
      })}
    >
      <div className="pc-stage">
        <h2 className="pc-head pc-r">
          <span className="pc-head-n">{CHAR_TEXT.number}</span>
          <span className="pc-head-t">{CHAR_TEXT.title}</span>
        </h2>
        <p className="pc-para pc-r">
          {CHAR_TEXT.paragraph.map((line: string, i: number) => (
            <span key={i} className="pc-line">
              {line}
              {i < CHAR_TEXT.paragraph.length - 1 ? " " : null}
            </span>
          ))}
        </p>
        <div ref={canvasRef} className="pc-canvas pc-r" role="img" aria-label={CHAR_TEXT.alt}>
          <div ref={hostRef} className="pc-host" />
        </div>
      </div>
      <noscript>
        <style>{`.pc-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.pc {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu (same grid as the Build page) */
  --ease: cubic-bezier(.22, 1, .36, 1);
  background: #fff;
}
.pc-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; }

/* heading: "3." regular + "Pick your characters" semibold */
.pc-head {
  position: absolute; z-index: 2; margin: 0; display: flex; align-items: baseline; gap: calc(6 * var(--cu));
  left: calc(var(--ax) + var(--pc-num) * var(--cu));
  top: calc(var(--y0) + var(--pc-head-y) * var(--cu));
  font-size: max(15px, calc(20 * var(--cu))); line-height: calc(28 * var(--cu)); letter-spacing: 0; color: var(--ink); white-space: nowrap;
}
.pc-head-n { font-weight: 400; }
.pc-head-t { font-weight: 600; }

.pc-para {
  position: absolute; z-index: 2; margin: 0; pointer-events: none;
  left: calc(var(--ax) + var(--pc-para-x) * var(--cu));
  top: calc(var(--y0) + var(--pc-para-y) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
}
.pc-line { display: block; white-space: nowrap; }

/* 3D canvas: full artboard width, behind the text */
.pc-canvas {
  position: absolute; z-index: 1; left: var(--ax); width: calc(1440 * var(--cu));
  top: calc(var(--y0) + var(--pc-cv-top) * var(--cu)); height: calc(var(--pc-cv-h) * var(--cu));
}
.pc-host { position: absolute; inset: 0; }

/* reveal */
.pc-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .pc-r { opacity: 1; transform: none; transition: opacity .9s var(--ease), transform 1.1s var(--ease); }
.is-in .pc-para { transition-delay: 110ms; }
.is-in .pc-canvas { transition-delay: 250ms; }

/* phones: text on top, then the canvas */
@media (max-width: 820px) {
  .pc { --cu: 1px; --y0: 0px; }
  .pc-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 0 56px; }
  .pc-head, .pc-para, .pc-canvas { position: static; transform: none; }
  .pc-head { margin: 0 16px 16px; font-size: 18px; line-height: 28px; gap: 6px; }
  .pc-para { margin: 0 16px 20px; font-size: 14px; line-height: 22px; }
  .pc-line { display: inline; white-space: normal; }
  .pc-canvas { position: relative; left: 0; width: 100%; height: calc(var(--pc-nh, 84) * 1vw); min-height: 320px; }
}
@media (prefers-reduced-motion: reduce) {
  .pc-r { opacity: 1; transform: none; transition: none !important; }
}
`;