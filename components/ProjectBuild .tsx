"use client";
/* components/ProjectBuild.tsx   (or src/components/ProjectBuild.tsx)
 *
 * Project eight — page 102 "HOW IT WORKS · BUILD".
 *
 * The flat 3D panels sit in the LEFT box (REGION_FLAT, the pink box). The NEXT panel to place
 * blinks (lighter, pulsing). The visitor clicks it and it flies into the RIGHT box (REGION_BUILT,
 * the orange box) to build the theatre, in the client's order 1–8. Then the four loose pieces glide
 * to the corner, and the visitor can drag to look around it from every side.
 *
 * CAMERA: fixed for the whole build. The flat panels never change angle or position while the
 * theatre forms, and nothing zooms after the theatre is built — it stays the same (big) size.
 * The theatre is fitted to the orange box once; the flat panels are laid out to fill the pink box
 * (they grow to full size as they fly across, which reads as being lifted towards the viewer).
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

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const CANVAS_TOP = 226; // canvas covers the page from here to the bottom edge
const CANVAS_BOTTOM = 900;
const LEFT_X = 90; // left margin of title, label and text
const HINT_X = 301;
const STEP_Y = 186; // top of "BUILD" and of the hint line
const COPY_Y = 687; // top of the first paragraph
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
   One angle for the whole build → the flat panels never move or tilt.
   az 0 = flat panels perfectly square-on · a few degrees gives the theatre a little more depth. */
const AZ_VIEW = 10;
const EL_VIEW = 50;

/* the two boxes, as fractions of the canvas width / height (x0,y0 = top-left, x1,y1 = bottom-right)
   REGION_FLAT  = pink box   → the flat panels fill this
   REGION_BUILT = orange box → the finished theatre fills this (and keeps this size) */
const REGION_FLAT = { x0: 0.05, y0: 0.05, x1: 0.51, y1: 0.68 };
const REGION_BUILT = { x0: 0.52, y0: 0.03, x1: 0.985, y1: 0.72 };

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const rad = (d: number) => (d * Math.PI) / 180;

type Region = { x0: number; y0: number; x1: number; y1: number };
type Api = { next: () => void; replay: () => void };

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
          pivot: ThreeNS.Group;
          mat: ThreeNS.MeshStandardMaterial;
          fp: ThreeNS.Vector3; // where the flat panel rests on screen (worked out by layout())
          to: ThreeNS.Vector3; // where it ends up in the finished theatre
          q: ThreeNS.Quaternion;
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
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.matrixAutoUpdate = false;
          mesh.matrix.copy(new THREE.Matrix4().makeTranslation(-from.x, -from.y, -from.z).multiply(world0));
          const pivot = new THREE.Group();
          pivot.position.copy(from);
          pivot.add(mesh);
          world.add(pivot);
          const to = new THREE.Vector3(...pose.to);
          return { key, pivot, mat, fp: from.clone(), to, q: new THREE.Quaternion(...pose.q), t0: null };
        };
        const steps = BUILD_STEPS.map((s) => makePiece(s.key)).filter((p): p is Piece => p !== null);
        const loose = BUILD_LOOSE.map(makePiece).filter((p): p is Piece => p !== null);
        const all = [...steps, ...loose];
        const ident = new THREE.Quaternion();

        /* size of the flat panels relative to the finished theatre (≤ 1). Worked out in layout(). */
        let flatK = 1;

        const kOf = (p: Piece, now: number) => (p.t0 === null ? 0 : clamp((now - p.t0) / (dur * 1000), 0, 1));
        const poseAt = (p: Piece, k: number) => {
          const e = ease(k);
          p.pivot.position.lerpVectors(p.fp, p.to, e);
          if (k > 0 && k < 1) p.pivot.position.z += LIFT * Math.sin(Math.PI * e);
          p.pivot.scale.setScalar(lerp(flatK, 1, e)); // flat size → full size while it flies
          p.pivot.quaternion.copy(ident).slerp(p.q, ease(clamp((k - 0.1) / 0.8, 0, 1)));
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
        const eDone = extents(boxDone, az, el);
        const eFlat = extents(boxFlat, az, el);
        const Tdone = boxDone.getCenter(new THREE.Vector3()); // the camera looks at (and orbits) the finished theatre
        const Sflat = boxFlat.getCenter(new THREE.Vector3());

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
          camera.position.copy(view.T).addScaledVector(dirOf(az, el), 10);
          camera.up.copy(UP);
          camera.lookAt(view.T);
        };

        /* the whole layout, in one place (runs at start and on every resize):
           1. the finished theatre is fitted to the orange box  → that sets the scale, and it never changes again
           2. the flat panels are shrunk just enough to fit the pink box, and centred in it */
        const layout = () => {
          const gB = regionPx(REGION_BUILT);
          const gF = regionPx(REGION_FLAT);

          view.s = Math.min(gB.w / (eDone.maxU - eDone.minU), gB.h / (eDone.maxV - eDone.minV));
          view.rx = gB.cx;
          view.ry = gB.cy;

          flatK = Math.min(
            1,
            gF.w / (view.s * (eFlat.maxU - eFlat.minU)),
            gF.h / (view.s * (eFlat.maxV - eFlat.minV))
          );

          /* ground point G (scene) whose screen position is the centre of the pink box */
          const A = (gF.cx - view.rx) / view.s + Tdone.dot(eDone.right);
          const Bp = (view.ry - gF.cy) / view.s + Tdone.dot(eDone.cup);
          const C = -Bp / Math.sin(el);
          const gx = A * Math.cos(az) + C * Math.sin(az);
          const gz = -A * Math.sin(az) + C * Math.cos(az);

          /* scene (x, y, z) → model (x, -z, y) */
          const gmx = gx;
          const gmy = -gz;
          const cmx = Sflat.x;
          const cmy = -Sflat.z;
          for (const p of all) {
            const f = BUILD_POSES[p.key].from;
            p.fp.set(gmx + flatK * (f[0] - cmx), gmy + flatK * (f[1] - cmy), flatK * f[2]);
          }

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