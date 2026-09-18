import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";
import { GITHUB_URL } from "@/lib/site";
import { GithubMark } from "@/components/nav";

const COMMANDS = "npm install\nnpm run stack:up";

export function RunSection() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(COMMANDS).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section id="run" className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal>
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              {t("run.title")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              {t("run.body")}
            </p>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold transition-colors hover:border-white/30"
            >
              <GithubMark />
              {t("hero.ctaGithub")}
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="money text-xs text-muted">bash</span>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
              >
                {copied ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? t("run.copied") : t("run.copy")}
              </button>
            </div>
            <pre className="money px-4 py-4 text-sm leading-7 text-ink/90">
              <code>{COMMANDS}</code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
