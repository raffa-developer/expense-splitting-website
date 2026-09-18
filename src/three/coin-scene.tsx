import { useLayoutEffect, useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { PhoneModel, PHONE_SCREEN_TEXTURE } from "@/three/phone";
import { screenOpacity } from "@/three/models";
import { ProceduralEnvironment } from "@/three/environment";
import { ContextReleaser } from "@/three/context-releaser";
import {
  createRadialTexture,
  useScreenTextures
} from "@/three/textures";
import { StaticCoin } from "@/components/static-coin";
import type { ScrollProgress } from "@/lib/animation";
import mobileDashboard from "@/assets/screens/mobile-dashboard.png";
import mobileGroup from "@/assets/screens/mobile-group.png";
import mobileExpenses from "@/assets/screens/mobile-expenses.png";

const PHONE_SCREENS = [mobileDashboard, mobileGroup, mobileExpenses];

const RADIUS = 1.2;
const DEPTH = 0.17;
const RIDGE_COUNT = 156;

const SEGMENTS = [
  { tint: "#4fbfae", share: 0.4, label: "40,00 €" },
  { tint: "#ff9e72", share: 0.25, label: "25,00 €" },
  { tint: "#a78bfa", share: 0.15, label: "15,00 €" },
  { tint: "#e58270", share: 0.1, label: "10,00 €" },
  { tint: "#6fbfaa", share: 0.1, label: "10,00 €" }
];

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function wedgeGeometry(start: number, end: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.absarc(0, 0, RADIUS, start, end, false);
  shape.lineTo(0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: false,
    curveSegments: 48
  });
  geometry.translate(0, 0, -DEPTH / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function RidgedEdge() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) {
      return;
    }
    const matrix = new THREE.Matrix4();
    for (let index = 0; index < RIDGE_COUNT; index++) {
      const angle = (index / RIDGE_COUNT) * Math.PI * 2;
      matrix.makeRotationZ(angle);
      matrix.setPosition(
        Math.cos(angle) * RADIUS,
        Math.sin(angle) * RADIUS,
        0
      );
      instanced.setMatrixAt(index, matrix);
    }
    instanced.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, RIDGE_COUNT]}>
      <boxGeometry args={[0.055, 0.032, DEPTH * 1.02, 1, 1, 1]} />
      <meshStandardMaterial color="#b98a52" metalness={0.95} roughness={0.34} />
    </instancedMesh>
  );
}

function Coin({
  progress,
  offsetX,
  offsetY,
  scale
}: {
  progress: ScrollProgress;
  offsetX: number;
  offsetY: number;
  scale: number;
}) {
  const root = useRef<THREE.Group>(null);
  const assembled = useRef<THREE.Group>(null);
  const slices = useRef<(THREE.Group | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lookAt = useMemo(() => new THREE.Vector3(offsetX * 0.2, 0, 0), [offsetX]);

  const parts = useMemo(() => {
    let angle = Math.PI / 2;
    return SEGMENTS.map((segment) => {
      const start = angle;
      const end = angle + segment.share * Math.PI * 2;
      angle = end;
      const mid = (start + end) / 2;
      return {
        ...segment,
        geometry: wedgeGeometry(start, end),
        direction: new THREE.Vector3(Math.cos(mid), Math.sin(mid), 0),
        labelPosition: [
          Math.cos(mid) * 0.6,
          Math.sin(mid) * 0.6,
          DEPTH / 2 + 0.02
        ] as [number, number, number]
      };
    });
  }, []);

  useFrame((state) => {
    const value = progress.current;
    const time = state.clock.elapsedTime;
    const explode = smoothstep(0.34, 0.95, value);
    const intro = smoothstep(0, 0.32, value);
    const pointer = state.pointer;

    if (root.current) {
      root.current.position.x = offsetX;
      root.current.position.y = offsetY + Math.sin(time * 0.4) * 0.045;
      root.current.rotation.x = THREE.MathUtils.lerp(
        root.current.rotation.x,
        pointer.y * 0.09 - 0.03,
        0.05
      );
      root.current.rotation.y = THREE.MathUtils.lerp(
        root.current.rotation.y,
        pointer.x * 0.14 + Math.sin(time * 0.16) * 0.03,
        0.05
      );
      root.current.rotation.z = Math.sin(time * 0.12) * 0.04;
      root.current.scale.setScalar(scale);
    }

    if (assembled.current) {
      const shrink = Math.max(0.001, 1 - explode);
      assembled.current.scale.setScalar(shrink);
    }

    slices.current.forEach((slice, index) => {
      const part = parts[index];
      if (!slice || !part) {
        return;
      }
      const drift = explode * 0.72;
      slice.position.x += (part.direction.x * drift - slice.position.x) * 0.085;
      slice.position.y += (part.direction.y * drift - slice.position.y) * 0.085;
      slice.position.z += (explode * 0.07 - slice.position.z) * 0.085;
      const fan = explode * 0.18 * (index % 2 === 0 ? 1 : -1);
      slice.rotation.z += (fan - slice.rotation.z) * 0.07;
    });

    const labelOpacity = smoothstep(0.56, 0.82, value);
    labelRefs.current.forEach((node) => {
      if (node) {
        node.style.opacity = String(labelOpacity);
      }
    });

    const camera = state.camera;
    const targetZ = 6.3 - intro * 0.45 + explode * 0.55;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05);
    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      Math.sin(value * Math.PI) * 0.22 + pointer.x * 0.22,
      0.05
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      -0.1 + intro * 0.1 + pointer.y * 0.1,
      0.05
    );
    camera.lookAt(lookAt);
  });

  return (
    <group ref={root} scale={scale}>
      {parts.map((part, index) => (
        <group
          key={`${index}-${part.tint}`}
          ref={(element) => {
            slices.current[index] = element;
          }}
        >
          <mesh geometry={part.geometry}>
            <meshStandardMaterial
              color="#c09458"
              metalness={0.92}
              roughness={0.36}
              envMapIntensity={0.9}
              emissive={part.tint}
              emissiveIntensity={0.05}
            />
          </mesh>
          <Html
            position={part.labelPosition}
            center
            distanceFactor={6}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <span
              ref={(node) => {
                labelRefs.current[index] = node;
              }}
              className="money rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] whitespace-nowrap text-ink/90 opacity-0"
            >
              {part.label}
            </span>
          </Html>
        </group>
      ))}

      <group ref={assembled}>
        <RidgedEdge />
        <mesh position={[0, 0, DEPTH / 2 + 0.012]}>
          <torusGeometry args={[0.66, 0.026, 14, 64]} />
          <meshStandardMaterial
            color="#e0b978"
            metalness={0.95}
            roughness={0.28}
          />
        </mesh>
        <mesh position={[0, 0, DEPTH / 2 + 0.012]}>
          <boxGeometry args={[0.03, 1.32, 0.02]} />
          <meshStandardMaterial
            color="#e0b978"
            metalness={0.95}
            roughness={0.28}
          />
        </mesh>
      </group>
    </group>
  );
}

function HeroPhone({
  progress,
  compact
}: {
  progress: ScrollProgress;
  compact: boolean;
}) {
  const textures = useScreenTextures(PHONE_SCREENS, PHONE_SCREEN_TEXTURE);
  const materials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const root = useRef<THREE.Group>(null);
  const glow = useMemo(
    () => createRadialTexture("rgba(255, 214, 178, 0.32)", "rgba(255, 214, 178, 0)"),
    []
  );
  const baseY = compact ? -1.6 : -0.92;
  const baseX = compact ? 0.95 : -1.6;
  const baseTilt = compact ? -0.3 : 0.35;
  const baseScale = compact ? 0.5 : 0.72;

  useFrame((state) => {
    const value = progress.current;
    const time = state.clock.elapsedTime;
    const exit = smoothstep(0.15, 0.5, value);
    const enter = smoothstep(0, 0.22, value);
    const count = PHONE_SCREENS.length;
    const raw = (((time / 5.5 - 0.1) % count) + count) % count;
    const cycle = (time / 5.5) % 1;
    const deltaFor = (index: number): number => {
      let delta = raw - index;
      if (delta > count / 2) {
        delta -= count;
      }
      if (delta < -count / 2) {
        delta += count;
      }
      return delta;
    };

    materials.current.forEach((material, index) => {
      if (!material) {
        return;
      }
      material.opacity = screenOpacity(deltaFor(index), 0.15);
    });

    const cycleFlip = smoothstep(0.82, 1, cycle);

    if (root.current) {
      root.current.position.y =
        baseY - exit * 1.7 + Math.sin(time * 0.9) * 0.05 * (1 - exit);
      root.current.rotation.z = -0.05 + value * 0.06;
      root.current.rotation.y =
        baseTilt +
        (1 - enter) * -0.95 +
        Math.sin(time * 0.4) * 0.04 +
        cycleFlip * Math.PI * 2;
      root.current.scale.setScalar(baseScale * (1 - exit * 0.3));
    }
  });

  return (
    <group
      ref={root}
      position={[baseX, baseY, 0.4]}
      rotation={[0.03, baseTilt, -0.05]}
      scale={baseScale}
    >
      <mesh position={[0, 0, -0.24]}>
        <planeGeometry args={[1.7, 2.3]} />
        <meshBasicMaterial
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight
        position={[0, 0, 0.55]}
        intensity={0.7}
        distance={2.2}
        color="#ffe9d6"
      />
      <PhoneModel textures={textures} materialsRef={materials} />
    </group>
  );
}

export default function CoinCanvas({
  progress,
  offsetX = 0,
  offsetY = 0,
  scale = 1,
  compact = false
}: {
  progress: ScrollProgress;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  compact?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, -0.25, 2.9], fov: 35 }}
      fallback={
        <div className="flex h-full items-center justify-center">
          <StaticCoin className="w-[min(58vw,22rem)] opacity-90" />
        </div>
      }
    >
      <ContextReleaser />
      <ProceduralEnvironment />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} color="#fff4e8" />
      <pointLight position={[-4, -1, 3]} intensity={2} color="#6fbfaa" />
      <pointLight position={[4, 1, 2]} intensity={1.6} color="#ff9e72" />
      <Coin
        progress={progress}
        offsetX={offsetX}
        offsetY={offsetY}
        scale={scale}
      />
      {compact ? null : <HeroPhone progress={progress} compact={false} />}
    </Canvas>
  );
}
