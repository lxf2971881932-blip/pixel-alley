import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({
  active,
}: {
  active?: "home" | "upload" | "gallery" | "login" | "account";
}) {
  return (
    <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
      <BrandMark size={36} />
      <nav className="flex flex-wrap items-center justify-end gap-2">
        {active !== "upload" ? (
          <Link
            href="/upload"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Upload
          </Link>
        ) : null}
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Home
        </Link>
      </nav>
    </header>
  );
}

export function PixelShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  scenery?: "full" | "lite" | "none";
}) {
  return (
    <div className={cn("relative flex min-h-full flex-1 flex-col", className)}>
      {children}
    </div>
  );
}

export function PixelPanel({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section
      className={cn("pixel-panel relative z-10 w-full p-4 sm:p-6", className)}
    >
      {title ? (
        <h2 className="pixel-label mb-4 text-white">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
