import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authEnabled, signupsOpen } from "@/lib/auth/users";
import { maybeUser } from "@/lib/auth/current";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell, safeNext } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Create an account" };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
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
  const signIn = <>Already have an account? <Link href={`/login${nextQs}`} className="font-medium text-primary underline-offset-4 hover:underline">Sign in</Link></>;
  if (!signupsOpen()) {
    return (
      <AuthShell title="Sign-up is closed" subtitle="New accounts can't be created on this site right now." footer={signIn}>
        {null}
      </AuthShell>
    );
  }
  return (
    <AuthShell title="Create your account" subtitle="Pick a language. Your progress is yours alone." footer={signIn}>
      <LoginForm next={next} mode="signup" />
    </AuthShell>
  );
}
