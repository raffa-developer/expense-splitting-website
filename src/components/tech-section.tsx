import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";

export function TechSection() {
  const { t } = useI18n();

  const facts = [
    { mark: "¢", label: t("tech.cents") },
    { mark: "1 tx", label: t("tech.transaction") },
    { mark: "175", label: t("tech.tests") },
    { mark: "N−1", label: t("tech.optimizer") }
  ];

  return (
    <section id="tech" className="border-t border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal delay={0}>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            {t("tech.title")}
          </h2>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-10 flex flex-col gap-6 border-y border-line py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <p className="money flex flex-wrap items-baseline gap-x-3 gap-y-2 text-xl sm:text-2xl">
              <span>{t("tech.paid")}</span>
              <span className="text-muted">−</span>
              <span>{t("tech.owed")}</span>
              <span className="text-muted">+</span>
              <span>{t("tech.settled")}</span>
              <span className="text-muted">=</span>
              <span className="text-pine">0</span>
            </p>
            <p className="max-w-xs text-sm leading-relaxed text-muted">
              {t("tech.equationNote")}
            </p>
          </div>
        </Reveal>

        <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <Reveal
              key={fact.label}
              delay={(index + 1) * 60}
              className="h-full bg-canvas"
            >
              <div className="h-full px-5 py-6">
                <dt className="money text-xl font-medium text-pine">
                  {fact.mark}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">
                  {fact.label}
                </dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
