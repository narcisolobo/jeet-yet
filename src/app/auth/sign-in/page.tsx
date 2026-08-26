"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SignInForm from "@/views/sign-in/sign-in-form";
import { useAuth } from "@/hooks/use-auth";

function SignInPage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();

  useEffect(() => {
    if (loading || profileLoading || !user) return;
    router.replace(profile?.handle ? "/dashboard" : "/onboarding");
  }, [loading, profileLoading, user, profile, router]);

  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <SignInForm />
      </div>
    </section>
  );
}

export default SignInPage;
