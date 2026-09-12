import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  fetchOptions: {
    auth: {
      type: "Bearer",
      token: () => {
        if (typeof window !== "undefined") {
          return localStorage.getItem("bearer_token") || "";
        }
        return "";
      },
    },
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken && typeof window !== "undefined") {
        localStorage.setItem("bearer_token", authToken);
      }
    },
    onError: (ctx) => {
      if (ctx.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
      }
    },
  },
});

export const { signIn, useSession, getSession } = authClient;

export const signOut = async (
  options?: Parameters<typeof authClient.signOut>[0],
) => {
  try {
    return await authClient.signOut(options);
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bearer_token");
    }
  }
};
