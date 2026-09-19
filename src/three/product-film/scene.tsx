import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import type { RefObject } from "react";
import { clamp, type ScrollProgress } from "@/lib/animation";
import { THEME_CANVAS, type ResolvedTheme } from "@/lib/theme";
import {
  clampOrbit,
  getProductFilmState,
  type Orbit,
  type ProductFilmState
} from "@/lib/product-film-motion";
import { ContextReleaser } from "@/three/context-releaser";
import { useScreenTextures } from "@/three/textures";
import { StudioLaptop } from "./laptop";
import { StudioPhone } from "./phone";
import { StudioEnvironment } from "./studio";
import desktopDashboard from "@/assets/screens/desktop-dashboard.png";
import desktopGroup from "@/assets/screens/desktop-group.png";
import desktopExpenses from "@/assets/screens/desktop-expenses.png";
import mobileDashboard from "@/assets/screens/mobile-dashboard.png";
import mobileGroup from "@/assets/screens/mobile-group.png";
import mobileExpenses from "@/assets/screens/mobile-expenses.png";

const LAPTOP_SCREENS = [desktopDashboard, desktopGroup, desktopExpenses];
const PHONE_SCREENS = [mobileDashboard, mobileGroup, mobileExpenses];

const LAPTOP_SCREEN = { width: 3.08, height: 1.96 } as const;
const PHONE_SCREEN = { width: 0.8, height: 1.7 } as const;

const DEG = Math.PI / 180;
const AZIMUTH_RANGE = 20 * DEG;
const ELEVATION_RANGE = 10 * DEG;
const ORBIT_DAMPING = 6;
const ORBIT_EPSILON = 0.0001;

const COMPACT_STAGE_SCALE = 0.46;
const RAIL_SCALE_COMPACT = 0.3;

const LAPTOP_GROUND_Y = 0.065;
const LAPTOP_HIDDEN_Y = -2.4;
const PHONE_REST_Y = 0.86;
const PHONE_HIDDEN_Y = -1.95;
const FOG_HIDDEN_SETTLE = 0.9;

const PHONE_RISE_SPAN = 0.4;
const COMPACT_LAPTOP_SINK = 3.2;
const COMPACT_LAPTOP_HANDOFF_END = 0.7;

const BASE_POSITION = new THREE.Vector3();
const FOCUS_POSITION = new THREE.Vector3();
const CAMERA_OFFSET = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);

interface DragState {
  pointerId: number;
  x: number;
  y: number;
  azimuth: number;
  elevation: number;
}

// ShapeGeometry emits UVs in local shape units, so screenshot maps need the
// screen bounds folded into their repeat/offset. Plane and image aspects rarely
// match, so the longer image axis is cover-cropped from the centre instead of stretched.
function mapScreenUvs(
  textures: THREE.Texture[],
  width: number,
  height: number
): void {
  const planeAspect = width / height;
  for (const texture of textures) {
    const image = texture.image as { width?: number; height?: number } | null;
    const imageWidth = image?.width ?? 0;
    const imageHeight = image?.height ?? 0;
    if (imageWidth <= 0 || imageHeight <= 0) {
      texture.repeat.set(1 / width, 1 / height);
      texture.offset.set(0.5, 0.5);
      texture.needsUpdate = true;
      continue;
    }
    const imageAspect = imageWidth / imageHeight;
    if (imageAspect > planeAspect) {
      texture.repeat.set(planeAspect / imageAspect / width, 1 / height);
    } else {
      texture.repeat.set(1 / width, imageAspect / planeAspect / height);
    }
    texture.offset.set(0.5, 0.5);
    texture.needsUpdate = true;
  }
}

function DprGuard({ compact }: { compact: boolean }) {
  const gl = useThree((state) => state.gl);
  return (
    <PerformanceMonitor
      onDecline={() => gl.setPixelRatio(1)}
      onIncline={() =>
        gl.setPixelRatio(
          Math.min(compact ? 1.25 : 1.5, window.devicePixelRatio || 1)
        )
      }
    >
      <></>
    </PerformanceMonitor>
  );
}

function FilmScene({
  progress,
  compact,
  reduce,
  theme,
  orbitRef,
  draggingRef
}: {
  progress: ScrollProgress;
  compact: boolean;
  reduce: boolean;
  theme: ResolvedTheme;
  orbitRef: RefObject<Orbit>;
  draggingRef: RefObject<boolean>;
}) {
  const filmRef = useRef<ProductFilmState | null>(null);
  if (filmRef.current === null) {
    filmRef.current = getProductFilmState(progress.current, compact, reduce);
  }
  const film = filmRef.current;

  const laptopRef = useRef<THREE.Group>(null);
  const phoneRef = useRef<THREE.Group>(null);
  const laptopMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phoneMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const settledRef = useRef(0);

  const laptopTextures = useScreenTextures(LAPTOP_SCREENS);
  const phoneTextures = useScreenTextures(PHONE_SCREENS);

  useLayoutEffect(() => {
    mapScreenUvs(laptopTextures, LAPTOP_SCREEN.width, LAPTOP_SCREEN.height);
  }, [laptopTextures]);

  useLayoutEffect(() => {
    mapScreenUvs(phoneTextures, PHONE_SCREEN.width, PHONE_SCREEN.height);
  }, [phoneTextures]);

  useFrame((root, delta) => {
    const next = getProductFilmState(progress.current, compact, reduce);
    film.activeDevice = next.activeDevice;
    film.settled = next.settled;
    Object.assign(film.laptop, next.laptop);
    Object.assign(film.phone, next.phone);
    Object.assign(film.camera, next.camera);

    const plan = clamp(film.laptop.open);
    const capture = clamp(film.phone.rotation / (Math.PI * 2));
    const captureScreens = clamp(film.phone.screen);
    const settle = clamp(film.settled);
    const activeDevice = film.activeDevice;
    const rise = clamp(capture / PHONE_RISE_SPAN);

    settledRef.current = next.settled;

    const orbit = orbitRef.current;
    if (!draggingRef.current) {
      const ease = 1 - Math.exp(-ORBIT_DAMPING * delta);
      orbit.azimuth += (0 - orbit.azimuth) * ease;
      orbit.elevation += (0 - orbit.elevation) * ease;
      if (Math.abs(orbit.azimuth) < ORBIT_EPSILON) orbit.azimuth = 0;
      if (Math.abs(orbit.elevation) < ORBIT_EPSILON) orbit.elevation = 0;
    }

    const railScale = compact ? RAIL_SCALE_COMPACT : 1;
    const push =
      (plan * 0.5 + captureScreens * 0.25 - settle * 0.75) * railScale;
    const focusY =
      (compact ? 0.42 : 0.85) +
      (plan * 0.1 + captureScreens * 0.06 - settle * 0.08) * railScale;
    const focusZ = captureScreens * 0.35 * railScale;

    FOCUS_POSITION.set(film.camera.x, focusY, focusZ);
    BASE_POSITION.set(
      film.camera.x,
      film.camera.y,
      film.camera.z - push
    );
    CAMERA_OFFSET.subVectors(BASE_POSITION, FOCUS_POSITION);
    CAMERA_OFFSET.applyAxisAngle(UP, orbit.azimuth);
    CAMERA_OFFSET.applyAxisAngle(RIGHT, orbit.elevation);
    root.camera.position.copy(FOCUS_POSITION).add(CAMERA_OFFSET);
    root.camera.lookAt(FOCUS_POSITION);

    const laptop = laptopRef.current;
    if (laptop) {
      const handoff = compact && activeDevice === "phone" ? rise : 0;
      laptop.position.set(
        -0.65 * capture - 1.9 * settle,
        THREE.MathUtils.lerp(LAPTOP_HIDDEN_Y, LAPTOP_GROUND_Y, plan) -
          COMPACT_LAPTOP_SINK * handoff,
        -0.55 * capture - 26 * settle
      );
      laptop.rotation.y = -0.08 * capture - 0.12 * settle;
      laptop.visible = compact
        ? activeDevice === "laptop" ||
          (activeDevice === "phone" &&
            handoff < COMPACT_LAPTOP_HANDOFF_END)
        : plan > 0.001 && settle < FOG_HIDDEN_SETTLE;
    }

    const phone = phoneRef.current;
    if (phone) {
      phone.position.set(
        0.22 - 0.9 * settle,
        THREE.MathUtils.lerp(PHONE_HIDDEN_Y, PHONE_REST_Y, rise) +
          0.35 * settle,
        THREE.MathUtils.lerp(1.45, 2.15, capture) - 28 * settle
      );
      phone.scale.setScalar(1 - 0.35 * settle);
      phone.visible = compact
        ? activeDevice === "phone" ||
          (activeDevice === null && settle < FOG_HIDDEN_SETTLE)
        : rise > 0.001 && settle < FOG_HIDDEN_SETTLE;
    }
  });

  return (
    <>
      <StudioEnvironment settledRef={settledRef} theme={theme} />
      <group scale={compact ? COMPACT_STAGE_SCALE : 1}>
        <group ref={laptopRef} position={[0, LAPTOP_HIDDEN_Y, 0]} visible={false}>
          <StudioLaptop
            state={film}
            textures={laptopTextures}
            materialsRef={laptopMaterials}
            compact={compact}
          />
        </group>
        <group
          ref={phoneRef}
          position={[0.22, PHONE_HIDDEN_Y, 1.45]}
          visible={false}
        >
          <StudioPhone
            state={film}
            textures={phoneTextures}
            materialsRef={phoneMaterials}
            compact={compact}
          />
        </group>
      </group>
    </>
  );
}

export interface ProductFilmCanvasProps {
  progress: ScrollProgress;
  compact: boolean;
  theme: ResolvedTheme;
  reduce?: boolean;
}

export default function ProductFilmCanvas({
  progress,
  compact,
  theme,
  reduce = false
}: ProductFilmCanvasProps) {
  const orbit = useRef<Orbit>({ azimuth: 0, elevation: 0 });
  const drag = useRef<DragState | null>(null);
  const dragging = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || !event.isPrimary || event.button !== 0) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) {
      return;
    }
    dragging.current = true;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      azimuth: orbit.current.azimuth,
      elevation: orbit.current.elevation
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      dragging.current = false;
      drag.current = null;
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (reduce || !active || active.pointerId !== event.pointerId) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    orbit.current = clampOrbit({
      azimuth:
        active.azimuth -
        ((event.clientX - active.x) / rect.width) * AZIMUTH_RANGE,
      elevation:
        active.elevation -
        ((event.clientY - active.y) / rect.height) * ELEVATION_RANGE
    });
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) {
      return;
    }
    drag.current = null;
    dragging.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      className="relative h-full w-full touch-pan-y select-none"
      aria-hidden="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onLostPointerCapture={handlePointerEnd}
    >
      <Canvas
        dpr={[1, compact ? 1.25 : 1.5]}
        gl={{ antialias: true }}
        camera={{
          position: [0, compact ? 0.2 : 0.35, 6.5],
          fov: 35,
          near: 0.1,
          far: 60
        }}
      >
        <color attach="background" args={[THEME_CANVAS[theme]]} />
        <ContextReleaser />
        <DprGuard compact={compact} />
        <FilmScene
          progress={progress}
          compact={compact}
          reduce={reduce}
          theme={theme}
          orbitRef={orbit}
          draggingRef={dragging}
        />
      </Canvas>
    </div>
  );
}
