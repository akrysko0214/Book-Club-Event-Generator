import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

// Used in the browser to sign up, sign in, sign out and manage billing.
export const authClient = createAuthClient({
  plugins: [stripeClient({ subscription: true })],
});
