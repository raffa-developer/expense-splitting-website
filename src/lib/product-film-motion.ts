import { clamp, smoothstep } from "./animation";

export type Orbit = { azimuth: number; elevation: number };

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
  coin: {
    open: number;
    settled: number;
  };
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

export function clampOrbit({ azimuth, elevation }: Orbit): Orbit {
  return {
    azimuth: clampRange(azimuth, -10 * Math.PI / 180, 10 * Math.PI / 180),
    elevation: clampRange(elevation, -5 * Math.PI / 180, 5 * Math.PI / 180)
  };
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
    coin: {
      open:
        smoothstep(0.1, 0.26, value) *
        (1 - smoothstep(0.31, 0.42, value)),
      settled: smoothstep(0.88, 0.98, value)
    },
    laptop: {
      open: smoothstep(0.34, 0.48, value),
      screen: smoothstep(0.43, 0.61, value) * 2
    },
    phone: {
      rotation: smoothstep(0.62, 0.72, value) * Math.PI * 2,
      screen: smoothstep(0.69, 0.82, value) * 2
    },
    camera: {
      x: 0,
      y: compact ? 0.2 : 0.35,
      z: 6.5
    }
  };
}
