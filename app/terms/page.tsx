import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service — JobHunch",
  description: "Terms of use for JobHunch. Placeholder terms.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        These placeholder terms are a stand-in for JobHunch&apos;s official Terms of Service. The final terms will
        describe acceptable use of the platform, rules for posting reviews, account responsibilities, and limitations
        of liability.
      </p>
      <p>
        Until the full terms are published, use of JobHunch is subject to your agreement to use the service in good
        faith, respect others, and not abuse the community or attempt to deanonymize reviewers. JobHunch may suspend or
        remove accounts that violate these expectations.
      </p>
      <p>
        We will replace this page with a complete legal document before launch or as required. Check back for updates.
      </p>
    </LegalPageShell>
  );
}
