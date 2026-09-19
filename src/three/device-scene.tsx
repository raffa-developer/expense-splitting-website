import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import * as THREE from "three";
import { ProceduralEnvironment } from "@/three/environment";
import { ContextReleaser } from "@/three/context-releaser";
import { LaptopModel } from "@/three/laptop";
import { PhoneModel, PHONE_SCREEN_TEXTURE } from "@/three/phone";
import {
  createRadialTexture,
  screenFadeThrough,
  screenOpacity,
  useScreenTextures
} from "@/three/textures";
import type { ScrollProgress } from "@/lib/animation";
import desktopDashboard from "@/assets/screens/desktop-dashboard.png";
import desktopGroup from "@/assets/screens/desktop-group.png";
import desktopExpenses from "@/assets/screens/desktop-expenses.png";
import desktopPeople from "@/assets/screens/desktop-people.png";
import mobileDashboard from "@/assets/screens/mobile-dashboard.png";
import mobileGroup from "@/assets/screens/mobile-group.png";
import mobileExpenses from "@/assets/screens/mobile-expenses.png";

const LAPTOP_SCREENS = [
  desktopDashboard,
  desktopGroup,
  desktopExpenses,
  desktopPeople
];
const PHONE_SCREENS = [mobileDashboard, mobileGroup, mobileExpenses];

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function DprGuard() {
  const gl = useThree((state) => state.gl);
  return (
    <PerformanceMonitor
      onDecline={() => gl.setPixelRatio(1)}
      onIncline={() =>
        gl.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1))
      }
    >
      <></>
    </PerformanceMonitor>
  );
}

function Devices({
  progress,
  reduce
}: {
  progress: ScrollProgress;
  reduce: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group | null>(null);
  const glow = useRef<THREE.MeshBasicMaterial | null>(null);
  const phone = useRef<THREE.Group>(null);
  const screenMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phoneMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const pointerY = useRef(0);
  const shadow = useMemo(
    () => createRadialTexture("rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0)"),
    []
  );
  const laptopTextures = useScreenTextures(LAPTOP_SCREENS);
  const phoneTextures = useScreenTextures(PHONE_SCREENS, PHONE_SCREEN_TEXTURE);

  useFrame((state) => {
    const value = progress.current;
    const time = state.clock.elapsedTime;
    const t = reduce ? 0 : time;
    const pointer = state.pointer;

    const enter = smoothstep(0.02, 0.14, value);
    const open = easeInOutCubic(smoothstep(0.14, 0.34, value));
    const dollyIn = smoothstep(0.52, 0.78, value);
    const pullBack = smoothstep(0.78, 0.9, value);
    const phoneIn = smoothstep(0.78, 0.9, value);
    const screen = smoothstep(0.52, 0.78, value) * 3;
    const phoneScreen = (t / 6) % PHONE_SCREENS.length;

    screenMaterials.current.forEach((material, index) => {
      if (material) {
        material.opacity = screenOpacity(screen - index, 0.5);
      }
    });
    phoneMaterials.current.forEach((material, index) => {
      if (!material) {
        return;
      }
      let delta = phoneScreen - index;
      if (delta > PHONE_SCREENS.length / 2) {
        delta -= PHONE_SCREENS.length;
      }
      if (delta < -PHONE_SCREENS.length / 2) {
        delta += PHONE_SCREENS.length;
      }
      material.opacity = screenFadeThrough(delta, 0.85, 0.12);
    });

    if (root.current) {
      pointerY.current = THREE.MathUtils.lerp(
        pointerY.current,
        pointer.x * 0.08,
        0.05
      );
      root.current.position.y =
        -1.2 * (1 - enter) + Math.sin(t * 0.4) * 0.015;
      root.current.rotation.y = pointerY.current;
    }
    if (lid.current) {
      lid.current.rotation.x = THREE.MathUtils.lerp(1.57, -0.15, open);
    }
    if (glow.current) {
      glow.current.opacity = open * (0.5 + 0.06 * Math.sin(t * 2.2));
    }
    if (phone.current) {
      phone.current.position.set(
        THREE.MathUtils.lerp(-1.55, 0.02, phoneIn),
        THREE.MathUtils.lerp(-1.05, 0.55, phoneIn),
        THREE.MathUtils.lerp(0.9, 2.2, phoneIn)
      );
      phone.current.rotation.set(
        THREE.MathUtils.lerp(-0.12, -0.1, phoneIn),
        THREE.MathUtils.lerp(0.5, 0.12, phoneIn),
        0.04
      );
      phone.current.scale.setScalar(THREE.MathUtils.lerp(0.55, 0.92, phoneIn));
    }

    const distance = 7.5 - dollyIn * 4.9 + pullBack * 2.0;
    state.camera.position.set(
      Math.sin(pointerY.current) * distance,
      0.35 + dollyIn * 0.55 + pointer.y * 0.05,
      Math.cos(pointerY.current) * distance
    );
    state.camera.lookAt(0, 0.1 + dollyIn * 0.45, 0);
  });

  return (
    <group ref={root}>
      <mesh position={[0, -1.08, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.9, 2.6]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
      <LaptopModel
        textures={laptopTextures}
        materialsRef={screenMaterials}
        lidRef={lid}
        glowRef={glow}
      />
      <group
        ref={phone}
        position={[-1.55, -1.05, 0.9]}
        rotation={[-0.12, 0.5, 0.04]}
        scale={0.55}
      >
        <PhoneModel textures={phoneTextures} materialsRef={phoneMaterials} />
      </group>
    </group>
  );
}

export default function DeviceCanvas({
  progress,
  reduce = false
}: {
  progress: ScrollProgress;
  reduce?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.4, 7.5], fov: 35 }}
    >
      <ContextReleaser />
      <ProceduralEnvironment />
      <DprGuard />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} color="#fff4e8" />
      <pointLight position={[-4, -1, 3]} intensity={1.7} color="#6fbfaa" />
      <pointLight position={[4, 1, 2]} intensity={1.3} color="#ff9e72" />
      <Devices progress={progress} reduce={reduce} />
    </Canvas>
  );
}
