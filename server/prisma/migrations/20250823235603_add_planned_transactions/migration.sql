-- CreateTable
CREATE TABLE "TransactionGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT,
    "main" VARCHAR(32) NOT NULL,
    "subId" TEXT,
    "amount" DECIMAL(20,2) NOT NULL,
    "note" TEXT,
    "payee" TEXT,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "confirmationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannedTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransactionGroup_userId_sortOrder_idx" ON "TransactionGroup"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionGroup_userId_name_key" ON "TransactionGroup"("userId", "name");

-- CreateIndex
CREATE INDEX "PlannedTransaction_userId_nextDueDate_idx" ON "PlannedTransaction"("userId", "nextDueDate");

-- CreateIndex
CREATE INDEX "PlannedTransaction_userId_frequency_idx" ON "PlannedTransaction"("userId", "frequency");

-- CreateIndex
CREATE INDEX "PlannedTransaction_groupId_idx" ON "PlannedTransaction"("groupId");

-- AddForeignKey
ALTER TABLE "TransactionGroup" ADD CONSTRAINT "TransactionGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TransactionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_subId_fkey" FOREIGN KEY ("subId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
