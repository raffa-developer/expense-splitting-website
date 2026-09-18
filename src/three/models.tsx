import { useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import type { RefObject } from "react";
import * as THREE from "three";

// MacBook model: "Laptop / MacBook Pro" by Alex Safayan, CC-BY via poly.pizza
// (https://poly.pizza/m/27hcX_w47Jb), simplified from the original download.
// iPhone model: "Apple iPhone 15 Pro Max Black" by polyman (https://sketchfab.com/Polyman_3D),
// CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/), source:
// https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7

export const MACBOOK_MODEL_URL = "/models/macbook.glb";
export const IPHONE_MODEL_URL = "/models/iphone.glb";

const MACBOOK_SCREEN_MATERIAL = "mat17";
const IPHONE_SCREEN_MATERIAL = "pIJKfZsazmcpEiU";
const MACBOOK_LID_NODE = "group256948792";
const MACBOOK_HINGE: [number, number, number] = [0, -0.12, -0.68];

function findMeshByMaterial(
  root: THREE.Object3D,
  materialName: string
): THREE.Mesh | null {
  let found: THREE.Mesh | null = null;
  root.traverse((object) => {
    if (found) {
      return;
    }
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    if (materials.some((material) => material && material.name === materialName)) {
      found = mesh;
    }
  });
  return found;
}

type ScreenPlaneInfo = {
  size: [number, number];
  rotation: [number, number, number];
  position: [number, number, number];
  axis: 0 | 1 | 2;
  direction: 1 | -1;
};

function screenPlaneInfo(
  target: THREE.Mesh,
  side: 1 | -1,
  offset: number
): ScreenPlaneInfo | null {
  const geometry = target.geometry as THREE.BufferGeometry;
  if (!geometry.boundingBox) {
    geometry.computeBoundingBox();
  }
  const box = geometry.boundingBox;
  if (!box) {
    return null;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const axis: 0 | 1 | 2 =
    size.x < size.y ? (size.x < size.z ? 0 : 2) : size.y < size.z ? 1 : 2;
  const position: [number, number, number] = [center.x, center.y, center.z];
  position[axis] =
    (side > 0 ? box.max.getComponent(axis) : box.min.getComponent(axis)) +
    offset * side;
  if (axis === 0) {
    return {
      size: [size.z, size.y],
      rotation: [0, side * (Math.PI / 2), 0],
      position,
      axis,
      direction: side
    };
  }
  if (axis === 1) {
    return {
      size: [size.x, size.z],
      rotation: [side * (-Math.PI / 2), 0, 0],
      position,
      axis,
      direction: side
    };
  }
  return {
    size: [size.x, size.y],
    rotation: [0, side > 0 ? 0 : Math.PI, 0],
    position,
    axis,
    direction: side
  };
}

export function screenOpacity(delta: number, fade: number): number {
  const value = (1 - Math.abs(delta)) / fade;
  return Math.min(1, Math.max(0, value));
}

function createSheenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 256, 512);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.30)");
    gradient.addColorStop(0.35, "rgba(255, 255, 255, 0.05)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.04)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ScreenPlanes({
  target,
  textures,
  materialsRef,
  side,
  offset,
  scale = 1,
  sheenOpacity = 0
}: {
  target: THREE.Mesh;
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  side: 1 | -1;
  offset: number;
  scale?: number;
  sheenOpacity?: number;
}) {
  const sheen = useMemo(() => createSheenTexture(), []);
  const group = useMemo(() => {
    const info = screenPlaneInfo(target, side, offset);
    if (!info) {
      return null;
    }
    const container = new THREE.Group();
    container.name = "screen-planes";
    textures.forEach((texture, index) => {
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(info.size[0] * scale, info.size[1] * scale),
        material
      );
      const position = new THREE.Vector3(...info.position);
      position.setComponent(
        info.axis,
        info.position[info.axis] + info.direction * 0.002 * index
      );
      mesh.position.copy(position);
      mesh.rotation.set(...info.rotation);
      mesh.renderOrder = 2 + index;
      container.add(mesh);
    });
    if (sheenOpacity > 0) {
      const material = new THREE.MeshBasicMaterial({
        map: sheen,
        transparent: true,
        opacity: sheenOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(info.size[0] * scale, info.size[1] * scale),
        material
      );
      const position = new THREE.Vector3(...info.position);
      position.setComponent(
        info.axis,
        info.position[info.axis] + info.direction * 0.01
      );
      mesh.position.copy(position);
      mesh.rotation.set(...info.rotation);
      mesh.renderOrder = 9;
      container.add(mesh);
    }
    return container;
  }, [target, textures, side, offset, scale, sheenOpacity, sheen]);

  useEffect(() => {
    if (!group) {
      return;
    }
    target.add(group);
    group.children.forEach((child, index) => {
      const mesh = child as THREE.Mesh;
      if (materialsRef) {
        materialsRef.current[index] = mesh.material as THREE.MeshBasicMaterial;
      }
    });
    return () => {
      target.remove(group);
      group.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
        }
      });
    };
  }, [group, target, materialsRef]);

  return null;
}

const prepared = new WeakSet<THREE.Object3D>();

function prepareShared(root: THREE.Object3D): void {
  if (prepared.has(root)) {
    return;
  }
  prepared.add(root);
  simplifyModel(root, 0.18);
  limitTextureSize(root, 256);
}

function simplifyModel(root: THREE.Object3D, minSizeRatio: number): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const limit = Math.max(size.x, size.y, size.z) * minSizeRatio;
  const scale = new THREE.Vector3();
  const localSize = new THREE.Vector3();
  const drop: THREE.Mesh[] = [];
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const geometry = mesh.geometry as THREE.BufferGeometry;
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    const bounds = geometry.boundingBox;
    if (!bounds) {
      return;
    }
    bounds.getSize(localSize);
    mesh.getWorldScale(scale);
    const largest =
      Math.max(localSize.x, localSize.y, localSize.z) *
      Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z));
    if (largest < limit) {
      drop.push(mesh);
    }
  });
  for (const mesh of drop) {
    mesh.removeFromParent();
  }
}

function limitTextureSize(root: THREE.Object3D, maxSize: number): void {
  const seen = new Set<THREE.Texture>();
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) {
      return;
    }
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      if (!material) {
        continue;
      }
      const standard = material as THREE.MeshStandardMaterial;
      standard.normalMap = null;
      standard.roughnessMap = null;
      standard.metalnessMap = null;
      standard.aoMap = null;
      standard.emissiveMap = null;
      standard.needsUpdate = true;
      for (const value of Object.values(material)) {
        if (!(value instanceof THREE.Texture) || seen.has(value)) {
          continue;
        }
        seen.add(value);
        const image = value.image as { width?: number; height?: number } | undefined;
        const width = image?.width ?? 0;
        const height = image?.height ?? 0;
        if (!width || !height || Math.max(width, height) <= maxSize) {
          continue;
        }
        const ratio = maxSize / Math.max(width, height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(width * ratio));
        canvas.height = Math.max(1, Math.round(height * ratio));
        const context = canvas.getContext("2d");
        if (!context) {
          continue;
        }
        context.drawImage(image as CanvasImageSource, 0, 0, canvas.width, canvas.height);
        value.image = canvas;
        value.needsUpdate = true;
      }
    }
  });
}

export function IphoneModel({
  textures,
  materialsRef,
  centerScreen = true,
  screenWidth = 0.7
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  centerScreen?: boolean;
  screenWidth?: number;
}) {
  return (
    <Suspense fallback={null}>
      <IphoneModelInner
        textures={textures}
        materialsRef={materialsRef}
        centerScreen={centerScreen}
        screenWidth={screenWidth}
      />
    </Suspense>
  );
}

function IphoneModelInner({
  textures,
  materialsRef,
  centerScreen,
  screenWidth
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  centerScreen: boolean;
  screenWidth: number;
}) {
  const gltf = useGLTF(IPHONE_MODEL_URL);
  const { object, screen } = useMemo(() => {
    prepareShared(gltf.scene);
    const scene = gltf.scene.clone(true);
    scene.rotation.y = Math.PI;
    const holder = new THREE.Group();
    holder.add(scene);
    holder.updateMatrixWorld(true);
    const screenMesh = findMeshByMaterial(scene, IPHONE_SCREEN_MATERIAL);
    if (centerScreen) {
      const box = new THREE.Box3();
      if (screenMesh) {
        box.setFromObject(screenMesh);
      } else {
        box.setFromObject(scene);
      }
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = screenWidth / Math.max(size.x, 0.0001);
      holder.scale.setScalar(scale);
      holder.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    }
    return { object: holder, screen: screenMesh };
  }, [gltf, centerScreen, screenWidth]);

  return (
    <group>
      <primitive object={object} dispose={null} />
      {screen ? (
        <ScreenPlanes
          target={screen}
          textures={textures}
          materialsRef={materialsRef}
          side={-1}
          offset={0.06}
          scale={1.02}
          sheenOpacity={0.07}
        />
      ) : null}
    </group>
  );
}

export function MacbookModel({
  textures,
  materialsRef,
  lidRef,
  screenWidth = 2.3
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  lidRef?: RefObject<THREE.Object3D | null>;
  screenWidth?: number;
}) {
  return (
    <Suspense fallback={null}>
      <MacbookModelInner
        textures={textures}
        materialsRef={materialsRef}
        lidRef={lidRef}
        screenWidth={screenWidth}
      />
    </Suspense>
  );
}

function MacbookModelInner({
  textures,
  materialsRef,
  lidRef,
  screenWidth
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
  lidRef?: RefObject<THREE.Object3D | null>;
  screenWidth: number;
}) {
  const gltf = useGLTF(MACBOOK_MODEL_URL);
  const { object, screen, lid } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) {
        return;
      }
      const material = mesh.material as THREE.MeshStandardMaterial;
      if (!material || !material.name) {
        return;
      }
      material.envMapIntensity = 0.35;
      if (material.name === MACBOOK_SCREEN_MATERIAL) {
        material.color.set("#0b0b0d");
        material.metalness = 0.4;
        material.roughness = 0.25;
      } else if (material.name === "mat23" || material.name === "mat15") {
        material.color.set("#b6b4b0");
        material.metalness = 0.7;
        material.roughness = 0.44;
      } else if (material.name === "mat16") {
        material.color.set("#dedbd6");
        material.metalness = 0.75;
        material.roughness = 0.36;
      }
    });

    const lidObject = scene.getObjectByName(MACBOOK_LID_NODE) ?? null;
    let lidPivot: THREE.Object3D | null = null;
    if (lidObject) {
      const hinge = new THREE.Group();
      hinge.name = "macbook-hinge";
      hinge.position.set(...MACBOOK_HINGE);
      scene.add(hinge);
      hinge.add(lidObject);
      lidObject.position.set(
        -MACBOOK_HINGE[0],
        -MACBOOK_HINGE[1],
        -MACBOOK_HINGE[2]
      );
      lidPivot = hinge;
    }

    const holder = new THREE.Group();
    holder.add(scene);
    holder.updateMatrixWorld(true);
    const screenMesh = lidObject
      ? findMeshByMaterial(lidObject, MACBOOK_SCREEN_MATERIAL)
      : null;
    const box = new THREE.Box3();
    if (screenMesh) {
      box.setFromObject(screenMesh);
    } else {
      box.setFromObject(scene);
    }
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = screenWidth / Math.max(size.x, 0.0001);
    holder.scale.setScalar(scale);
    holder.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    return { object: holder, screen: screenMesh, lid: lidPivot };
  }, [gltf, screenWidth]);

  useEffect(() => {
    if (lidRef) {
      lidRef.current = lid;
    }
  }, [lid, lidRef]);

  return (
    <group>
      <primitive object={object} dispose={null} />
      {screen ? (
        <ScreenPlanes
          target={screen}
          textures={textures}
          materialsRef={materialsRef}
          side={1}
          offset={0.02}
          scale={1.07}
          sheenOpacity={0.12}
        />
      ) : null}
    </group>
  );
}

useGLTF.preload(MACBOOK_MODEL_URL);
useGLTF.preload(IPHONE_MODEL_URL);
