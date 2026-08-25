"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccount } from "@/actions/auth";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function DeleteAccountButton() {
  const router = useRouter();

  async function handleDelete() {
    const ok = window.confirm(
      "Supprimer définitivement ton compte et toutes tes données (recettes, commentaires, messages) ? Cette action est irréversible."
    );
    if (!ok) return;
    const res = await deleteAccount();
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenuItem
      className="text-destructive focus:text-destructive"
      onSelect={(e) => {
        e.preventDefault();
        handleDelete();
      }}
    >
      <Trash2 className="mr-2 size-4" />
      Supprimer mon compte
    </DropdownMenuItem>
  );
}