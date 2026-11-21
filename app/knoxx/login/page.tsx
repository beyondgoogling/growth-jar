import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
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
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Sign in to manage orders and your team.
          </p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-parchment/40">
          Access is restricted to authorized administrators.
        </p>
      </div>
    </main>
  );
}