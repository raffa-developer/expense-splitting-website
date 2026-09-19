import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type Locale = "pt-PT" | "en";

const pt = {
  "nav.how": "Como funciona",
  "nav.app": "A app",
  "nav.tech": "Tecnologia",
  "nav.run": "Correr",
  "nav.github": "GitHub",

  "hero.title": "Divide as contas. Mantém a amizade.",
  "hero.body":
    "Uma app para grupos, viagens e casas partilhadas. Regista despesas, mantém saldos exatos e acerta tudo com o mínimo de transferências.",
  "hero.ctaGithub": "Ver no GitHub",
  "hero.ctaDemo": "Abrir demo",
  "hero.ctaDemoSoon": "Demo em breve",
  "hero.scroll": "Desce",

  "film.share": "A conta dividida em partes exatas.",
  "film.laptop": "Planeia em conjunto no painel do grupo.",
  "film.phone": "Regista despesas onde estiveres.",
  "film.settle": "Os saldos acertam a zero.",

  "app.window.group": "app · grupo",
  "app.window.settle": "app · acertos",

  "theme.toggle": "Mudar de tema",
  "theme.label": "Tema",
  "theme.light": "Claro",
  "theme.dark": "Escuro",
  "theme.system": "Sistema",

  "mechanics.title": "Simples por fora, exato por dentro.",
  "mechanics.expense": "Jantar de sábado",
  "mechanics.meta": "{name} pagou · divisão {split} · {count} pessoas",
  "mechanics.modes": "Formas de dividir",
  "mechanics.mode.equal": "Igual",
  "mechanics.mode.exact": "Exato",
  "mechanics.mode.percentage": "Percentagem",
  "mechanics.mode.shares": "Quotas",
  "mechanics.line.equal": "parte igual",
  "mechanics.line.exact": "valor fixo",
  "mechanics.exact": "soma exata",
  "mechanics.extraCent": "leva o cêntimo extra",
  "mechanics.transfers": "No máximo N−1 transferências para acertar tudo.",
  "mechanics.balances": "Saldos mantidos na mesma transação de cada escrita.",

  "settle.title": "Acertar contas sem discussão.",
  "settle.body":
    "A app propõe as transferências que deixam todos em dia. Marca como pago e o histórico fica registado.",
  "settle.from": "deve a",
  "settle.transfers": "{count} transferências",
  "settle.remaining": "{amount} por acertar",
  "settle.flowHint": "Segue o dinheiro de quem deve para quem recebe.",
  "settle.flowAria": "Mapa das transferências entre membros",
  "settle.allPaid": "Todos a zero.",
  "settle.paid": "marcar como pago",
  "settle.paidDone": "Pago",

  "tech.title": "Feito para confiar.",
  "tech.paid": "pago",
  "tech.owed": "devido",
  "tech.settled": "acertado",
  "tech.equationNote": "Uma escrita só passa se esta conta continuar a dar zero.",
  "tech.cents": "Cêntimos inteiros, sem floats",
  "tech.transaction": "Saldos mantidos na mesma transação",
  "tech.tests": "175 testes de API a passar",
  "tech.optimizer": "Otimizador de acertos determinístico",

  "run.title": "Corre em dois comandos.",
  "run.body":
    "Postgres em Docker, API Fastify e app React. Depois abre localhost:8080.",
  "run.ready": "Postgres pronto em :5433",
  "run.api": "API Fastify em :3000",
  "run.site": "App React em :8080",
  "run.copy": "Copiar",
  "run.copied": "Copiado",

  "footer.made": "Feito com React, Fastify e PostgreSQL.",
  "footer.repo": "Repositório",
  "footer.language": "Idioma",
  "footer.zero": "Saldo final"
} as const;

const en: Record<keyof typeof pt, string> = {
  "nav.how": "How it works",
  "nav.app": "The app",
  "nav.tech": "Tech",
  "nav.run": "Run it",
  "nav.github": "GitHub",

  "hero.title": "Split the bill. Keep the friendship.",
  "hero.body":
    "An app for groups, trips and shared houses. Log expenses, keep exact balances, and settle everything with the fewest transfers.",
  "hero.ctaGithub": "View on GitHub",
  "hero.ctaDemo": "Open demo",
  "hero.ctaDemoSoon": "Demo coming soon",
  "hero.scroll": "Scroll",

  "film.share": "The bill, split into exact shares.",
  "film.laptop": "Plan together on the group dashboard.",
  "film.phone": "Add expenses from anywhere.",
  "film.settle": "Balances settle back to zero.",

  "app.window.group": "app · group",
  "app.window.settle": "app · settle up",

  "theme.toggle": "Switch theme",
  "theme.label": "Theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "theme.system": "System",

  "mechanics.title": "Simple outside, exact inside.",
  "mechanics.expense": "Saturday dinner",
  "mechanics.meta": "{name} paid · {split} split · {count} people",
  "mechanics.modes": "Ways to split",
  "mechanics.mode.equal": "Equal",
  "mechanics.mode.exact": "Exact",
  "mechanics.mode.percentage": "Percentage",
  "mechanics.mode.shares": "Shares",
  "mechanics.line.equal": "equal part",
  "mechanics.line.exact": "fixed amount",
  "mechanics.exact": "sums exactly",
  "mechanics.extraCent": "carries the extra cent",
  "mechanics.transfers": "At most N−1 transfers to settle everything.",
  "mechanics.balances": "Balances kept in the same transaction as each write.",

  "settle.title": "Settle up without the argument.",
  "settle.body":
    "The app proposes the transfers that leave everyone even. Mark one as paid and it lands in the history.",
  "settle.from": "owes",
  "settle.transfers": "{count} transfers",
  "settle.remaining": "{amount} left",
  "settle.flowHint": "Follow the money from who owes to who receives.",
  "settle.flowAria": "Map of the transfers between members",
  "settle.allPaid": "Everyone at zero.",
  "settle.paid": "mark as paid",
  "settle.paidDone": "Paid",

  "tech.title": "Built to be trusted.",
  "tech.paid": "paid",
  "tech.owed": "owed",
  "tech.settled": "settled",
  "tech.equationNote": "A write only lands if this stays at zero.",
  "tech.cents": "Integer cents, never floats",
  "tech.transaction": "Balances maintained in the same transaction",
  "tech.tests": "175 API tests passing",
  "tech.optimizer": "Deterministic settlement optimizer",

  "run.title": "Runs in two commands.",
  "run.body":
    "Postgres in Docker, a Fastify API and a React app. Then open localhost:8080.",
  "run.ready": "Postgres ready on :5433",
  "run.api": "Fastify API on :3000",
  "run.site": "React app on :8080",
  "run.copy": "Copy",
  "run.copied": "Copied",

  "footer.made": "Built with React, Fastify and PostgreSQL.",
  "footer.repo": "Repository",
  "footer.language": "Language",
  "footer.zero": "Final balance"
};

const dictionaries: Record<Locale, Record<keyof typeof pt, string>> = {
  "pt-PT": pt,
  en
};

export type MessageKey = keyof typeof pt;

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

const STORAGE_KEY = "expense-splitting-site-locale";

function detectLocale(): Locale {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "pt-PT") {
      return stored;
    }
  }
  if (typeof navigator !== "undefined") {
    return navigator.language?.toLowerCase().startsWith("pt") ? "pt-PT" : "en";
  }
  return "pt-PT";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);

  const t = useCallback(
    (key: MessageKey, params?: Record<string, string | number>) => {
      const message = dictionaries[locale][key];
      if (!params) {
        return message;
      }
      return message.replace(/\{(\w+)\}/g, (match, name: string) => {
        const value = params[name];
        return value === undefined ? match : String(value);
      });
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
