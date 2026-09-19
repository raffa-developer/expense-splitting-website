import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ContextReleaser() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    return () => {
      gl.dispose();
    };
  }, [gl]);

  return null;
}
