import { LoginForm } from "./login-form";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-sage/30 bg-parchment p-8">
        <h1 className="font-serif text-3xl font-medium text-sage-dark">
          Admin sign in
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          The Growth Jar order dashboard.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}