import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  listAdmins,
  type Role,
} from "@/lib/admins";
import { formatDate } from "@/lib/format";
import { updateAdminAction } from "../actions";
import { AdminShell, Card } from "../ui";
import { btnPrimary } from "../styles";
import { CreateAdminForm, DeleteAdminForm, EditAdminProfileForm, ResetPasswordForm } from "./team-forms";

export default function TeamPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading team…</p>}>
      <Team />
    </Suspense>
  );
}

async function Team() {
  const admin = await requirePermission("admins.manage");
  const admins = await listAdmins();

  return (
    <AdminShell
      admin={admin}
      active="team"
      title="Team"
      subtitle="Create admin accounts and control what each person can do."
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <div className="border-b border-sage/15 px-6 py-4">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              Administrators
            </h2>
          </div>
          <div className="divide-y divide-sage/10">
            {admins.map((a) => (
              <div key={a.id} className="px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {a.name}
                      {a.id === admin.id && (
                        <span className="ml-2 text-xs text-gold">(you)</span>
                      )}
                      {!a.active && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600 ring-1 ring-red-200">
                          disabled
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-soft">{a.email}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      Added {formatDate(a.created_at)}
                    </p>
                  </div>
                  <form action={updateAdminAction} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <select
                      name="role"
                      defaultValue={a.role}
                      key={a.role}
                      className="rounded-xl border border-sage/30 bg-cream px-3 py-2 text-sm"
                    >
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <select
                      name="active"
                      defaultValue={String(a.active)}
                      key={a.active}
                      className="rounded-xl border border-sage/30 bg-cream px-3 py-2 text-sm"
                    >
                      <option value="1">Active</option>
                      <option value="0">Disabled</option>
                    </select>
                    <button type="submit" className={btnPrimary}>
                      Save
                    </button>
                  </form>
                </div>
                <div className="flex flex-wrap items-start gap-x-8">
                  <ResetPasswordForm id={a.id} email={a.email} />
                  <EditAdminProfileForm id={a.id} name={a.name} email={a.email} />
                  {a.id !== admin.id && (
                    <DeleteAdminForm id={a.id} name={a.name} email={a.email} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">
              Add an admin
            </h2>
            <CreateAdminForm />
          </Card>
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-sage-dark">
              What each role can do
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <div key={r}>
                  <dt className="font-semibold text-gold">{ROLE_LABELS[r]}</dt>
                  <dd className="text-ink-soft">{ROLE_DESCRIPTIONS[r]}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}