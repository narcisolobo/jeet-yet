"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google-icon";
import { useAuth } from "@/hooks/use-auth";
import { UserCircle } from "lucide-react";
import Image from "next/image";

function SignInForm() {
  const { user, loading, signInWithGoogle, signOutUser } = useAuth();

  return (
    <Card className="min-w-[360]">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Sign in with Google to begin.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : user ? (
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt=""
                width={32}
                height={32}
                className="size-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserCircle className="size-8 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {user.displayName ?? user.email}
            </p>
          </div>
        ) : (
          <Button variant="outline" onClick={signInWithGoogle}>
            <GoogleIcon />
            Sign in with Google
          </Button>
        )}
      </CardContent>
      <CardFooter>
        {user ? (
          <Button variant="outline" onClick={signOutUser}>
            Sign out
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export default SignInForm;
