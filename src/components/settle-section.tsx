import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";

const TRANSFERS = [
  { from: "Carla", to: "Nuno Liu", amount: "40,60 €" },
  { from: "David", to: "Osvaldo", amount: "32,20 €" },
  { from: "Carla", to: "Osvaldo", amount: "0,60 €" }
];

export function SettleSection() {
  const { t } = useI18n();
  const [paid, setPaid] = useState<string[]>([]);

  return (
    <section className="mx-auto max-w-6xl px-6 py-28">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <Reveal delay={0}>
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">
              {t("settle.title")}
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              {t("settle.body")}
            </p>
          </div>
        </Reveal>

        <ul className="space-y-3">
          {TRANSFERS.map((transfer, index) => {
            const key = `${transfer.from}-${transfer.to}`;
            const isPaid = paid.includes(key);
            return (
              <Reveal key={key} delay={(index + 1) * 90}>
                <li
                  className={`card-surface flex flex-wrap items-center gap-3 p-4 transition-opacity duration-500 ${
                    isPaid ? "opacity-60" : ""
                  }`}
                >
                  <span className="money text-sm font-medium">
                    {transfer.from}
                  </span>
                  <ArrowRight className="size-4 text-muted" />
                  <span className="money text-sm font-medium">
                    {transfer.to}
                  </span>
                  <span className="money ml-1 text-sm text-muted">
                    {transfer.amount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPaid((previous) =>
                        isPaid
                          ? previous.filter((item) => item !== key)
                          : [...previous, key]
                      )
                    }
                    className={`ml-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 active:scale-95 ${
                      isPaid
                        ? "bg-pine/15 text-pine"
                        : "bg-pine text-canvas hover:bg-pine/90"
                    }`}
                  >
                    {isPaid ? <Check className="size-3.5" /> : null}
                    {isPaid ? t("settle.paidDone") : t("settle.paid")}
                  </button>
                </li>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
