"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleSave } from "@/actions/interactions";

export function useSave(recipeId: string, initialSaved: boolean) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSave(recipeId);
      if ("error" in res) {
        setSaved(!next);
        toast.error(res.error);
        if (res.error === "Connecte-toi pour enregistrer") router.push("/login");
      } else {
        setSaved(res.saved);
      }
    });
  }

  return { saved, pending, toggle };
}