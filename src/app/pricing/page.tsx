import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHROME_STORE_URL } from "@/lib/chrome-store";
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
          <p className="mb-4 font-mono text-sm leading-relaxed text-gray-300">
            Install Pixel Alley free from the Chrome Web Store, then open a new
            tab to enter the midnight alley.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants())}
            >
              Chrome Web Store
            </a>
            <Link href="/upload" className={cn(buttonVariants({ variant: "outline" }))}>
              Create a pet
            </Link>
          </div>
        </PixelPanel>
      </main>
    </PixelShell>
  );
}
