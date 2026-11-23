import { LoginForm } from "@/components/auth/account-forms.js";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;

  return <LoginForm next={params?.next} />;
}
