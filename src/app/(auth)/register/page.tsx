import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage() {
  const session = await getSession();
  if (session.userId) redirect("/");

  return <RegisterForm />;
}