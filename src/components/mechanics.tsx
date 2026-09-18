import { ArrowLeftRight, Scale, Split } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";

export function Mechanics() {
  const { t } = useI18n();

  const cards = [
    { icon: Split, title: t("mechanics.split.title"), body: t("mechanics.split.body") },
    {
      icon: ArrowLeftRight,
      title: t("mechanics.settle.title"),
      body: t("mechanics.settle.body")
    },
    {
      icon: Scale,
      title: t("mechanics.balance.title"),
      body: t("mechanics.balance.body")
    }
  ];

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">
          {t("mechanics.title")}
        </h2>
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, index) => (
          <Reveal key={card.title} delay={index * 0.08}>
            <article className="card-surface group h-full p-6 transition-transform duration-300 hover:-translate-y-1">
              <card.icon className="size-5 text-pine transition-transform duration-300 group-hover:-rotate-12" />
              <h3 className="mt-5 text-lg font-bold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {card.body}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
