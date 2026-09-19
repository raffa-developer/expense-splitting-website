import { clamp, smoothstep } from "./animation";

export type ActiveDevice = "laptop" | "phone" | null;

export type FilmCaptionKey =
  | "film.share"
  | "film.laptop"
  | "film.phone"
  | "film.settle";

export const PRODUCT_FILM_CAPTION_EDGES = [0.34, 0.62, 0.9] as const;

export function productFilmCaptionKey(progress: number): FilmCaptionKey {
  if (progress < PRODUCT_FILM_CAPTION_EDGES[0]) {
    return "film.share";
  }
  if (progress < PRODUCT_FILM_CAPTION_EDGES[1]) {
    return "film.laptop";
  }
  if (progress < PRODUCT_FILM_CAPTION_EDGES[2]) {
    return "film.phone";
  }
  return "film.settle";
}

export interface ProductFilmState {
  activeDevice: ActiveDevice;
  settled: number;
  laptop: {
    open: number;
    screen: number;
  };
  phone: {
    rotation: number;
    screen: number;
  };
  camera: {
    x: number;
    y: number;
    z: number;
  };
}

function clampRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function screenCrossfade(
  position: number,
  count: number,
  fade: number
): number[] {
  const values = Array.from({ length: count }, () => 0);
  if (count === 0) {
    return values;
  }

  const boundedPosition = clampRange(position, 0, count - 1);
  const activeIndex = Math.floor(boundedPosition);
  const nextIndex = Math.min(activeIndex + 1, count - 1);
  const blend =
    nextIndex === activeIndex
      ? 0
      : smoothstep(activeIndex, activeIndex + Math.max(fade, 0.001), boundedPosition);

  values[activeIndex] = 1 - blend;
  values[nextIndex] = values[nextIndex]! + blend;

  return values;
}

export function getProductFilmState(
  progress: number,
  compact: boolean,
  reduce: boolean
): ProductFilmState {
  const value = reduce ? 1 : clamp(progress);

  return {
    activeDevice: value < 0.53 ? "laptop" : value < 0.82 ? "phone" : null,
    settled: smoothstep(0.88, 0.98, value),
    laptop: {
      open: smoothstep(0.12, 0.3, value),
      screen: smoothstep(0.3, 0.5, value) * 2
    },
    phone: {
      rotation: smoothstep(0.55, 0.68, value) * Math.PI * 2,
      screen: smoothstep(0.62, 0.8, value) * 2
    },
    camera: {
      x: 0,
      y: compact ? 0.2 : 0.35,
      z: 6.5
    }
  };
}
