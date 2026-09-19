import { createContext, useContext, useEffect, type ReactNode } from "react";

const MotionContext = createContext(true);

export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("motion-forced");
  }, []);

  return <MotionContext.Provider value={true}>{children}</MotionContext.Provider>;
}

export function useMotion(): boolean {
  return useContext(MotionContext);
}
