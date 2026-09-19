import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { clamp } from "@/lib/animation";
import { THEME_CANVAS, type ResolvedTheme } from "@/lib/theme";
import { createRadialTexture } from "@/three/textures";

export const STUDIO_PALETTE = {
  studioBlack: "#080b10",
  settleGreen: "#72e1b1",
  brandPine: "#6fbfaa",
  brandCoral: "#ffa07a",
  warmKey: "#fff4e8"
} as const;

export interface StageLook {
  background: string;
  floor: string;
  fog: string;
  key: string;
  keyIntensity: number;
  rim: string;
  rimIntensity: number;
  contactShadow: string;
  reflectionTop: string;
  reflectionMid: string;
  reflectionBottom: string;
  accentReflection: string;
  porcelainReflection: string;
  greenReflection: string;
  envIntensity: number;
}

export const STAGE_LOOKS: Record<ResolvedTheme, StageLook> = {
  dark: {
    background: THEME_CANVAS.dark,
    floor: "#211a15",
    fog: THEME_CANVAS.dark,
    key: STUDIO_PALETTE.warmKey,
    keyIntensity: 2.7,
    rim: STUDIO_PALETTE.brandPine,
    rimIntensity: 1.7,
    contactShadow: "rgba(0, 0, 0, 0.92)",
    reflectionTop: "#1a1410",
    reflectionMid: "#241d17",
    reflectionBottom: "#120e0a",
    accentReflection: "rgba(111, 191, 170, 0.55)",
    porcelainReflection: "rgba(255, 244, 232, 0.42)",
    greenReflection: "rgba(114, 225, 177, 0.12)",
    envIntensity: 0.6
  },
  light: {
    background: THEME_CANVAS.light,
    floor: "#ece4da",
    fog: THEME_CANVAS.light,
    key: "#fffaf4",
    keyIntensity: 2.4,
    rim: "#5c8b7d",
    rimIntensity: 1.2,
    contactShadow: "rgba(36, 31, 28, 0.55)",
    reflectionTop: "#fffdfa",
    reflectionMid: "#ece4da",
    reflectionBottom: "#ddd3c6",
    accentReflection: "rgba(30, 91, 79, 0.24)",
    porcelainReflection: "rgba(255, 255, 255, 0.9)",
    greenReflection: "rgba(31, 122, 111, 0.16)",
    envIntensity: 0.85
  }
};

export interface StudioEnvironmentProps {
  settledRef: RefObject<number>;
  theme: ResolvedTheme;
}

const FLOOR_SIZE = 64;
const FOG_NEAR = 9;
const FOG_FAR = 30;
const CONTACT_SHADOW_SIZE: [number, number] = [15, 10];
const GREEN_FILL_INTENSITY = 2.4;

const floorGeometry = new THREE.PlaneGeometry(FLOOR_SIZE, FLOOR_SIZE);

function createReflectionTexture(look: StageLook): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = context.createLinearGradient(0, 0, 0, 64);
  gradient.addColorStop(0, look.reflectionTop);
  gradient.addColorStop(0.45, look.reflectionMid);
  gradient.addColorStop(1, look.reflectionBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 64);

  const blob = (x: number, y: number, radius: number, color: string) => {
    const radial = context.createRadialGradient(x, y, 0, x, y, radius);
    radial.addColorStop(0, color);
    radial.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = radial;
    context.fillRect(0, 0, 128, 64);
  };
  blob(96, 16, 30, look.accentReflection);
  blob(34, 22, 26, look.porcelainReflection);
  blob(64, 56, 34, look.greenReflection);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function StudioEnvironment({ settledRef, theme }: StudioEnvironmentProps) {
  const scene = useThree((state) => state.scene);
  const fillRef = useRef<THREE.PointLight>(null);
  const look = STAGE_LOOKS[theme];

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: look.floor,
        roughness: 0.94,
        metalness: 0.06,
        envMapIntensity: look.envIntensity
      }),
    [look]
  );

  const contactShadowTexture = useMemo(
    () => createRadialTexture(look.contactShadow, "rgba(0, 0, 0, 0)"),
    [look]
  );

  useEffect(
    () => () => {
      contactShadowTexture.dispose();
      floorMaterial.dispose();
    },
    [contactShadowTexture, floorMaterial]
  );

  useEffect(() => {
    const texture = createReflectionTexture(look);
    scene.environment = texture;
    scene.fog = new THREE.Fog(look.fog, FOG_NEAR, FOG_FAR);
    return () => {
      scene.environment = null;
      scene.fog = null;
      texture.dispose();
    };
  }, [scene, look]);

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
        color={look.key}
        intensity={look.keyIntensity}
        position={[4, 5.5, 4.5]}
      />

      <directionalLight
        color={look.rim}
        intensity={look.rimIntensity}
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
