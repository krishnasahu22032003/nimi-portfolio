"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const frames = [
  "/hourglass/hourglass-1.png",
  "/hourglass/hourglass-2.png",
  "/hourglass/hourglass-3.png",
  "/hourglass/hourglass-4.png",
  "/hourglass/hourglass-5.png",
  "/hourglass/hourglass-6.png",
];

export default function HourglassLogo() {

  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((current) => (current + 1) % frames.length);
    }, 350);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-9 w-9 overflow-hidden">
      <Image
        src={frames[frame]}
        alt=""
        fill
        priority
        sizes="36px"
        className="object-contain"
      />
    </div>
  );
} ;