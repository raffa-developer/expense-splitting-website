import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

const STORAGE_KEY = "expense-splitting-motion";

type MotionChoice = "system" | "on" | "off";

function readChoice(): MotionChoice {
  if (typeof localStorage === "undefined") {
    return "system";
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "on" || stored === "off" ? stored : "system";
}

const MotionContext = createContext<{
  motion: boolean;
  toggle: () => void;
}>({ motion: true, toggle: () => {} });

export function MotionProvider({ children }: { children: ReactNode }) {
  const [choice, setChoice] = useState<MotionChoice>(readChoice);
  const [systemReduce, setSystemReduce] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const list = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event: MediaQueryListEvent) => setSystemReduce(event.matches);
    list.addEventListener("change", handler);
    return () => list.removeEventListener("change", handler);
  }, []);

  const motion = choice === "on" ? true : choice === "off" ? false : !systemReduce;

  useEffect(() => {
    document.documentElement.classList.toggle("motion-forced", motion);
  }, [motion]);

  const toggle = useCallback(() => {
    setChoice((current) => {
      const effective =
        current === "on" ? true : current === "off" ? false : !systemReduce;
      const next: MotionChoice = effective ? "off" : "on";
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [systemReduce]);

  return (
    <MotionContext.Provider value={{ motion, toggle }}>
      {children}
    </MotionContext.Provider>
  );
}

export function useMotion(): { motion: boolean; toggle: () => void } {
  return useContext(MotionContext);
}
