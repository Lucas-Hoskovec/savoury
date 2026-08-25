# Savoury 🍴

Réseau social culinaire façon **Instagram** : partage tes recettes sur un feed, aime-les, commente-les et suis les gourmands qui t'inspirent.

## Fonctionnalités

- **Feed style Instagram** : colonne unique, cartes de recette (avatar, photo 1:1, actions), like animé avec **double-tap** sur l'image, chargement infini, skeleton au chargement, sidebar « Suggestions pour vous » sur desktop
- **Recettes** : création avec upload d'image, ingrédients, étapes, temps, portions, catégorie
- **Interactions** : likes, commentaires, follow, partage (copie de lien)
- **Profils** : photo de profil personnalisable (clique sur ta photo pour la changer ou la supprimer), bio, grille de recettes, stats abonnés/abonnements
- **Explorer** : grille de recettes filtrable par catégorie
- **Comptes** : inscription / connexion par email & mot de passe (sessions chiffrées)
- **Thème clair / sombre**, accessible (WCAG), responsive mobile-first avec barre de navigation basse

## Stack

| Rôle | Techno |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui + Lucide |
| ORM | Prisma 6 |
| Base de données | PostgreSQL (Supabase en local · Render en prod) |
| Stockage images | Supabase Storage (bucket `recipe-images`) |
| Auth | iron-session (cookies chiffrés) + bcryptjs |

## Design system

Le design system (palette « neutre + accents chauds », typographie Playfair Display + Karla, règles UI/UX) est généré et persisté dans [`design-system/savoury/MASTER.md`](design-system/savoury/MASTER.md).

## Démarrage en local

### 1. Créer le projet Supabase

1. Rends-toi sur [supabase.com](https://supabase.com) → **New project** (gratuit)
2. Dans **Settings → Database**, récupère la **Connection string** (PostgreSQL, mode direct) → servira de `DATABASE_URL`
3. Dans **Settings → API**, récupère :
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement, jamais exposée)
4. Dans **Storage → New bucket**, crée le bucket `recipe-images` en mode **public**, puis le bucket `user-avatars` en mode **public** — ou lance `npm run db:ensure-buckets` (après avoir configuré `.env`) pour les créer automatiquement

### 2. Configurer l'environnement

```bash
cp .env.example .env
```

Puis remplis `.env` avec tes valeurs.

### 3. Installer, migrer, seeder, lancer

```bash
npm install
npm run db:migrate    # applique les migrations PostgreSQL
npm run db:seed       # données de démo (optionnel)
npm run dev           # http://localhost:3000
```

**Comptes de démo** (après seed) : `chef_lisa`, `mamie_odette`, `fit_nutrition`, `foodie_paris` — mot de passe `password123`.

### 4. Vérifications

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Déploiement sur Render

Le fichier [`render.yaml`](render.yaml) est un **Blueprint** : il crée l'app Next.js + une base PostgreSQL.

1. **GitHub** : crée un repo (via le site github.com), puis :
   ```bash
   git init
   git add .
   git commit -m "Savoury : réseau social culinaire"
   git remote add origin https://github.com/<toi>/savoury.git
   git push -u origin main
   ```
2. **Render** : connecte ton compte à GitHub, puis **New + → Blueprint** et choisis le repo `savoury`
   - Render crée le Web Service + la base PostgreSQL, et exécute `prisma migrate deploy` avant chaque déploiement
3. **Variables Supabase** : dans l'onglet **Environment** du service, ajoute les 3 valeurs manquantes :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Redémarre (ou laisse Render redéployer), puis ouvre l'URL `https://savoury.onrender.com`

### Optionnel

- **Seed en production** : connecte-toi à la base Render (Dashboard → Databases → Connect) et lance `npx prisma db seed` depuis le repo en local avec `DATABASE_URL` pointant vers Render.
- **Perf images** : pour éviter que le cache `next/image` se reconstruise à chaque déploiement, ajoute un disque persistant (fonctionnalité payante Render).

## Structure

```
src/
  actions/        # Server Actions (auth, recettes, interactions)
  app/
    (app)/        # Feed, explorer, recettes, profils (+ navbar)
    (auth)/       # Login / inscription
    api/          # Route handlers (feed paginé, upload image)
  components/     # UI (shadcn/ui) + composants métier
  hooks/          # useLike (état partagé feed/détail)
  lib/            # prisma, auth (iron-session), supabase, validation, format
prisma/           # schéma, migrations, seed
design-system/    # design system généré (MASTER.md)
```