import type { Metadata } from "next";
import AuthForm from "../auth-form";

export const metadata: Metadata = { title: "Sign in · Book Club Event Generator" };

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
