import { useEffect } from "react";

export function useDocumentTitle(title: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · Parlance` : "Parlance · Speech and Indian Sign Language, both ways";
  }, [title]);
}
