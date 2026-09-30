//* Libraries imports
import type { Metadata } from "next";

//* Components imports
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Meawstory account.",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignInForm />
    </div>
  );
}
