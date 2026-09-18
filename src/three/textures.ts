import { useEffect, useState } from "react";
import * as THREE from "three";

export function configureWindow(
  texture: THREE.Texture,
  planeAspect: number
): number {
  const image = texture.image as { width?: number; height?: number } | undefined;
  const width = image?.width ?? 1;
  const height = image?.height ?? 1;
  const textureAspect = width / height;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  if (textureAspect > planeAspect) {
    const repeatX = planeAspect / textureAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
    return 0;
  }
  const repeatY = textureAspect / planeAspect;
  texture.repeat.set(1, repeatY);
  texture.offset.set(0, 0);
  return 1 - repeatY;
}

export function createLinearTexture(
  inner: string,
  outer: string
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 64, 128);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    gradient.addColorStop(1, outer);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createRadialTexture(inner: string, outer: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function useScreenTextures(
  sources: string[],
  options?: { radius?: number; punchHole?: boolean }
): THREE.Texture[] {
  const [textures, setTextures] = useState<THREE.Texture[]>([]);
  const radius = options?.radius ?? 0;
  const punchHole = options?.punchHole ?? false;

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    void Promise.all(
      sources.map(async (source) => {
        const texture = await loader.loadAsync(source);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        if (radius <= 0 && !punchHole) {
          return texture;
        }
        const image = texture.image as HTMLImageElement;
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        if (!context) {
          return texture;
        }
        const corner = Math.min(canvas.width, canvas.height) * radius;
        context.beginPath();
        context.roundRect(0, 0, canvas.width, canvas.height, corner);
        context.clip();
        context.drawImage(image, 0, 0);
        if (punchHole) {
          context.globalCompositeOperation = "destination-out";
          context.beginPath();
          context.arc(
            canvas.width / 2,
            canvas.height * 0.017,
            canvas.width * 0.024,
            0,
            Math.PI * 2
          );
          context.fill();
          context.globalCompositeOperation = "source-over";
        }
        const masked = new THREE.CanvasTexture(canvas);
        masked.colorSpace = THREE.SRGBColorSpace;
        masked.anisotropy = 8;
        texture.dispose();
        return masked;
      })
    )
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        setTextures(loaded);
      })
      .catch((error: unknown) => {
        console.error("Failed to load app screenshots", error);
      });
    return () => {
      cancelled = true;
    };
  }, [sources, radius, punchHole]);

  return textures;
}

export function screenOpacity(delta: number, fade: number): number {
  const value = (1 - Math.abs(delta)) / fade;
  return Math.min(1, Math.max(0, value));
}

export function screenFadeThrough(
  delta: number,
  hold = 0.85,
  fade = 0.12
): number {
  const distance = Math.abs(delta);
  if (distance <= hold - fade) {
    return 1;
  }
  if (distance >= hold + fade) {
    return 0;
  }
  return (hold + fade - distance) / (2 * fade);
}
