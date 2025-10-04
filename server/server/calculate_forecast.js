/**
 * 📊 CALCOLO FORECAST SETTEMBRE: Script per calcolare il "Previsto" con dati reali
 * 
 * 🎯 Scopo: Mostrare come viene calcolato il "Previsto" per settembre 2025
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function calculateSeptemberForecast() {
  try {
    console.log('🔍 CALCOLO FORECAST SETTEMBRE 2025\n');
    
    // 🔸 1. Saldo attuale (somma di tutte le transazioni fino ad oggi)
    console.log('📊 1. SALDO ATTUALE');
    const allTransactions = await prisma.transaction.findMany({
      select: {
        amount: true,
        date: true
      }
    });
    
    const currentBalance = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    console.log(`   Totale transazioni: ${allTransactions.length}`);
    console.log(`   Saldo attuale: €${currentBalance.toFixed(2)}\n`);
    
    // 🔸 2. Transazioni pianificate attive
    console.log('📅 2. TRANSAZIONI PIANIFICATE ATTIVE');
    const plannedTransactions = await prisma.plannedTransaction.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        amount: true,
        frequency: true,
        nextDueDate: true,
        main: true,
        repeatCount: true,
        remainingRepeats: true
      }
    });
    
    console.log(`   Transazioni pianificate attive: ${plannedTransactions.length}`);
    
    // 🔸 3. Calcola le occorrenze per settembre 2025
    const septemberStart = new Date(2025, 8, 1); // Settembre = mese 8 (0-indexed)
    const septemberEnd = new Date(2025, 8, 30);
    
    console.log(`   Periodo: ${septemberStart.toLocaleDateString('it-IT')} - ${septemberEnd.toLocaleDateString('it-IT')}\n`);
    
    let totalProjectedIncome = 0;
    let totalProjectedExpenses = 0;
    
    console.log('💡 3. CALCOLO OCCORRENZE PER SETTEMBRE');
    
    plannedTransactions.forEach(tx => {
      const occurrences = calculateOccurrencesInPeriod(tx, septemberStart, septemberEnd);
      const projectedAmount = tx.amount * occurrences;
      
      console.log(`   📝 ${tx.title || 'Senza titolo'}:`);
      console.log(`      - Importo: €${tx.amount}`);
      console.log(`      - Frequenza: ${tx.frequency}`);
      console.log(`      - Occorrenze in settembre: ${occurrences}`);
      console.log(`      - Proiezione totale: €${projectedAmount.toFixed(2)}`);
      
      if (tx.repeatCount && tx.remainingRepeats !== null) {
        console.log(`      - Ripetizioni: ${tx.remainingRepeats}/${tx.repeatCount} rimanenti`);
      }
      
      if (tx.main === 'income') {
        totalProjectedIncome += Math.abs(projectedAmount);
      } else {
        totalProjectedExpenses += Math.abs(projectedAmount);
      }
      console.log('');
    });
    
    // 🔸 4. Calcolo finale
    console.log('🎯 4. CALCOLO FINALE PREVISTO');
    console.log(`   Saldo attuale: €${currentBalance.toFixed(2)}`);
    console.log(`   + Entrate previste: €${totalProjectedIncome.toFixed(2)}`);
    console.log(`   - Uscite previste: €${totalProjectedExpenses.toFixed(2)}`);
    console.log('   ' + '='.repeat(40));
    
    const forecastBalance = currentBalance + totalProjectedIncome - totalProjectedExpenses;
    console.log(`   🔮 PREVISTO SETTEMBRE: €${forecastBalance.toFixed(2)}`);
    
    // 🔸 5. Riepilogo
    console.log('\n📈 RIEPILOGO:');
    if (forecastBalance > currentBalance) {
      const improvement = forecastBalance - currentBalance;
      console.log(`   ✅ Miglioramento previsto: +€${improvement.toFixed(2)}`);
    } else if (forecastBalance < currentBalance) {
      const deterioration = currentBalance - forecastBalance;
      console.log(`   ⚠️ Peggioramento previsto: -€${deterioration.toFixed(2)}`);
    } else {
      console.log(`   ➖ Situazione stabile`);
    }
    
  } catch (error) {
    console.error('❌ Errore nel calcolo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateOccurrencesInPeriod(plannedTx, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let occurrences = 0;
  
  // Se la transazione ha repeatCount e remainingRepeats è 0, non è più attiva
  if (plannedTx.repeatCount && plannedTx.remainingRepeats === 0) {
    return 0;
  }
  
  let currentDate = new Date(plannedTx.nextDueDate);
  
  // Limite di sicurezza per evitare loop infiniti
  let iterations = 0;
  const maxIterations = 100;
  
  while (currentDate <= end && iterations < maxIterations) {
    if (currentDate >= start) {
      occurrences++;
    }
    
    // Incrementa la data in base alla frequenza
    const frequency = plannedTx.frequency?.toUpperCase();
    switch (frequency) {
      case 'DAILY':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'MONTHLY':
      case 'REPEAT':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'YEARLY':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      case 'ONE_TIME':
        // Una sola occorrenza
        return currentDate >= start && currentDate <= end ? 1 : 0;
      default:
        // Frequenza sconosciuta, considera una sola occorrenza
        return currentDate >= start && currentDate <= end ? 1 : 0;
    }
    
    iterations++;
  }
  
  return occurrences;
}

// Esegui il calcolo
calculateSeptemberForecast();
