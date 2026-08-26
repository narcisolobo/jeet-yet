"use client";

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
import Link from "next/link";

function getInitials(user: User): string {
  const source = user.displayName ?? user.email ?? "";
  return source.slice(0, 2).toUpperCase();
}

const navItems = [
  { href: "/recipes", label: "Community Recipes" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

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
          <UserCircle className="size-8" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-auto min-w-56 whitespace-nowrap"
      >
        {navItems.map(({ href, label }) => (
          <DropdownMenuItem key={href} render={<Link href={href} />}>
            {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOutUser}>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserAvatarButton };
