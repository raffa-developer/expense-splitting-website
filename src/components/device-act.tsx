import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { smoothstep, useScrollProgress } from "@/lib/animation";
import { supportsWebGL, useInRange, useMediaQuery } from "@/lib/use-media";
import { screenOpacity } from "@/three/textures";
import overview from "@/assets/screens/desktop-group.png";

const DeviceCanvas = lazy(() => import("@/three/device-scene"));

export function DeviceAct() {
  const { t } = useI18n();
  const section = useRef<HTMLElement | null>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const captions = [
    useRef<HTMLParagraphElement>(null),
    useRef<HTMLParagraphElement>(null),
    useRef<HTMLParagraphElement>(null),
    useRef<HTMLParagraphElement>(null),
    useRef<HTMLParagraphElement>(null)
  ];
  const wide = useMediaQuery("(min-width: 900px)");
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const webgl = useMemo(() => supportsWebGL(), []);
  const deviceNear = useInRange(section, -0.12, -0.3);
  const canRenderDevice = webgl;
  const showDevice = canRenderDevice && deviceNear;

  const progress = useScrollProgress(
    section,
    (value) => {
      const screen = smoothstep(0.52, 0.78, value) * 3;
      const laptopOut = 1 - smoothstep(0.78, 0.86, value);
      captions.forEach((ref, index) => {
        const element = ref.current;
        if (!element) {
          return;
        }
        const enterRamp = index === 0 ? smoothstep(0.28, 0.44, value) : 1;
        const opacity =
          index < 4
            ? screenOpacity(screen - index, 0.5) * laptopOut * enterRamp
            : smoothstep(0.8, 0.88, value) * (1 - smoothstep(0.95, 1, value));
        element.style.opacity = String(opacity);
        element.style.transform = `translateY(${(1 - opacity) * 14}px)`;
      });
      if (fallback.current) {
        const zoom = 1 + smoothstep(0.1, 0.8, value) * 0.5;
        fallback.current.style.transform = `scale(${zoom})`;
      }
    },
    !reduce
  );

  useEffect(() => {
    if (!reduce) {
      return;
    }
    progress.current = 1;
    captions.forEach((ref, index) => {
      const element = ref.current;
      if (!element) {
        return;
      }
      element.style.opacity = index === 4 ? "1" : "0";
      element.style.transform = "translateY(0)";
    });
  }, [reduce]);

  const captionsText = [
    t("device.caption1"),
    t("device.caption2"),
    t("device.caption3"),
    t("device.caption4"),
    t("device.caption5")
  ];

  return (
    <section id="app" ref={section} className="relative h-[220vh]">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(111,191,170,0.12),transparent_55%)]" />
        <div className="stage-vignette pointer-events-none absolute inset-0" />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col px-6">
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            {t("device.title")}
          </h2>

          <div className="relative mt-6 h-[74vh] min-h-80">
            {showDevice ? (
              <Suspense fallback={null}>
                <DeviceCanvas
                  progress={progress}
                  reduce={reduce}
                  compact={!wide}
                />
              </Suspense>
            ) : canRenderDevice ? null : (
              <div
                ref={fallback}
                className="mx-auto w-full max-w-3xl will-change-transform"
              >
                <div className="overflow-hidden rounded-2xl border border-line bg-[#2a211b] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
                  <div className="overflow-hidden rounded-xl border border-black/60">
                    <img src={overview} alt="" className="block w-full" />
                  </div>
                </div>
                <div className="mx-auto h-3 w-[104%] max-w-none -translate-x-[2%] rounded-b-2xl bg-[#2a211b]" />
              </div>
            )}

            <div className="pointer-events-none absolute bottom-2 left-6 h-40 w-[min(18rem,60vw)] sm:bottom-6 sm:h-28 sm:w-[min(21rem,70vw)]">
              {captionsText.map((caption, index) => (
                <p
                  key={caption}
                  ref={captions[index]}
                  className="absolute inset-x-0 bottom-0 font-display text-(length:--text-caption) font-extrabold leading-[1.05] tracking-[-0.02em] text-ink opacity-0 [text-shadow:0_2px_18px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6)]"
                >
                  {caption}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
