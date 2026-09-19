import { useEffect } from "react";
import Lenis from "lenis";
import { useMotion } from "@/lib/motion";

export function useLenis(): void {
  const { motion } = useMotion();
  useEffect(() => {
    if (!motion) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, [motion]);
}
