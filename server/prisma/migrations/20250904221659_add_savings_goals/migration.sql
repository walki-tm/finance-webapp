/*
  Warnings:

  - You are about to drop the `DashboardCategoryVisibility` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DashboardCategoryVisibility" DROP CONSTRAINT "DashboardCategoryVisibility_userId_fkey";

-- DropTable
DROP TABLE "DashboardCategoryVisibility";

-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "targetAmount" DECIMAL(20,2) NOT NULL,
    "currentAmount" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "categoryMain" VARCHAR(32) NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "notes" TEXT,
    "iconKey" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "type" TEXT NOT NULL,
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_status_idx" ON "SavingsGoal"("userId", "status");

-- CreateIndex
CREATE INDEX "SavingsGoal_userId_targetDate_idx" ON "SavingsGoal"("userId", "targetDate");

-- CreateIndex
CREATE INDEX "SavingsGoal_subcategoryId_idx" ON "SavingsGoal"("subcategoryId");

-- CreateIndex
CREATE INDEX "GoalTransaction_userId_goalId_idx" ON "GoalTransaction"("userId", "goalId");

-- CreateIndex
CREATE INDEX "GoalTransaction_goalId_createdAt_idx" ON "GoalTransaction"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "GoalTransaction_transactionId_idx" ON "GoalTransaction"("transactionId");

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTransaction" ADD CONSTRAINT "GoalTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalTransaction" ADD CONSTRAINT "GoalTransaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
