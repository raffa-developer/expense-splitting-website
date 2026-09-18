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
  const captionOne = useRef<HTMLDivElement>(null);
  const captionTwo = useRef<HTMLParagraphElement>(null);
  const sliceRows = useRef<(HTMLDivElement | null)[]>([]);
  const stageDim = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLParagraphElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const wide = useMediaQuery("(min-width: 900px)");
  const reduce = usePrefersReducedMotion();
  const webgl = useMemo(() => supportsWebGL(), []);
  const coinNear = useInRange(section, 1.1, 0);
  const showCoin = webgl && coinNear;

  const SLICES = [
    { tint: "#4fbfae", label: t("split.share1") },
    { tint: "#ff9e72", label: t("split.share2") },
    { tint: "#a78bfa", label: t("split.share3") },
    { tint: "#e58270", label: t("split.share4") },
    { tint: "#6fbfaa", label: t("split.share5") }
  ];

  const progress = useScrollProgress(
    section,
    (value) => {
      if (hero.current) {
        const away = smoothstep(0.12, 0.26, value);
        hero.current.style.opacity = String(1 - away);
        hero.current.style.transform = `translateY(${-away * 48}px)`;
        hero.current.style.pointerEvents = away > 0.5 ? "none" : "auto";
      }
      if (captionOne.current) {
        captionOne.current.style.opacity = String(
          smoothstep(0.26, 0.42, value) * (1 - smoothstep(0.5, 0.6, value))
        );
      }
      if (captionTwo.current) {
        captionTwo.current.style.opacity = String(
          smoothstep(0.44, 0.6, value) * (1 - smoothstep(0.82, 0.92, value))
        );
      }
      sliceRows.current.forEach((row, index) => {
        if (!row) {
          return;
        }
        const show = smoothstep(
          0.44 + index * 0.025,
          0.52 + index * 0.025,
          value
        );
        row.style.opacity = String(show * (1 - smoothstep(0.86, 0.95, value)));
        row.style.transform = `translateX(${(1 - show) * 20}px)`;
      });
      if (stageDim.current) {
        stageDim.current.style.opacity = String(smoothstep(0.82, 1, value) * 0.55);
      }
      if (hint.current) {
        hint.current.style.opacity = String(clamp(1 - value / 0.12));
      }
    },
    !reduce
  );

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

  useEffect(() => {
    if (!reduce) {
      return;
    }
    progress.current = 0.7;
    if (hero.current) {
      hero.current.style.opacity = "0";
      hero.current.style.transform = "translateY(-48px)";
      hero.current.style.pointerEvents = "none";
    }
    if (captionOne.current) {
      captionOne.current.style.opacity = "1";
    }
    if (captionTwo.current) {
      captionTwo.current.style.opacity = "1";
    }
    sliceRows.current.forEach((row) => {
      if (!row) {
        return;
      }
      row.style.opacity = "1";
      row.style.transform = "translateX(0)";
    });
    if (stageDim.current) {
      stageDim.current.style.opacity = "0";
    }
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

          <div className="max-w-2xl">
            <div ref={captionOne} className="opacity-0">
              <p className="text-sm font-semibold text-apricot">
                {t("split.kicker")}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                {t("split.title")}
              </h2>
            </div>
            <div className="mt-8 flex flex-wrap items-start gap-x-14 gap-y-6">
              <p
                ref={captionTwo}
                className="max-w-sm text-sm leading-relaxed text-muted opacity-0"
              >
                {t("split.body")}
              </p>
              <div className="space-y-3">
                {SLICES.map((slice, index) => (
                  <div
                    key={slice.tint}
                    ref={(element) => {
                      sliceRows.current[index] = element;
                    }}
                    className="flex items-center gap-3 opacity-0"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: slice.tint }}
                    />
                    <span className="money text-sm text-ink">
                      {slice.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

        <div
          ref={stageDim}
          className="pointer-events-none absolute inset-0 bg-black opacity-0"
        />
      </div>
    </section>
  );
}
