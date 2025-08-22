-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "main" VARCHAR(32) NOT NULL,
    "subcategoryId" TEXT,
    "period" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "style" TEXT NOT NULL DEFAULT 'FIXED',
    "pctOfIncome" DECIMAL(5,2),
    "rollover" BOOLEAN NOT NULL DEFAULT false,
    "capType" TEXT,
    "notes" TEXT,
    "overrideChildren" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Budget_userId_period_idx" ON "Budget"("userId", "period");

-- CreateIndex
CREATE INDEX "Budget_userId_main_idx" ON "Budget"("userId", "main");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_userId_main_subcategoryId_period_key" ON "Budget"("userId", "main", "subcategoryId", "period");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
