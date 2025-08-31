/*
  Warnings:

  - You are about to drop the column `durationMonths` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `firstPaymentDate` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `lastPaymentDate` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the column `remainingMonths` on the `Loan` table. All the data in the column will be lost.
  - You are about to drop the `LoanPayment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LoanPayment" DROP CONSTRAINT "LoanPayment_loanId_fkey";

-- DropIndex
DROP INDEX "Loan_userId_firstPaymentDate_idx";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "durationMonths",
DROP COLUMN "firstPaymentDate",
DROP COLUMN "lastPaymentDate",
DROP COLUMN "remainingMonths",
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "paidPayments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPayments" INTEGER NOT NULL DEFAULT 1;

-- DropTable
DROP TABLE "LoanPayment";

-- CreateTable
CREATE TABLE "LoanTransaction" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "paidDate" TIMESTAMP(3) NOT NULL,
    "totalAmount" DECIMAL(20,2) NOT NULL,
    "principalAmount" DECIMAL(20,2) NOT NULL,
    "interestAmount" DECIMAL(20,2) NOT NULL,
    "lateFee" DECIMAL(20,2),
    "balanceAfterPayment" DECIMAL(20,2) NOT NULL,
    "notes" TEXT,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoanTransaction_loanId_paymentNumber_idx" ON "LoanTransaction"("loanId", "paymentNumber");

-- CreateIndex
CREATE INDEX "LoanTransaction_loanId_paidDate_idx" ON "LoanTransaction"("loanId", "paidDate");

-- CreateIndex
CREATE INDEX "LoanTransaction_paidDate_idx" ON "LoanTransaction"("paidDate");

-- CreateIndex
CREATE UNIQUE INDEX "LoanTransaction_loanId_paymentNumber_key" ON "LoanTransaction"("loanId", "paymentNumber");

-- CreateIndex
CREATE INDEX "Loan_userId_nextPaymentDate_idx" ON "Loan"("userId", "nextPaymentDate");

-- AddForeignKey
ALTER TABLE "LoanTransaction" ADD CONSTRAINT "LoanTransaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
