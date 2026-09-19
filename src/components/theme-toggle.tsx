import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme, type ThemeChoice } from "@/lib/theme";

const OPTIONS: ReadonlyArray<{ value: ThemeChoice; icon: typeof Sun }> = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor }
];

export function ThemeToggle() {
  const { t } = useI18n();
  const { choice, theme, setChoice } = useTheme();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        aria-label={t("theme.toggle")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="flex size-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-ink"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={t("theme.label")}
          className="absolute right-0 top-11 z-50 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-window"
        >
          {OPTIONS.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={choice === option.value}
                onClick={() => {
                  setChoice(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted-surface ${
                  choice === option.value ? "font-medium text-ink" : "text-muted"
                }`}
              >
                <OptionIcon className="size-4" aria-hidden="true" />
                {t(`theme.${option.value}` as const)}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
