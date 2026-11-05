//* Libraries imports
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

//* Components imports
import { SignInForm } from "@/components/auth/sign-in-form";

//* Local imports
import { auth } from "@/lib/auth";
import { safeDestination } from "@/lib/auth-destination";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Meawstory account.",
};

type SignInPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignInPage(props: SignInPageProps) {
  const [searchParams, session] = await Promise.all([
    props.searchParams,
    auth.api.getSession({
      headers: await headers(),
    }),
  ]);
  const destination = safeDestination(searchParams.next);

  if (session) {
    redirect(destination);
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignInForm destination={destination} />
    </div>
  );
}
