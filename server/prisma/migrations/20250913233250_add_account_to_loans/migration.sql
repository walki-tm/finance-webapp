-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE INDEX "Loan_accountId_idx" ON "Loan"("accountId");

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
