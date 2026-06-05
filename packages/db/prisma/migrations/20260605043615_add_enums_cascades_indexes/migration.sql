/*
  Warnings:

  - The `status` column on the `Story` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `provider` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'FACEBOOK');

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- DropForeignKey
ALTER TABLE "Chapter" DROP CONSTRAINT "Chapter_storyId_fkey";

-- DropForeignKey
ALTER TABLE "Page" DROP CONSTRAINT "Page_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingProgress" DROP CONSTRAINT "ReadingProgress_storyId_fkey";

-- DropForeignKey
ALTER TABLE "ReadingProgress" DROP CONSTRAINT "ReadingProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "StoryGenre" DROP CONSTRAINT "StoryGenre_storyId_fkey";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "status",
ADD COLUMN     "status" "StoryStatus" NOT NULL DEFAULT 'ONGOING';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "Chapter_storyId_idx" ON "Chapter"("storyId");

-- CreateIndex
CREATE INDEX "Page_chapterId_idx" ON "Page"("chapterId");

-- CreateIndex
CREATE INDEX "ReadingProgress_userId_idx" ON "ReadingProgress"("userId");

-- CreateIndex
CREATE INDEX "ReadingProgress_chapterId_idx" ON "ReadingProgress"("chapterId");

-- CreateIndex
CREATE INDEX "StoryGenre_genre_idx" ON "StoryGenre"("genre");

-- AddForeignKey
ALTER TABLE "StoryGenre" ADD CONSTRAINT "StoryGenre_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingProgress" ADD CONSTRAINT "ReadingProgress_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
