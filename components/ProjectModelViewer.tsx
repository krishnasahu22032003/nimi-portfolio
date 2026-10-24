"use client";

/* components/ProjectModelViewer.tsx   (or src/components/ProjectModelViewer.tsx)
 *
 * The 3D MODEL viewer — opens from the "3D MODEL" text in FORM EXPLORATION.
 *
 *   LOOK     White page, the bench standing on a soft contact shadow. Pine seat, black satin steel base.
 *   MOVE     Press and drag → orbit around it, like turning a real object. Scroll / pinch → zoom (limited).
 *            It turns slowly by itself until you touch it, then it is yours. Damped, so it glides.
 *   CLOSE    "CLOSE" (top right) · Esc. Focus returns to the "3D MODEL" text.
 *   GRID     The title and CLOSE sit on the same grid as the CONCEPT / FORM EXPLORATION titles.
 *
 * The .obj has NO materials file (Fusion only wrote the names), so the two materials are rebuilt here:
 *   WOOD_BODIES  = the bodies that are the pine seat (everything else = black satin steel).
 *   Tune the colours / roughness in WOOD and STEEL below.
 *
 * The file is Z-up (Fusion 360) → rotated to Y-up, centred, put on the floor and scaled to a fixed size.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/* ------------------------------ TUNING ------------------------------ */
const WOOD_BODIES = ["Body5"]; //                                    group names (from the .obj) that are the seat
const WOOD = { color: "#9b6a43", roughness: 0.52, metalness: 0 }; //  "3D Pine – Stained light semigloss"
const STEEL = { color: "#1d1d1f", roughness: 0.42, metalness: 0.85 }; // "Steel – Satin", shown black

const MODEL_SIZE = 4; //            longest side of the bench in scene units (camera is fitted to this)
const FOV = 30;
const START_DIR = new THREE.Vector3(0.95, 0.5, 1.25); // where the first view is taken from (right, above, front)
const AUTO_ROTATE_SPEED = 0.9; //   slow turn until the first touch (0 = off)
const ZOOM_MIN = 0.5; //            × the fitted distance
const ZOOM_MAX = 1.5;

const HEADER_H = 96; // px — same as the other sections

function disposeObject(root: THREE.Object3D) {
  root.traverse((o: THREE.Object3D) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x: THREE.Material) => x.dispose());
    else mat?.dispose();
  });
}

type Props = { src: string; label: string; alt: string; onClose: () => void };

export default function ProjectModelViewer({ src, label, alt, onClose }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [shown, setShown] = useState(false); //     overlay fade-in
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [touched, setTouched] = useState(false); // hint fades once the user has moved the model
  const [coarse, setCoarse] = useState(false);

  /* ---- page behind: no scrolling while open (scrollbar width is compensated so nothing shifts) ---- */
  useEffect(() => {
    const html = document.documentElement;
    const prev = { overflow: html.style.overflow, pr: html.style.paddingRight };
    const sb = window.innerWidth - html.clientWidth;
    html.style.overflow = "hidden";
    if (sb > 0) html.style.paddingRight = `${sb}px`;

    const root = rootRef.current;
    const stop = (e: WheelEvent) => e.preventDefault();
    root?.addEventListener("wheel", stop, { passive: false });

    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    const raf = requestAnimationFrame(() => setShown(true));
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      cancelAnimationFrame(raf);
      root?.removeEventListener("wheel", stop);
      html.style.overflow = prev.overflow;
      html.style.paddingRight = prev.pr;
    };
  }, []);

  /* ---- keyboard: Esc closes, Tab stays inside ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === "Tab") {
        e.preventDefault(); // the close button is the only control
        closeRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---- the 3D scene ---- */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let disposed = false;
    let raf = 0;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xffffff, 0);
    const canvas = renderer.domElement;
    canvas.className = "mv-canvas";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", alt);
    stage.appendChild(canvas);

    const scene = new THREE.Scene();

    /* image-based light: soft studio reflections on the steel */
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);

    /* key light, casts the contact shadow */
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(3.5, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.radius = 6;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xdddddd, 0.35));

    /* the floor only shows the shadow — the page stays pure white */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.rotateSpeed = 0.75;
    controls.zoomSpeed = 0.6;
    controls.enablePan = false; //  orbit + zoom only, the bench always stays centred
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // never under the floor
    controls.autoRotate = !reduce && AUTO_ROTATE_SPEED > 0;
    controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
    const onStart = () => {
      controls.autoRotate = false;
      canvas.classList.add("is-grabbing");
      setTouched(true);
    };
    const onEnd = () => canvas.classList.remove("is-grabbing");
    controls.addEventListener("start", onStart);
    controls.addEventListener("end", onEnd);

    /* fit the camera to the model */
    const frame = (height: number) => {
      const radius = Math.max(MODEL_SIZE / 2, height) * 1.05;
      const dist = (radius / Math.sin((FOV * Math.PI) / 360)) * 0.78;
      camera.position.copy(START_DIR.clone().normalize().multiplyScalar(dist));
      controls.target.set(0, height * 0.42, 0);
      controls.minDistance = dist * ZOOM_MIN;
      controls.maxDistance = dist * ZOOM_MAX;
      controls.update();
    };
    frame(0.9);

    /* size */
    const resize = () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      /* narrow screens: widen the view so the bench never gets cropped at the sides */
      camera.fov = camera.aspect < 1 ? FOV / Math.max(camera.aspect, 0.5) ** 0.6 : FOV;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    /* load the .obj */
    let model: THREE.Group | null = null;
    const woodMat = new THREE.MeshStandardMaterial({ ...WOOD, side: THREE.DoubleSide });
    const steelMat = new THREE.MeshStandardMaterial({ ...STEEL, side: THREE.DoubleSide });
    new OBJLoader().load(
      src,
      (obj: THREE.Group) => {
        if (disposed) {
          disposeObject(obj);
          return;
        }
        obj.traverse((o: THREE.Object3D) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          const names = [mesh.name, mesh.parent?.name ?? ""];
          const isWood = WOOD_BODIES.some((n: string) => names.includes(n));
          const old = mesh.material as THREE.Material | THREE.Material[];
          (Array.isArray(old) ? old : [old]).forEach((m: THREE.Material) => m.dispose());
          mesh.material = isWood ? woodMat : steelMat;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        /* Z-up → Y-up, centre it, stand it on the floor, scale to MODEL_SIZE */
        const pivot = new THREE.Group();
        obj.rotation.x = -Math.PI / 2;
        pivot.add(obj);
        pivot.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(pivot);
        const size = box.getSize(new THREE.Vector3());
        const centre = box.getCenter(new THREE.Vector3());
        obj.position.set(-centre.x, -box.min.y, -centre.z);
        pivot.scale.setScalar(MODEL_SIZE / Math.max(size.x, size.y, size.z));
        scene.add(pivot);
        model = pivot;

        frame((size.y * MODEL_SIZE) / Math.max(size.x, size.y, size.z));
        setStatus("ready");
      },
      undefined,
      () => {
        if (!disposed) setStatus("error");
      }
    );

    const loop = () => {
      raf = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.removeEventListener("start", onStart);
      controls.removeEventListener("end", onEnd);
      controls.dispose();
      if (model) {
        scene.remove(model);
        disposeObject(model);
      }
      woodMat.dispose();
      steelMat.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [src, alt]);

  return createPortal(
    <div
      ref={rootRef}
      className={`mv${shown ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{ ["--header-h" as string]: `${HEADER_H}px` }}
    >
      <div className="mv-head">
        <h2 className="mv-title">{label}</h2>
        <button ref={closeRef} type="button" className="mv-close" onClick={() => onCloseRef.current()}>
          Close
        </button>
      </div>

      <div ref={stageRef} className="mv-stage" />

      <p className={`mv-status${status === "ready" ? " is-hidden" : ""}`} role="status" aria-live="polite">
        {status === "error" ? "The model could not be loaded." : "Loading model…"}
      </p>
      <p className={`mv-hint${status === "ready" && !touched ? " is-on" : ""}`} aria-hidden="true">
        {coarse ? "Drag to turn · Pinch to zoom" : "Drag to turn · Scroll to zoom"}
      </p>

      <style>{CSS}</style>
    </div>,
    document.body
  );
}

/* ------------------------------- CSS ------------------------------- */
const CSS = `
@import url("https://fonts.googleapis.com/css2?family=Comico&display=swap");

.mv {
  --ease: cubic-bezier(.22, 1, .36, 1);
  --mute: #767676;
  /* same grid as CONCEPT / FORM EXPLORATION (see --cu there) */
  --cu: min(calc(100cqw / 1440), calc((100svh - var(--header-h)) / 804));
  --edge-l: calc((100cqw - 1440 * var(--cu)) / 2 + 231 * var(--cu));
  --edge-r: calc((100cqw - 1440 * var(--cu)) / 2 + 230 * var(--cu));

  position: fixed; inset: 0; z-index: 1000; container-type: inline-size;
  background: #fff; color: #000;
  opacity: 0; transition: opacity .5s var(--ease);
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  font-family: "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  overscroll-behavior: contain;
}
.mv.is-open { opacity: 1; }

.mv-head {
  position: absolute; z-index: 3; left: var(--edge-l); right: var(--edge-r);
  top: calc(var(--header-h) - 4 * var(--cu)); height: calc(24 * var(--cu));
  display: flex; align-items: center; justify-content: space-between;
  pointer-events: none;
}
.mv-title { margin: 0; font-size: calc(18 * var(--cu)); line-height: calc(24 * var(--cu)); font-weight: 500; letter-spacing: 0; color: #000; white-space: nowrap; }

/* CLOSE — Comico 16, grey → black. The padding is a bigger hit area; the negative margin keeps the TEXT on the grid. */
.mv-close {
  pointer-events: auto; margin: 0 -12px 0 0; padding: 12px; border: 0; background: none; cursor: pointer; border-radius: 2px;
  font-family: "Comico", "Familjen Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-size: 16px; line-height: 24px; font-weight: 400; font-synthesis: none; letter-spacing: .02em;
  text-transform: uppercase; color: var(--mute); transition: color .3s ease;
  -webkit-tap-highlight-color: transparent;
}
.mv-close:active { color: #000; }
.mv-close:focus-visible { color: #000; outline: 2px solid #000; outline-offset: -2px; }
@media (hover: hover) and (pointer: fine) { .mv-close:hover { color: #000; } }

/* the model fills the whole screen; the title / close / hint float above it */
.mv-stage { position: absolute; inset: 0; z-index: 1; }
.mv-canvas {
  display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; outline: none;
  opacity: 0; transition: opacity .9s var(--ease) .1s;
}
.mv-canvas.is-grabbing { cursor: grabbing; }
.mv.is-open .mv-canvas { opacity: 1; }

.mv-status, .mv-hint {
  position: absolute; z-index: 2; left: 0; right: 0; margin: 0; text-align: center; pointer-events: none;
  font-size: 14px; line-height: 24px; font-weight: 400; color: var(--mute);
  transition: opacity .6s var(--ease);
}
.mv-status { top: 50%; transform: translateY(-50%); }
.mv-status.is-hidden { opacity: 0; }
.mv-hint { bottom: 36px; opacity: 0; }
.mv-hint.is-on { opacity: 1; transition-delay: .8s; }

@media (max-width: 820px) {
  .mv { --edge-l: 16px; --edge-r: 16px; }
  .mv-head { top: 40px; height: 24px; }
  .mv-title { font-size: 16px; line-height: 24px; }
  .mv-hint { bottom: 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .mv, .mv-canvas, .mv-status, .mv-hint { transition: none; }
}
`;