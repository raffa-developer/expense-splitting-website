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
import { ArrowDown } from "lucide-react";
import { ProductFilmFallback } from "@/components/product-film-fallback";
import { GithubMark } from "@/components/nav";
import { clamp, smoothstep, useScrollProgress } from "@/lib/animation";
import { useI18n, type MessageKey } from "@/lib/i18n";
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

const SHARE_ROWS: ReadonlyArray<{ key: MessageKey; tint: string }> = [
  { key: "film.share1", tint: "#b9c3cd" },
  { key: "film.share2", tint: "#72e1b1" },
  { key: "film.share3", tint: "#59636e" },
  { key: "film.share4", tint: "#080b10" }
];

export function ProductFilmAct() {
  const { t } = useI18n();
  const section = useRef<HTMLElement | null>(null);
  const hero = useRef<HTMLDivElement>(null);
  const captions = useRef<(HTMLParagraphElement | null)[]>([]);
  const shares = useRef<(HTMLDivElement | null)[]>([]);
  const hint = useRef<HTMLParagraphElement>(null);
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
      if (hint.current) {
        hint.current.style.opacity = String(clamp(1 - value / 0.12));
      }
      const open =
        smoothstep(0.1, 0.26, value) * (1 - smoothstep(0.31, 0.42, value));
      shares.current.forEach((row, index) => {
        if (!row) {
          return;
        }
        const enter = smoothstep(
          0.12 + index * 0.02,
          0.22 + index * 0.02,
          value
        );
        row.style.opacity = String(open * enter);
        row.style.transform = `translateY(${(1 - enter) * 8}px)`;
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
    if (hint.current) {
      hint.current.style.opacity = "0";
    }
    shares.current.forEach((row) => {
      if (!row) {
        return;
      }
      row.style.opacity = "0";
      row.style.transform = "translateY(8px)";
    });
  }, [reduce, progress]);

  const shareRows = SHARE_ROWS.map((row, index) => (
    <div
      key={row.key}
      data-film-share={row.key}
      ref={(element) => {
        shares.current[index] = element;
      }}
      className="flex items-center gap-2 text-sm text-ink opacity-0 [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]"
    >
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-full ring-1 ring-white/20"
        style={{ background: row.tint }}
      />
      <span className="money">{t(row.key)}</span>
    </div>
  ));

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

        <p
          ref={hint}
          data-film-hint=""
          className="pointer-events-none absolute inset-x-0 bottom-8 z-20 flex flex-col items-center gap-1 text-center text-xs text-muted opacity-0"
        >
          {t("hero.scroll")}
          <ArrowDown size={14} aria-hidden className="scroll-hint-arrow" />
        </p>

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
            {wide ? (
              <div className="absolute top-1/2 left-6 z-20 flex -translate-y-1/2 flex-col gap-2">
                {shareRows}
              </div>
            ) : null}
          </div>

          <div className="mx-auto w-full max-w-6xl shrink-0 px-6 pb-14 sm:pb-20">
            {!wide ? (
              <div className="mb-3 flex max-w-xl flex-col gap-1.5">
                {shareRows}
              </div>
            ) : null}
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
