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
  "hero.scroll": "Desce para dividir",

  "split.kicker": "A divisão",
  "split.title": "Cada um paga a sua parte.",
  "split.body":
    "Igual, valores exatos, percentagens ou quotas. O motor distribui os cêntimos com arredondamento largest-remainder para que a soma bata sempre ao cêntimo.",
  "split.share1": "40,00 €",
  "split.share2": "25,00 €",
  "split.share3": "15,00 €",
  "split.share4": "10,00 €",
  "split.share5": "10,00 €",

  "mechanics.title": "Simples por fora, exato por dentro.",
  "mechanics.split.title": "Quatro formas de dividir",
  "mechanics.split.body":
    "Igual, exato, percentagem e quotas — todos validados no servidor.",
  "mechanics.settle.title": "Mínimo de transferências",
  "mechanics.settle.body":
    "O otimizador resolve quem paga a quem com N−1 transferências no máximo.",
  "mechanics.balance.title": "Saldos sempre certos",
  "mechanics.balance.body":
    "Tudo em cêntimos inteiros, atualizado na mesma transação de cada escrita.",

  "device.title": "A app, em detalhe.",
  "device.caption1": "O teu saldo em todos os grupos, num só painel.",
  "device.caption2": "Despesas, acertos sugeridos e histórico de pagamentos.",
  "device.caption3": "Quem pagou o quê, comparado com a parte de cada um.",
  "device.caption4": "Pessoas e grupos, sempre a par.",
  "device.caption5": "No bolso: os mesmos saldos.",

  "settle.title": "Acertar contas sem discussão.",
  "settle.body":
    "A app propõe as transferências que deixam todos em dia. Marca como pago e o histórico fica registado.",
  "settle.from": "deve a",
  "settle.paid": "marcar como pago",
  "settle.paidDone": "Pago",

  "tech.title": "Feito para confiar.",
  "tech.cents": "Cêntimos inteiros, sem floats",
  "tech.transaction": "Saldos mantidos na mesma transação",
  "tech.tests": "175 testes de API a passar",
  "tech.optimizer": "Otimizador de acertos determinístico",

  "run.title": "Corre em dois comandos.",
  "run.body":
    "Postgres em Docker, API Fastify e app React. Depois abre localhost:8080.",
  "run.copy": "Copiar",
  "run.copied": "Copiado",

  "footer.made": "Feito com React, Fastify e PostgreSQL.",
  "footer.credits":
    "Modelos 3D: MacBook por Alex Safayan e iPhone por polyman, CC BY 4.0.",
  "footer.repo": "Repositório",
  "footer.language": "Idioma"
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
  "hero.scroll": "Scroll to split",

  "split.kicker": "The split",
  "split.title": "Everyone pays their share.",
  "split.body":
    "Equal, exact amounts, percentages or weights. The engine distributes cents with largest-remainder rounding so the sum always lands to the cent.",
  "split.share1": "40,00 €",
  "split.share2": "25,00 €",
  "split.share3": "15,00 €",
  "split.share4": "10,00 €",
  "split.share5": "10,00 €",

  "mechanics.title": "Simple outside, exact inside.",
  "mechanics.split.title": "Four ways to split",
  "mechanics.split.body":
    "Equal, exact, percentage and weighted shares — all validated server-side.",
  "mechanics.settle.title": "Fewest transfers",
  "mechanics.settle.body":
    "The optimizer works out who pays whom in at most N−1 transfers.",
  "mechanics.balance.title": "Balances stay exact",
  "mechanics.balance.body":
    "Everything in integer cents, updated in the same transaction as each write.",

  "device.title": "The app, up close.",
  "device.caption1": "Your balance across every group, in one panel.",
  "device.caption2": "Expenses, suggested settlements and payment history.",
  "device.caption3": "Who paid what, compared with each person's share.",
  "device.caption4": "People and groups, always in sync.",
  "device.caption5": "In your pocket: the same balances.",

  "settle.title": "Settle up without the argument.",
  "settle.body":
    "The app proposes the transfers that leave everyone even. Mark one as paid and it lands in the history.",
  "settle.from": "owes",
  "settle.paid": "mark as paid",
  "settle.paidDone": "Paid",

  "tech.title": "Built to be trusted.",
  "tech.cents": "Integer cents, never floats",
  "tech.transaction": "Balances maintained in the same transaction",
  "tech.tests": "175 API tests passing",
  "tech.optimizer": "Deterministic settlement optimizer",

  "run.title": "Runs in two commands.",
  "run.body":
    "Postgres in Docker, a Fastify API and a React app. Then open localhost:8080.",
  "run.copy": "Copy",
  "run.copied": "Copied",

  "footer.made": "Built with React, Fastify and PostgreSQL.",
  "footer.credits":
    "3D models: MacBook by Alex Safayan and iPhone by polyman, CC BY 4.0.",
  "footer.repo": "Repository",
  "footer.language": "Language"
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
