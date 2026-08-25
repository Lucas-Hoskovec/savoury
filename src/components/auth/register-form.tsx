"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { register, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4">
      {state.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input id="username" name="username" autoComplete="username" maxLength={20} required />
        <p className="text-xs text-muted-foreground">3 à 20 caractères — lettres, chiffres, _ et .</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <Button type="submit" disabled={pending} className="w-full rounded-full">
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Créer mon compte
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Connecte-toi
        </Link>
      </p>
    </form>
  );
}