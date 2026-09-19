import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import * as THREE from "three";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clamp } from "@/lib/animation";
import {
  screenCrossfade,
  type ProductFilmState
} from "@/lib/product-film-motion";
import { createLinearTexture, createRadialTexture } from "@/three/textures";

export const DEVICE_TOKENS = {
  graphite: "#151a22",
  porcelain: "#f2f5f7",
  settleGreen: "#72e1b1",
  studioBlack: "#080b10"
} as const;

const BASE_W = 3.24;
const BASE_D = 2.24;
const BASE_T = 0.13;
const BASE_RADIUS = 0.055;
const DECK_Y = BASE_T / 2;

const LID_T = 0.075;
const LID_D = BASE_D - 0.16;
const LID_RADIUS = 0.034;
const LID_OPEN = 1.8;

const HINGE_RADIUS = 0.05;
const HINGE_Z = -BASE_D / 2 + 0.04;
const HINGE_Y = DECK_Y + LID_T / 2 + 0.004;
const HINGE_BARRELS = [-1.06, 0, 1.06];
const HINGE_BARREL_LENGTH = 0.9;

const SCREEN_W = 3.08;
const SCREEN_H = 1.96;
const SCREEN_RADIUS = 0.07;
const SCREEN_FADE = 0.5;
const SCREEN_STAGGER = 0.0006;

const GLASS_PANEL_Y = -LID_T / 2 - 0.004;
const GLASS_PANEL_T = 0.014;
const SCREEN_Y = -LID_T / 2 - 0.014;
const COVER_Y = -LID_T / 2 - 0.0175;
const REFLECTION_Y = -LID_T / 2 - 0.0195;

const KEYBOARD_W = 2.76;
const KEYBOARD_D = 1.06;
const KEYBOARD_Z = -0.26;
const KEYBOARD_T = 0.02;
const KEYBOARD_TOP = DECK_Y + 0.003;
const KEYBOARD_Y = KEYBOARD_TOP - KEYBOARD_T / 2;
const KEY_W = 0.17;
const KEY_D = 0.16;
const KEY_H = 0.012;

const TRACKPAD_W = 1.18;
const TRACKPAD_D = 0.74;
const TRACKPAD_Z = 0.66;
const TRACKPAD_T = 0.012;
const TRACKPAD_Y = DECK_Y - TRACKPAD_T / 2;

const SLAB_CREASE_ANGLE = Math.PI / 6;

const shellMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.graphite,
  metalness: 0.92,
  roughness: 0.34,
  clearcoat: 0.35,
  clearcoatRoughness: 0.42,
  envMapIntensity: 1.05
});

const hingeMaterial = new THREE.MeshStandardMaterial({
  color: "#120f0c",
  metalness: 0.85,
  roughness: 0.42
});

const keyboardMaterial = new THREE.MeshStandardMaterial({
  color: DEVICE_TOKENS.studioBlack,
  metalness: 0.2,
  roughness: 0.62
});

const keyMaterial = new THREE.MeshPhysicalMaterial({
  color: "#201b17",
  metalness: 0.12,
  roughness: 0.4,
  clearcoat: 0.25,
  clearcoatRoughness: 0.5
});

const trackpadMaterial = new THREE.MeshPhysicalMaterial({
  color: DEVICE_TOKENS.graphite,
  metalness: 0.45,
  roughness: 0.26,
  clearcoat: 0.7,
  clearcoatRoughness: 0.28,
  envMapIntensity: 1.2,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -2
});

const bezelMaterial = new THREE.MeshPhysicalMaterial({
  color: "#0a0806",
  metalness: 0.3,
  roughness: 0.14,
  clearcoat: 0.8,
  clearcoatRoughness: 0.12
});

const coverGlassMaterial = new THREE.MeshPhysicalMaterial({
  color: "#0f0c09",
  transparent: true,
  opacity: 0.18,
  metalness: 0,
  roughness: 0.05,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.8,
  depthWrite: false
});

export interface ScreenOpacityTarget {
  opacity: number;
}

export function applyScreenOpacities(
  materials: readonly ScreenOpacityTarget[],
  values: readonly number[]
): void {
  materials.forEach((material, index) => {
    material.opacity = clamp(values[index] ?? 0);
  });
}

function createRoundedShape(
  width: number,
  height: number,
  radius: number
): THREE.Shape {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + radius, -halfHeight);
  shape.lineTo(halfWidth - radius, -halfHeight);
  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth,
    -halfHeight + radius
  );
  shape.lineTo(halfWidth, halfHeight - radius);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - radius, halfHeight);
  shape.lineTo(-halfWidth + radius, halfHeight);
  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth,
    halfHeight - radius
  );
  shape.lineTo(-halfWidth, -halfHeight + radius);
  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth + radius,
    -halfHeight
  );
  return shape;
}

export function createRoundedScreenGeometry(
  width: number,
  height: number,
  radius: number,
  curveSegments = 8
): THREE.ShapeGeometry {
  return new THREE.ShapeGeometry(
    createRoundedShape(width, height, radius),
    curveSegments
  );
}

function extrudeRoundedSlab(
  shape: THREE.Shape,
  thickness: number,
  bevel: number,
  curveSegments: number
): THREE.ExtrudeGeometry {
  const safeBevel = Math.max(
    0.0005,
    Math.min(bevel, thickness / 2 - 0.0005)
  );
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - safeBevel * 2,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: safeBevel,
    bevelSize: safeBevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments
  });
  geometry.center();
  toCreasedNormals(geometry, SLAB_CREASE_ANGLE);
  return geometry;
}

export function createRoundedSlabGeometry(
  width: number,
  height: number,
  radius: number,
  thickness: number,
  bevel = 0.002,
  curveSegments = 8
): THREE.ExtrudeGeometry {
  return extrudeRoundedSlab(
    createRoundedShape(width, height, radius),
    thickness,
    bevel,
    curveSegments
  );
}

export function createRoundedRingGeometry(
  width: number,
  height: number,
  radius: number,
  holeWidth: number,
  holeHeight: number,
  holeRadius: number,
  thickness: number,
  bevel = 0.002,
  curveSegments = 8
): THREE.ExtrudeGeometry {
  const shape = createRoundedShape(width, height, radius);
  shape.holes.push(createRoundedShape(holeWidth, holeHeight, holeRadius));
  return extrudeRoundedSlab(shape, thickness, bevel, curveSegments);
}

function createKeyMatrices(compact: boolean): THREE.Matrix4[] {
  const cols = compact ? 10 : 14;
  const rows = compact ? 4 : 5;
  const pitchX = compact ? 0.25 : 0.19;
  const pitchZ = compact ? 0.25 : 0.195;
  const width = KEY_W + pitchX * (cols - 1);
  const depth = KEY_D + pitchZ * (rows - 1);
  const startX = -width / 2 + KEY_W / 2;
  const startZ = KEYBOARD_Z - depth / 2 + KEY_D / 2;
  const matrices: THREE.Matrix4[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      matrices.push(
        new THREE.Matrix4().makeTranslation(
          startX + col * pitchX,
          KEYBOARD_TOP + KEY_H / 2 - 0.002,
          startZ + row * pitchZ
        )
      );
    }
  }
  return matrices;
}

export interface StudioLaptopProps {
  state: ProductFilmState;
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  compact: boolean;
}

export function StudioLaptop({
  state,
  textures,
  materialsRef,
  compact
}: StudioLaptopProps) {
  const lidRef = useRef<THREE.Group>(null);
  const keysMesh = useRef<THREE.InstancedMesh>(null);
  const latest = useRef(state);
  latest.current = state;

  const keys = useMemo(() => createKeyMatrices(compact), [compact]);

  const screenGeometry = useMemo(
    () =>
      createRoundedScreenGeometry(
        SCREEN_W,
        SCREEN_H,
        SCREEN_RADIUS,
        compact ? 5 : 8
      ),
    [compact]
  );

  const coverGeometry = useMemo(
    () =>
      createRoundedScreenGeometry(
        SCREEN_W,
        SCREEN_H,
        SCREEN_RADIUS + 0.02,
        compact ? 5 : 8
      ),
    [compact]
  );

  const keyboardGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        KEYBOARD_W,
        KEYBOARD_D,
        0.03,
        KEYBOARD_T,
        0.004,
        compact ? 5 : 8
      ),
    [compact]
  );

  const trackpadGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        TRACKPAD_W,
        TRACKPAD_D,
        0.03,
        TRACKPAD_T,
        0.003,
        compact ? 5 : 8
      ),
    [compact]
  );

  const glassPanelGeometry = useMemo(
    () =>
      createRoundedSlabGeometry(
        SCREEN_W + 0.02,
        SCREEN_H + 0.02,
        0.07,
        GLASS_PANEL_T,
        0.004,
        compact ? 5 : 8
      ),
    [compact]
  );

  const reflectionTexture = useMemo(
    () =>
      createLinearTexture(
        "rgba(111, 191, 170, 0.22)",
        "rgba(111, 191, 170, 0)"
      ),
    []
  );

  const contactShadowTexture = useMemo(
    () =>
      createRadialTexture(
        "rgba(8, 11, 16, 0.85)",
        "rgba(8, 11, 16, 0)"
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
    const mesh = keysMesh.current;
    if (!mesh) {
      return;
    }
    keys.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
  }, [keys]);

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
      screenGeometry.dispose();
      coverGeometry.dispose();
      keyboardGeometry.dispose();
      trackpadGeometry.dispose();
      glassPanelGeometry.dispose();
      reflectionTexture.dispose();
      contactShadowTexture.dispose();
    },
    [
      screenGeometry,
      coverGeometry,
      keyboardGeometry,
      trackpadGeometry,
      glassPanelGeometry,
      reflectionTexture,
      contactShadowTexture
    ]
  );

  useFrame(() => {
    const lid = lidRef.current;
    if (lid) {
      lid.rotation.x = -latest.current.laptop.open * LID_OPEN;
    }
    const values = screenCrossfade(
      latest.current.laptop.screen,
      screenMaterials.length,
      SCREEN_FADE
    );
    applyScreenOpacities(screenMaterials, values);
  });

  return (
    <group>
      <RoundedBox
        args={[BASE_W, BASE_T, BASE_D]}
        radius={BASE_RADIUS}
        smoothness={compact ? 3 : 4}
        material={shellMaterial}
      />

      <mesh
        geometry={keyboardGeometry}
        material={keyboardMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, KEYBOARD_Y, KEYBOARD_Z]}
      />

      <instancedMesh
        ref={keysMesh}
        args={[undefined, undefined, keys.length]}
        material={keyMaterial}
        frustumCulled={false}
      >
        <boxGeometry args={[KEY_W, KEY_H, KEY_D]} />
      </instancedMesh>

      <mesh
        geometry={trackpadGeometry}
        material={trackpadMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, TRACKPAD_Y, TRACKPAD_Z]}
      />

      {HINGE_BARRELS.map((x) => (
        <mesh
          key={x}
          position={[x, HINGE_Y, HINGE_Z]}
          rotation={[0, 0, Math.PI / 2]}
          material={hingeMaterial}
        >
          <cylinderGeometry
            args={[
              HINGE_RADIUS,
              HINGE_RADIUS,
              HINGE_BARREL_LENGTH,
              compact ? 16 : 28
            ]}
          />
        </mesh>
      ))}

      <group
        ref={lidRef}
        position={[0, HINGE_Y, HINGE_Z]}
        rotation={[-state.laptop.open * LID_OPEN, 0, 0]}
      >
        <RoundedBox
          args={[BASE_W - 0.02, LID_T, LID_D]}
          radius={LID_RADIUS}
          smoothness={compact ? 3 : 4}
          position={[0, 0, LID_D / 2]}
          material={shellMaterial}
        />

        <mesh
          geometry={glassPanelGeometry}
          material={bezelMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, GLASS_PANEL_Y, LID_D / 2]}
        />

        {screenMaterials.map((material, index) => (
          <mesh
            key={index}
            geometry={screenGeometry}
            material={material}
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, SCREEN_Y - index * SCREEN_STAGGER, LID_D / 2]}
            renderOrder={2 + index}
          />
        ))}

        <mesh
          geometry={coverGeometry}
          material={coverGlassMaterial}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, COVER_Y, LID_D / 2]}
          renderOrder={6}
        />

        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, REFLECTION_Y, LID_D / 2]}
          renderOrder={7}
        >
          <planeGeometry args={[SCREEN_W, SCREEN_H]} />
          <meshBasicMaterial
            map={reflectionTexture}
            transparent
            opacity={0.16}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -BASE_T / 2 + 0.0005, 0.06]}
        renderOrder={-1}
      >
        <planeGeometry args={[BASE_W + 0.9, BASE_D + 0.9]} />
        <meshBasicMaterial
          map={contactShadowTexture}
          transparent
          opacity={0.75}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
