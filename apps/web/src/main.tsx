import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./app/providers/AuthProvider.js";
import { QueryProvider } from "./app/providers/QueryProvider.js";
import { ThemeProvider } from "./app/providers/ThemeProvider.js";
import { AppRouter } from "./app/router/index.js";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>,
);
