import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authEnabled, signupsOpen } from "@/lib/auth/users";
import { maybeUser } from "@/lib/auth/current";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell, safeNext } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (!authEnabled()) redirect("/");
  let signedIn = false;
  try {
    signedIn = !!(await maybeUser());
  } catch {
    signedIn = false;
  }
  if (signedIn) redirect(next);

  const nextQs = next === "/" ? "" : `?next=${encodeURIComponent(next)}`;
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep learning, petit à petit."
      footer={signupsOpen() ? <>New here? <Link href={`/signup${nextQs}`} className="font-medium text-primary underline-offset-4 hover:underline">Create an account</Link></> : undefined}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
