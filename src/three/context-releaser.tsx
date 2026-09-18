import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ContextReleaser() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    return () => {
      const context = gl.getContext();
      gl.dispose();
      if (context && !context.isContextLost()) {
        gl.forceContextLoss();
      }
    };
  }, [gl]);

  return null;
}
