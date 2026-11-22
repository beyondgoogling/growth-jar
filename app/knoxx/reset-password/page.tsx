import Link from "next/link";
import { isValidPasswordResetToken } from "@/lib/admins";
import { ResetPasswordForm } from "./reset-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const valid = token ? await isValidPasswordResetToken(token) : false;
  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-dark px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-serif text-2xl font-semibold uppercase tracking-[0.2em] text-gold-soft">
            The Growth Jar
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-[0.35em] text-parchment/50">
            Admin Console
          </p>
        </div>
        <div className="rounded-3xl border border-sage/20 bg-parchment p-10 shadow-2xl shadow-black/20">
          <h1 className="font-serif text-3xl font-medium text-sage-dark">
            Choose a new password
          </h1>
          {valid ? (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                Pick something at least 10 characters long. This link can only
                be used once.
              </p>
              <ResetPasswordForm token={token} />
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-ink-soft">
                This reset link is invalid or has expired. Reset links last for
                1 hour and work only once.
              </p>
              <Link
                href="/knoxx/forgot-password"
                className="mt-8 block w-full rounded-full bg-sage-dark px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold"
              >
                Request a new link
              </Link>
            </>
          )}
          <Link
            href="/knoxx/login"
            className="mt-6 block text-center text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:text-sage-dark"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}