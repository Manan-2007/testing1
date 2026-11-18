import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="container-page flex flex-1 flex-col items-start justify-center py-16">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-5xl">This page doesn&rsquo;t exist.</h1>
        <p className="mt-4 max-w-lg text-lg leading-8 text-ink-2">
          The link may be out of date. You can go back to the home page or start a translation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink to="/" variant="secondary" leading={<ArrowLeft aria-hidden />}>
            Back to home
          </ButtonLink>
          <ButtonLink to="/app/speech-to-sign">Open the translator</ButtonLink>
        </div>
      </main>
    </div>
  );
}
