import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";
import { GITHUB_URL } from "@/lib/site";
import { GithubMark } from "@/components/nav";

const COMMANDS = ["npm install", "npm run stack:up"];

export function RunSection() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(COMMANDS.join("\n")).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <section id="run" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Reveal delay={0}>
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
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-semibold transition-colors hover:border-line-strong"
              >
                <GithubMark />
                {t("hero.ctaGithub")}
              </a>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="card-surface overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                <span className="money text-xs text-muted">bash</span>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
                >
                  {copied ? (
                    <Check className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="size-3.5" aria-hidden="true" />
                  )}
                  {copied ? t("run.copied") : t("run.copy")}
                </button>
              </div>
              <div className="money space-y-1.5 px-5 py-5 text-sm leading-6">
                {COMMANDS.map((command) => (
                  <p key={command} className="flex gap-2">
                    <span className="text-pine" aria-hidden="true">
                      $
                    </span>
                    <span className="text-ink">{command}</span>
                  </p>
                ))}
                <div className="space-y-1.5 pt-2 text-muted">
                  <p>{t("run.ready")}</p>
                  <p>{t("run.api")}</p>
                  <p>{t("run.site")}</p>
                </div>
                <p className="flex gap-2 pt-1" aria-hidden="true">
                  <span className="text-pine">$</span>
                  <span className="terminal-caret inline-block h-4 w-1.5 translate-y-0.5 bg-pine" />
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
