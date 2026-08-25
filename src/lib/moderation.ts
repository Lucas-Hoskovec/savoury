import { prisma } from "@/lib/prisma";

export const REPORT_REASONS = [
  "Spam",
  "Contenu inapproprié",
  "Harcèlement",
  "Usurpation d'identité",
  "Autre",
] as const;

export const BLOCKED_WORDS = [
  "pute",
  "putain",
  "salope",
  "connard",
  "connasse",
  "enculé",
  "enculé",
  "enculer",
  "pd",
  "pédé",
  "négro",
  "bicot",
  "bougnoule",
  "tarlouze",
  "salaud",
  "sale con",
  "abruti",
  "crétin",
  "idiot",
  "fdp",
  "ntm",
  "tg",
  "batard",
  "bâtard",
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

export function hasBlockedContent(text: string): boolean {
  const normalized = normalize(text);
  return BLOCKED_WORDS.some((word) => {
    const nw = normalize(word);
    return nw.length > 2
      ? new RegExp(`(^|\\s)${nw}(\\s|$)`, "u").test(normalized)
      : normalized.includes(nw);
  });
}

export const BLOCKED_CONTENT_MESSAGE = "Contenu inapproprié détecté, impossible de publier.";

const REPORT_RETENTION_DAYS = 365;

export async function purgeExpiredReports(): Promise<number> {
  const cutoff = new Date(Date.now() - REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const result = await prisma.report.deleteMany({ where: { createdAt: { lt: cutoff } } });
    return result.count;
  } catch {
    return 0;
  }
}