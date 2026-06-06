"use client";

import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "../lib/apollo-client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        {children}
      </ThemeProvider>
    </ApolloProvider>
  );
}
