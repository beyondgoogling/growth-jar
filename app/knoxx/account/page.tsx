import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/admins";
import { AdminShell, Card } from "../ui";
import { ChangePasswordForm, UpdateProfileForm } from "./account-form";

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading account…</p>}>
      <Account />
    </Suspense>
  );
}

async function Account() {
  const admin = await requireAdmin();
  return (
    <AdminShell
      admin={admin}
      active="account"
      title="Account"
      subtitle="Your sign-in details and password."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Your details
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Update your name or the email you sign in with.
          </p>
          <UpdateProfileForm
            name={admin.name}
            email={admin.email}
            roleLabel={ROLE_LABELS[admin.role]}
          />
        </Card>
        <Card className="p-6">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Change password
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            You&apos;ll need your current password. Other devices where you&apos;re signed
            in will be signed out.
          </p>
          <ChangePasswordForm />
        </Card>
      </div>
    </AdminShell>
  );
}