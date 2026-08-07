import type { ReactNode } from "react";
import { publicEnv } from "@/lib/env";

type LegalPageProps = {
  title: string;
  effectiveDate: string;
  children: ReactNode;
};

export function LegalPage({ title, effectiveDate, children }: LegalPageProps) {
  const appName = publicEnv.appName;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {appName} · Effective {effectiveDate}
        </p>
      </header>
      <div className="space-y-6 text-sm leading-relaxed text-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:underline">
        {children}
      </div>
    </article>
  );
}
