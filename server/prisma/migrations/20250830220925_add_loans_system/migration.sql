-- AlterTable
ALTER TABLE "PlannedTransaction" ADD COLUMN     "loanId" TEXT;

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loanType" TEXT NOT NULL,
    "lenderName" TEXT NOT NULL,
    "principalAmount" DECIMAL(20,2) NOT NULL,
    "currentBalance" DECIMAL(20,2) NOT NULL,
    "interestRate" DECIMAL(5,4) NOT NULL,
    "effectiveRate" DECIMAL(5,4),
    "rateType" TEXT NOT NULL DEFAULT 'FIXED',
    "durationMonths" INTEGER NOT NULL,
    "remainingMonths" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "firstPaymentDate" TIMESTAMP(3) NOT NULL,
    "lastPaymentDate" TIMESTAMP(3) NOT NULL,
    "paymentFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "monthlyPayment" DECIMAL(20,2) NOT NULL,
    "additionalCosts" DECIMAL(20,2),
    "description" TEXT,
    "notes" TEXT,
    "categoryMain" VARCHAR(32),
    "subcategoryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "autoCreatePayments" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "paymentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "scheduledAmount" DECIMAL(20,2) NOT NULL,
    "principalAmount" DECIMAL(20,2) NOT NULL,
    "interestAmount" DECIMAL(20,2) NOT NULL,
    "remainingBalance" DECIMAL(20,2) NOT NULL,
    "actualAmount" DECIMAL(20,2),
    "lateFee" DECIMAL(20,2),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_userId_loanType_idx" ON "Loan"("userId", "loanType");

-- CreateIndex
CREATE INDEX "Loan_userId_firstPaymentDate_idx" ON "Loan"("userId", "firstPaymentDate");

-- CreateIndex
CREATE INDEX "Loan_subcategoryId_idx" ON "Loan"("subcategoryId");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_paymentNumber_idx" ON "LoanPayment"("loanId", "paymentNumber");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_dueDate_idx" ON "LoanPayment"("loanId", "dueDate");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_status_idx" ON "LoanPayment"("loanId", "status");

-- CreateIndex
CREATE INDEX "LoanPayment_dueDate_status_idx" ON "LoanPayment"("dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LoanPayment_loanId_paymentNumber_key" ON "LoanPayment"("loanId", "paymentNumber");

-- CreateIndex
CREATE INDEX "PlannedTransaction_loanId_idx" ON "PlannedTransaction"("loanId");

-- AddForeignKey
ALTER TABLE "PlannedTransaction" ADD CONSTRAINT "PlannedTransaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
