"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

function ProfilePage() {
  const router = useRouter();
  const { user, loading, profile, profileLoading } = useAuth();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace("/auth/sign-in");
    } else if (!profile?.handle) {
      router.replace("/onboarding");
    }
  }, [loading, profileLoading, user, profile, router]);

  return (
    <section className="flex flex-1 items-center">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="text-2xl">Profile</h1>
      </div>
    </section>
  );
}

export default ProfilePage;
