import type { Metadata } from "next";
import {
  PixelPanel,
  PixelShell,
  SiteHeader,
} from "@/components/layout/site-chrome";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Pixel Alley website and Chrome extension.",
};

export default function PrivacyPage() {
  return (
    <PixelShell>
      <SiteHeader />
      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-4 sm:px-6">
        <PixelPanel title="Privacy Policy">
          <div className="space-y-4 font-mono text-sm leading-relaxed text-gray-300">
            <p>Last updated: August 3, 2026</p>
            <p>
              Pixel Alley respects your privacy. This policy describes what we
              collect and how we use it when you visit{" "}
              <a
                className="text-[#7dd3fc] underline underline-offset-2"
                href="https://www.pixelalley.online"
              >
                www.pixelalley.online
              </a>
              , purchase through Gumroad, or use the Pixel Alley Chrome
              extension.
            </p>

            <h2 className="font-pixel text-[10px] uppercase text-white sm:text-xs">
              Information we collect
            </h2>
            <p>
              Depending on how you use the product, we may process: account or
              guest identifiers; uploaded pet photos used for pixel generation;
              generation job metadata; sync codes and related pet asset
              references (name, sprite image URLs); and purchase-related details
              processed by our payment provider (Gumroad).
            </p>
            <p>
              The Chrome extension stores synced pet data and optional settings
              (such as API base URL or custom music preference) locally in your
              browser using Chrome storage / IndexedDB. Search queries typed in
              the new-tab search box are sent to Google to show suggestions and
              open Google Search results; we do not sell that query data.
            </p>

            <h2 className="font-pixel text-[10px] uppercase text-white sm:text-xs">
              How we use it
            </h2>
            <p>
              We use this information to generate your pixel companion, deliver
              License Keys, operate the website and extension, prevent abuse,
              and improve reliability. We do not sell your personal data.
            </p>

            <h2 className="font-pixel text-[10px] uppercase text-white sm:text-xs">
              Third parties
            </h2>
            <p>
              Payments and licensing are handled by Gumroad under their privacy
              practices. Hosting, database, and storage providers (including
              Vercel and Supabase) may process data as needed to run the
              service. Google may process search suggestion / search requests
              initiated from the new tab.
            </p>

            <h2 className="font-pixel text-[10px] uppercase text-white sm:text-xs">
              Your choices
            </h2>
            <p>
              You may clear synced pet data from the extension popup, and you
              may request deletion of account-linked data where applicable.
            </p>

            <h2 className="font-pixel text-[10px] uppercase text-white sm:text-xs">
              Contact
            </h2>
            <p>
              Questions or deletion requests:{" "}
              <a
                className="text-[#7dd3fc] underline underline-offset-2"
                href="mailto:lxf2971881932@gmail.com"
              >
                lxf2971881932@gmail.com
              </a>
              .
            </p>
          </div>
        </PixelPanel>
      </main>
    </PixelShell>
  );
}
