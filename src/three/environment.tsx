import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export function ProceduralEnvironment() {
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const gradient = context.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, "#4a3524");
    gradient.addColorStop(0.5, "#9a7a56");
    gradient.addColorStop(1, "#14100d");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 64);

    const blob = (x: number, y: number, radius: number, color: string) => {
      const radial = context.createRadialGradient(x, y, 0, x, y, radius);
      radial.addColorStop(0, color);
      radial.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = radial;
      context.fillRect(0, 0, 128, 64);
    };
    blob(94, 18, 34, "rgba(111, 191, 170, 0.75)");
    blob(30, 22, 30, "rgba(255, 158, 114, 0.7)");
    blob(64, 52, 44, "rgba(255, 236, 216, 0.28)");

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.environment = texture;

    return () => {
      scene.environment = null;
      texture.dispose();
    };
  }, [scene]);

  return null;
}
