//* Libraries imports
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

//* Components imports
import { SignUpForm } from "@/components/auth/sign-up-form";

//* Local imports
import { auth } from "@/lib/auth";
import { safeDestination } from "@/lib/auth-destination";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Meawstory account.",
};

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

export default async function SignUpPage(props: SignUpPageProps) {
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
      <SignUpForm destination={destination} />
    </div>
  );
}
