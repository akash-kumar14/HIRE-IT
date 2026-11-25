"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BUTTON_CLASS,
  FormCard,
  FormError,
  FormNotice,
  INPUT_CLASS,
  LABEL_CLASS,
} from "@/components/auth/form-ui.js";
import { postJson } from "@/lib/ui/auth-forms.js";

const CODE_CLASS = `${INPUT_CLASS} tracking-widest`;

function MfaNotEnrolledCard() {
  return (
    <FormCard
      title="Admin security"
      description="Multi-factor authentication is not enrolled for this admin."
      footer={
        <Link href="/mfa/enroll" className="font-medium text-brand">
          Start enrollment
        </Link>
      }
    >
      <FormNotice>
        Enroll an authenticator app before accessing the admin workspace.
      </FormNotice>
    </FormCard>
  );
}

export function MfaEnrollmentForm() {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleStart(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const payload = await postJson("/api/v1/auth/mfa/enroll", {});
      setEnrollment(payload.data ?? null);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const payload = await postJson("/api/v1/auth/mfa/confirm", { code });
      setRecoveryCodes(payload.data?.recoveryCodes ?? []);
      setEnrollment(null);
      setCode("");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  if (recoveryCodes.length > 0) {
    return (
      <FormCard
        title="Enrollment complete"
        description="Store these recovery codes before leaving this page."
        footer={
          <Link href="/mfa/verify" className="font-medium text-brand">
            Continue to verification
          </Link>
        }
      >
        <div className="grid gap-4">
          <FormNotice>
            These codes are shown once. Keep them somewhere private and secure.
          </FormNotice>
          <ul className="grid gap-1 rounded-md border border-border bg-surface-muted p-4 font-mono text-sm">
            {recoveryCodes.map((recoveryCode) => (
              <li key={recoveryCode}>{recoveryCode}</li>
            ))}
          </ul>
        </div>
      </FormCard>
    );
  }

  if (enrollment) {
    return (
      <FormCard
        title="Confirm enrollment"
        description="Add the credential to your authenticator app, then enter a code."
      >
        <div className="grid gap-4">
          <FormError message={error} />
          <div className="grid gap-1 rounded-md border border-border bg-surface-muted p-4 text-sm">
            <span className="font-medium">Secret</span>
            <code className="break-all font-mono">{enrollment.secret}</code>
          </div>
          <div className="grid gap-1 rounded-md border border-border bg-surface-muted p-4 text-sm">
            <span className="font-medium">Authenticator URI</span>
            <code className="break-all font-mono">{enrollment.otpauthUri}</code>
          </div>
          <form onSubmit={handleConfirm} className="grid gap-4">
            <div>
              <label htmlFor="mfa-enroll-code" className={LABEL_CLASS}>
                6-digit code
              </label>
              <input
                id="mfa-enroll-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={CODE_CLASS}
              />
            </div>
            <button type="submit" disabled={pending} className={BUTTON_CLASS}>
              {pending ? "Confirming..." : "Confirm enrollment"}
            </button>
          </form>
        </div>
      </FormCard>
    );
  }

  return (
    <FormCard
      title="Enroll admin MFA"
      description="Add a time-based one-time password credential to this admin account."
      footer={
        <Link href="/mfa/verify" className="font-medium text-brand">
          Back to security
        </Link>
      }
    >
      <form onSubmit={handleStart} className="grid gap-4">
        <FormError message={error} />
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Preparing..." : "Start enrollment"}
        </button>
      </form>
    </FormCard>
  );
}

export function MfaVerifyForm({ enrolled }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!enrolled) {
    return <MfaNotEnrolledCard />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/mfa/verify", { code });
      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Verify with authenticator"
      description="Enter the current 6-digit code to unlock the admin workspace."
      footer={
        <Link href="/mfa/recovery" className="font-medium text-brand">
          Use a recovery code instead
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <div>
          <label htmlFor="mfa-verify-code" className={LABEL_CLASS}>
            6-digit code
          </label>
          <input
            id="mfa-verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            minLength={6}
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={CODE_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
    </FormCard>
  );
}

export function MfaRecoveryForm({ enrolled }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (!enrolled) {
    return <MfaNotEnrolledCard />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/mfa/recovery", { code });
      router.replace("/admin");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Use a recovery code"
      description="Each recovery code works once and unlocks the current session."
      footer={
        <Link href="/mfa/verify" className="font-medium text-brand">
          Back to authenticator verification
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <div>
          <label htmlFor="mfa-recovery-code" className={LABEL_CLASS}>
            Recovery code
          </label>
          <input
            id="mfa-recovery-code"
            type="text"
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Recovering..." : "Use recovery code"}
        </button>
      </form>
    </FormCard>
  );
}
