import type { RefObject } from "react";
import * as THREE from "three";
import { IphoneModel } from "@/three/models";

export const PHONE_SCREEN_TEXTURE = { radius: 0.055, punchHole: true } as const;

export function PhoneModel({
  textures,
  materialsRef
}: {
  textures: (THREE.Texture | undefined)[];
  materialsRef?: RefObject<(THREE.MeshBasicMaterial | null)[]>;
}) {
  return <IphoneModel textures={textures} materialsRef={materialsRef} />;
}
