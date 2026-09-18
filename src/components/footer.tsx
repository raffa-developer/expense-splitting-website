import { GithubMark } from "@/components/nav";
import { useI18n } from "@/lib/i18n";
import { GITHUB_URL } from "@/lib/site";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-10 text-sm text-muted">
        <span className="font-display font-bold text-ink">
          Expense<span className="text-apricot">.</span>Splitting
        </span>
        <span>© {year}</span>
        <span className="hidden sm:inline">{t("footer.made")}</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-2 transition-colors hover:text-ink"
        >
          <GithubMark className="size-4" />
          {t("footer.repo")}
        </a>
      </div>
    </footer>
  );
}
