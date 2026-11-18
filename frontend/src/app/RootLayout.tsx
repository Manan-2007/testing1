import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "@/components/ui/Toaster";
import { Preferences } from "./Preferences";

export function RootLayout() {
  return (
    <Preferences>
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </Preferences>
  );
}
