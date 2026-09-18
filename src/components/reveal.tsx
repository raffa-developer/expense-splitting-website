import { useRef, type ReactNode } from "react";
import { useReveal } from "@/lib/animation";

export function Reveal({
  children,
  delay = 0,
  className
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, delay);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
