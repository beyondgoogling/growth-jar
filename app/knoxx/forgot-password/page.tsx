import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-form";

export default function ForgotPasswordPage() {
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
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Enter your admin email and we&apos;ll send you a link to choose a new
            password.
          </p>
          <ForgotPasswordForm />
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