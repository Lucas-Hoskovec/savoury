"use client";

import { useRouter } from "next/navigation";
import { Bookmark, Download, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user-avatar";
import { DeleteAccountButton } from "@/components/delete-account-button";

type Props = {
  user: {
    username: string;
    avatarUrl: string | null;
  };
};

export function UserMenu({ user }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full transition-opacity hover:opacity-80" aria-label="Menu du compte">
          <UserAvatar username={user.username} src={user.avatarUrl} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="font-display text-sm font-semibold">@{user.username}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/users/${user.username}`}>
            <UserRound className="mr-2 size-4" />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/saved">
            <Bookmark className="mr-2 size-4" />
            Recettes enregistrées
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/privacy">
            <ShieldCheck className="mr-2 size-4" />
            Confidentialité
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/export" download>
            <Download className="mr-2 size-4" />
            Télécharger mes données
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteAccountButton />
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-2 size-4" />
            Se déconnecter
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}