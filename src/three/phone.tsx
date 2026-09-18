import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import { createLinearTexture } from "@/three/textures";

export const PHONE_SCREEN_TEXTURE = { radius: 0.055, punchHole: true } as const;

const frameMaterial = new THREE.MeshStandardMaterial({
  color: "#2b231d",
  metalness: 0.85,
  roughness: 0.32
});
const glassMaterial = new THREE.MeshStandardMaterial({
  color: "#0a0908",
  metalness: 0.4,
  roughness: 0.18
});
const islandMaterial = new THREE.MeshStandardMaterial({
  color: "#241c16",
  metalness: 0.7,
  roughness: 0.3
});
const lensRingMaterial = new THREE.MeshStandardMaterial({
  color: "#5a4638",
  metalness: 0.95,
  roughness: 0.2
});
const lensMaterial = new THREE.MeshStandardMaterial({
  color: "#0b1622",
  metalness: 0.9,
  roughness: 0.06
});

export function PhoneModel({
  textures,
  materialsRef
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
}) {
  const sheen = useMemo(
    () => createLinearTexture("rgba(255,255,255,0.22)", "rgba(255,255,255,0)"),
    []
  );

  return (
    <group>
      <RoundedBox args={[0.82, 1.68, 0.09]} radius={0.1} smoothness={6}>
        <meshStandardMaterial
          color="#2b231d"
          metalness={0.85}
          roughness={0.32}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.76, 1.6, 0.02]}
        radius={0.085}
        smoothness={5}
        position={[0, 0, 0.038]}
      >
        <primitive object={glassMaterial} attach="material" />
      </RoundedBox>

      <mesh position={[-0.43, 0.24, 0]}>
        <boxGeometry args={[0.014, 0.16, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      <mesh position={[-0.43, 0.02, 0]}>
        <boxGeometry args={[0.014, 0.12, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>
      <mesh position={[0.43, 0.08, 0]}>
        <boxGeometry args={[0.014, 0.24, 0.04]} />
        <primitive object={frameMaterial} attach="material" />
      </mesh>

      <group position={[-0.18, 0.5, -0.055]}>
        <RoundedBox args={[0.36, 0.36, 0.028]} radius={0.09} smoothness={4}>
          <primitive object={islandMaterial} attach="material" />
        </RoundedBox>
        {[-0.075, 0.075].map((offset) => (
          <group key={offset} position={[-0.06, offset, -0.026]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.028, 24]} />
              <primitive object={lensRingMaterial} attach="material" />
            </mesh>
            <mesh position={[0, 0, -0.016]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.048, 0.048, 0.008, 24]} />
              <primitive object={lensMaterial} attach="material" />
            </mesh>
          </group>
        ))}
        <mesh position={[0.1, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.012, 16]} />
          <meshStandardMaterial
            color="#f2e6cd"
            emissive="#f2e6cd"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>

      {textures.map((texture, index) => (
        <mesh
          key={index}
          position={[0, 0, 0.052 + index * 0.0004]}
          renderOrder={2 + index}
        >
          <planeGeometry args={[0.7, 1.52]} />
          <meshBasicMaterial
            ref={(material) => {
              if (materialsRef) {
                materialsRef.current[index] = material;
              }
            }}
            map={texture}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}

      <mesh position={[0, -0.24, 0.056]} renderOrder={9}>
        <planeGeometry args={[0.7, 1.52]} />
        <meshBasicMaterial
          map={sheen}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
