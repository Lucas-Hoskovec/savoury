/**
 * Nettoyage des entrées texte : retire les caractères de contrôle et invisibles
 * (C0/C1 sauf \n, zero-width, bidi) qui servent à contourner la modération,
 * usurper des identités ou casser Postgres (octets NUL).
 */
const CONTROL_CHARS =
  // C0 sauf \n (\u000A), DEL, C1
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const INVISIBLE_CHARS = /[\u00AD\u061C\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\uFFF9-\uFFFB]/g;

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "").replace(INVISIBLE_CHARS, "");
}

/** Échappe les jokers LIKE/ILIKE (% _ \) pour une recherche littérale. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
