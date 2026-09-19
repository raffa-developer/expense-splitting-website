import { animate, onScroll, utils } from "animejs";
import { useEffect, useRef, type RefObject } from "react";
import { useMotion } from "@/lib/motion";

export interface ScrollProgress {
  current: number;
}

export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  onUpdate?: (value: number) => void,
  enabled = true
): ScrollProgress {
  const progress = useRef(0);
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    const element = target.current;
    if (!element) {
      return;
    }
    if (!enabled) return;
    progress.current = 0;
    callback.current?.(0);
    const animation = animate(progress, {
      current: 1,
      ease: "linear",
      autoplay: onScroll({
        target: element,
        enter: "top top",
        leave: "bottom bottom",
        sync: true
      }),
      onUpdate: () => callback.current?.(progress.current)
    });
    return () => {
      animation.revert();
    };
  }, [target, enabled]);

  return progress;
}

export function useGlobalScrollProgress(
  target: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const element = target.current;
    if (!element) {
      return;
    }
    const animation = animate(element, {
      scaleX: [0, 1],
      ease: "linear",
      autoplay: onScroll({
        target: document.documentElement,
        enter: "top top",
        leave: "bottom bottom",
        sync: true
      })
    });
    return () => {
      animation.revert();
    };
  }, [target]);
}

export function useReveal(
  target: RefObject<HTMLElement | null>,
  delay = 0
): void {
  const motion = useMotion();
  useEffect(() => {
    const element = target.current;
    if (!element) {
      return;
    }
    if (!motion) return;

    utils.set(element, { opacity: 0, y: 16 });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            animate(element, {
              opacity: 1,
              y: 0,
              duration: 700,
              delay,
              ease: "outCubic"
            });
            observer.disconnect();
          }
        }
      },
      { rootMargin: "-12% 0px" }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, [target, delay, motion]);
}

export function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}
