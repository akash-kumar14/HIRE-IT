"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson } from "@/lib/ui/auth-forms.js";
import {
  BUTTON_CLASS,
  FormCard,
  FormError,
  FormNotice,
  INPUT_CLASS,
  LABEL_CLASS,
} from "@/components/auth/form-ui.js";

function MissingToken({ title, description, requestPath }) {
  return (
    <FormCard
      title={title}
      description={description}
      footer={
        <Link href={requestPath} className="font-medium text-brand">
          Request a new link
        </Link>
      }
    >
      <FormError message="This link is missing its token." />
    </FormCard>
  );
}

export function EmailVerificationRequestForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/email-verification", {});
      setMessage("If your account is eligible, a verification email has been queued.");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Verify your email"
      description="Send a fresh verification link to your account email."
      footer={
        <>
          Need to sign in first?{" "}
          <Link href="/login" className="font-medium text-brand">
            Sign in
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <FormNotice>{message}</FormNotice>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Sending..." : "Send verification email"}
        </button>
      </form>
    </FormCard>
  );
}

export function EmailVerificationConfirmForm({ token }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <MissingToken
        title="Verify your email"
        description="Confirm the address on your HIRE-IT account."
        requestPath="/verify-email"
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/email-verification/confirm", { token });
      setMessage("Email verified. You can return to your profile.");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Confirm email"
      description="Complete verification using the link from your email."
      footer={
        <Link href="/me" className="font-medium text-brand">
          Back to profile
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <FormNotice>{message}</FormNotice>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Verifying..." : "Confirm email"}
        </button>
      </form>
    </FormCard>
  );
}

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/password-reset", { email });
      setMessage("If an account exists, a password reset email has been queued.");
      setEmail("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Reset password"
      description="We will email a reset link if the address is registered."
      footer={
        <Link href="/login" className="font-medium text-brand">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <FormNotice>{message}</FormNotice>
        <div>
          <label htmlFor="reset-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </FormCard>
  );
}

export function PasswordResetConfirmForm({ token }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!token) {
    return (
      <MissingToken
        title="Choose a new password"
        description="Set a new password using the link from your email."
        requestPath="/password-reset"
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      await postJson("/api/v1/auth/password-reset/confirm", { token, password });
      setMessage("Password updated. Sign in with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Choose a new password"
      description="Use at least 8 characters for your new password."
      footer={
        <Link href="/login" className="font-medium text-brand">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <FormNotice>{message}</FormNotice>
        <div>
          <label htmlFor="reset-password" className={LABEL_CLASS}>
            New password
          </label>
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className={LABEL_CLASS}>
            Confirm new password
          </label>
          <input
            id="reset-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </FormCard>
  );
}
