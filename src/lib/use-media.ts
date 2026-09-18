import { useEffect, useState, type RefObject } from "react";

export function useInRange(
  ref: RefObject<HTMLElement | null>,
  before = 1.1,
  after = -0.1
): boolean {
  const [inRange, setInRange] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const element = ref.current;
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight;
      setInRange(rect.top < viewport * before && rect.bottom > viewport * after);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, before, after]);

  return inRange;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", handler);
    setMatches(list.matches);
    return () => list.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

export function supportsWebGL(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}
