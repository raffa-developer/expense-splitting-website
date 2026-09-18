import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { createTimeline, utils } from "animejs";
import { ArrowDown } from "lucide-react";
import { StaticCoin } from "@/components/static-coin";
import { GithubMark } from "@/components/nav";
import { useI18n } from "@/lib/i18n";
import {
  clamp,
  smoothstep,
  useScrollProgress
} from "@/lib/animation";
import { useInRange, useMediaQuery, supportsWebGL } from "@/lib/use-media";
import { DEMO_URL, GITHUB_URL } from "@/lib/site";

const CoinCanvas = lazy(() => import("@/three/coin-scene"));

function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

export function SplitAct() {
  const { t } = useI18n();
  const section = useRef<HTMLElement | null>(null);
  const hero = useRef<HTMLDivElement>(null);
  const split = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 900px)");
  const reduce = usePrefersReducedMotion();
  const webgl = useMemo(() => supportsWebGL(), []);
  const coinNear = useInRange(section, 1.1, 0);
  const showCoin = webgl && coinNear;

  const progress = useScrollProgress(section, (value) => {
    if (hero.current) {
      const fade = clamp(1 - value / 0.26);
      hero.current.style.opacity = String(fade);
      hero.current.style.transform = `translateY(${(1 - fade) * -48}px)`;
      hero.current.style.pointerEvents = fade < 0.5 ? "none" : "auto";
    }
    if (split.current) {
      const reveal = smoothstep(0.42, 0.62, value);
      split.current.style.opacity = String(reveal);
      split.current.style.transform = `translateY(${(1 - reveal) * 36}px)`;
    }
    if (hint.current) {
      hint.current.style.opacity = String(clamp(1 - value / 0.12));
    }
  });

  useEffect(() => {
    if (reduce) {
      return;
    }
    const titleElement = title.current;
    if (!titleElement) {
      return;
    }
    const bodyElement = body.current;
    const ctaElement = cta.current;
    utils.set(titleElement, { y: "108%" });
    if (bodyElement) {
      utils.set(bodyElement, { opacity: 0, y: 14 });
    }
    if (ctaElement) {
      utils.set(ctaElement, { opacity: 0, y: 12 });
    }

    const timeline = createTimeline();
    timeline.add(
      titleElement,
      { y: "0%", duration: 950, ease: "out(3)" },
      160
    );
    if (bodyElement) {
      timeline.add(
        bodyElement,
        { opacity: 1, y: 0, duration: 850, ease: "out(2)" },
        620
      );
    }
    if (ctaElement) {
      timeline.add(
        ctaElement,
        { opacity: 1, y: 0, duration: 850, ease: "out(2)" },
        760
      );
    }

    return () => {
      timeline.revert();
    };
  }, [reduce]);

  return (
    <section id="top" ref={section} className="relative h-[250vh]">
      <div className="grid-backdrop sticky top-0 h-svh overflow-hidden">
        {showCoin ? (
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <CoinCanvas
                progress={progress}
                offsetX={wide ? 1.5 : 0}
                offsetY={wide ? 0 : -1.15}
                scale={wide ? 0.92 : 0.55}
                compact={!wide}
              />
            </Suspense>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end justify-center pb-24">
            <StaticCoin className="w-[min(58vw,22rem)] opacity-90" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-6xl flex-col justify-between px-6 pt-28 pb-20 sm:pt-32">
          <div
            ref={hero}
            className="pointer-events-auto max-w-xl"
          >
            <div className="-mb-[0.12em] overflow-hidden pb-[0.12em]">
              <h1
                ref={title}
                className="text-4xl leading-[1.1] font-extrabold sm:text-5xl lg:text-6xl"
              >
                {t("hero.title")}
              </h1>
            </div>
            <p
              ref={body}
              className="mt-5 max-w-md text-base leading-relaxed text-muted"
            >
              {t("hero.body")}
            </p>
            <div
              ref={cta}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-pine px-5 py-3 text-sm font-bold text-canvas transition-transform hover:-translate-y-0.5 active:scale-95"
              >
                <GithubMark />
                {t("hero.ctaGithub")}
              </a>
              {DEMO_URL ? (
                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-white/30"
                >
                  {t("hero.ctaDemo")}
                </a>
              ) : (
                <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold text-muted">
                  {t("hero.ctaDemoSoon")}
                </span>
              )}
            </div>
          </div>

          <div ref={split} className="max-w-md opacity-0">
            <p className="text-sm font-semibold text-apricot">
              {t("split.kicker")}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              {t("split.title")}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {t("split.body")}
            </p>
          </div>
        </div>

        {showCoin && (
          <p
            ref={hint}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 text-center text-xs text-muted"
          >
            {t("hero.scroll")}
            <ArrowDown size={14} aria-hidden className="scroll-hint-arrow" />
          </p>
        )}
      </div>
    </section>
  );
}
