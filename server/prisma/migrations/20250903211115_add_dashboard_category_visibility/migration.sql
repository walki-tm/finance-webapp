-- CreateTable
CREATE TABLE "DashboardCategoryVisibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardCategoryVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardCategoryVisibility_userId_visible_sortOrder_idx" ON "DashboardCategoryVisibility"("userId", "visible", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardCategoryVisibility_userId_categoryKey_key" ON "DashboardCategoryVisibility"("userId", "categoryKey");

-- AddForeignKey
ALTER TABLE "DashboardCategoryVisibility" ADD CONSTRAINT "DashboardCategoryVisibility_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
