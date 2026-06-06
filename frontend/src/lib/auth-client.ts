import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  plugins: [], // Add plugins here if needed
});

export const { signIn, signUp, signOut, useSession } = authClient;
