/**
 * Script per analizzare le transazioni TRASFERIMENTO esistenti
 * Prima della migrazione al nuovo sistema transfers
 */

import { prisma } from './src/lib/prisma.js';

async function analyzeTransfers() {
  try {
    // Lista tutti gli utenti
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log('👥 All users in system:');
    users.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.email} - ${user.name} (ID: ${user.id})`);
    });
    
    // Cerca l'utente con email che contiene "venezia" o "michele"
    const user = users.find(u => 
      u.email.toLowerCase().includes('venezia') || 
      u.email.toLowerCase().includes('michele') ||
      u.name.toLowerCase().includes('michele')
    );
    
    if (!user) {
      console.log('❌ Target user not found');
      return;
    }
    
    console.log('✅ Analyzing user:', user.email, '-', user.name, '(ID:', user.id + ')');
    
    // Cerca tutte le categorie per debug
    const allCategories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { main: 'asc' }
    });
    
    console.log('📋 All user categories:');
    allCategories.forEach((cat, i) => {
      console.log(`   ${i+1}. ${cat.main} - ${cat.name} (ID: ${cat.id})`);
    });
    
    // Cerca categoria TRASFERIMENTO con ricerca più ampia
    const transferCategory = allCategories.find(cat => 
      cat.main.toLowerCase().includes('trasferimento') ||
      cat.name.toLowerCase().includes('trasferimento') ||
      cat.main.toLowerCase().includes('transfer')
    );
    
    console.log('🔄 Transfer category found:', transferCategory ? 'YES' : 'NO');
    if (transferCategory) {
      console.log('   - MAIN:', transferCategory.main);
      console.log('   - Name:', transferCategory.name);
      console.log('   - ID:', transferCategory.id);
    }
    
    // Cerca tutte le transazioni con MAIN che potrebbe essere trasferimento
    const allMainTypes = await prisma.transaction.groupBy({
      by: ['main'],
      where: { userId: user.id }
    });
    
    console.log('📊 All MAIN transaction types for user:');
    allMainTypes.forEach((type, i) => {
      console.log(`   ${i+1}. ${type.main}`);
    });
    
    // Cerca transazioni TRASFERIMENTO con ricerca più ampia
    const transferMainTypes = allMainTypes.filter(type => 
      type.main.toLowerCase().includes('trasferimento') ||
      type.main.toLowerCase().includes('transfer')
    );
    
    let allTransferTransactions = [];
    
    if (transferMainTypes.length > 0) {
      const transferMains = transferMainTypes.map(t => t.main);
      console.log('🔍 Found transfer MAIN types:', transferMains);
      
      allTransferTransactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          main: { in: transferMains }
        },
        include: {
          subcategory: true,
          account: true
        },
        orderBy: { date: 'desc' }
      });
    }
    
    console.log('💸 Transfer transactions found:', allTransferTransactions.length);
    allTransferTransactions.forEach((tx, i) => {
      console.log(`   ${i+1}. ${tx.date.toISOString().split('T')[0]} - MAIN: ${tx.main} - €${tx.amount} - ${tx.note || 'No note'} - Account: ${tx.account?.name || 'None'}`);
    });
    
    // Controlla se esistono già transfers nel sistema
    const existingTransfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      include: {
        fromAccount: true,
        toAccount: true
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('🔄 Existing transfers in transfer table:', existingTransfers.length);
    existingTransfers.forEach((transfer, i) => {
      console.log(`   ${i+1}. ${transfer.date.toISOString().split('T')[0]} - €${transfer.amount}`);
      console.log(`      ${transfer.fromAccount?.name || 'Unknown'} -> ${transfer.toAccount?.name || 'Unknown'}`);
      console.log(`      Note: ${transfer.note || 'No note'}`);
    });
    
    // Lista tutti i conti dell'utente per riferimento
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      orderBy: { name: 'asc' }
    });
    
    console.log('🏦 User accounts:', accounts.length);
    accounts.forEach((acc, i) => {
      console.log(`   ${i+1}. ${acc.name} (${acc.accountType}) - Balance: €${acc.balance}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeTransfers();