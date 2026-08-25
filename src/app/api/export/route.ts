import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s: string;
  if (value instanceof Date) s = value.toISOString();
  else if (Array.isArray(value))
    s = value.map((v) => (typeof v === "object" && v !== null ? JSON.stringify(v) : String(v))).join(" | ");
  else if (typeof value === "object") s = JSON.stringify(value);
  else s = String(value);
  if (/[;"\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [headers.join(";"), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(";"))];
  return "\uFEFF" + lines.join("\r\n");
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      email: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      recipes: {
        orderBy: { createdAt: "asc" },
        select: {
          title: true,
          description: true,
          imageUrl: true,
          ingredients: true,
          steps: true,
          prepTime: true,
          cookTime: true,
          servings: true,
          category: true,
          views: true,
          createdAt: true,
          _count: { select: { likes: true, comments: true } },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        select: { body: true, createdAt: true, recipe: { select: { title: true } } },
      },
      likes: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, recipe: { select: { title: true } } },
      },
      savedRecipes: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, recipe: { select: { title: true } } },
      },
      following: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, following: { select: { username: true } } },
      },
      followers: {
        orderBy: { createdAt: "asc" },
        select: { createdAt: true, follower: { select: { username: true } } },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          body: true,
          imageUrl: true,
          editedAt: true,
          createdAt: true,
          conversation: {
            select: { userA: { select: { username: true } }, userB: { select: { username: true } } },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
  }

  const zip = new JSZip();

  zip.file(
    "profil.csv",
    toCsv([
      {
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        dateInscription: user.createdAt,
      },
    ])
  );

  zip.file(
    "recettes.csv",
    toCsv(
      user.recipes.map((r) => ({
        titre: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        ingredients: r.ingredients,
        etapes: r.steps,
        tempsPreparation: r.prepTime,
        tempsCuisson: r.cookTime,
        portions: r.servings,
        categorie: r.category,
        vues: r.views,
        dateCreation: r.createdAt,
        nombreDeJaims: r._count.likes,
        nombreDeCommentaires: r._count.comments,
      }))
    )
  );

  zip.file(
    "commentaires.csv",
    toCsv(
      user.comments.map((c) => ({
        recette: c.recipe.title,
        contenu: c.body,
        dateCreation: c.createdAt,
      }))
    )
  );

  zip.file(
    "jaims.csv",
    toCsv(user.likes.map((l) => ({ recette: l.recipe.title, dateCreation: l.createdAt })))
  );

  zip.file(
    "enregistrements.csv",
    toCsv(
      user.savedRecipes.map((s) => ({ recette: s.recipe.title, dateCreation: s.createdAt }))
    )
  );

  zip.file(
    "abonnements.csv",
    toCsv(user.following.map((f) => ({ username: f.following.username, dateCreation: f.createdAt })))
  );

  zip.file(
    "abonnes.csv",
    toCsv(user.followers.map((f) => ({ username: f.follower.username, dateCreation: f.createdAt })))
  );

  zip.file(
    "messages.csv",
    toCsv(
      user.messages.map((m) => ({
        destinataire:
          m.conversation.userA.username === user.username
            ? m.conversation.userB.username
            : m.conversation.userA.username,
        contenu: m.body,
        imageUrl: m.imageUrl,
        dateModification: m.editedAt,
        dateCreation: m.createdAt,
      }))
    )
  );

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="savoury-donnees-${user.username}.zip"`,
    },
  });
}
