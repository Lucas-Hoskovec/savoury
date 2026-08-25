"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  action?: string;
};

export function SearchInput({ defaultValue = "", className, placeholder = "Rechercher", action = "/search" }: Props) {
  return (
    <form action={action} method="get" className={cn("relative", className)} role="search">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label="Rechercher des recettes et des comptes"
        className="h-9 rounded-xl bg-secondary pl-9 text-sm"
      />
    </form>
  );
}