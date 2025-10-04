/**
 * 🔧 FIX INACTIVE ACCOUNTS
 * Risolve il problema degli account disattivi che causano loop infiniti
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PROBLEM_USER_EMAIL = 'm.venezia02@outlook.it';

async function fixInactiveAccounts() {
    try {
        console.log('🔧 FIXING INACTIVE ACCOUNTS...\n');
        
        // Trova l'utente
        const user = await prisma.user.findUnique({
            where: { email: PROBLEM_USER_EMAIL }
        });

        if (!user) {
            console.log(`❌ Utente ${PROBLEM_USER_EMAIL} non trovato!`);
            return;
        }

        const userId = user.id;
        console.log(`✅ Utente trovato: ${userId}\n`);

        // 1. Verifica gli account inattivi
        const inactiveAccounts = await prisma.account.findMany({
            where: { 
                userId: userId,
                isActive: false
            }
        });

        console.log(`📊 Account inattivi trovati: ${inactiveAccounts.length}`);
        
        if (inactiveAccounts.length === 0) {
            console.log('✅ Tutti gli account sono già attivi!');
            return;
        }

        // 2. Mostra gli account inattivi
        console.log('\n🔍 ACCOUNT INATTIVI:');
        inactiveAccounts.forEach((acc, i) => {
            console.log(`${i+1}. [${acc.id}] ${acc.name} - Tipo: ${acc.type || 'Non specificato'}`);
        });

        // 3. Verifica se ci sono planned transactions AUTOMATIC che usano questi account
        const problematicTransactions = await prisma.plannedTransaction.findMany({
            where: {
                userId: userId,
                isActive: true,
                confirmationMode: 'AUTOMATIC',
                accountId: {
                    in: inactiveAccounts.map(acc => acc.id)
                }
            }
        });

        console.log(`\n🚨 Planned transactions AUTOMATIC che usano account inattivi: ${problematicTransactions.length}`);
        
        if (problematicTransactions.length > 0) {
            console.log('🔍 TRANSAZIONI PROBLEMATICHE:');
            problematicTransactions.forEach((pt, i) => {
                const account = inactiveAccounts.find(acc => acc.id === pt.accountId);
                console.log(`${i+1}. ${pt.title} - €${pt.amount} -> Account: ${account?.name}`);
                console.log(`   Prossima scadenza: ${pt.nextDueDate}`);
                
                // Verifica se è scaduta
                const nextDue = new Date(pt.nextDueDate);
                const now = new Date();
                if (nextDue <= now) {
                    const hoursOverdue = (now - nextDue) / (1000 * 60 * 60);
                    console.log(`   ⚠️  SCADUTA da ${hoursOverdue.toFixed(1)} ore! POSSIBILE CAUSA DEL LOOP!`);
                }
            });
            
            console.log('\n💡 QUESTO È PROBABILMENTE LA CAUSA DEL LOOP INFINITO!');
            console.log('   Le transazioni AUTOMATIC tentano di materializzarsi ma falliscono');
            console.log('   perché gli account di destinazione sono inattivi.\n');
        }

        // 4. Proponi soluzioni
        console.log('🛠️  === SOLUZIONI PROPOSTE ===\n');
        
        console.log('OPZIONE 1: Attivare tutti gli account (CONSIGLIATO)');
        console.log('   Comando SQL da eseguire:');
        inactiveAccounts.forEach(acc => {
            console.log(`   UPDATE "Account" SET "isActive" = true WHERE id = '${acc.id}'; -- ${acc.name}`);
        });

        console.log('\nOPZIONE 2: Disattivare le planned transactions AUTOMATIC problematiche');
        if (problematicTransactions.length > 0) {
            problematicTransactions.forEach(pt => {
                console.log(`   UPDATE "PlannedTransaction" SET "isActive" = false WHERE id = '${pt.id}'; -- ${pt.title}`);
            });
        }

        console.log('\nOPZIONE 3: Cambiare le planned transactions da AUTOMATIC a MANUAL');
        if (problematicTransactions.length > 0) {
            problematicTransactions.forEach(pt => {
                console.log(`   UPDATE "PlannedTransaction" SET "confirmationMode" = 'MANUAL' WHERE id = '${pt.id}'; -- ${pt.title}`);
            });
        }

        // 5. Chiedi quale opzione eseguire
        console.log('\n🎯 RACCOMANDAZIONE: Eseguire OPZIONE 1 (attivare tutti gli account)');
        console.log('   Questo dovrebbe risolvere immediatamente il problema del loop infinito.');
        
        // Opzione automatica: attivare gli account
        console.log('\n🤖 ESECUZIONE AUTOMATICA...');
        console.log('   Attivando tutti gli account inattivi...');
        
        const updateResult = await prisma.account.updateMany({
            where: {
                userId: userId,
                isActive: false
            },
            data: {
                isActive: true
            }
        });
        
        console.log(`✅ Account attivati: ${updateResult.count}`);
        
        // Verifica il risultato
        const activeAccounts = await prisma.account.findMany({
            where: { userId: userId }
        });
        
        const stillInactive = activeAccounts.filter(acc => !acc.isActive);
        
        if (stillInactive.length === 0) {
            console.log('🎉 SUCCESSO! Tutti gli account sono ora attivi.');
            console.log('   Il problema del loop infinito dovrebbe essere risolto.');
            console.log('   Prova a ricaricare l\'applicazione frontend.');
        } else {
            console.log(`⚠️  Alcuni account sono ancora inattivi: ${stillInactive.length}`);
        }

    } catch (error) {
        console.error('❌ Errore durante la correzione:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui la correzione
fixInactiveAccounts();