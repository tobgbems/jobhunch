import Image from "next/image";
import Link from "next/link";

type LegalPageShellProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0D0D0D] antialiased">
      <header className="border-b border-[#E5E7EB] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-90">
            <Image src="/logo.svg" alt="JobHunch" width={140} height={30} className="h-7 w-auto sm:h-8" priority />
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-[#27AE60] transition-colors hover:text-[#229954]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <article className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#0D0D0D]">{title}</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Last updated: March 2026</p>
          <div className="mt-8 space-y-4 text-sm leading-relaxed text-[#6B7280]">{children}</div>
        </article>
      </main>

      <footer className="border-t border-[#E5E7EB] bg-white px-4 py-6 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-6xl text-center text-sm text-[#6B7280]">
          © 2026 JobHunch. Built for Africa.
        </p>
      </footer>
    </div>
  );
}
