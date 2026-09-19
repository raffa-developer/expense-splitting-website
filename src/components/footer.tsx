import { GithubMark } from "@/components/nav";
import { useI18n } from "@/lib/i18n";
import { formatCents } from "@/lib/money";
import { GITHUB_URL } from "@/lib/site";

export function Footer() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-6 py-10 text-sm text-muted">
        <span className="font-display font-bold text-ink">
          Expense<span className="text-apricot">.</span>Splitting
        </span>
        <span>© {year}</span>
        {/* <span className="hidden sm:inline">{t("footer.made")}</span> */}
        <span className="money ml-auto flex items-center gap-2 text-xs">
          {t("footer.zero")}
          <span className="text-sm font-medium text-pine">
            {formatCents(0, locale)}
          </span>
        </span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 transition-colors hover:text-ink"
        >
          <GithubMark className="size-4" />
          {t("footer.repo")}
        </a>
      </div>
    </footer>
  );
}
