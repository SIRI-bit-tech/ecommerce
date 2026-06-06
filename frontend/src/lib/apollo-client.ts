import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

// Get token from anywhere we store it (zustand store, cookie, etc.)
// For this architecture, Better Auth manages the cookie automatically
// But we might still need to handle specific errors

const httpLink = new HttpLink({
  uri: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/graphql",
  // Critical: send cookies for Better Auth session
  credentials: "include",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorLink = onError((errorResponse: any) => {
  const { graphQLErrors, networkError } = errorResponse;
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }: { message: string; locations: unknown; path: unknown; extensions?: Record<string, unknown> }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      if (extensions?.code === "UNAUTHENTICATED") {
        // Handle logout / redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// If we needed to attach a Bearer token:
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
