import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Handles every request to /api/auth/* (sign up, sign in, sign out, session).
export const { GET, POST } = toNextJsHandler(auth);
