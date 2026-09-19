import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ProductFilmState } from "@/lib/product-film-motion";

export type CoinState = ProductFilmState["coin"];

export interface CoinArc {
  start: number;
  end: number;
  mid: number;
}

export function coinSegmentAngles(shares: number[]): CoinArc[] {
  const arcs: CoinArc[] = [];
  if (shares.length === 0) {
    return arcs;
  }

  const weights = shares.map((share) =>
    Number.isFinite(share) && share > 0 ? share : 0
  );
  const total = weights.reduce((sum, share) => sum + share, 0);
  const unit = total > 0 ? (Math.PI * 2) / total : 0;

  let cursor = 0;
  for (const weight of weights) {
    const span =
      total > 0 ? weight * unit : (Math.PI * 2) / weights.length;
    const start = cursor;
    const end = start + span;
    arcs.push({ start, end, mid: start + span / 2 });
    cursor = end;
  }

  return arcs;
}

export const COIN_SEGMENT_SHARES = [0.4, 0.25, 0.2, 0.15];

export const COIN_TOKENS = {
  alloy: "#b9c3cd",
  settleGreen: "#72e1b1",
  studioBlack: "#080b10"
} as const;

const COIN_RADIUS = 1.2;
const COIN_HALF_HEIGHT = 0.1;
const FACE_RECESS = 0.022;
const FACE_HEIGHT = COIN_HALF_HEIGHT - FACE_RECESS;
const RIM_INNER_RADIUS = 1.1;
const GROOVE_RADII = [1.04, 0.97];
const GROOVE_WIDTH = 0.022;
const GROOVE_DEPTH = 0.013;
const WELL_RADIUS = 0.44;
const WELL_DEPTH = 0.02;

const WEDGE_INNER_RADIUS = 0.3;
const WEDGE_RADIUS = 0.86;
const WEDGE_DEPTH = 0.05;
const WEDGE_BEVEL = 0.01;
const WEDGE_HEIGHT = WEDGE_DEPTH + WEDGE_BEVEL * 2;
const WEDGE_TILT = [-0.035, 0.028, -0.022, 0.031];
const OPEN_TRAVEL = 0.07;

const TICK_RADIUS = 1.07;
const TICK_LENGTH = 0.055;
const TICK_WIDTH = 0.007;
const TICK_HEIGHT = 0.011;
const TICK_COUNT = 90;
const TICK_COUNT_COMPACT = 54;

const INLAY_RING_RADIUS = 0.21;
const CORE_RADIUS = 0.16;

const alloyMaterial = new THREE.MeshPhysicalMaterial({
  color: COIN_TOKENS.alloy,
  metalness: 1,
  roughness: 0.3,
  clearcoat: 0.4,
  clearcoatRoughness: 0.28,
  envMapIntensity: 1
});

const shellMaterial = new THREE.MeshPhysicalMaterial({
  color: COIN_TOKENS.alloy,
  metalness: 1,
  roughness: 0.42,
  clearcoat: 0.25,
  clearcoatRoughness: 0.4,
  envMapIntensity: 0.9
});

const grooveMaterial = new THREE.MeshStandardMaterial({
  color: "#59636e",
  metalness: 0.85,
  roughness: 0.5
});

const voidMaterial = new THREE.MeshStandardMaterial({
  color: COIN_TOKENS.studioBlack,
  metalness: 0.4,
  roughness: 0.7
});

const inlayMaterial = new THREE.MeshStandardMaterial({
  color: COIN_TOKENS.settleGreen,
  emissive: COIN_TOKENS.settleGreen,
  emissiveIntensity: 1.15,
  metalness: 0.25,
  roughness: 0.35,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  toneMapped: false
});

function createShellGeometry(segments: number): THREE.LatheGeometry {
  const half = COIN_HALF_HEIGHT;
  const face = FACE_HEIGHT;
  const wellFloor = face - WELL_DEPTH;
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0, -half),
    new THREE.Vector2(COIN_RADIUS - 0.16, -half),
    new THREE.Vector2(COIN_RADIUS - 0.05, -half + 0.014),
    new THREE.Vector2(COIN_RADIUS, -half + 0.042),
    new THREE.Vector2(COIN_RADIUS, half - 0.042),
    new THREE.Vector2(COIN_RADIUS - 0.05, half - 0.014),
    new THREE.Vector2(RIM_INNER_RADIUS, half),
    new THREE.Vector2(RIM_INNER_RADIUS, face)
  ];

  for (const radius of GROOVE_RADII) {
    points.push(
      new THREE.Vector2(radius + GROOVE_WIDTH, face),
      new THREE.Vector2(radius, face - GROOVE_DEPTH),
      new THREE.Vector2(radius - GROOVE_WIDTH, face)
    );
  }

  points.push(
    new THREE.Vector2(WELL_RADIUS, face),
    new THREE.Vector2(WELL_RADIUS, wellFloor),
    new THREE.Vector2(WELL_RADIUS * 0.55, wellFloor),
    new THREE.Vector2(0, wellFloor)
  );

  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.rotateX(Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createWedgeGeometry(
  arc: CoinArc,
  compact: boolean
): THREE.ExtrudeGeometry {
  const span = arc.end - arc.start;
  const density = compact ? 18 : 28;
  const curveSegments = Math.max(
    4,
    Math.round((span / (Math.PI * 2)) * density)
  );

  const shape = new THREE.Shape();
  shape.moveTo(
    Math.cos(arc.start) * WEDGE_RADIUS,
    Math.sin(arc.start) * WEDGE_RADIUS
  );
  shape.absarc(0, 0, WEDGE_RADIUS, arc.start, arc.end, false);
  shape.lineTo(
    Math.cos(arc.end) * WEDGE_INNER_RADIUS,
    Math.sin(arc.end) * WEDGE_INNER_RADIUS
  );
  shape.absarc(0, 0, WEDGE_INNER_RADIUS, arc.end, arc.start, true);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: WEDGE_DEPTH,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: WEDGE_BEVEL,
    bevelSize: WEDGE_BEVEL,
    bevelOffset: 0,
    bevelSegments: 1,
    curveSegments
  });
  geometry.translate(0, 0, -WEDGE_DEPTH / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createTickMatrices(count: number): THREE.Matrix4[] {
  const matrices: THREE.Matrix4[] = [];
  for (let index = 0; index < count; index++) {
    const angle = (index / count) * Math.PI * 2;
    const matrix = new THREE.Matrix4();
    matrix.makeRotationZ(angle);
    matrix.setPosition(
      Math.cos(angle) * TICK_RADIUS,
      Math.sin(angle) * TICK_RADIUS,
      FACE_HEIGHT + TICK_HEIGHT / 2
    );
    matrices.push(matrix);
  }
  return matrices;
}

function wedgeOffset(arc: CoinArc, open: number): [number, number, number] {
  const distance = open * OPEN_TRAVEL;
  return [
    Math.cos(arc.mid) * distance,
    Math.sin(arc.mid) * distance,
    FACE_HEIGHT + WEDGE_HEIGHT / 2
  ];
}

interface CoinGeometry {
  shell: THREE.LatheGeometry;
  wedges: { geometry: THREE.ExtrudeGeometry; arc: CoinArc }[];
  ticks: THREE.Matrix4[];
}

function buildCoinGeometry(compact: boolean): CoinGeometry {
  const arcs = coinSegmentAngles(COIN_SEGMENT_SHARES);
  return {
    shell: createShellGeometry(compact ? 40 : 64),
    wedges: arcs.map((arc) => ({
      geometry: createWedgeGeometry(arc, compact),
      arc
    })),
    ticks: createTickMatrices(compact ? TICK_COUNT_COMPACT : TICK_COUNT)
  };
}

export function MachinedCoin({
  state,
  compact
}: {
  state: CoinState;
  compact: boolean;
}) {
  const wedgeGroups = useRef<(THREE.Group | null)[]>([]);
  const ticksMesh = useRef<THREE.InstancedMesh>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  const latest = useRef(state);
  latest.current = state;

  const coin = useMemo(() => buildCoinGeometry(compact), [compact]);

  useLayoutEffect(() => {
    inlayMaterial.opacity = latest.current.settled;
  }, [coin]);

  useLayoutEffect(() => {
    const mesh = ticksMesh.current;
    if (!mesh) {
      return;
    }
    coin.ticks.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.instanceMatrix.needsUpdate = true;
  }, [coin]);

  useFrame(() => {
    const { open, settled } = latest.current;
    coin.wedges.forEach((piece, index) => {
      const group = wedgeGroups.current[index];
      if (!group) {
        return;
      }
      const distance = open * OPEN_TRAVEL;
      group.position.x = Math.cos(piece.arc.mid) * distance;
      group.position.y = Math.sin(piece.arc.mid) * distance;
      group.rotation.z = open * (WEDGE_TILT[index] ?? 0);
    });
    inlayMaterial.opacity = settled;
    if (coreLight.current) {
      coreLight.current.intensity = settled * 2.2;
    }
  });

  return (
    <group>
      <mesh geometry={coin.shell} material={shellMaterial} />

      {coin.wedges.map((piece, index) => (
        <group
          key={index}
          ref={(element) => {
            wedgeGroups.current[index] = element;
          }}
          position={wedgeOffset(piece.arc, state.open)}
          rotation={[0, 0, state.open * (WEDGE_TILT[index] ?? 0)]}
        >
          <mesh geometry={piece.geometry} material={alloyMaterial} />
        </group>
      ))}

      <mesh position={[0, 0, FACE_HEIGHT + 0.001]} material={voidMaterial}>
        <ringGeometry
          args={[WEDGE_INNER_RADIUS - 0.01, WEDGE_RADIUS + 0.03, 48]}
        />
      </mesh>

      <instancedMesh
        ref={ticksMesh}
        args={[undefined, undefined, coin.ticks.length]}
        material={grooveMaterial}
      >
        <boxGeometry args={[TICK_LENGTH, TICK_WIDTH, TICK_HEIGHT]} />
      </instancedMesh>

      <group position={[0, 0, FACE_HEIGHT + 0.004]}>
        <mesh material={inlayMaterial}>
          <torusGeometry args={[INLAY_RING_RADIUS, 0.014, 6, 40]} />
        </mesh>
        <mesh
          position={[0, 0, -WELL_DEPTH + 0.002]}
          material={inlayMaterial}
        >
          <circleGeometry args={[CORE_RADIUS, 32]} />
        </mesh>
      </group>

      <pointLight
        ref={coreLight}
        position={[0, 0, 0.4]}
        color={COIN_TOKENS.settleGreen}
        intensity={0}
        distance={2.6}
        decay={2}
      />
    </group>
  );
}
