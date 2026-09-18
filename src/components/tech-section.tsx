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
    <section id="tech" className="border-y border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <h2 className="text-3xl font-extrabold sm:text-4xl">
            {t("tech.title")}
          </h2>
        </Reveal>
        <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <Reveal key={fact.label} delay={index * 0.07}>
              <div>
                <dt className="money text-2xl font-medium text-pine">
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
