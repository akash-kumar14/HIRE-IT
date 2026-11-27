import Link from "next/link";
import { FormCard } from "@/components/auth/form-ui.js";
import { ProviderApplicationForm } from "@/components/provider/provider-application-form.js";
import { getDb } from "@/lib/db/client.js";
import { requireProviderSession } from "@/lib/ui/session-guard.js";
import {
  ProviderProfileNotFoundError,
  getOwnProviderProfile,
} from "@/modules/providers/provider-applications.service.js";

export const dynamic = "force-dynamic";

const statusMessages = {
  pending: "Your application is pending admin review.",
  approved: "Your provider profile is approved.",
  suspended: "Your provider profile is suspended.",
};

async function readOwnProfile(user) {
  try {
    return await getOwnProviderProfile(user, { database: getDb() });
  } catch (error) {
    if (error instanceof ProviderProfileNotFoundError) {
      return null;
    }

    throw error;
  }
}

export default async function ProviderApplicationPage() {
  const { user } = await requireProviderSession();
  const profile = await readOwnProfile(user);

  if (!user.emailVerifiedAt) {
    return (
      <section className="grid max-w-2xl gap-6">
        <FormCard
          title="Verify your email"
          description="Email verification is required before applying as a provider."
          footer={
            <Link href="/verify-email" className="font-medium text-brand">
              Verify email
            </Link>
          }
        />
      </section>
    );
  }

  if (profile && profile.status !== "rejected") {
    return (
      <section className="grid max-w-2xl gap-6">
        <FormCard
          title="Provider application"
          description={statusMessages[profile.status] ?? "Application submitted."}
          footer={
            <Link href="/provider/dashboard" className="font-medium text-brand">
              Back to dashboard
            </Link>
          }
        >
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Display name</dt>
              <dd className="font-medium">{profile.displayName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Status</dt>
              <dd className="font-medium">{profile.status}</dd>
            </div>
          </dl>
        </FormCard>
      </section>
    );
  }

  return (
    <section className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-brand">Provider</p>
        <h1 className="text-3xl font-semibold sm:text-4xl">
          {profile ? "Resubmit your application" : "Become a provider"}
        </h1>
        <p className="text-ink-muted">
          Share the name customers will see and a short introduction. Verification
          details are added after your application is approved.
        </p>
      </div>
      <ProviderApplicationForm
        initialDisplayName={profile?.displayName ?? ""}
        initialBio={profile?.bio ?? ""}
        isResubmission={Boolean(profile)}
      />
    </section>
  );
}
