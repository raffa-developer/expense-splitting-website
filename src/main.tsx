import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { I18nProvider } from "@/lib/i18n";
import { MotionProvider } from "@/lib/motion";
import { ThemeProvider } from "@/lib/theme";
import "./index.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container is missing");
}

createRoot(container).render(
  <StrictMode>
    <ThemeProvider>
      <MotionProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </MotionProvider>
    </ThemeProvider>
  </StrictMode>
);
