import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function calculateSeptemberForecast() {
  try {
    console.log('🔍 CALCOLO FORECAST SETTEMBRE 2025\n');
    
    const allTransactions = await prisma.transaction.findMany({
      select: {
        amount: true,
        date: true
      }
    });
    
    const currentBalance = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log('📊 1. SALDO ATTUALE');
    console.log(   Totale transazioni: );
    console.log(   Saldo attuale: €\n);
    
    const plannedTransactions = await prisma.plannedTransaction.findMany({
      where: { isActive: true }
    });
    
    console.log('📅 2. TRANSAZIONI PIANIFICATE ATTIVE');
    console.log(   Transazioni attive: \n);
    
    if (plannedTransactions.length > 0) {
      console.log('   Dettagli transazioni pianificate:');
      plannedTransactions.forEach((tx, i) => {
        console.log(   . );
        console.log(      - Importo: €);
        console.log(      - Frequenza: );
        console.log(      - Categoria: );
        console.log(      - Prossima scadenza: );
        if (tx.repeatCount) {
          console.log(      - Ripetizioni: / rimanenti);
        }
        console.log('');
      });
    }
    
    console.log('🎯 3. CALCOLO PREVISTO PER SETTEMBRE 2025');
    console.log(   Saldo attuale: €);
    console.log(   + Transazioni pianificate da calcolare...);
    console.log(   = Previsto settembre: da implementare);
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.();
  }
}

calculateSeptemberForecast();
