import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp } from "@/lib/animation";
import { createRadialTexture } from "@/three/textures";

export const STUDIO_PALETTE = {
  studioBlack: "#080b10",
  graphite: "#151a22",
  porcelain: "#f2f5f7",
  iceBlue: "#8dbfff",
  settleGreen: "#72e1b1",
  alloy: "#b9c3cd",
  cobalt: "#4f7fd6",
  keyWhite: "#eef4fb"
} as const;

export interface StudioEnvironmentProps {
  settledRef: RefObject<number>;
}

const FLOOR_SIZE = 64;
const FLOOR_COLOR = "#0e131b";
const FOG_NEAR = 9;
const FOG_FAR = 30;
const KEY_INTENSITY = 2.8;
const RIM_INTENSITY = 1.9;
const CONTACT_SHADOW_SIZE: [number, number] = [15, 10];
const GREEN_FILL_INTENSITY = 2.4;

const ICE_REFLECTION = "rgba(141, 191, 255, 0.85)";
const PORCELAIN_REFLECTION = "rgba(242, 245, 247, 0.5)";
const GREEN_REFLECTION = "rgba(114, 225, 177, 0.12)";

const floorGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);

const floorMaterial = new THREE.MeshStandardMaterial({
  color: FLOOR_COLOR,
  roughness: 0.94,
  metalness: 0.06,
  envMapIntensity: 0.6
});

function createReflectionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, STUDIO_PALETTE.studioBlack);
  gradient.addColorStop(0.45, STUDIO_PALETTE.graphite);
  gradient.addColorStop(1, "#05070b");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 64);

  const blob = (x: number, y: number, radius: number, color: string) => {
    const radial = context.createRadialGradient(x, y, 0, x, y, radius);
    radial.addColorStop(0, color);
    radial.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = radial;
    context.fillRect(0, 0, 128, 64);
  };
  blob(96, 16, 30, ICE_REFLECTION);
  blob(34, 22, 26, PORCELAIN_REFLECTION);
  blob(64, 56, 34, GREEN_REFLECTION);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function StudioEnvironment({ settledRef }: StudioEnvironmentProps) {
  const scene = useThree((state) => state.scene);
  const fillRef = useRef<THREE.PointLight>(null);

  const contactShadowTexture = useMemo(
    () =>
      createRadialTexture("rgba(8, 11, 16, 0.92)", "rgba(8, 11, 16, 0)"),
    []
  );

  useEffect(
    () => () => {
      contactShadowTexture.dispose();
    },
    [contactShadowTexture]
  );

  useEffect(() => {
    const texture = createReflectionTexture();
    scene.environment = texture;
    scene.fog = new THREE.Fog(STUDIO_PALETTE.studioBlack, FOG_NEAR, FOG_FAR);
    return () => {
      scene.environment = null;
      scene.fog = null;
      texture.dispose();
    };
  }, [scene]);

  useFrame(() => {
    const light = fillRef.current;
    if (light) {
      light.intensity = clamp(settledRef.current) * GREEN_FILL_INTENSITY;
    }
  });

  return (
    <>
      <mesh
        geometry={floorGeometry}
        material={floorMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.001, 0]}
        renderOrder={-1}
      >
        <planeGeometry args={CONTACT_SHADOW_SIZE} />
        <meshBasicMaterial
          map={contactShadowTexture}
          transparent
          opacity={0.85}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <directionalLight
        color={STUDIO_PALETTE.keyWhite}
        intensity={KEY_INTENSITY}
        position={[4, 5.5, 4.5]}
      />

      <directionalLight
        color={STUDIO_PALETTE.cobalt}
        intensity={RIM_INTENSITY}
        position={[-4.5, 2.4, -4]}
      />

      <pointLight
        ref={fillRef}
        color={STUDIO_PALETTE.settleGreen}
        intensity={0}
        position={[0, 0.5, 2.2]}
        distance={9}
        decay={2}
      />
    </>
  );
}
