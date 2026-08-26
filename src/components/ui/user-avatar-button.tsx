"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "firebase/auth";
import { UserCircle } from "lucide-react";

function getInitials(user: User): string {
  const source = user.displayName ?? user.email ?? "";
  return source.slice(0, 2).toUpperCase();
}

function UserAvatarButton() {
  const { user, loading, signOutUser } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!user || loading}
        render={
          <Button variant="ghost" size="icon-sm" className="rounded-full" />
        }
      >
        {user && !loading ? (
          <Avatar>
            <AvatarImage
              src={user.photoURL ?? undefined}
              alt={user.displayName ?? "User avatar"}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar>
        ) : (
          <UserCircle />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-56 whitespace-nowrap"
      >
        <DropdownMenuItem render={<Link href="/recipes" />}>
          Community Recipes
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/profile" />}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOutUser}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserAvatarButton };
