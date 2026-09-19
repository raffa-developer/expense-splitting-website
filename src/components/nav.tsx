import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useMotion } from "@/lib/motion";
import { GITHUB_URL } from "@/lib/site";

export function GithubMark({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function Nav() {
  const { t, locale, setLocale } = useI18n();
  const { motion, toggle } = useMotion();
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrolled = window.scrollY > 80;
      header.current?.classList.toggle("bg-canvas/80", scrolled);
      header.current?.classList.toggle("backdrop-blur-md", scrolled);
      header.current?.classList.toggle("py-4", !scrolled);
      header.current?.classList.toggle("py-2", scrolled);
    };
    const request = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    return () => {
      window.removeEventListener("scroll", request);
      cancelAnimationFrame(frame);
    };
  }, []);

  const links = [
    { href: "#how", label: t("nav.how") },
    { href: "#app", label: t("nav.app") },
    { href: "#tech", label: t("nav.tech") },
    { href: "#run", label: t("nav.run") }
  ];

  return (
    <header
      ref={header}
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6">
        <a
          href="#top"
          className="font-display text-[15px] font-bold tracking-tight"
        >
          Expense<span className="text-apricot">.</span>Splitting
        </a>
        <nav className="ml-auto hidden items-center gap-6 text-sm text-muted md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <div className="flex items-center rounded-full border border-line p-0.5 text-xs">
            {(["pt-PT", "en"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocale(value)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  locale === value
                    ? "bg-surface-strong text-ink"
                    : "text-muted hover:text-ink"
                }`}
              >
                {value === "pt-PT" ? "PT" : "EN"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={motion}
            aria-label={motion ? t("nav.motionOn") : t("nav.motionOff")}
            title={motion ? t("nav.motionOn") : t("nav.motionOff")}
            className={`flex size-9 items-center justify-center rounded-full border border-line transition-colors hover:border-white/25 hover:text-ink ${
              motion ? "text-ink" : "text-muted"
            }`}
          >
            <Sparkles className="size-4" />
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-white/25 hover:text-ink"
          >
            <GithubMark />
          </a>
        </div>
      </div>
    </header>
  );
}
