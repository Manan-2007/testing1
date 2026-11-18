import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell";
import { PageLoader } from "./PageLoader";
import { RootLayout } from "./RootLayout";
import { RouteError } from "./RouteError";

/* Every page is its own chunk: the landing page never downloads MediaPipe,
   and the camera workspace never downloads the landing illustrations. */
export const router = createBrowserRouter([
  {
    Component: RootLayout,
    ErrorBoundary: RouteError,
    HydrateFallback: PageLoader,
    children: [
      {
        path: "/",
        lazy: async () => ({ Component: (await import("@/features/landing/LandingPage")).LandingPage }),
      },
      {
        path: "/app",
        Component: AppShell,
        children: [
          { index: true, element: <Navigate to="speech-to-sign" replace /> },
          {
            path: "speech-to-sign",
            lazy: async () => ({
              Component: (await import("@/features/speech-to-sign/SpeechToSignPage")).SpeechToSignPage,
            }),
          },
          {
            path: "sign-to-text",
            lazy: async () => ({
              Component: (await import("@/features/sign-to-text/SignToTextPage")).SignToTextPage,
            }),
          },
          {
            path: "history",
            lazy: async () => ({ Component: (await import("@/features/history/HistoryPage")).HistoryPage }),
          },
          {
            path: "settings",
            lazy: async () => ({ Component: (await import("@/features/settings/SettingsPage")).SettingsPage }),
          },
          {
            path: "help",
            lazy: async () => ({ Component: (await import("@/features/help/HelpPage")).HelpPage }),
          },
        ],
      },
      {
        path: "*",
        lazy: async () => ({ Component: (await import("@/features/NotFoundPage")).NotFoundPage }),
      },
    ],
  },
]);
