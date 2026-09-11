import { useState } from "react";
import {
  createFileRoute,
  isRedirect,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { getSession, signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      const { data } = await getSession();

      if (!data?.session) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("bearer_token");
        }
        throw redirect({ to: "/sign-in" });
      }

      return { user: data?.user };
    } catch (err) {
      if (isRedirect(err)) throw err;
      if (typeof window !== "undefined") {
        localStorage.removeItem("bearer_token");
      }
      throw redirect({ to: "/sign-in" });
    }
  },
  component: Index,
});

function Index() {
  const { data } = useSession();
  const navigate = useNavigate();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      await router.invalidate();
      navigate({ to: "/sign-in" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2">
      <h3 className="text">Welcome Home!</h3>
      {data?.session && (
        <Button disabled={loading} onClick={handleSignOut}>
          {loading ? "Signing out..." : "Sign out"}
        </Button>
      )}
    </div>
  );
}
