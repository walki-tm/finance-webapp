import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 ANALISI DATI DATABASE\n');
    
    // 1. Saldo attuale
    const transactions = await prisma.transaction.findMany();
    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    console.log('📊 SALDO ATTUALE:');
    console.log(`   Transazioni totali: ${transactions.length}`);
    console.log(`   Saldo: €${balance.toFixed(2)}\n`);
    
    // 2. Transazioni pianificate
    const planned = await prisma.plannedTransaction.findMany({
      where: { isActive: true }
    });
    
    console.log('📅 TRANSAZIONI PIANIFICATE:');
    console.log(`   Attive: ${planned.length}\n`);
    
    if (planned.length > 0) {
      planned.forEach((tx, i) => {
        console.log(`   ${i+1}. ${tx.title || 'Senza titolo'}`);
        console.log(`      Importo: €${tx.amount}`);
        console.log(`      Frequenza: ${tx.frequency}`);
        console.log(`      Categoria: ${tx.main}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
