//* Libraries imports
import type { Metadata } from "next";

//* Components imports
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Meawstory account.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignUpForm />
    </div>
  );
}
