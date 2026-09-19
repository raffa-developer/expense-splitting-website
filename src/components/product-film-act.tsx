import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode
} from "react";
import { ProductFilmFallback } from "@/components/product-film-fallback";
import { GithubMark } from "@/components/nav";
import { smoothstep, useScrollProgress } from "@/lib/animation";
import { useI18n } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import {
  PRODUCT_FILM_CAPTION_EDGES,
  productFilmCaptionKey,
  type FilmCaptionKey
} from "@/lib/product-film-motion";
import { DEMO_URL, GITHUB_URL } from "@/lib/site";
import { supportsWebGL, useInRange, useMediaQuery } from "@/lib/use-media";

const ProductFilmCanvas = lazy(() => import("@/three/product-film/scene"));

let webglSupport: boolean | null = null;

function detectWebGLSupport(): boolean {
  if (webglSupport === null) {
    webglSupport = supportsWebGL();
  }
  return webglSupport;
}

interface FilmCanvasBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface FilmCanvasBoundaryState {
  failed: boolean;
}

class FilmCanvasBoundary extends Component<
  FilmCanvasBoundaryProps,
  FilmCanvasBoundaryState
> {
  state: FilmCanvasBoundaryState = { failed: false };

  static getDerivedStateFromError(): FilmCanvasBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error("Product film canvas failed to render", error, info);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const CAPTION_FADE = 0.05;

const CAPTIONS: ReadonlyArray<{ key: FilmCaptionKey; start: number }> = [
  { key: "film.share", start: 0 },
  { key: "film.laptop", start: PRODUCT_FILM_CAPTION_EDGES[0] },
  { key: "film.phone", start: PRODUCT_FILM_CAPTION_EDGES[1] },
  { key: "film.settle", start: PRODUCT_FILM_CAPTION_EDGES[2] }
];

export function ProductFilmAct() {
  const { t } = useI18n();
  const section = useRef<HTMLElement | null>(null);
  const hero = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLParagraphElement | null)[]>([]);
  const wide = useMediaQuery("(min-width: 900px)");
  const { motion } = useMotion();
  const reduce = !motion;
  const [webgl, setWebgl] = useState(() => webglSupport === true);
  const near = useInRange(section, 1.1, 0);
  const showCanvas = webgl && near;

  useEffect(() => {
    setWebgl(detectWebGLSupport());
  }, []);

  const progress = useScrollProgress(
    section,
    (value) => {
      const away = smoothstep(0.1, 0.24, value);
      if (hero.current) {
        hero.current.style.opacity = String(1 - away);
        hero.current.style.transform = `translateY(${-away * 40}px)`;
        hero.current.style.pointerEvents = away > 0.5 ? "none" : "auto";
      }
      const active = productFilmCaptionKey(value);
      captions.current.forEach((element, index) => {
        const caption = CAPTIONS[index];
        if (!element || !caption) {
          return;
        }
        const next = CAPTIONS[index + 1];
        const enter =
          caption.start === 0
            ? 1
            : smoothstep(caption.start, caption.start + CAPTION_FADE, value);
        const leave = next
          ? 1 -
            smoothstep(next.start - CAPTION_FADE, next.start, value)
          : 1;
        const opacity = enter * leave;
        element.style.opacity = String(opacity);
        element.style.transform = `translateY(${(1 - opacity) * 12}px)`;
        element.setAttribute(
          "aria-hidden",
          caption.key === active ? "false" : "true"
        );
      });
    },
    !reduce
  );

  useEffect(() => {
    if (!reduce) {
      return;
    }
    progress.current = 1;
    const finalKey = productFilmCaptionKey(1);
    captions.current.forEach((element, index) => {
      const caption = CAPTIONS[index];
      if (!element || !caption) {
        return;
      }
      const visible = caption.key === finalKey;
      element.style.opacity = visible ? "1" : "0";
      element.style.transform = "translateY(0)";
      element.setAttribute("aria-hidden", visible ? "false" : "true");
    });
    if (hero.current) {
      hero.current.style.opacity = "1";
      hero.current.style.transform = "translateY(0)";
      hero.current.style.pointerEvents = "auto";
    }
  }, [reduce, progress]);

  return (
    <section
      id="top"
      ref={section}
      className={`relative ${wide ? "h-[420vh]" : "h-[320vh]"}`}
    >
      <div id="app" className="sticky top-0 h-svh overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(141,191,255,0.1),transparent_58%)]"
        />
        <div
          aria-hidden="true"
          className="stage-vignette pointer-events-none absolute inset-0"
        />

        {showCanvas ? (
          <div className="absolute inset-0">
            <FilmCanvasBoundary
              fallback={<ProductFilmFallback compact={!wide} />}
            >
              <Suspense fallback={<ProductFilmFallback compact={!wide} />}>
                <ProductFilmCanvas
                  progress={progress}
                  compact={!wide}
                  reduce={reduce}
                />
              </Suspense>
            </FilmCanvasBoundary>
          </div>
        ) : null}

        {!showCanvas && wide ? <ProductFilmFallback compact={false} /> : null}

        <div className="pointer-events-none relative z-10 flex h-full flex-col">
          <div className="mx-auto w-full max-w-6xl shrink-0 px-6 pt-24 sm:pt-28">
            <div ref={hero} className="pointer-events-auto relative max-w-xl">
              {showCanvas || !wide ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-24 -left-24 -z-10 h-[55vh] w-screen bg-gradient-to-b from-canvas via-canvas/60 to-transparent"
                />
              ) : null}
              <h1 className="text-4xl leading-[1.1] font-extrabold min-[900px]:text-(length:--text-hero)">
                {t("hero.title")}
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
                {t("hero.body")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
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
          </div>

          <div className="relative mx-auto min-h-0 w-full max-w-6xl flex-1">
            {!showCanvas && !wide ? (
              <ProductFilmFallback compact={true} />
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-6xl shrink-0 px-6 pb-14 sm:pb-20">
            <div className="relative h-32 max-w-xl">
              {CAPTIONS.map((caption, index) => (
                <p
                  key={caption.key}
                  ref={(element) => {
                    captions.current[index] = element;
                  }}
                  aria-hidden={index === 0 ? "false" : "true"}
                  className="absolute inset-x-0 bottom-0 font-display text-(length:--text-caption) leading-[1.05] font-extrabold tracking-[-0.02em] text-ink opacity-0 [text-shadow:0_2px_18px_rgba(0,0,0,0.85),0_1px_3px_rgba(0,0,0,0.6)]"
                >
                  {t(caption.key)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
