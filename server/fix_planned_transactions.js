/**
 * 🔧 ANALISI E FIX PLANNED TRANSACTIONS
 * Identifica e risolve problemi con le planned transactions
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PROBLEM_USER_EMAIL = 'm.venezia02@outlook.it';

async function analyzePlannedTransactions() {
    try {
        console.log('🔧 ANALIZING PLANNED TRANSACTIONS ISSUES...\n');
        
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

        // Trova tutte le planned transactions attive
        const plannedTransactions = await prisma.plannedTransaction.findMany({
            where: { 
                userId: userId,
                isActive: true
            },
            include: {
                subcategory: true,
                group: true,
                account: true
            },
            orderBy: { nextDueDate: 'asc' }
        });

        console.log(`📊 Planned Transactions attive: ${plannedTransactions.length}\n`);

        const now = new Date();
        let problemsFound = 0;

        console.log('🔍 ANALISI DETTAGLIATA:\n');

        for (const [i, pt] of plannedTransactions.entries()) {
            const nextDue = new Date(pt.nextDueDate);
            const hoursUntilDue = (nextDue - now) / (1000 * 60 * 60);
            
            console.log(`${i+1}. [${pt.id}] ${pt.title}`);
            console.log(`   Importo: €${pt.amount}`);
            console.log(`   Tipo: ${pt.confirmationMode} - Frequenza: ${pt.frequency}`);
            console.log(`   Scadenza: ${pt.nextDueDate}`);
            console.log(`   Account: ${pt.account?.name || 'NESSUNO'}`);
            console.log(`   Sottocategoria: ${pt.subcategory?.name || 'NESSUNA'}`);
            
            // Verifica problemi
            let hasIssues = false;
            
            // 1. Verifica date problematiche
            if (isNaN(nextDue.getTime())) {
                console.log(`   🚨 PROBLEMA: Data nextDueDate invalida!`);
                hasIssues = true;
                problemsFound++;
            }
            
            // 2. Verifica AUTOMATIC scadute
            if (pt.confirmationMode === 'AUTOMATIC' && hoursUntilDue <= 0) {
                console.log(`   🚨 PROBLEMA: Transaction AUTOMATIC scaduta da ${Math.abs(hoursUntilDue).toFixed(1)} ore!`);
                console.log(`   💡 Questa può causare loop infinito di auto-materializzazione!`);
                hasIssues = true;
                problemsFound++;
            } else if (pt.confirmationMode === 'AUTOMATIC' && hoursUntilDue <= 24) {
                console.log(`   ⏰ ATTENZIONE: Transaction AUTOMATIC scade tra ${hoursUntilDue.toFixed(1)} ore`);
            }
            
            // 3. Verifica riferimenti mancanti
            if (!pt.subcategory) {
                console.log(`   ⚠️  ATTENZIONE: Sottocategoria mancante`);
            }
            
            if (!pt.account) {
                console.log(`   ⚠️  ATTENZIONE: Account mancante`);
            }
            
            // 4. Verifica campi critici null
            if (!pt.main || !pt.amount) {
                console.log(`   🚨 PROBLEMA: Campi critici mancanti (main: ${pt.main}, amount: ${pt.amount})`);
                hasIssues = true;
                problemsFound++;
            }
            
            if (!hasIssues) {
                console.log(`   ✅ OK - Nessun problema rilevato`);
            }
            
            console.log(''); // riga vuota
        }

        console.log(`\n📋 === RIEPILOGO ANALISI ===`);
        console.log(`Planned Transactions totali: ${plannedTransactions.length}`);
        console.log(`Problemi rilevati: ${problemsFound}`);

        // Se ci sono problemi, proponi soluzioni
        if (problemsFound > 0) {
            console.log('\n🛠️  === SOLUZIONI PROPOSTE ===\n');
            
            // Trova transazioni AUTOMATIC scadute
            const overdueAutoTransactions = plannedTransactions.filter(pt => {
                const nextDue = new Date(pt.nextDueDate);
                const hoursUntilDue = (nextDue - now) / (1000 * 60 * 60);
                return pt.confirmationMode === 'AUTOMATIC' && hoursUntilDue <= 0;
            });
            
            if (overdueAutoTransactions.length > 0) {
                console.log(`🚨 PROBLEMA PRINCIPALE: ${overdueAutoTransactions.length} transazioni AUTOMATIC scadute`);
                console.log('   Queste causano il loop infinito perché il sistema tenta continuamente di materializzarle!\n');
                
                console.log('OPZIONE 1: Disattivare temporaneamente le transazioni AUTOMATIC scadute');
                console.log('OPZIONE 2: Cambiare da AUTOMATIC a MANUAL');
                console.log('OPZIONE 3: Aggiornare la nextDueDate alla prossima scadenza\n');
                
                // ESECUZIONE AUTOMATICA: Aggiorna le nextDueDate delle transazioni scadute
                console.log('🤖 ESECUZIONE AUTOMATICA: Aggiorno le date di scadenza...\n');
                
                for (const pt of overdueAutoTransactions) {
                    console.log(`Aggiornamento: ${pt.title}`);
                    
                    // Calcola la prossima data di scadenza
                    let nextDueDate = new Date(pt.nextDueDate);
                    
                    switch (pt.frequency) {
                        case 'MONTHLY':
                            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                            break;
                        case 'QUARTERLY':
                            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
                            break;
                        case 'SEMIANNUAL':
                            nextDueDate.setMonth(nextDueDate.getMonth() + 6);
                            break;
                        case 'YEARLY':
                            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
                            break;
                        case 'WEEKLY':
                            nextDueDate.setDate(nextDueDate.getDate() + 7);
                            break;
                        default:
                            // Per ONE_TIME o altro, spostiamo di un mese
                            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                    }
                    
                    // Aggiorna nel database
                    await prisma.plannedTransaction.update({
                        where: { id: pt.id },
                        data: { nextDueDate: nextDueDate }
                    });
                    
                    console.log(`   ✅ Aggiornata da ${pt.nextDueDate} a ${nextDueDate.toISOString()}`);
                }
                
                console.log(`\n🎉 SUCCESSO! Aggiornate ${overdueAutoTransactions.length} planned transactions.`);
                console.log('   Il problema del loop infinito dovrebbe essere risolto!');
                console.log('   Prova a ricaricare l\'applicazione frontend.');
                
            } else {
                console.log('✅ Nessuna transazione AUTOMATIC scaduta trovata.');
                console.log('🔍 Il problema del loop infinito potrebbe essere causato da altro.');
                console.log('\n💡 SUGGERIMENTI:');
                console.log('1. Controlla i log del frontend per errori JavaScript');
                console.log('2. Verifica i hooks React per dipendenze cicliche');
                console.log('3. Controlla se ci sono timer o setInterval che causano re-render continui');
            }
            
        } else {
            console.log('✅ Nessun problema rilevato nelle planned transactions!');
            console.log('🔍 Il freeze del frontend è probabilmente causato da logica React, non dai dati.');
        }

    } catch (error) {
        console.error('❌ Errore durante l\'analisi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui l'analisi
analyzePlannedTransactions();