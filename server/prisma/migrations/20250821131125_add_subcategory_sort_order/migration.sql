-- AlterTable
ALTER TABLE "Subcategory" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Subcategory_userId_categoryId_sortOrder_idx" ON "Subcategory"("userId", "categoryId", "sortOrder");
