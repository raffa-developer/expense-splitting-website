import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AppWindow } from "@/components/app-window";
import { MoneyFlowGraph } from "@/components/money-flow-graph";
import { Reveal } from "@/components/reveal";
import { useI18n } from "@/lib/i18n";
import { formatCents } from "@/lib/money";

const PEOPLE = [
  { id: "carla", name: "Carla" },
  { id: "david", name: "David" },
  { id: "nuno", name: "Nuno Liu" },
  { id: "osvaldo", name: "Osvaldo" }
] as const;

const TRANSFERS = [
  { from: "carla", to: "nuno", cents: 4060 },
  { from: "david", to: "osvaldo", cents: 3220 },
  { from: "carla", to: "osvaldo", cents: 60 }
] as const;

const TOTAL = TRANSFERS.reduce((sum, transfer) => sum + transfer.cents, 0);

function nameOf(id: string): string {
  return PEOPLE.find((person) => person.id === id)?.name ?? id;
}

export function SettleSection() {
  const { t, locale } = useI18n();
  const [paid, setPaid] = useState<readonly string[]>([]);

  const settled = TRANSFERS.filter((transfer) =>
    paid.includes(`${transfer.from}-${transfer.to}`)
  ).reduce((sum, transfer) => sum + transfer.cents, 0);
  const remaining = TOTAL - settled;
  const done = remaining === 0;
  const openTransfers = TRANSFERS.filter(
    (transfer) => !paid.includes(`${transfer.from}-${transfer.to}`)
  );

  const toggle = (id: string) =>
    setPaid((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );

  return (
    <section id="settle" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
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

        <Reveal delay={120} className="mt-12 max-w-2xl">
          <AppWindow label={t("app.window.settle")}>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-base font-semibold">
                  {t("settle.transfers", { count: TRANSFERS.length })}
                </h3>
                <span
                  role="status"
                  aria-live="polite"
                  className={`money text-sm font-medium ${
                    done ? "text-positive" : "text-muted"
                  }`}
                >
                  {done
                    ? t("settle.allPaid")
                    : t("settle.remaining", {
                        amount: formatCents(remaining, locale)
                      })}
                </span>
              </div>

              <div className="hidden sm:block">
                <div className="mx-auto max-w-xl">
                  <MoneyFlowGraph people={PEOPLE} transfers={openTransfers} />
                </div>
                <p className="mt-1 text-center text-xs text-muted">
                  {done ? t("settle.allPaid") : t("settle.flowHint")}
                </p>
              </div>

              <ul className="space-y-2">
                {TRANSFERS.map((transfer) => {
                  const id = `${transfer.from}-${transfer.to}`;
                  const isPaid = paid.includes(id);
                  return (
                    <li
                      key={id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted-surface px-4 py-3"
                    >
                      <p className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="font-medium">
                          {nameOf(transfer.from)}
                        </span>
                        <ArrowRight
                          className="size-3.5 text-muted"
                          aria-hidden="true"
                        />
                        <span className="font-medium">
                          {nameOf(transfer.to)}
                        </span>
                        <span
                          className={`money ml-1 font-medium transition-colors duration-300 ${
                            isPaid ? "text-muted line-through" : ""
                          }`}
                        >
                          {formatCents(transfer.cents, locale)}
                        </span>
                      </p>
                      <button
                        type="button"
                        aria-pressed={isPaid}
                        onClick={() => toggle(id)}
                        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-[transform,background-color,color] duration-150 active:scale-[0.98] ${
                          isPaid
                            ? "bg-muted-surface text-muted"
                            : "bg-pine text-canvas hover:bg-pine/90"
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : null}
                        {isPaid ? t("settle.paidDone") : t("settle.paid")}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {done ? (
                <p className="flex items-center gap-2.5 rounded-2xl bg-accent p-4 text-sm font-medium text-accent-foreground">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {t("settle.allPaid")}
                </p>
              ) : null}
            </div>
          </AppWindow>
        </Reveal>
      </div>
    </section>
  );
}
