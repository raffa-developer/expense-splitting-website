import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AppWindow } from "@/components/app-window";
import { Reveal } from "@/components/reveal";
import { avatarStyle, initialsOf } from "@/lib/avatar";
import { useI18n } from "@/lib/i18n";
import { formatCents } from "@/lib/money";
import { allocateWeights } from "@/lib/split";

type Mode = "equal" | "exact" | "percentage" | "shares";

const MODES = ["equal", "exact", "percentage", "shares"] as const;
const PEOPLE = [
  { id: "carla", name: "Carla" },
  { id: "david", name: "David" },
  { id: "nuno", name: "Nuno Liu" }
] as const;
const EXPENSE_CENTS = 10000;
const PAYER = PEOPLE[0];
const WEIGHTS: Record<Mode, readonly number[]> = {
  equal: [1, 1, 1],
  exact: [4750, 3250, 2000],
  percentage: [40, 35, 25],
  shares: [2, 1, 1]
};

export function Mechanics() {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<Mode>("equal");
  const shares = useMemo(
    () => allocateWeights(EXPENSE_CENTS, WEIGHTS[mode]),
    [mode]
  );
  const total = shares.reduce((sum, share) => sum + share.cents, 0);

  const weightLabel = (index: number): string => {
    const weight = WEIGHTS[mode][index] ?? 0;
    if (mode === "percentage") {
      return `${weight}%`;
    }
    if (mode === "shares") {
      return `×${weight}`;
    }
    return t(`mechanics.line.${mode}` as const);
  };

  return (
    <section id="how" className="relative border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-28">
        <Reveal delay={0}>
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">
            {t("mechanics.title")}
          </h2>
        </Reveal>

        <Reveal delay={120} className="mt-12 max-w-2xl">
          <AppWindow label={t("app.window.group")}>
            <div className="flex flex-col gap-5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-semibold">
                    {t("mechanics.expense")}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {t("mechanics.meta", {
                      name: PAYER.name,
                      split: t(`mechanics.mode.${mode}`),
                      count: PEOPLE.length
                    })}
                  </p>
                </div>
                <span className="money shrink-0 text-lg font-semibold">
                  {formatCents(EXPENSE_CENTS, locale)}
                </span>
              </div>

              <div
                role="group"
                aria-label={t("mechanics.modes")}
                className="inline-flex w-fit flex-wrap items-center justify-center rounded-full bg-muted-surface p-1 text-xs"
              >
                {MODES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={value === mode}
                    onClick={() => setMode(value)}
                    className={`rounded-full px-3 py-1 font-medium transition-colors ${
                      value === mode
                        ? "bg-surface text-ink shadow-soft"
                        : "text-muted hover:text-ink"
                    }`}
                  >
                    {t(`mechanics.mode.${value}`)}
                  </button>
                ))}
              </div>

              <p
                id="mechanics-mode-desc"
                aria-live="polite"
                className="text-sm leading-relaxed text-muted"
              >
                {t(`mechanics.desc.${mode}` as const)}
              </p>

              <div className="-mx-5 flex items-center gap-3 border-t border-line px-5 pt-3 text-xs text-muted">
                <span>{t("mechanics.col.person")}</span>
                <span className="ml-auto">{t("mechanics.col.share")}</span>
              </div>

              <ul className="-mx-5 divide-y divide-line/60">
                {shares.map((share, index) => {
                  const person = PEOPLE[index];
                  if (!person) {
                    return null;
                  }
                  const isPayer = person.id === PAYER.id;
                  return (
                    <li
                      key={person.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium"
                        style={avatarStyle(person.name)}
                        aria-hidden="true"
                      >
                        {initialsOf(person.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-sm font-medium">
                          {person.name}
                          {isPayer ? (
                            <span className="rounded-full bg-muted-surface px-2 py-0.5 text-[11px] font-medium text-muted">
                              {t("tech.paid")}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {weightLabel(index)}
                          {share.extra
                            ? ` · ${t("mechanics.extraCent")}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`money ml-auto shrink-0 text-sm font-medium ${
                          share.extra ? "text-accent-foreground" : ""
                        }`}
                      >
                        {formatCents(share.cents, locale)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <p className="flex items-center gap-2 rounded-2xl bg-muted-surface px-4 py-3 text-xs font-medium text-muted">
                <Check className="size-4 text-positive" aria-hidden="true" />
                {t("mechanics.exact")}
                <span className="money ml-auto text-sm font-medium text-positive">
                  {formatCents(total, locale)}
                </span>
              </p>
            </div>
          </AppWindow>
        </Reveal>

        <div className="mt-10 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
          <Reveal delay={200}>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t("mechanics.transfers")}
            </p>
          </Reveal>
          <Reveal delay={260}>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              {t("mechanics.balances")}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
