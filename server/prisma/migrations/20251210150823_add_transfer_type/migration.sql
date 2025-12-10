-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('ALLOCATE', 'SAVING', 'INTERNAL');

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN     "transferType" "TransferType" NOT NULL DEFAULT 'INTERNAL';

-- CreateIndex
CREATE INDEX "Transfer_userId_transferType_idx" ON "Transfer"("userId", "transferType");
