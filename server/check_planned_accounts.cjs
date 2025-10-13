const { PrismaClient } = require('@prisma/client');

async function checkPlannedTransactionAccounts() {
  const prisma = new PrismaClient();
  
  try {
    // Find an example planned transaction
    const plannedTx = await prisma.plannedTransaction.findFirst({
      where: { User: { email: 'm.venezia02@outlook.it' } },
      select: { id: true, title: true, accountId: true }
    });
    console.log('Example planned transaction:', plannedTx);
    
    // Count transactions with and without accountId
    const countWithAccount = await prisma.plannedTransaction.count({
      where: { 
        User: { email: 'm.venezia02@outlook.it' },
        accountId: { not: null }
      }
    });
    
    const totalCount = await prisma.plannedTransaction.count({
      where: { User: { email: 'm.venezia02@outlook.it' } }
    });
    
    console.log('Planned transactions with accountId:', countWithAccount + '/' + totalCount);
    
    // Show all planned transactions
    const allPlanned = await prisma.plannedTransaction.findMany({
      where: { User: { email: 'm.venezia02@outlook.it' } },
      select: { id: true, title: true, accountId: true, amount: true }
    });
    
    console.log('All planned transactions:');
    allPlanned.forEach(tx => {
      console.log('- ' + (tx.title || 'No title') + ': accountId=' + (tx.accountId || 'NULL'));
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlannedTransactionAccounts();