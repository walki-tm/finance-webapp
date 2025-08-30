/*
  Warnings:

  - You are about to drop the column `endDate` on the `PlannedTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PlannedTransaction" DROP COLUMN "endDate",
ADD COLUMN     "appliedToBudget" BOOLEAN NOT NULL DEFAULT false;
