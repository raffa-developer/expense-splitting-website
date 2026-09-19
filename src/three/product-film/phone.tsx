import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";
import { smoothstep } from "@/lib/animation";
import {
  screenCrossfade,
  type ProductFilmState
} from "@/lib/product-film-motion";
import { createLinearTexture } from "@/three/textures";
import {
  DEVICE_TOKENS,
  applyScreenOpacities,
  createRoundedScreenGeometry,
  createRoundedSlabGeometry
} from "./laptop";

const BODY_W = 0.84;
const BODY_H = 1.74;
const BODY_T = 0.1;
const BODY_RADIUS = 0.12;

const PANEL_W = BODY_W - 0.05;
const PANEL_H = BODY_H - 0.05;
const PANEL_T = 0.016;
const FRONT_PANEL_Z = 0.044;
const BACK_T = 0.014;
const BACK_PANEL_Z = -0.046;

const SCREEN_W = 0.7;
const SCREEN_H = 1.515;
const SCREEN_RADIUS = 0.075;
const SCREEN_FADE = 0.7;
const SCREEN_STAGGER = 0.0005;
const SCREEN_Z = 0.0545;
const COVER_Z = 0.0585;
const REFLECTION_Z = 0.0595;

const ISLAND_X = -0.17;
const ISLAND_Y = 0.54;
const ISLAND_Z = -0.062;
const ISLAND_W = 0.4;
const ISLAND_H = 0.42;
const ISLAND_T = 0.026;
const LENS_RADIUS = 0.082;
const LENS_RING_T = 0.03;
const LENS_GLASS_RADIUS = 0.057;
const LENSES: [number, number][] = [
  [-0.085, -0.1],
  [-0.085, 0.1],
  [0.095, 0]
];
const FLASH_X = 0.095;
const FLASH_Y = 0.115;

const BUTTON_X = BODY_W / 2 - 0.002;
const POWER_Y = 0.3;
const VOLUME_Y = 0.32;

const frameMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.graphite,
  metalness: 0.95,
  roughness: 0.3,
  clearcoat: 0.4,
  clearcoatRoughness: 0.35,
  envMapIntensity: 1.1
});

const frontGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#05070a",
  metalness: 0.3,
  roughness: 0.12,
  clearcoat: 0.9,
  clearcoatRoughness: 0.1
});

const backGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#0b0e14",
  metalness: 0.25,
  roughness: 0.2,
  clearcoat: 1,
  clearcoatRoughness: 0.15
});

const coverGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#0a0f16",
  transparent: true,
  opacity: 0.16,
  metalness: 0,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.7,
  depthWrite: false
});

const ceramicMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.porcelain,
  metalness: 0.05,
  roughness: 0.3,
  clearcoat: 0.6,
  clearcoatRoughness: 0.32
});

const lensRingMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.graphite,
  metalness: 1,
  roughness: 0.18
});

const lensMaterial = new THREE.MeshPhysicalMaterial({
  color: "#060b12",
  metalness: 0.45,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.03,
  envMapIntensity: 1.6
});

const flashMaterial = new THREE.MeshStandardMaterial({
  color: "#e8eef4",
  emissive: DEVICE_TOKENS.iceBlue,
  emissiveIntensity: 0.25,
  roughness: 0.3
});

const buttonMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.graphite,
  metalness: 0.9,
  roughness: 0.28
});

export function phoneScreenVisibility(rotation: number): number {
  const angle = Math.abs(Math.atan2(Math.sin(rotation), Math.cos(rotation)));
  return 1 - smoothstep(0.26, 0.55, angle);
}

export interface StudioPhoneProps {
  state: ProductFilmState;
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  compact: boolean;
}

export function StudioPhone({
  state,
  textures,
  materialsRef,
  compact
}: StudioPhoneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const latest = useRef(state);
  latest.current = state;

  const displayGeometry = useMemo(
    () =>
      createRoundedScreenGeometry(
        SCREEN_W,
        SCREEN_H,
        SCREEN_RADIUS,
        compact ? 5 : 8
      ),
    [compact]
  );

  const bodyGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        BODY_W,
        BODY_H,
        BODY_RADIUS,
        BODY_T,
        0.005,
        compact ? 5 : 8
      ),
    [compact]
  );

  const frontPanelGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        PANEL_W,
        PANEL_H,
        0.1,
        PANEL_T,
        0.0025,
        compact ? 5 : 8
      ),
    [compact]
  );

  const backPanelGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        PANEL_W,
        PANEL_H,
        0.1,
        BACK_T,
        0.0025,
        compact ? 5 : 8
      ),
    [compact]
  );

  const islandGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        ISLAND_W,
        ISLAND_H,
        0.105,
        ISLAND_T,
        0.004,
        compact ? 5 : 8
      ),
    [compact]
  );

  const powerButtonGeometry = useMemo(
    () => createRoundedSlabGeometry(0.05, 0.24, 0.007, 0.016, 0.003, 4),
    []
  );

  const volumeButtonGeometry = useMemo(
    () => createRoundedSlabGeometry(0.05, 0.34, 0.007, 0.016, 0.003, 4),
    []
  );

  const reflectionTexture = useMemo(
    () =>
      createLinearTexture(
        "rgba(242, 245, 247, 0.2)",
        "rgba(242, 245, 247, 0)"
      ),
    []
  );

  const screenMaterials = useMemo(
    () =>
      textures.map(
        (texture) =>
          new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false
          })
      ),
    [textures]
  );

  useLayoutEffect(() => {
    const target = materialsRef?.current;
    if (!target) {
      return;
    }
    screenMaterials.forEach((material, index) => {
      target[index] = material;
    });
    return () => {
      screenMaterials.forEach((_, index) => {
        target[index] = null;
      });
    };
  }, [materialsRef, screenMaterials]);

  useEffect(
    () => () => {
      screenMaterials.forEach((material) => material.dispose());
    },
    [screenMaterials]
  );

  useEffect(
    () => () => {
      displayGeometry.dispose();
      bodyGeometry.dispose();
      frontPanelGeometry.dispose();
      backPanelGeometry.dispose();
      islandGeometry.dispose();
      powerButtonGeometry.dispose();
      volumeButtonGeometry.dispose();
      reflectionTexture.dispose();
    },
    [
      displayGeometry,
      bodyGeometry,
      frontPanelGeometry,
      backPanelGeometry,
      islandGeometry,
      powerButtonGeometry,
      volumeButtonGeometry,
      reflectionTexture
    ]
  );

  useFrame(() => {
    const group = groupRef.current;
    const { rotation, screen } = latest.current.phone;
    if (group) {
      group.rotation.y = rotation;
    }
    const values = screenCrossfade(
      screen,
      screenMaterials.length,
      SCREEN_FADE
    );
    const visibility = phoneScreenVisibility(rotation);
    for (let index = 0; index < values.length; index += 1) {
      values[index] = (values[index] ?? 0) * visibility;
    }
    applyScreenOpacities(screenMaterials, values);
  });

  return (
    <group ref={groupRef} rotation={[0, state.phone.rotation, 0]}>
      <mesh geometry={bodyGeometry} material={frameMaterial} />

      <mesh
        geometry={frontPanelGeometry}
        material={frontGlassMaterial}
        position={[0, 0, FRONT_PANEL_Z]}
      />

      <mesh
        geometry={backPanelGeometry}
        material={backGlassMaterial}
        position={[0, 0, BACK_PANEL_Z]}
      />

      {screenMaterials.map((material, index) => (
        <mesh
          key={index}
          geometry={displayGeometry}
          material={material}
          position={[0, 0, SCREEN_Z + index * SCREEN_STAGGER]}
          renderOrder={2 + index}
        />
      ))}

      <mesh
        geometry={displayGeometry}
        material={coverGlassMaterial}
        position={[0, 0, COVER_Z]}
        renderOrder={6}
      />

      <mesh position={[0, 0, REFLECTION_Z]} renderOrder={7}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial
          map={reflectionTexture}
          transparent
          opacity={0.14}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group position={[ISLAND_X, ISLAND_Y, ISLAND_Z]}>
        <mesh geometry={islandGeometry} material={ceramicMaterial} />

        {LENSES.map(([x, y]) => (
          <group key={`${x}:${y}`} position={[x, y, 0]}>
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -0.012]}
              material={lensRingMaterial}
            >
              <cylinderGeometry
                args={[
                  LENS_RADIUS,
                  LENS_RADIUS,
                  LENS_RING_T,
                  compact ? 16 : 28
                ]}
              />
            </mesh>
            <mesh
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -0.02]}
              material={lensMaterial}
            >
              <cylinderGeometry
                args={[
                  LENS_GLASS_RADIUS,
                  LENS_GLASS_RADIUS,
                  0.01,
                  compact ? 14 : 24
                ]}
              />
            </mesh>
          </group>
        ))}

        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[FLASH_X, FLASH_Y, -0.014]}
          material={flashMaterial}
        >
          <cylinderGeometry args={[0.024, 0.024, 0.012, compact ? 10 : 16]} />
        </mesh>
      </group>

      <mesh
        geometry={powerButtonGeometry}
        material={buttonMaterial}
        rotation={[0, Math.PI / 2, 0]}
        position={[BUTTON_X, POWER_Y, 0]}
      />

      <mesh
        geometry={volumeButtonGeometry}
        material={buttonMaterial}
        rotation={[0, -Math.PI / 2, 0]}
        position={[-BUTTON_X, VOLUME_Y, 0]}
      />
    </group>
  );
}
