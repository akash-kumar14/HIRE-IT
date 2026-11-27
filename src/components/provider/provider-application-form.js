"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BUTTON_CLASS,
  FormCard,
  FormError,
  INPUT_CLASS,
  LABEL_CLASS,
} from "@/components/auth/form-ui.js";
import { postJson } from "@/lib/ui/auth-forms.js";
import {
  MAX_BIO_LENGTH,
  MAX_DISPLAY_NAME_LENGTH,
  buildApplicationPayload,
} from "@/lib/ui/provider-application-form.js";

export function ProviderApplicationForm({
  initialDisplayName = "",
  initialBio = "",
  isResubmission = false,
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio ?? "");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const payload = buildApplicationPayload({ displayName, bio });
      await postJson("/api/v1/provider-applications", payload);
      router.replace("/provider/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setPending(false);
    }
  }

  return (
    <FormCard
      title={isResubmission ? "Resubmit application" : "Apply as a provider"}
      description="Admins review applications before your profile can accept work."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <div>
          <label htmlFor="provider-display-name" className={LABEL_CLASS}>
            Display name
          </label>
          <input
            id="provider-display-name"
            type="text"
            required
            maxLength={MAX_DISPLAY_NAME_LENGTH}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="provider-bio" className={LABEL_CLASS}>
            Bio (optional)
          </label>
          <textarea
            id="provider-bio"
            rows={5}
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending
            ? "Submitting..."
            : isResubmission
              ? "Resubmit application"
              : "Submit application"}
        </button>
      </form>
    </FormCard>
  );
}
