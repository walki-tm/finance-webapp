/**
 * Script per trovare tutti gli elementi trasferimento da migrare
 */

import { prisma } from './src/lib/prisma.js';

async function findTransferItems() {
  try {
    // Trova l'utente principale
    const user = await prisma.user.findFirst({
      where: { email: 'm.venezia02@outlook.it' }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ Analyzing user:', user.email, '-', user.name);
    
    // 1. Cerca TUTTE le transazioni che potrebbero essere trasferimenti
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        subcategory: true,
        account: true
      },
      orderBy: { date: 'desc' }
    });
    
    // Filtra transazioni che potrebbero essere trasferimenti
    const potentialTransfers = allTransactions.filter(tx => 
      (tx.note && tx.note.toLowerCase().includes('trasferimento')) ||
      (tx.payee && tx.payee.toLowerCase().includes('trasferimento')) ||
      (tx.subcategory?.name && tx.subcategory.name.toLowerCase().includes('trasferimento')) ||
      (tx.main && tx.main.toLowerCase().includes('transfer'))
    );
    
    console.log('🔍 Potential transfer transactions found:', potentialTransfers.length);
    potentialTransfers.forEach((tx, i) => {
      console.log(`   ${i+1}. ${tx.date.toISOString().split('T')[0]} - MAIN: ${tx.main} - €${tx.amount}`);
      console.log(`      Note: ${tx.note || 'No note'}`);
      console.log(`      Payee: ${tx.payee || 'No payee'}`);
      console.log(`      Account: ${tx.account?.name || 'None'}`);
      console.log(`      Subcategory: ${tx.subcategory?.name || 'None'}`);
      console.log('');
    });
    
    // 2. Cerca TUTTE le categorie che potrebbero essere trasferimenti
    const allCategories = await prisma.category.findMany({
      where: { userId: user.id }
    });
    
    const transferCategories = allCategories.filter(cat => 
      cat.main.toLowerCase().includes('trasferimento') ||
      cat.name.toLowerCase().includes('trasferimento') ||
      cat.main.toLowerCase().includes('transfer') ||
      cat.name.toLowerCase().includes('transfer')
    );
    
    console.log('📂 Transfer categories found:', transferCategories.length);
    transferCategories.forEach((cat, i) => {
      console.log(`   ${i+1}. MAIN: ${cat.main} - Name: ${cat.name} (ID: ${cat.id})`);
    });
    
    // 3. Cerca sottocategorie trasferimento
    const allSubcategories = await prisma.subcategory.findMany({
      where: { userId: user.id },
      include: { Category: true }
    });
    
    const transferSubcategories = allSubcategories.filter(sub => 
      sub.name.toLowerCase().includes('trasferimento') ||
      sub.name.toLowerCase().includes('transfer')
    );
    
    console.log('📁 Transfer subcategories found:', transferSubcategories.length);
    transferSubcategories.forEach((sub, i) => {
      console.log(`   ${i+1}. ${sub.name} (Category: ${sub.Category?.main}) - ID: ${sub.id}`);
    });
    
    // 4. Mostra i transfer attuali per confronto
    const currentTransfers = await prisma.transfer.findMany({
      where: { userId: user.id },
      include: {
        fromAccount: true,
        toAccount: true
      },
      orderBy: { date: 'desc' }
    });
    
    console.log('💸 Current transfers in Transfer table:', currentTransfers.length);
    currentTransfers.forEach((transfer, i) => {
      console.log(`   ${i+1}. ${transfer.date.toISOString().split('T')[0]} - €${transfer.amount}`);
      console.log(`      ${transfer.fromAccount?.name} -> ${transfer.toAccount?.name}`);
    });
    
    // 5. Statistiche riassuntive  
    console.log('📊 SUMMARY:');
    console.log(`   - Potential transfer transactions to migrate: ${potentialTransfers.length}`);
    console.log(`   - Transfer categories to remove: ${transferCategories.length}`);
    console.log(`   - Transfer subcategories to remove: ${transferSubcategories.length}`);
    console.log(`   - Current transfers (working correctly): ${currentTransfers.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findTransferItems();