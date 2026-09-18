import { useRef } from "react";
import { DeviceAct } from "@/components/device-act";
import { Footer } from "@/components/footer";
import { Mechanics } from "@/components/mechanics";
import { Nav } from "@/components/nav";
import { RunSection } from "@/components/run-section";
import { SettleSection } from "@/components/settle-section";
import { SplitAct } from "@/components/split-act";
import { TechSection } from "@/components/tech-section";
import { useGlobalScrollProgress } from "@/lib/animation";

export function App() {
  const bar = useRef<HTMLDivElement>(null);
  useGlobalScrollProgress(bar);

  return (
    <div className="relative overflow-x-clip">
      <div
        ref={bar}
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-pine"
      />
      <Nav />
      <main>
        <SplitAct />
        <Mechanics />
        <DeviceAct />
        <SettleSection />
        <TechSection />
        <RunSection />
      </main>
      <Footer />
    </div>
  );
}
