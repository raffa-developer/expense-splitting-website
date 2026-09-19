import { useRef } from "react";
import { Footer } from "@/components/footer";
import { Mechanics } from "@/components/mechanics";
import { Nav } from "@/components/nav";
import { ProductFilmAct } from "@/components/product-film-act";
import { RunSection } from "@/components/run-section";
import { SettleSection } from "@/components/settle-section";
import { TechSection } from "@/components/tech-section";
import { useGlobalScrollProgress } from "@/lib/animation";
import { useLenis } from "@/lib/lenis";

export function App() {
  const bar = useRef<HTMLDivElement>(null);
  useGlobalScrollProgress(bar);
  useLenis();

  return (
    <div className="relative overflow-x-clip">
      <div
        ref={bar}
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-0.5 origin-left scale-x-0 bg-pine"
      />
      <Nav />
      <main>
        <ProductFilmAct />
        <Mechanics />
        <SettleSection />
        <TechSection />
        <RunSection />
      </main>
      <Footer />
    </div>
  );
}
