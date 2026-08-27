"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SignUpForm from "@/views/sign-up/sign-up-form";
import { useAuth } from "@/hooks/use-auth";

function SignUpPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading, sessionSyncing } = useAuth();

  useEffect(() => {
    if (loading || profileLoading || sessionSyncing || !user) return;
    router.replace(profile?.handle ? "/dashboard" : "/onboarding");
  }, [loading, profileLoading, sessionSyncing, user, profile, router]);

  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <SignUpForm />
      </div>
    </section>
  );
}

export default SignUpPage;
