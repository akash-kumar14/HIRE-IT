import {
  EmailVerificationConfirmForm,
  EmailVerificationRequestForm,
} from "@/components/auth/verification-forms.js";
import { readSearchParam } from "@/lib/ui/auth-forms.js";

export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;
  const token = readSearchParam(params?.token);

  if (token) {
    return <EmailVerificationConfirmForm token={token} />;
  }

  return <EmailVerificationRequestForm />;
}
