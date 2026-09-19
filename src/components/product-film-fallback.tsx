import desktopDashboard from "@/assets/screens/desktop-dashboard.png";
import mobileDashboard from "@/assets/screens/mobile-dashboard.png";
import { useI18n } from "@/lib/i18n";

export function ProductFilmFallback({ compact }: { compact: boolean }) {
  const { t } = useI18n();
  const label = compact ? t("film.phone") : t("film.laptop");

  const frame = (
    <figure className="card-surface relative flex w-fit max-w-full flex-col p-2 shadow-frame">
      <figcaption
        className={`flex shrink-0 items-center gap-2 px-2 pt-1 pb-2 text-xs font-semibold text-muted ${
          compact ? "justify-center text-center" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className="size-1.5 rounded-full bg-pine"
        />
        {label}
      </figcaption>
      <div className="mx-auto overflow-hidden rounded-xl border border-line bg-canvas">
        <img
          src={compact ? mobileDashboard : desktopDashboard}
          alt={label}
          className={`block h-auto w-auto object-contain ${
            compact ? "max-h-[26vh] max-w-[70vw]" : "max-h-[52vh] max-w-[50vw]"
          }`}
        />
      </div>
    </figure>
  );

  if (compact) {
    return (
      <div className="relative flex h-full w-full items-center justify-center px-6">
        {frame}
      </div>
    );
  }

  return (
    <div className="absolute top-24 right-6 bottom-48 left-[54%] flex items-center justify-center">
      {frame}
    </div>
  );
}
