-- CreateTable
CREATE TABLE "AiRecipe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "ingredients" TEXT[] NOT NULL,
    "steps" TEXT[] NOT NULL,
    "prepTime" INTEGER,
    "servings" INTEGER,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRecipe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiRecipe_userId_createdAt_idx" ON "AiRecipe"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AiRecipe" ADD CONSTRAINT "AiRecipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
