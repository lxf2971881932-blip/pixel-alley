"use client";

import { useEffect, useId, useState, type ReactNode } from "react";

type PolicyId = "terms" | "privacy" | "refund";

const POLICIES: Record<
  PolicyId,
  { title: string; label: string; body: ReactNode }
> = {
  terms: {
    label: "Terms of Service",
    title: "Terms of Service",
    body: (
      <>
        <p>
          Welcome to Pixel Alley. By accessing our website, purchasing a
          license, or using the Pixel Alley Chrome extension, you agree to these
          Terms of Service.
        </p>
        <p>
          Pixel Alley provides digital tools that convert pet photos into pixel
          companions for display in a browser new-tab experience. You must
          provide accurate information when purchasing and keep your License Key
          confidential.
        </p>
        <p>
          You may not reverse engineer, resell, or redistribute our software,
          License Keys, or generated assets except as expressly allowed for
          personal use. We may update these terms; continued use after changes
          constitutes acceptance.
        </p>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY
          KIND. To the maximum extent permitted by law, Pixel Alley is not
          liable for indirect, incidental, or consequential damages arising from
          use of the service.
        </p>
        <p>Contact: lxf2971881932@gmail.com.</p>
      </>
    ),
  },
  privacy: {
    label: "Privacy Policy",
    title: "Privacy Policy",
    body: (
      <>
        <p>
          Pixel Alley respects your privacy. This policy describes what we
          collect and how we use it when you visit our site, purchase through
          Gumroad, or use our extension.
        </p>
        <p>
          <strong className="text-white">Information we collect.</strong> Account
          or guest identifiers, uploaded pet photos for generation, generation
          job metadata, and purchase-related details processed by our payment
          provider (Gumroad). The extension may store sync/license data
          locally in your browser.
        </p>
        <p>
          <strong className="text-white">How we use it.</strong> To generate your
          pixel companion, deliver License Keys, operate the product, prevent
          abuse, and improve reliability. We do not sell your personal data.
        </p>
        <p>
          <strong className="text-white">Third parties.</strong> Payments and
          licensing are handled by Gumroad under their privacy practices.
          Hosting and storage providers may process data to run the service.
        </p>
        <p>
          You may request deletion of account-linked data where applicable.
          Contact: lxf2971881932@gmail.com.
        </p>
      </>
    ),
  },
  refund: {
    label: "Refund Policy",
    title: "Refund Policy",
    body: (
      <>
        <p>
          Pixel Alley sells digital goods delivered electronically. Please read
          this policy carefully before purchasing.
        </p>
        <p className="rounded-lg border border-[#ff77a8]/50 bg-[#ff77a8]/10 px-3 py-3 text-gray-200">
          <strong className="font-semibold text-white">
            Pixel Alley is a digital product delivering an instantaneous License
            Key. All sales are final. No refunds will be issued once the key is
            generated.
          </strong>
        </p>
        <p>
          Because License Keys and generation credits are delivered immediately
          after payment, we generally cannot reverse or refund completed
          purchases. If you experience a technical delivery failure (for
          example, you paid but never received a key), contact support with your
          order receipt and we will help resolve delivery issues.
        </p>
        <p>
          Chargebacks filed without first contacting support may result in
          suspension of License Keys and related access.
        </p>
        <p>Contact: lxf2971881932@gmail.com.</p>
      </>
    ),
  },
};

export function SiteLegalFooter() {
  const [open, setOpen] = useState<PolicyId | null>(null);
  const titleId = useId();
  const active = open ? POLICIES[open] : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <footer className="relative z-20 mt-auto w-full px-4 py-8 sm:px-6">
        <nav
          aria-label="Legal"
          className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-gray-500"
        >
          {(Object.keys(POLICIES) as PolicyId[]).map((id, i) => (
            <span key={id} className="inline-flex items-center gap-x-4">
              {i > 0 ? <span aria-hidden>·</span> : null}
              <button
                type="button"
                onClick={() => setOpen(id)}
                className="transition hover:text-gray-300 hover:underline hover:underline-offset-4"
              >
                {POLICIES[id].label}
              </button>
            </span>
          ))}
        </nav>
        <p className="mt-3 text-center text-xs text-gray-600">
          © {new Date().getFullYear()} Pixel Alley
        </p>
      </footer>

      {active ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          role="presentation"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-[#ff77a8]/70 bg-[#0b0f19]/85 p-5 shadow-[0_0_32px_rgba(255,119,168,0.35)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="font-pixel text-[10px] leading-relaxed text-[#ff77a8] sm:text-[11px]"
            >
              {active.title}
            </h2>
            <div className="mt-4 space-y-3 font-mono text-sm leading-relaxed text-gray-300">
              {active.body}
            </div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-5 w-full rounded-sm border border-white/20 bg-transparent py-2 font-mono text-sm text-gray-300 transition hover:border-[#ff77a8]/50 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
