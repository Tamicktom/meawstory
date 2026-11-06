//* Libraries imports
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { after } from "next/server";

//* Local imports
import * as schema from "@/database/schema";
import { clientEnv } from "@/env/client";
import { productionSiteUrl, publicBaseUrl } from "@/utils/absolute-url";

//* Libraries imports
import { db } from "@/database";

//* Services imports
import { sendEmail } from "@/services/email";
import { passwordResetEmail, verificationEmail } from "@/services/email-templates";

const verificationLinkLifetimeInSeconds = 60 * 60 * 24;

//* Sending after the response keeps the password reset as fast for an unknown email as for a known one.
//* Outside a request, as in the seed and in unit tests, after throws and the promise simply keeps running.
function runAfterResponse(task: Promise<unknown>) {
  try {
    after(() => task);
  } catch {
    return;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  //* Parallel E2E accounts share localhost; keep the production default outside tests.
  rateLimit: process.env.MEAWSTORY_E2E === "1" ? { enabled: false } : undefined,
  baseURL: publicBaseUrl(process.env.VERCEL_ENV, clientEnv.NEXT_PUBLIC_VERCEL_URL),
  //* Sign-in from the public site stays valid when the configured host is a Vercel deployment URL.
  trustedOrigins: [productionSiteUrl],
  advanced: {
    backgroundTasks: { handler: runAfterResponse },
  },
  emailAndPassword: {
    enabled: true,
    //* Signing in stays open to unverified accounts. See docs/v2/fase-0-base/0A-2.
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        passwordResetEmail({ name: user.name, email: user.email, url })
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: verificationLinkLifetimeInSeconds,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail(
        verificationEmail({ name: user.name, email: user.email, url })
      );
    },
  },
});
