import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/layout/Logo";

export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Something went wrong.";
  return (
    <main id="main" className="container-page flex min-h-screen flex-col items-center justify-center py-16 text-center">
      <LogoMark className="size-10" />
      <h1 className="mt-6 text-2xl font-bold">This page hit a problem</h1>
      <p className="mt-2 max-w-md text-ink-3">{message}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => window.location.reload()} leading={<RefreshCw aria-hidden />}>
          Reload
        </Button>
        <ButtonLink to="/" variant="secondary">
          Go to home
        </ButtonLink>
      </div>
    </main>
  );
}
