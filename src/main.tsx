import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry before rendering the app (async, but don't block rendering)
// Will only initialize if VITE_SENTRY_DSN is set and @sentry/react is installed
initSentry().catch(() => {
  // Silently fail if Sentry is not installed or not configured
});

createRoot(document.getElementById("root")!).render(<App />);
