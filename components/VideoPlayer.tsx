"use client";
/* components/VideoPlayer.tsx   (or src/components/VideoPlayer.tsx)
 *
 * One video + two controls, shared by the Echo Pan TESTING and END pages.
 *   · centre button .... ONE button: shows PLAY when paused, turns into PAUSE (same spot) when playing
 *   · bottom-right ..... MUTE / UNMUTE button
 *   · autoplay ......... starts MUTED when the parent says `play` (page on screen); pauses when it leaves.
 *                        If the visitor pauses it themselves, it stays paused until they press play.
 *
 * CSS prefix is "vp-" (video player). Sizes use var(--u) when the page defines it (so the buttons scale
 * with her 1440 × 900 layout) and fall back to 1px on stacked / mobile layouts.
 */
import { useEffect, useRef, useState } from "react";

/* ------------------------------ TUNING ------------------------------ */
const BTN_BG = "rgba(36, 36, 34, 0.82)"; // dark circle, like the reference
const BTN_ICON = "#f4f1ea"; //              off-white glyph
const PLAY_SIZE = 64; //                    centre button diameter (design px)
const MUTE_SIZE = 40; //                    mute button diameter (design px)
const MUTE_INSET = 18; //                   distance of the mute button from the bottom / right edge (design px)
const PLAYING_OPACITY = 0.7; //             centre button opacity while playing (1 on hover / focus)

type Props = {
  src: string;
  poster?: string;
  label: string;
  position?: string; // CSS object-position
  play: boolean; //     "this video should be running right now" (page on screen + this is the current video)
  muted: boolean;
  onToggleMute: () => void;
  interactive?: boolean; // false = buttons are not reachable by keyboard / screen reader (hidden slide)
};

export default function VideoPlayer({ src, poster, label, position, play, muted, onToggleMute, interactive = true }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);

  /* always start muted (browsers only allow muted autoplay) */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.defaultMuted = true;
    v.muted = true;
  }, []);

  /* follow the mute state from the parent */
  useEffect(() => {
    const v = ref.current;
    if (v) v.muted = muted;
  }, [muted]);

  /* play while the page is on screen, pause when it leaves */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduce && !userPaused.current) v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [play]);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const tab = interactive ? 0 : -1;

  return (
    <div
      className="vp"
      style={
        {
          "--vp-bg": BTN_BG,
          "--vp-ic": BTN_ICON,
          "--vp-play": PLAY_SIZE,
          "--vp-mute": MUTE_SIZE,
          "--vp-inset": MUTE_INSET,
          "--vp-op": PLAYING_OPACITY,
        } as React.CSSProperties
      }
    >
      <video
        ref={ref}
        className="vp-video"
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="metadata"
        tabIndex={-1}
        aria-label={label}
        disablePictureInPicture
        disableRemotePlayback
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onContextMenu={(e) => e.preventDefault()}
        style={{ objectPosition: position ?? "50% 50%" }}
      />

      {/* ONE centre button: play ⇄ pause in the same spot */}
      <button
        type="button"
        className={`vp-btn vp-play${playing ? " is-playing" : ""}`}
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        tabIndex={tab}
      >
        <svg className="vp-ic vp-ic--play" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8.6 5.9 L18 12 L8.6 18.1 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        <svg className="vp-ic vp-ic--pause" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="6.8" y="5.2" width="3.7" height="13.6" rx="1.1" fill="currentColor" />
          <rect x="13.5" y="5.2" width="3.7" height="13.6" rx="1.1" fill="currentColor" />
        </svg>
      </button>

      {/* mute / unmute, bottom right */}
      <button
        type="button"
        className="vp-btn vp-mute"
        onClick={onToggleMute}
        aria-label={muted ? "Unmute video" : "Mute video"}
        aria-pressed={!muted}
        tabIndex={tab}
      >
        <svg className="vp-mic" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 9.6 v4.8 h3.6 L12.6 18.6 V5.4 L7.6 9.6 Z" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          {muted ? (
            <path d="M16.2 9.6 L21 14.4 M21 9.6 L16.2 14.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <>
              <path d="M15.8 9.3 a3.6 3.6 0 0 1 0 5.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M18.3 6.8 a7.2 7.2 0 0 1 0 10.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </svg>
      </button>

      <style>{CSS}</style>
    </div>
  );
}

const CSS = `
.vp { position: absolute; inset: 0; overflow: hidden; }
.vp-video { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; user-select: none; }

.vp-btn {
  position: absolute; z-index: 3; display: block; padding: 0; margin: 0; border: 0; border-radius: 50%;
  background: var(--vp-bg); color: var(--vp-ic); cursor: pointer; -webkit-tap-highlight-color: transparent;
  transition: opacity .35s ease, transform .25s ease, background .25s ease;
}
.vp-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

/* centre play / pause */
.vp-play {
  left: 50%; top: 50%;
  width: calc(var(--u, 1px) * var(--vp-play)); height: calc(var(--u, 1px) * var(--vp-play));
  margin: calc(var(--u, 1px) * var(--vp-play) * -0.5) 0 0 calc(var(--u, 1px) * var(--vp-play) * -0.5);
}
.vp-play:hover { transform: scale(1.07); background: rgba(20, 20, 19, .92); }
.vp-play:active { transform: scale(.96); }
.vp-play.is-playing { opacity: var(--vp-op); }
.vp:hover .vp-play.is-playing, .vp-play.is-playing:focus-visible { opacity: 1; }

.vp-ic { position: absolute; inset: 0; margin: auto; width: 46%; height: 46%; display: block; transition: opacity .25s ease, transform .25s ease; }
.vp-ic--play { opacity: 1; transform: translateX(3%); }
.vp-ic--pause { opacity: 0; transform: scale(.7); }
.is-playing .vp-ic--play { opacity: 0; transform: scale(.7); }
.is-playing .vp-ic--pause { opacity: 1; transform: none; }

/* bottom-right mute */
/* bottom-left mute */
.vp-mute {
  left: calc(var(--u, 1px) * var(--vp-inset)); bottom: calc(var(--u, 1px) * var(--vp-inset));
  width: calc(var(--u, 1px) * var(--vp-mute)); height: calc(var(--u, 1px) * var(--vp-mute));
}
.vp-mute:hover { transform: scale(1.08); background: rgba(20, 20, 19, .92); }
.vp-mic { position: absolute; inset: 0; margin: auto; width: 56%; height: 56%; display: block; }

@media (prefers-reduced-motion: reduce) {
  .vp-btn, .vp-ic { transition: none !important; }
}
`;