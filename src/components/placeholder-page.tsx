import type { ReactNode } from "react";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="text-slate-600">{description}</p>
      <p className="font-mono text-xs text-slate-400">Scaffold — wire to Supabase next</p>
    </main>
  );
}

export function SimpleShell({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-slate-50">{children}</div>;
}
