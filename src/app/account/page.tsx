import { AccountPanel } from "@/components/auth/account-panel";
import { PixelShell, SiteHeader } from "@/components/layout/site-chrome";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <PixelShell>
      <SiteHeader active="account" />
      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col items-center px-4 pb-16 pt-4 sm:px-6">
        <AccountPanel />
      </main>
    </PixelShell>
  );
}
