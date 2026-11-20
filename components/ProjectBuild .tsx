"use client";
/* components/ProjectBuild.tsx   (or src/components/ProjectBuild.tsx)
 *
 * Project eight — page 102 "HOW IT WORKS · BUILD".
 *
 * The flat 3D panels sit in the LEFT box (REGION_FLAT). They are turned to FACE THE CAMERA, so their edges
 * are perfectly straight on screen (no slant). The NEXT panel to place blinks (lighter, pulsing). The visitor
 * clicks it and it flies into the RIGHT box (REGION_BUILT) to build the theatre, in the client's order 1–8.
 * Then the four loose pieces glide to the corner, and the visitor can drag to look around it.
 *
 * CAMERA: fixed for the whole build. Nothing zooms after the theatre is built.
 * FLAT LAYOUT: two groups — PURPLE (front panel, base, top panel, two small domes) and PINK (the rest).
 *   "row"   = both groups side by side, as in the original layout
 *   "stack" = purple on top, pink below
 *   "auto"  = whichever gives the BIGGER panels
 *
 * MODE = "auto" (below) builds it by itself instead, as the visitor arrives.
 *
 * Needs:   npm i three   and   npm i -D @types/three
 * Model:   public/projects/puppet-theatre/model/panel_flat.glb
 * Data:    data/puppetBuild.ts
 * Image:   public/nav-underline.png   (the same hand-drawn underline as FABRICATION)
 *
 * Phones (≤820px): same build, smaller canvas, text under it.
 */
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type * as ThreeNS from "three";
import { BUILD_LOOSE, BUILD_MODEL_URL, BUILD_POSES, BUILD_STEPS, BUILD_TEXT } from "../data/PuppetBuild ";
import HowItWorksTimeline from "./HowItWorksTimeline";
/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const CANVAS_TOP = 226; // canvas covers the page from here to the bottom edge
const CANVAS_BOTTOM = 900;
const LEFT_X = 90; // left margin of title, label and text
const HINT_X = 301;
const STEP_Y = 186; // top of "BUILD" and of the hint line
const COPY_Y = 738; // top of the first paragraph (was 687 — lowered so the bigger flats fit above it)
const COPY_W = 509;
const STAGE_X = 831; // "The stage is set." block
const STAGE_Y = 765;
const GREY = "#8A8A8A";
const ORANGE = "#C98A1E"; // "BUILD"

/* hand-drawn underline (same recipe as FABRICATION): distance from the bottom of the text line to the
   bottom of the underline strip. Bigger negative number = the line sits lower. */
const UL_OFFSET = -10;

/* behaviour */
const MODE: "click" | "auto" = "click"; // "click" = visitor builds it; "auto" = builds itself on arrival
const HINT_OPACITY_LOW = 0.3; // the next panel pulses between these two (1 = solid)
const HINT_OPACITY_HIGH = 0.62;
const HINT_OPACITY_HOVER = 0.82; // while the cursor is over it

/* 3D look */
const MODEL_COLOR = "#3C6952"; // the green of the printed theatre. Use "#A39A84" for the taupe render in Canva.
const DURATION = 1.5; // seconds one panel takes to fly
const STAGGER = 0.8; // "auto" mode: seconds between two panels
const LOOSE_STAGGER = 0.35; // seconds between the four loose pieces
const LIFT = 0.32; // metres a panel rises while it flies

/* the light: kept EXACTLY as the client liked it. This is the old gap (metres) between the flat panels
   and the finished theatre; it is only used to keep the sun's direction — and so the shadows — identical. */
const SUN_REF_SHIFT_X = 1.97;

/* FIXED camera (degrees): az = turn around the model, el = height above the floor (90 = straight down).
   The flats are turned to face this camera, so they look perfectly straight whatever angle you pick here. */
const AZ_VIEW = 10;
const EL_VIEW = 50;

/* the two boxes, as fractions of the canvas width / height (x0,y0 = top-left, x1,y1 = bottom-right)
   REGION_FLAT  = left box   → the flat panels fill this
   REGION_BUILT = right box  → the finished theatre fills this (and keeps this size) */
const REGION_FLAT = { x0: 0.0625, y0: 0.035, x1: 0.55, y1: 0.735 };
const REGION_BUILT = { x0: 0.52, y0: 0.03, x1: 0.985, y1: 0.72 };

/* FLAT LAYOUT — "auto" | "row" | "stack"  (see the top of the file) */
const FLAT_LAYOUT: "auto" | "row" | "stack" = "auto";
/* the PURPLE group: these panels stay together (and go on top when stacked). Everything else = PINK group. */
const PURPLE_KEYS = ["Body14", "Body1", "Body1.001", "Body1.002", "Body1.003"];
const FLAT_GAP_M = 0.16; // metres between the two groups when stacked
const FLAT_FILL = 0.97; // share of the box the flats use (1 = touch the box edges)

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rad = (d: number) => (d * Math.PI) / 180;

type Region = { x0: number; y0: number; x1: number; y1: number };
type Api = { next: () => void; replay: () => void };
type MBox = { minX: number; maxX: number; minY: number; maxY: number };

export default function ProjectBuild() {
  const outerRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [done, setDone] = useState(false);
  const [built, setBuilt] = useState(0);
  const total = BUILD_STEPS.length;

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

  /* the 3D scene */
  useEffect(() => {
    const host = hostRef.current;
    const outer = outerRef.current;
    if (!host || !outer) return;

    let disposed = false;
    let raf = 0;
    let teardown: (() => void) | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 0.001 : DURATION;

    (async () => {
      try {
        const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/controls/OrbitControls.js"),
        ]);
        if (disposed) return;

        /* ---------- renderer, scene, lights ---------- */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const dom = renderer.domElement;
        dom.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
        host.appendChild(dom);

        const scene = new THREE.Scene();
        /* the model is exported with Z up; this group turns it to Y up.
           model (x, y, z)  →  scene (x, z, -y) */
        const world = new THREE.Group();
        world.rotation.x = -Math.PI / 2;
        scene.add(world);

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c6, 1.15));
        const sun = new THREE.DirectionalLight(0xffffff, 2.1);
        sun.position.set(-2.2, 5, 3.2);
        sun.castShadow = true;
        sun.shadow.mapSize.set(2048, 2048);
        const sc = sun.shadow.camera;
        sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 14;
        sun.shadow.bias = -0.0004;
        sun.shadow.normalBias = 0.012;
        scene.add(sun, sun.target);

        const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.16 }));
        ground.position.z = -0.0006;
        ground.receiveShadow = true;
        world.add(ground);

        const baseMaterial = new THREE.MeshStandardMaterial({ color: MODEL_COLOR, roughness: 0.82, metalness: 0 });

        /* ---------- load the flat panels and give each its own pivot ---------- */
        const gltf = await new GLTFLoader().loadAsync(BUILD_MODEL_URL);
        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }
        gltf.scene.updateMatrixWorld(true);
        const byKey = new Map<string, ThreeNS.Mesh>();
        gltf.scene.traverse((o: ThreeNS.Object3D) => {
          const m = o as ThreeNS.Mesh;
          if (m.isMesh) byKey.set((m.userData as { name?: string }).name ?? m.name, m); // original name, with its dots
        });

        type Piece = {
          key: string;
          mesh: ThreeNS.Mesh;
          pivot: ThreeNS.Group;
          mat: ThreeNS.MeshStandardMaterial;
          fp: ThreeNS.Vector3; // where the flat panel rests (worked out by layout())
          to: ThreeNS.Vector3; // where it ends up in the finished theatre
          qf: ThreeNS.Quaternion; // the flat pose: turned to face the camera
          q: ThreeNS.Quaternion; // the finished pose
          t0: number | null; // when it started to fly (ms), null = still flat
        };
        const makePiece = (key: string): Piece | null => {
          const mesh = byKey.get(key);
          const pose = BUILD_POSES[key];
          if (!mesh || !pose) {
            console.warn(`[ProjectBuild] "${key}" not found in ${BUILD_MODEL_URL}`);
            return null;
          }
          const from = new THREE.Vector3(...pose.from);
          const world0 = mesh.matrixWorld.clone();
          mesh.removeFromParent();
          const mat = baseMaterial.clone();
          mesh.material = mat;
          mesh.castShadow = false; // a resting flat casts no shadow; it starts to once it flies
          mesh.receiveShadow = true;
          mesh.matrixAutoUpdate = false;
          mesh.matrix.copy(new THREE.Matrix4().makeTranslation(-from.x, -from.y, -from.z).multiply(world0));
          const pivot = new THREE.Group();
          pivot.position.copy(from);
          pivot.add(mesh);
          world.add(pivot);
          const to = new THREE.Vector3(...pose.to);
          return {
            key,
            mesh,
            pivot,
            mat,
            fp: from.clone(),
            to,
            qf: new THREE.Quaternion(),
            q: new THREE.Quaternion(...pose.q),
            t0: null,
          };
        };
        const steps = BUILD_STEPS.map((s) => makePiece(s.key)).filter((p): p is Piece => p !== null);
        const loose = BUILD_LOOSE.map(makePiece).filter((p): p is Piece => p !== null);
        const all = [...steps, ...loose];
        const ident = new THREE.Quaternion();

        /* size of the flats relative to the finished theatre (can be > 1: the flats are now bigger). Set in layout(). */
        let flatK = 1;

        /* footprint (model x / y, metres) of the purple and pink groups in the ORIGINAL flat layout.
           measured now, while every pivot is still at its original place with no rotation */
        world.updateMatrixWorld(true);
        const isPurple = (p: Piece) => PURPLE_KEYS.includes(p.key);
        const groupP = all.filter(isPurple);
        const groupK = all.filter((p: Piece) => !isPurple(p));
        const mbox = (list: Piece[]): MBox => {
          const b = new THREE.Box3();
          list.forEach((p: Piece) => b.expandByObject(p.pivot));
          return { minX: b.min.x, maxX: b.max.x, minY: -b.max.z, maxY: -b.min.z }; // scene → model: y = -z
        };
        const bP = mbox(groupP);
        const bK = groupK.length ? mbox(groupK) : bP;
        const bAll: MBox = {
          minX: Math.min(bP.minX, bK.minX),
          maxX: Math.max(bP.maxX, bK.maxX),
          minY: Math.min(bP.minY, bK.minY),
          maxY: Math.max(bP.maxY, bK.maxY),
        };

        const kOf = (p: Piece, now: number) => (p.t0 === null ? 0 : clamp((now - p.t0) / (dur * 1000), 0, 1));
        const poseAt = (p: Piece, k: number) => {
          const e = ease(k);
          p.pivot.position.lerpVectors(p.fp, p.to, e);
          if (k > 0 && k < 1) p.pivot.position.z += LIFT * Math.sin(Math.PI * e);
          p.pivot.scale.setScalar(lerp(flatK, 1, e)); // flat size → full size while it flies
          /* flat pose (facing the camera) → finished pose */
          p.pivot.quaternion.copy(p.qf).slerp(p.q, ease(clamp((k - 0.1) / 0.8, 0, 1)));
          const flying = k > 0;
          if (p.mesh.castShadow !== flying) p.mesh.castShadow = flying;
        };
        const applyAll = (now: number) => {
          for (const p of all) poseAt(p, kOf(p, now));
          world.updateMatrixWorld(true);
        };

        /* boxes used to frame the camera (scene space) — measured with the flat panels at their ORIGINAL layout */
        const boxOf = (k: number) => {
          for (const p of all) poseAt(p, k);
          world.updateMatrixWorld(true);
          const b = new THREE.Box3();
          all.forEach((p: Piece) => b.expandByObject(p.pivot));
          return b;
        };
        const boxFlat = boxOf(0);
        const boxDone = boxOf(1);
        boxOf(0);

        /* the light keeps the SAME direction as before (so the shadows are exactly as the client liked) */
        const sunRef = boxFlat.clone().union(boxDone.clone().translate(new THREE.Vector3(SUN_REF_SHIFT_X, 0, 0)));
        const sunOffset = sun.position.clone().sub(sunRef.getCenter(new THREE.Vector3()));

        /* ---------- fixed camera (orthographic, like the Canva render) ---------- */
        const UP = new THREE.Vector3(0, 1, 0);
        const dirOf = (az: number, el: number) =>
          new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
        const extents = (b: ThreeNS.Box3, az: number, el: number) => {
          const d = dirOf(az, el);
          const right = new THREE.Vector3().crossVectors(UP, d).normalize();
          const cup = new THREE.Vector3().crossVectors(d, right).normalize();
          let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
          for (let i = 0; i < 8; i++) {
            const c = new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z);
            const u = c.dot(right);
            const v = c.dot(cup);
            minU = Math.min(minU, u); maxU = Math.max(maxU, u);
            minV = Math.min(minV, v); maxV = Math.max(maxV, v);
          }
          return { minU, maxU, minV, maxV, right, cup };
        };
        const regionPx = (r: Region) => {
          const W = host.clientWidth || 1;
          const H = host.clientHeight || 1;
          return { w: (r.x1 - r.x0) * W, h: (r.y1 - r.y0) * H, cx: ((r.x0 + r.x1) / 2) * W, cy: ((r.y0 + r.y1) / 2) * H };
        };

        const az = rad(AZ_VIEW);
        const el = rad(EL_VIEW);
        const dv = dirOf(az, el); // from the model towards the camera
        const eDone = extents(boxDone, az, el);
        const Tdone = boxDone.getCenter(new THREE.Vector3()); // the camera looks at (and orbits) the finished theatre

        /* the FLAT pose: model X → screen right, model Y → screen up, model Z (the panel's face) → the camera.
           Every flat is turned like this, so it looks perfectly straight on screen. (scene → model: (x, -z, y)) */
        const toModel = (v: ThreeNS.Vector3) => new THREE.Vector3(v.x, -v.z, v.y);
        const qFlat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(toModel(eDone.right), toModel(eDone.cup), toModel(dv))
        );
        all.forEach((p: Piece) => p.qf.copy(qFlat));

        /* view: T = point the camera looks at · s = pixels per metre · (rx, ry) = where T sits in the canvas (px) */
        const view = { T: Tdone.clone(), s: 1, rx: 0, ry: 0 };
        const setFrustum = () => {
          const W = host.clientWidth || 1;
          const H = host.clientHeight || 1;
          camera.left = -view.rx / view.s;
          camera.right = (W - view.rx) / view.s;
          camera.top = view.ry / view.s;
          camera.bottom = -(H - view.ry) / view.s;
          camera.updateProjectionMatrix();
        };
        const placeCamera = () => {
          camera.position.copy(view.T).addScaledVector(dv, 10);
          camera.up.copy(UP);
          camera.lookAt(view.T);
        };

        /* the whole layout, in one place (runs at start and on every resize):
           1. the finished theatre is fitted to the right box  → that sets its scale, and it never changes again
           2. the flats get THEIR OWN scale: as big as they can be inside the left box, as a row or as a stack,
              placed straight on screen (facing the camera) */
        const layout = () => {
          const gB = regionPx(REGION_BUILT);
          const gF = regionPx(REGION_FLAT);

          view.s = Math.min(gB.w / (eDone.maxU - eDone.minU), gB.h / (eDone.maxV - eDone.minV));
          view.rx = gB.cx;
          view.ry = gB.cy;

          const wP = bP.maxX - bP.minX, hP = bP.maxY - bP.minY;
          const wK = bK.maxX - bK.minX, hK = bK.maxY - bK.minY;
          const wR = bAll.maxX - bAll.minX, hR = bAll.maxY - bAll.minY;
          const hasK = groupK.length > 0;

          const sRow = Math.min(gF.w / wR, gF.h / hR);
          const wS = Math.max(wP, hasK ? wK : 0);
          const hS = hP + (hasK ? FLAT_GAP_M + hK : 0);
          const sStack = Math.min(gF.w / wS, gF.h / hS);
          const stack = FLAT_LAYOUT === "stack" || (FLAT_LAYOUT === "auto" && sStack > sRow);

          const sF = (stack ? sStack : sRow) * FLAT_FILL; // pixels per metre of the flat panels
          flatK = sF / view.s;

          const mx = (b: MBox) => (b.minX + b.maxX) / 2;
          const my = (b: MBox) => (b.minY + b.maxY) / 2;

          const tu = Tdone.dot(eDone.right);
          const tv = Tdone.dot(eDone.cup);
          const tw = Tdone.dot(dv);
          const P = new THREE.Vector3();

          all.forEach((p: Piece, i: number) => {
            const f = BUILD_POSES[p.key].from;
            let lx: number; // position inside the flat layout, metres, y up
            let ly: number;
            if (!stack) {
              lx = f[0] - mx(bAll);
              ly = f[1] - my(bAll);
            } else if (isPurple(p)) {
              lx = f[0] - mx(bP);
              ly = f[1] - my(bP) + (hS / 2 - hP / 2); // purple on top
            } else {
              lx = f[0] - mx(bK);
              ly = f[1] - my(bK) - (hS / 2 - hK / 2); // pink below
            }
            const px = gF.cx + lx * sF;
            const py = gF.cy - ly * sF;

            /* the scene point that the camera shows at canvas pixel (px, py); a tiny depth step per panel
               stops overlapping flats from flickering (the base lies on top, as before) */
            const u = (px - view.rx) / view.s + tu;
            const v = (view.ry - py) / view.s + tv;
            const w = tw + (all.length - i) * 0.004;
            P.set(0, 0, 0).addScaledVector(eDone.right, u).addScaledVector(eDone.cup, v).addScaledVector(dv, w);
            p.fp.set(P.x, -P.z, P.y); // scene → model
          });

          /* the sun: same recipe as before, so the shadows do not change */
          const gcx = (gF.cx - view.rx) / view.s + tu;
          const gcy = (view.ry - gF.cy) / view.s + tv;
          const C = -gcy / Math.sin(el);
          const gx = gcx * Math.cos(az) + C * Math.sin(az);
          const gz = -gcx * Math.sin(az) + C * Math.cos(az);
          sun.target.position.set((gx + Tdone.x) / 2, Tdone.y / 2, (gz + Tdone.z) / 2);
          sun.position.copy(sun.target.position).add(sunOffset);
          setFrustum();
        };

        /* ---------- the build: click the blinking panel, it flies, the next one lights up ---------- */
        type Phase = "build" | "loose" | "orbit";
        let phase: Phase = "build";
        let nBuilt = 0; // how many of the 8 have been clicked
        let hovered = false;
        let autoAt: number | null = null;
        let lit: Piece | null = null; // the panel currently shown lighter
        let controls: InstanceType<typeof OrbitControls> | null = null;
        let onScreen = true;

        const nextPiece = (): Piece | undefined => (phase === "build" ? steps[nBuilt] : undefined);
        const light = (p: Piece, opacity: number) => {
          if (!p.mat.transparent) {
            p.mat.transparent = true;
            p.mat.needsUpdate = true;
          }
          p.mat.opacity = opacity;
        };
        const solid = (p: Piece) => {
          if (p.mat.transparent) {
            p.mat.transparent = false;
            p.mat.needsUpdate = true;
          }
          p.mat.opacity = 1;
        };
        const clickNext = (now: number) => {
          const p = nextPiece();
          if (!p) return;
          p.t0 = now;
          solid(p);
          lit = null;
          hovered = false;
          nBuilt++;
          setBuilt(nBuilt);
        };

        /* everything is built: NO camera move, NO zoom — the view stays exactly as it is, and the visitor can orbit */
        const toOrbit = () => {
          phase = "orbit";
          for (const p of all) p.t0 = 0;
          applyAll(1e9);
          controls = new OrbitControls(camera, dom);
          controls.target.copy(view.T);
          controls.enableZoom = false; // so the page keeps scrolling over the model
          controls.enablePan = false;
          controls.enableDamping = true;
          controls.dampingFactor = 0.08;
          controls.rotateSpeed = 0.7;
          controls.minPolarAngle = rad(18);
          controls.maxPolarAngle = Math.PI / 2 - 0.06;
          dom.style.touchAction = "pan-y"; // vertical swipes still scroll the page on phones
          dom.style.cursor = "grab";
          controls.update();
          setDone(true);
        };
        const replay = () => {
          controls?.dispose();
          controls = null;
          dom.style.cursor = "";
          dom.style.touchAction = "";
          for (const p of all) {
            p.t0 = null;
            solid(p);
          }
          nBuilt = 0;
          lit = null;
          hovered = false;
          autoAt = MODE === "auto" ? performance.now() + 400 : null;
          phase = "build";
          setBuilt(0);
          setDone(false);
          placeCamera(); // back to the fixed view (the visitor may have orbited)
          layout();
          applyAll(0);
        };
        api.current = { next: () => clickNext(performance.now()), replay };

        /* hover + click on the blinking panel (only that panel reacts) */
        const ray = new THREE.Raycaster();
        const ndc = new THREE.Vector2();
        const overNext = (ev: MouseEvent) => {
          const p = nextPiece();
          if (!p) return false;
          const r = dom.getBoundingClientRect();
          ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
          ray.setFromCamera(ndc, camera);
          return ray.intersectObject(p.pivot, true).length > 0;
        };
        const onMove = (ev: PointerEvent) => {
          if (phase !== "build" || ev.pointerType === "touch") return;
          hovered = overNext(ev);
          dom.style.cursor = hovered ? "pointer" : "";
        };
        const onClick = (ev: MouseEvent) => {
          if (phase === "build" && MODE === "click" && overNext(ev)) clickNext(performance.now());
        };
        const onLeave = () => {
          hovered = false;
        };
        dom.addEventListener("pointermove", onMove);
        dom.addEventListener("pointerleave", onLeave);
        dom.addEventListener("click", onClick);

        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          if (!onScreen) return;

          if (phase === "build" || phase === "loose") {
            if (phase === "build") {
              if (MODE === "auto" && autoAt !== null && now >= autoAt && nBuilt < steps.length) {
                clickNext(now);
                autoAt = now + STAGGER * 1000;
              }
              /* the next panel: lighter, softly pulsing */
              const p = nextPiece();
              if (lit && lit !== p) solid(lit);
              if (p) {
                const pulse = HINT_OPACITY_LOW + (HINT_OPACITY_HIGH - HINT_OPACITY_LOW) * (0.5 + 0.5 * Math.sin(now / 420));
                light(p, hovered ? HINT_OPACITY_HOVER : pulse);
                lit = p;
              }
            }
            applyAll(now);

            if (phase === "build" && nBuilt >= steps.length && steps.every((p: Piece) => kOf(p, now) >= 1)) {
              phase = "loose";
              dom.style.cursor = "";
              loose.forEach((p: Piece, i: number) => (p.t0 = now + i * LOOSE_STAGGER * 1000));
            }
            if (phase === "loose" && loose.every((p: Piece) => kOf(p, now) >= 1)) {
              toOrbit();
            }
          } else if (controls) {
            controls.update();
          }
          renderer.render(scene, camera);
        };

        /* ---------- size, visibility ---------- */
        const resize = () => {
          const W = host.clientWidth || 1;
          const H = host.clientHeight || 1;
          renderer.setSize(W, H, false);
          layout();
          applyAll(phase === "orbit" ? 1e9 : performance.now());
        };
        resize();
        placeCamera();
        applyAll(0);
        const ro = new ResizeObserver(resize);
        ro.observe(host);

        const io = new IntersectionObserver(
          (entries: IntersectionObserverEntry[]) => {
            const e = entries[0];
            if (!e) return;
            onScreen = e.isIntersecting;
            if (e.isIntersecting && MODE === "auto" && autoAt === null && phase === "build") autoAt = performance.now() + 700;
          },
          { threshold: 0.45 }
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
          controls?.dispose();
          all.forEach((p: Piece) => {
            p.pivot.traverse((o: ThreeNS.Object3D) => (o as ThreeNS.Mesh).geometry?.dispose());
            p.mat.dispose();
          });
          baseMaterial.dispose();
          renderer.dispose();
          dom.remove();
          api.current = null;
        };
      } catch (err) {
        console.error("[ProjectBuild] could not start the 3D scene", err);
      }
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      teardown?.();
    };
  }, []);

  const nextLabel = BUILD_STEPS[built]?.label;
  const lastDone = BUILD_TEXT.done.length - 1;

  return (
    <section
      ref={outerRef}
      className="pd-page hw"
      aria-label={BUILD_TEXT.title}
      data-hiw-step="build"
      style={cssVars({
        "--hw-left": LEFT_X,
        "--hw-hint": HINT_X,
        "--hw-step-y": STEP_Y,
        "--hw-copy-y": COPY_Y,
        "--hw-copy-w": COPY_W,
        "--hw-stage-x": STAGE_X,
        "--hw-stage-y": STAGE_Y,
        "--hw-cv-top": CANVAS_TOP,
        "--hw-cv-h": CANVAS_BOTTOM - CANVAS_TOP,
        "--hw-orange": ORANGE,
        "--hw-grey": GREY,
        "--hw-ul": UL_OFFSET,
      })}
    >
      <div className="hw-stage">
        <h2 className="hw-title hw-r">{BUILD_TEXT.title}</h2>
        <HowItWorksTimeline active="build" />
        <p className="hw-step hw-r">{BUILD_TEXT.step}</p>

        {/* hint with the hand-drawn orange underline (same recipe as FABRICATION: the text hugs its own box,
            so the underline is exactly as wide as the text) */}
        <p className="hw-hint hw-r">
          <span className="hw-ul-text">
            {BUILD_TEXT.hint}
            <span className="hw-ul" aria-hidden="true" />
          </span>
        </p>

        <div className="hw-canvas hw-r" role="img" aria-label={BUILD_TEXT.alt}>
          <div ref={hostRef} className="hw-host" />
        </div>

        {/* keyboard and screen-reader route: places the next panel without the mouse */}
        <button
          type="button"
          className="hw-sr"
          disabled={done || !nextLabel}
          onClick={() => api.current?.next()}
        >
          {nextLabel ? `Place panel ${built + 1} of ${total}: ${nextLabel}` : "All panels placed"}
        </button>

        <div className="hw-copy hw-r">
          {BUILD_TEXT.paragraphs.map((t: string) => (
            <p key={t}>{t}</p>
          ))}
        </div>

        <p className={done ? "hw-done is-done" : "hw-done"} aria-live="polite">
          {BUILD_TEXT.done.map((t: string, i: number) => (
            <span key={t}>
              {i === lastDone ? (
                <span className="hw-ul-text">
                  {t}
                  <span className="hw-ul" aria-hidden="true" />
                </span>
              ) : (
                t
              )}
            </span>
          ))}
        </p>

        <button
          type="button"
          className={done ? "hw-replay is-done" : "hw-replay"}
          tabIndex={done ? 0 : -1}
          onClick={() => api.current?.replay()}
        >
          Replay
        </button>
      </div>

      <noscript>
        <style>{`.hw-r{opacity:1!important;transform:none!important}`}</style>
      </noscript>
      <style>{CSS}</style>
    </section>
  );
}

const CSS = `
.hw {
  --header-h: 96px;
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --ax: calc((100cqw - 1440 * var(--cu)) / 2);
  --ease: cubic-bezier(.22, 1, .36, 1);
  --y0: calc(var(--header-h) - 96 * var(--cu));   /* artboard y → page y: y0 + y * cu */
  background: #fff;
}
.hw-stage { position: relative; height: var(--page-h); overflow: hidden; box-sizing: border-box; }

/* ---- title (same place as "KEY FEATURES") ---- */
.hw-title {
  position: absolute; z-index: 2; margin: 0;
  left: calc(var(--ax) + 90 * var(--cu));
  top: calc(var(--header-h) - 7 * var(--cu));
  white-space: nowrap; text-transform: uppercase;
  font-size: calc(18 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; letter-spacing: 0; color: var(--ink);
}

/* ---- "BUILD" + hint ---- */
.hw-step, .hw-hint { position: absolute; z-index: 2; margin: 0; top: calc(var(--y0) + var(--hw-step-y) * var(--cu)); white-space: nowrap; }
.hw-step {
  left: calc(var(--ax) + var(--hw-left) * var(--cu));
  font-size: calc(20 * var(--cu)); line-height: calc(30 * var(--cu)); font-weight: 500; text-transform: uppercase; color: var(--hw-orange);
}
.hw-hint {
  left: calc(var(--ax) + var(--hw-hint) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
}

/* ---- hand-drawn orange underline (client artwork, /public/nav-underline.png) — same recipe as FABRICATION.
   The text hugs its own box (inline-block), so the underline is exactly as wide as the text.
   The PNG is a SQUARE canvas with the stroke at ~62.4% of its height, so the image is scaled to the text's
   width (100% auto) and shifted so the stroke lands in the middle of a 12-artboard-px strip. Always visible. ---- */
.hw-ul-text { display: inline-block; position: relative; white-space: nowrap; }
.hw-ul {
  position: absolute; left: 0; right: 0;
  bottom: calc(var(--hw-ul) * var(--cu));
  height: calc(12 * var(--cu));
  background-image: url('/nav-underline.png');
  background-size: 100% auto;
  background-position: center 62.4%;
  background-repeat: no-repeat;
  pointer-events: none;
}

/* ---- 3D canvas: full artboard width, behind the text ---- */
.hw-canvas {
  position: absolute; z-index: 1; left: var(--ax); width: calc(1440 * var(--cu));
  top: calc(var(--y0) + var(--hw-cv-top) * var(--cu)); height: calc(var(--hw-cv-h) * var(--cu));
}
.hw-host { position: absolute; inset: 0; }

/* ---- text blocks (above the canvas, but they let clicks and drags through) ---- */
.hw-copy, .hw-done { position: absolute; z-index: 2; pointer-events: none; margin: 0; }
.hw-copy {
  left: calc(var(--ax) + var(--hw-left) * var(--cu)); width: calc(var(--hw-copy-w) * var(--cu));
  top: calc(var(--y0) + var(--hw-copy-y) * var(--cu));
}
.hw-copy p {
  margin: 0 0 calc(26 * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
  text-align: justify; hyphens: none;
}
.hw-copy p:last-child { margin-bottom: 0; }

.hw-done {
  left: calc(var(--ax) + var(--hw-stage-x) * var(--cu)); top: calc(var(--y0) + var(--hw-stage-y) * var(--cu));
  font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500; color: var(--ink);
  opacity: 0; transform: translate3d(0, 10px, 0); transition: opacity .8s var(--ease), transform 1s var(--ease);
}
.hw-done > span { display: block; }
.hw-done.is-done { opacity: 1; transform: none; }

.hw-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}
.hw-sr:focus-visible {
  width: auto; height: auto; margin: 0; padding: 8px 12px; clip: auto; clip-path: none; z-index: 5;
  left: calc(var(--ax) + var(--hw-left) * var(--cu)); top: calc(var(--y0) + 200 * var(--cu)); background: #fff; border: 1px solid var(--ink);
}

/* ---- replay ---- */
.hw-replay {
  position: absolute; z-index: 3; margin: 0; padding: 0; border: 0; background: none; cursor: pointer;
  right: calc(var(--ax) + 90 * var(--cu)); top: calc(var(--y0) + var(--hw-step-y) * var(--cu));
  font: inherit; font-size: max(12px, calc(16 * var(--cu))); line-height: calc(26 * var(--cu)); font-weight: 500;
  color: var(--hw-grey); text-decoration: underline; text-underline-offset: 3px;
  opacity: 0; pointer-events: none; transition: opacity .6s var(--ease), color .2s ease;
}
.hw-replay.is-done { opacity: 1; pointer-events: auto; }
.hw-replay:hover, .hw-replay:focus-visible { color: var(--ink); }

/* ---- reveal ---- */
.hw-r { opacity: 0; transform: translate3d(0, 14px, 0); }
.is-in .hw-r {
  opacity: 1; transform: none;
  transition: opacity .9s var(--ease), transform 1.1s var(--ease);
  transition-delay: calc(var(--d, 0) * 110ms + 150ms);
}
.is-in .hw-title { transition-delay: 0ms; }
.is-in .hw-canvas { transition-delay: 300ms; }

/* ---- phones ---- */
@media (max-width: 820px) {
  .hw { --cu: 1px; --y0: 0px; }
  .hw-stage { height: auto; overflow: visible; padding: calc(var(--header-h) + 8px) 0 56px; }
  .hw-title, .hw-step, .hw-hint, .hw-canvas, .hw-copy, .hw-done, .hw-replay { position: static; transform: none; }
  .hw-title { margin: 0 16px 28px; font-size: 18px; line-height: 30px; }
  .hw-step { margin: 0 16px 6px; font-size: 18px; line-height: 28px; }
  .hw-hint { margin: 0 16px 8px; font-size: 14px; line-height: 22px; white-space: normal; }
  .hw-ul-text { white-space: normal; }
  .hw-ul { bottom: -9px; height: 12px; }
  .hw-canvas { width: 100%; height: 64vw; min-height: 260px; margin: 0; position: relative; left: 0; }
  .hw-copy { margin: 20px 16px 0; width: auto; }
  .hw-copy p { font-size: 14px; line-height: 22px; text-align: left; margin-bottom: 14px; }
  .hw-done { margin: 18px 16px 0; font-size: 14px; line-height: 22px; transform: none; }
  .hw-replay { display: block; margin: 14px 16px 0; font-size: 14px; line-height: 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .hw-r, .hw-done { opacity: 1; transform: none; transition: none !important; }
  .hw-done:not(.is-done) { opacity: 0; }
}
`;