-- AlterTable
ALTER TABLE "Budget" ADD COLUMN "managedAutomatically" BOOLEAN NOT NULL DEFAULT false;

-- Crea indice per ottimizzare query sui budget gestiti automaticamente
CREATE INDEX "Budget_userId_managedAutomatically_idx" ON "Budget"("userId", "managedAutomatically");
