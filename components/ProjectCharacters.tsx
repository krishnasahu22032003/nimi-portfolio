"use client";

/* components/ProjectCharacters.tsx   (or src/components/ProjectCharacters.tsx)
 *
 * Project eight — COMPOSE · "3. Pick your characters"  (Canva page 107)
 *
 * · Same system as ProjectBuild / ProjectEnvironment: a 1440 × 900 artboard scaled by --cu, one WebGL canvas,
 *   three.js loaded on demand, nothing starts until the section is near the screen.
 * · The canvas uses an ORTHOGRAPHIC camera measured in artboard pixels → every box in data/puppetCharacters.ts
 *   lands exactly where it is on Canva, at every screen size.
 * · Arrival: the stick puppets show the BUNCH pose for CHAR_HOLD_MS, then glide (staggered) to the OPEN pose.
 *   Leave the page completely and come back → it plays again.
 * · Every puppet casts a soft shadow onto an invisible wall behind it (up-left, like the Canva render).
 * · prefers-reduced-motion: no animation, the open pose is shown straight away.
 *
 * Needs:  three (already installed) · data/puppetCharacters.ts
 * Files:  public/projects/puppet-theatre/characters/  (stick-puppets-bunch.glb + 5 tex-*.jpg)
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

/* ------------------------------ TUNING (artboard px, 1440 × 900) ------------------------------ */
const NUM_X = 108; //   "3."
const TITLE_X = 126; // "Pick your characters"
const HEAD_Y = 90; //   top of the heading line (its centre is y = 104, as on Canva)
const PARA_X = 91;
const PARA_Y = 138; //  top of the first paragraph line (line centres 151 / 177 on Canva)
const CANVAS_TOP = 96; //     the 3D canvas covers the page from the header down…
const CANVAS_BOTTOM = 900; // …to the bottom edge (the rooster starts above the old 190 line)
const DESIGN_W = 1440;

/* phones: the canvas turns into one tall column (design width 720) */
const NARROW_BELOW = 700; // canvas width (px) under which the stacked layout is used
const NARROW_W = 720;
const NARROW_ROW_H = 560;
const NARROW_PAD = 24;

/* light (total ≈ 1, so the pictures keep their true colours) */
/* brighter lighting to match the client's reference image */
const LIGHT_HEMI = 2.2;
const LIGHT_FRONT = 1.5;
const LIGHT_SHADOW = 0.35;

const START_MARGIN = "1500px"; // start building when the section is this close to the screen

const cssVars = (vars: Record<string, string | number>): CSSProperties => vars as unknown as CSSProperties;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const yieldToMain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const norm = (s: string) => s.toLowerCase().replace(/\.\d+$/, "").replace(/[^a-z0-9]/g, "");

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
        renderer.shadowMap.type = THREE.VSMShadowMap; // soft, blurred shadows
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

        /* ---------- load the model and the colour pictures ---------- */
        const loader = new GLTFLoader();
        const texLoader = new THREE.TextureLoader();
        const texCache = new Map<string, ThreeNS.Texture | null>();
        const getTex = (url: string) => {
          if (!texCache.has(url)) texCache.set(url, null);
          return texLoader
            .loadAsync(url)
            .then((t: ThreeNS.Texture) => {
              t.colorSpace = THREE.SRGBColorSpace;
              t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
              texCache.set(url, t);
              return t;
            })
            .catch((err: unknown) => {
              console.error("[ProjectCharacters] texture missing:", url, err);
              return null;
            });
        };
        const urls = Array.from(new Set(CHAR_PARTS.map((p) => p.tex).filter((u): u is string => !!u)));
        const [gltf] = await Promise.all([loader.loadAsync(CHAR_BUNCH_URL), ...urls.map(getTex)]);
        if (disposed) {
          renderer.dispose();
          dom.remove();
          return;
        }
        await yieldToMain();

        /* ---------- build the puppets ---------- */
        const byKey = new Map<string, ThreeNS.Mesh>();
        gltf.scene.traverse((o: ThreeNS.Object3D) => {
          const m = o as ThreeNS.Mesh;
          if (m.isMesh) byKey.set(norm(((m.userData as { name?: string }).name ?? m.name) || ""), m);
        });

        type Part = { mesh: ThreeNS.Mesh; deg: number; a: ThreeNS.Vector3; b: ThreeNS.Vector3 };
        const parts: Part[] = [];
        const ownMats: ThreeNS.Material[] = [];
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
          parts.push({ mesh, deg: def.deg, a, b });
        });

        const holder = new THREE.Group(); // scale = px per metre, position = page position
        holder.add(gltf.scene);
        scene.add(holder);

        /* ---------- layout ---------- */
        let boxB: Box = CHAR_STICKS_BOX.bunch;
        let boxO: Box = CHAR_STICKS_BOX.open;
        let fitB = fitBox(boxB, CHAR_BOUNDS.bunch);
        let fitO = fitBox(boxO, CHAR_BOUNDS.open);
        const cB = { x: (CHAR_BOUNDS.bunch.x0 + CHAR_BOUNDS.bunch.x1) / 2, y: (CHAR_BOUNDS.bunch.y0 + CHAR_BOUNDS.bunch.y1) / 2 };
        const cO = { x: (CHAR_BOUNDS.open.x0 + CHAR_BOUNDS.open.x1) / 2, y: (CHAR_BOUNDS.open.y0 + CHAR_BOUNDS.open.y1) / 2 };

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
        };

        /* ---------- the pose: g = whole-group progress (0 bunch … 1 open), per-part progress via poseK ---------- */
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

        /* ---------- sequence: arrive → hold the bunch → open ---------- */
        let phase: "idle" | "hold" | "move" | "done" = reduce ? "done" : "idle";
        let t0 = 0;
        const total = CHAR_MOVE_MS + CHAR_STAGGER_MS * Math.max(parts.length - 1, 0);

        let onScreen = false;
        const tick = (now: number) => {
          raf = requestAnimationFrame(tick);
          if (!onScreen) return;
          if (phase === "hold" && now - t0 >= CHAR_HOLD_MS) {
            phase = "move";
            t0 = now;
          }
          if (phase === "move") {
            const el = now - t0;
            const per = parts.map((_: Part, i: number) => ease(clamp((el - i * CHAR_STAGGER_MS) / CHAR_MOVE_MS, 0, 1)));
            setPose(ease(clamp(el / total, 0, 1)), per);
            if (el >= total) {
              phase = "done";
              setPose(1, parts.map(() => 1));
            }
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
              setPose(0, parts.map(() => 0));
            } else if (e.intersectionRatio >= 0.55 && phase === "idle") {
              phase = "hold";
              t0 = performance.now();
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