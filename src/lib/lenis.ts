import { useEffect } from "react";
import Lenis from "lenis";
import { useMotion } from "@/lib/motion";

let instance: Lenis | null = null;

/*
 * Scrolls to a section without touching the URL. Lenis owns the scroll when it
 * is running, so the instance is preferred; the native call is the fallback for
 * the no-motion path.
 */
export function scrollToSection(element: HTMLElement): void {
  const target =
    element.tagName === "SECTION"
      ? element
      : (element.closest("section") ?? element);

  if (instance) {
    instance.scrollTo(target, { duration: 1.1 });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
}

export function useLenis(): void {
  const motion = useMotion();
  useEffect(() => {
    if (!motion) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
    instance = lenis;
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      instance = null;
    };
  }, [motion]);
}
