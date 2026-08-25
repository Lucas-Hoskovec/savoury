"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "savoury_consent";

type ConsentChoice = "accepted" | "refused";

function readConsentFromCookie(): ConsentChoice | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=([^;]*)`));
  return m && (m[1] === "accepted" || m[1] === "refused") ? (m[1] as ConsentChoice) : null;
}

let cachedConsent: ConsentChoice | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): ConsentChoice | null {
  if (typeof document !== "undefined") cachedConsent = readConsentFromCookie();
  return cachedConsent;
}

function getServerSnapshot(): ConsentChoice | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setConsentCookie(choice: ConsentChoice) {
  const maxAge = choice === "accepted" ? 60 * 60 * 24 * 180 : 60 * 60 * 24 * 365;
  document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function updateConsentMode(choice: ConsentChoice) {
  const state = choice === "accepted" ? "granted" : "denied";
  const gtag = (window as Window & { gtag?: (command: string, ...args: unknown[]) => void }).gtag;
  gtag?.("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}

export function CookieBanner() {
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (consent !== null) return null;

  function handleChoice(choice: ConsentChoice) {
    setConsentCookie(choice);
    updateConsentMode(choice);
    cachedConsent = choice;
    listeners.forEach((listener) => listener());
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <div className="mx-auto flex max-w-[935px] flex-col items-start gap-4 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          Nous utilisons des cookies pour assurer le fonctionnement du site et, avec ton
          consentement, pour mesurer notre audience et diffuser des annonces.{" "}
          <Link href="/privacy" className="font-semibold text-primary hover:underline">
            En savoir plus
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => handleChoice("refused")}>
            Tout refuser
          </Button>
          <Button size="sm" onClick={() => handleChoice("accepted")}>
            Tout accepter
          </Button>
        </div>
      </div>
    </div>
  );
}