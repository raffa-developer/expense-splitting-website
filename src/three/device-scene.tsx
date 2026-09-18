import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ProceduralEnvironment } from "@/three/environment";
import { ContextReleaser } from "@/three/context-releaser";
import { MacbookModel, screenOpacity } from "@/three/models";
import { PhoneModel, PHONE_SCREEN_TEXTURE } from "@/three/phone";
import { createRadialTexture, useScreenTextures } from "@/three/textures";
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

function Laptop({ progress }: { progress: ScrollProgress }) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Object3D | null>(null);
  const phone = useRef<THREE.Group>(null);
  const spill = useRef<THREE.PointLight>(null);
  const screenMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phoneMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const shadow = useMemo(
    () => createRadialTexture("rgba(0, 0, 0, 0.6)", "rgba(0, 0, 0, 0)"),
    []
  );
  const pointerY = useRef(0);
  const laptopTextures = useScreenTextures(LAPTOP_SCREENS);
  const phoneTextures = useScreenTextures(PHONE_SCREENS, PHONE_SCREEN_TEXTURE);

  useFrame((state) => {
    const value = progress.current;
    const time = state.clock.elapsedTime;
    const open = smoothstep(0.06, 0.36, value);
    const entrance = smoothstep(0.07, 0.28, value);
    const pointer = state.pointer;
    const early = smoothstep(0.06, 0.16, value);
    const late = smoothstep(0.76, 0.94, value);
    const screen = Math.min(early, 1) + late * (LAPTOP_SCREENS.length - 1 - 1);
    const reveal = smoothstep(0.05, 0.2, value);

    screenMaterials.current.forEach((material, index) => {
      if (!material) {
        return;
      }
      material.opacity = screenOpacity(screen - index, 0.35);
    });

    const phoneCount = PHONE_SCREENS.length;
    const phoneCycle = (time / 5.5) % 1;
    const phoneRaw =
      (((time / 5.5 - 0.1) % phoneCount) + phoneCount) % phoneCount;
    const cycleFlip = smoothstep(0.82, 1, phoneCycle);
    const circularDelta = (index: number): number => {
      let delta = phoneRaw - index;
      if (delta > phoneCount / 2) {
        delta -= phoneCount;
      }
      if (delta < -phoneCount / 2) {
        delta += phoneCount;
      }
      return delta;
    };
    phoneMaterials.current.forEach((material, index) => {
      if (!material) {
        return;
      }
      material.opacity = screenOpacity(circularDelta(index), 0.15);
    });

    if (root.current) {
      pointerY.current = THREE.MathUtils.lerp(pointerY.current, pointer.x * 0.1, 0.06);
      root.current.position.y =
        -0.55 * (1 - entrance) + Math.sin(time * 0.45) * 0.03;
      root.current.rotation.y = pointerY.current + reveal * Math.PI * 2;
      root.current.rotation.x = THREE.MathUtils.lerp(
        root.current.rotation.x,
        -pointer.y * 0.05 + 0.02,
        0.05
      );
    }

    if (lid.current) {
      lid.current.rotation.x = THREE.MathUtils.lerp(
        lid.current.rotation.x,
        (1 - open) * (Math.PI / 2),
        0.06
      );
    }

    const phoneIn = smoothstep(0.46, 0.74, value);
    const closeUp = smoothstep(0.82, 0.9, value) * (1 - smoothstep(0.94, 1, value));
    const flipShow = Math.sin(Math.PI * smoothstep(0.8, 0.92, value)) * Math.PI;
    const settle = Math.sin(time * 3.2) * 0.025 * (1 - phoneIn);
    if (phone.current) {
      phone.current.position.x = THREE.MathUtils.lerp(-1.55, 0.02, closeUp);
      phone.current.position.y =
        THREE.MathUtils.lerp(2.6, -0.72, phoneIn) + settle + closeUp * 0.85;
      phone.current.position.z = 1.02 + closeUp * 0.55;
      phone.current.rotation.z = THREE.MathUtils.lerp(0.14, -0.04, phoneIn);
      phone.current.rotation.y =
        THREE.MathUtils.lerp(0.4, 0.24, phoneIn) -
        closeUp * 0.2 +
        flipShow +
        cycleFlip * (1 - closeUp) * Math.PI * 2;
      phone.current.rotation.x =
        THREE.MathUtils.lerp(-0.05, -0.16, phoneIn) + closeUp * 0.08;
      phone.current.scale.setScalar(0.58 + closeUp * 0.2);
    }

    if (spill.current) {
      spill.current.intensity = open * 1.5;
    }

    const zoomIn = smoothstep(0.24, 0.58, value);
    const zoomOut = smoothstep(0.76, 1, value);
    const distance = 6.5 - zoomIn * 4.4 + zoomOut * 3.2;
    const orbit = (1 - smoothstep(0, 0.42, value)) * 0.62;
    const camera = state.camera;
    camera.position.set(
      Math.sin(orbit) * distance + pointer.x * 0.12,
      0.32 + (1 - open) * 0.28 + zoomIn * 0.5 + pointer.y * 0.06,
      Math.cos(orbit) * distance
    );
    camera.lookAt(0, 0.06 + zoomIn * 0.42, 0);
  });

  return (
    <group ref={root}>
      <mesh position={[0, -1.02, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.9, 2.6]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      <MacbookModel
        textures={laptopTextures}
        materialsRef={screenMaterials}
        lidRef={lid}
      />

      <pointLight
        ref={spill}
        position={[0, 0.55, 0.8]}
        intensity={0}
        distance={3}
        color="#ffe9d6"
      />

      <group
        ref={phone}
        position={[-1.55, 2.6, 1.02]}
        rotation={[-0.05, 0.4, 0.14]}
        scale={0.58}
      >
        <PhoneModel textures={phoneTextures} materialsRef={phoneMaterials} />
      </group>
    </group>
  );
}

export default function DeviceCanvas({
  progress
}: {
  progress: ScrollProgress;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0.4, 6.5], fov: 35 }}
    >
      <ContextReleaser />
      <ProceduralEnvironment />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 6]} intensity={1.2} color="#fff4e8" />
      <pointLight position={[-4, -1, 3]} intensity={1.7} color="#6fbfaa" />
      <pointLight position={[4, 1, 2]} intensity={1.3} color="#ff9e72" />
      <Laptop progress={progress} />
    </Canvas>
  );
}
