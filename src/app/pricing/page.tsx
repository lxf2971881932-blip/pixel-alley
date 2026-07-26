import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PixelPanel,
  PixelShell,
  SiteHeader,
} from "@/components/layout/site-chrome";

export const metadata = { title: "Get the extension" };

export default function PricingPage() {
  return (
    <PixelShell>
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-16 pt-4 sm:px-6">
        <PixelPanel title="Get the extension">
          <p className="mb-4 text-sm font-semibold text-wood-dark/80">
            MVP is free. Chrome Web Store install link will live here. Paid
            limits stay in backlog.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/upload" className={cn(buttonVariants())}>
              Create a pet
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back home
            </Link>
          </div>
        </PixelPanel>
      </main>
    </PixelShell>
  );
}
