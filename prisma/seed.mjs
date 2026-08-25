import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMAGES = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&q=80",
  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1200&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80",
  "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80",
  "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200&q=80",
  "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=1200&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&q=80",
];

const USERS = [
  {
    username: "chef_lisa",
    email: "lisa@savoury.app",
    bio: "Pâtissière passionnée 🥐 — 15 ans d'amour pour la pâte feuilletée.",
  },
  {
    username: "mamie_odette",
    email: "odette@savoury.app",
    bio: "Les recettes de famille depuis 1962. Rien ne bat un bon plat mijoté.",
  },
  {
    username: "fit_nutrition",
    email: "fit@savoury.app",
    bio: "Repas équilibrés, rapides et qui ont du goût. Sans sucres inutiles.",
  },
  {
    username: "foodie_paris",
    email: "paris@savoury.app",
    bio: "Toutes les adresses et recettes qui font saliver la capitale.",
  },
];

const RECIPES = [
  {
    title: "Buddha bowl du chef",
    description:
      "Un bol coloré, complet et ultra frais : quinoa, légumes rôtis, avocat et sauce tahini.",
    image: IMAGES[0],
    category: "Plat",
    ingredients: [
      "150 g de quinoa",
      "1 avocat",
      "1 patate douce",
      "100 g de pois chiches rôtis",
      "2 c. à s. de tahini",
      "Jus d'un citron",
    ],
    steps: [
      "Cuire le quinoa selon les indications du paquet.",
      "Rôtir la patate douce en dés à 200°C pendant 25 min.",
      "Griller les pois chiches avec un filet d'huile et du paprika.",
      "Mélanger tahini, citron et un peu d'eau pour la sauce.",
      "Dresser tous les éléments dans un bol et verser la sauce.",
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 2,
  },
  {
    title: "Pancakes moelleux du dimanche",
    description: "La recette impossible à rater pour des brunchs réussis.",
    image: IMAGES[1],
    category: "Petit-déjeuner",
    ingredients: [
      "250 g de farine",
      "2 œufs",
      "300 ml de lait",
      "1 sachet de levure",
      "2 c. à s. de sucre",
      "Une pincée de sel",
    ],
    steps: [
      "Mélanger farine, levure, sucre et sel dans un saladier.",
      "Ajouter œufs et lait, fouetter jusqu'à obtenir une pâte lisse.",
      "Cuire 2 min par face dans une poêle légèrement huilée.",
      "Servir avec sirop d'érable et fruits frais.",
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 4,
  },
  {
    title: "Pizza margherita maison",
    description: "Une pâte fine et croustillante, une sauce tomate onctueuse.",
    image: IMAGES[2],
    category: "Plat",
    ingredients: [
      "300 g de farine",
      "180 ml d'eau tiède",
      "1 c. à c. de levure sèche",
      "200 g de sauce tomate",
      "1 boule de mozzarella",
      "Basilic frais",
    ],
    steps: [
      "Pétrir farine, eau, levure et sel, laisser reposer 1 h.",
      "Étaler la pâte en cercle fin.",
      "Étaler la sauce tomate et la mozzarella.",
      "Cuire à 250°C pendant 10-12 min.",
      "Ajouter le basilic à la sortie du four.",
    ],
    prepTime: 20,
    cookTime: 12,
    servings: 2,
  },
  {
    title: "Poulet rôti & légumes d'hiver",
    description: "Le plat réconfortant qui embaume toute la maison.",
    image: IMAGES[3],
    category: "Plat",
    ingredients: [
      "1 poulet fermier",
      "4 carottes",
      "2 oignons",
      "4 pommes de terre",
      "Romarin, thym",
      "Huile d'olive",
    ],
    steps: [
      "Préchauffer le four à 200°C.",
      "Badigeonner le poulet d'huile d'olive et d'herbes.",
      "Disposer les légumes autour du poulet.",
      "Cuire 1 h 30 en arrosant régulièrement.",
    ],
    prepTime: 15,
    cookTime: 90,
    servings: 6,
  },
  {
    title: "Bol de riz au saumon teriyaki",
    description: "Rapide, sain, et incroyablement savoureux.",
    image: IMAGES[4],
    category: "Plat",
    ingredients: [
      "200 g de riz",
      "2 pavés de saumon",
      "4 c. à s. de sauce soja",
      "2 c. à s. de miel",
      "1 gousse d'ail",
      "Sésame",
    ],
    steps: [
      "Cuire le riz.",
      "Mélanger soja, miel et ail écrasé pour la sauce.",
      "Cuire le saumon à la poêle, puis ajouter la sauce.",
      "Servir sur le riz avec le sésame.",
    ],
    prepTime: 5,
    cookTime: 15,
    servings: 2,
  },
  {
    title: "Tarte aux pommes dorée",
    description: "Le dessert signature de mamie : pâte sablée, compotée et éclats de sucre.",
    image: IMAGES[9],
    category: "Dessert",
    ingredients: [
      "1 pâte sablée",
      "4 pommes",
      "2 c. à s. de sucre roux",
      "1 noix de beurre",
      "Cannelle",
    ],
    steps: [
      "Foncer la pâte dans un moule à tarte.",
      "Éplucher et couper les pommes en lamelles.",
      "Disposer en rosace, parsemer de sucre et de cannelle.",
      "Cuire 35 min à 180°C.",
    ],
    prepTime: 15,
    cookTime: 35,
    servings: 6,
  },
  {
    title: "Avocado toast façon bistrot",
    description: "Trois ingrédients, un résultat qui déchire.",
    image: IMAGES[10],
    category: "Petit-déjeuner",
    ingredients: [
      "2 tranches de pain au levain",
      "1 avocat mûr",
      "Jus de citron",
      "Flocons de piment",
      "Œuf poché (option)",
    ],
    steps: [
      "Griller le pain.",
      "Écraser l'avocat avec le citron.",
      "Étaler généreusement sur le pain.",
      "Terminer avec le piment et l'œuf poché.",
    ],
    prepTime: 5,
    cookTime: 5,
    servings: 2,
  },
  {
    title: "Salade de quinoa & grenade",
    description: "Frais, croquant, parfait pour les lunchboxes.",
    image: IMAGES[6],
    category: "Végétarien",
    ingredients: [
      "150 g de quinoa",
      "1/2 grenade",
      "1 concombre",
      "Menthe fraîche",
      "Feta",
      "Huile d'olive",
    ],
    steps: [
      "Cuire le quinoa et laisser refroidir.",
      "Détailler le concombre et la grenade.",
      "Mélanger le tout avec la menthe ciselée.",
      "Ajouter la feta et l'huile d'olive.",
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
  },
  {
    title: "Risotto crémeux aux champignons",
    description: "Le plat réconfortant par excellence.",
    image: IMAGES[7],
    category: "Plat",
    ingredients: [
      "300 g de riz arborio",
      "1 L de bouillon de légumes",
      "250 g de champignons",
      "1 oignon",
      "40 g de parmesan",
      "Beurre",
    ],
    steps: [
      "Faire revenir l'oignon émincé dans le beurre.",
      "Ajouter le riz et le nacrer 2 min.",
      "Verser le bouillon louche par louche en remuant.",
      "Ajouter les champignons et le parmesan en fin de cuisson.",
    ],
    prepTime: 10,
    cookTime: 25,
    servings: 4,
  },
  {
    title: "Bowl de patate douce rôtie",
    description: "Simple, coloré et plein de bonnes choses.",
    image: IMAGES[11],
    category: "Végétarien",
    ingredients: [
      "2 patates douces",
      "200 g de lentilles",
      "1 avocat",
      "Yaourt grec",
      "Paprika fumé",
    ],
    steps: [
      "Rôtir les patates douces en cubes à 200°C.",
      "Cuire les lentilles 20 min.",
      "Dresser les patates, les lentilles et l'avocat.",
      "Ajouter une cuillère de yaourt et du paprika.",
    ],
    prepTime: 10,
    cookTime: 25,
    servings: 2,
  },
];

async function main() {
  console.log("🌱 Nettoyage de la base…");
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.recipe.deleteMany();
  await prisma.user.deleteMany();

  console.log("👩‍🍳 Création des utilisateurs…");
  const passwordHash = await bcrypt.hash("password123", 12);
  const users = [];
  for (const u of USERS) {
    const user = await prisma.user.create({ data: { ...u, passwordHash } });
    users.push(user);
  }

  // Quelques follow pour le côté social
  await prisma.follow.createMany({
    data: [
      { followerId: users[1].id, followingId: users[0].id },
      { followerId: users[2].id, followingId: users[0].id },
      { followerId: users[3].id, followingId: users[1].id },
      { followerId: users[0].id, followingId: users[1].id },
    ],
  });

  console.log("🍽️  Création des recettes…");
  const created = [];
  for (let i = 0; i < RECIPES.length; i++) {
    const r = RECIPES[i];
    const author = users[i % users.length];
    const recipe = await prisma.recipe.create({
      data: {
        authorId: author.id,
        title: r.title,
        description: r.description,
        imageUrl: r.image,
        ingredients: r.ingredients,
        steps: r.steps,
        prepTime: r.prepTime,
        cookTime: r.cookTime,
        servings: r.servings,
        category: r.category,
      },
    });
    created.push(recipe);
  }

  console.log("❤️  Ajout de likes…");
  const likeData = [];
  for (const recipe of created) {
    for (const user of users) {
      if (Math.random() > 0.4) {
        likeData.push({ userId: user.id, recipeId: recipe.id });
      }
    }
  }
  await prisma.like.createMany({ data: likeData });

  console.log("💬 Ajout de commentaires…");
  const commentBank = [
    "Hmm, je teste ça ce week-end !",
    "La photo donne trop faim 🤤",
    "Recette approuvée par toute la famille.",
    "J'ai remplacé le sucre par du miel, c'est encore meilleur.",
    "Merci pour le partage, c'est devenu un classique chez nous !",
  ];
  for (const recipe of created.slice(0, 6)) {
    for (const user of users.slice(0, 3)) {
      await prisma.comment.create({
        data: {
          recipeId: recipe.id,
          userId: user.id,
          body: commentBank[Math.floor(Math.random() * commentBank.length)],
        },
      });
    }
  }

  console.log("✅ Seed terminé !");
  console.log("🔑 Comptes de démo : chef_lisa / mamie_odette / fit_nutrition / foodie_paris — mot de passe : password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());