import { UploadForm } from "@/components/upload/upload-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { PixelShell, SiteHeader } from "@/components/layout/site-chrome";

export const metadata = { title: "Upload" };

export default function UploadPage() {
  return (
    <PixelShell>
      <SiteHeader active="upload" />
      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 px-4 pb-16 pt-2 sm:px-6">
        <UploadForm configured={isSupabaseConfigured()} />
      </main>
    </PixelShell>
  );
}
