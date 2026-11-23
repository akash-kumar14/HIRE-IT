"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJson, resolveNextPath } from "@/lib/ui/auth-forms.js";
import {
  BUTTON_CLASS,
  FormCard,
  FormError,
  INPUT_CLASS,
  LABEL_CLASS,
} from "@/components/auth/form-ui.js";

export function LoginForm({ next }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/login", { email, password });
      router.replace(resolveNextPath(next));
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Sign in"
      description="Access your HIRE-IT workspace."
      footer={
        <>
          Need an account?{" "}
          <Link href="/register" className="font-medium text-brand">
            Create one
          </Link>
          .{" "}
          <Link href="/password-reset" className="font-medium text-brand">
            Forgot password?
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <div>
          <label htmlFor="login-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="login-password" className={LABEL_CLASS}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </FormCard>
  );
}

export function RegisterForm({ next }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/register", {
        fullName,
        email,
        phone,
        password,
      });
      router.replace(resolveNextPath(next));
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
      setPending(false);
    }
  }

  return (
    <FormCard
      title="Create account"
      description="Describe tasks and compare verified offers."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-medium text-brand">
            Sign in
          </Link>
          .
        </>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <div>
          <label htmlFor="register-name" className={LABEL_CLASS}>
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="register-email" className={LABEL_CLASS}>
            Email
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="register-phone" className={LABEL_CLASS}>
            Phone (optional)
          </label>
          <input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="register-password" className={LABEL_CLASS}>
            Password
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Creating account..." : "Create account"}
        </button>
      </form>
    </FormCard>
  );
}

export function LogoutForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      await postJson("/api/v1/auth/logout", {});
    } catch (submitError) {
      setError(submitError.message);
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <FormCard title="Sign out" description="End your session on this device.">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormError message={error} />
        <button type="submit" disabled={pending} className={BUTTON_CLASS}>
          {pending ? "Signing out..." : "Sign out"}
        </button>
      </form>
    </FormCard>
  );
}
