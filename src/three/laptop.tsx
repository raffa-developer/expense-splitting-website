import { useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import type { RefObject } from "react";
import * as THREE from "three";
import { createLinearTexture, createRadialTexture } from "@/three/textures";

const aluminium = new THREE.MeshStandardMaterial({
  color: "#c3c0ba",
  metalness: 0.85,
  roughness: 0.35
});
const aluminiumDark = new THREE.MeshStandardMaterial({
  color: "#8f8c88",
  metalness: 0.8,
  roughness: 0.42
});
const keyboardWell = new THREE.MeshStandardMaterial({
  color: "#151110",
  roughness: 0.7
});
const keyMaterial = new THREE.MeshStandardMaterial({
  color: "#211c19",
  roughness: 0.55
});

export function LaptopModel({
  textures,
  materialsRef,
  lidRef,
  glowRef
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  lidRef?: RefObject<THREE.Group | null>;
  glowRef?: RefObject<THREE.MeshBasicMaterial | null>;
}) {
  const keys = useMemo(() => {
    const rows = 4;
    const cols = 13;
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.15, 0.016, 0.15),
      keyMaterial,
      rows * cols
    );
    mesh.frustumCulled = false;
    const matrix = new THREE.Matrix4();
    let index = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (row === 3 && (col === 0 || col === 12)) {
          continue;
        }
        matrix.setPosition(-0.94 + col * 0.157, 0.012, -0.58 + row * 0.27);
        mesh.setMatrixAt(index, matrix);
        index += 1;
      }
    }
    mesh.count = index;
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, []);

  const glowTexture = useMemo(
    () => createRadialTexture("rgba(255, 214, 178, 0.5)", "rgba(255, 214, 178, 0)"),
    []
  );
  const sheen = useMemo(
    () => createLinearTexture("rgba(255,255,255,0.18)", "rgba(255,255,255,0)"),
    []
  );

  return (
    <group>
      <RoundedBox
        args={[2.62, 0.09, 1.82]}
        radius={0.05}
        smoothness={4}
        position={[0, -1.05, 0.85]}
      >
        <primitive object={aluminium} attach="material" />
      </RoundedBox>

      <mesh position={[0, -1.0, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 1.5]} />
        <primitive object={keyboardWell} attach="material" />
      </mesh>
      <primitive object={keys} position={[0, -0.985, 0.85]} />
      <mesh position={[0, -0.955, 0.85]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.3, 1.5]} />
        <meshBasicMaterial
          ref={glowRef}
          map={glowTexture}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <RoundedBox
        args={[0.9, 0.02, 0.7]}
        radius={0.01}
        smoothness={2}
        position={[0, -0.985, 1.35]}
      >
        <primitive object={aluminiumDark} attach="material" />
      </RoundedBox>

      <group ref={lidRef} position={[0, -1.0, -0.02]} rotation={[1.57, 0, 0]}>
        <RoundedBox
          args={[2.62, 1.7, 0.06]}
          radius={0.04}
          smoothness={4}
          position={[0, 0.85, -0.02]}
        >
          <primitive object={aluminium} attach="material" />
        </RoundedBox>
        <mesh position={[0, 0.85, 0.012]}>
          <planeGeometry args={[2.46, 1.56]} />
          <meshStandardMaterial color="#0a0a0c" metalness={0.3} roughness={0.2} />
        </mesh>
        {textures.map((texture, index) => (
          <mesh
            key={index}
            position={[0, 0.85, 0.016 + index * 0.0004]}
            renderOrder={2 + index}
          >
            <planeGeometry args={[2.3, 1.44]} />
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
        <mesh position={[0, 0.85, 0.02]} renderOrder={9}>
          <planeGeometry args={[2.3, 1.44]} />
          <meshBasicMaterial
            map={sheen}
            transparent
            opacity={0.1}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}
