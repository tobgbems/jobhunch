import type { Metadata } from "next";
import { LegalPageShell } from "@/components/landing/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — JobHunch",
  description: "How JobHunch handles your information. Placeholder policy.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        This is a placeholder privacy policy for JobHunch. A full policy will describe what data we collect (for
        example, account details you provide when you sign in), how we use it to run the service, and how we protect
        anonymous reviews when you choose to post without identifying yourself.
      </p>
      <p>
        When the official policy is published, it will cover cookies, analytics, third-party services (such as
        authentication providers), and your rights under applicable law. We will update this page and notify active users
        where required.
      </p>
      <p>
        For questions about privacy in the meantime, please contact us through the channels listed on the main site
        once support is available.
      </p>
    </LegalPageShell>
  );
}
