import { RegisterForm } from "@/components/auth/account-forms.js";

export default async function RegisterPage({ searchParams }) {
  const params = await searchParams;

  return <RegisterForm next={params?.next} />;
}
