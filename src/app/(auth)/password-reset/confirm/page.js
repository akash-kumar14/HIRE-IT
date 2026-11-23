import { PasswordResetConfirmForm } from "@/components/auth/verification-forms.js";
import { readSearchParam } from "@/lib/ui/auth-forms.js";

export default async function PasswordResetConfirmPage({ searchParams }) {
  const params = await searchParams;
  const token = readSearchParam(params?.token);

  return <PasswordResetConfirmForm token={token} />;
}
