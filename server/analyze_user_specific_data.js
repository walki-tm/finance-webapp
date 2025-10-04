/**
 * 🎯 ANALISI DATI SPECIFICI UTENTE
 * Focus su utente problematico: m.venezia02@outlook.it
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PROBLEM_USER_EMAIL = 'm.venezia02@outlook.it';

console.log(`🔍 ANALISI DATI UTENTE SPECIFICO: ${PROBLEM_USER_EMAIL}`);
console.log('🎯 Ricerca cause del loop infinito per questo utente specifico...\n');

async function analyzeUserSpecificData() {
    try {
        // Trova l'utente problematico
        const user = await prisma.user.findUnique({
            where: { email: PROBLEM_USER_EMAIL }
        });

        if (!user) {
            console.log(`❌ Utente ${PROBLEM_USER_EMAIL} non trovato!`);
            return;
        }

        console.log(`✅ Utente trovato: ID = ${user.id}`);
        console.log(`   Nome: ${user.name || 'Non specificato'}`);
        console.log(`   Creato: ${user.createdAt}`);
        
        const userId = user.id;

        // ==========================================
        // 1. PLANNED TRANSACTIONS DELL'UTENTE
        // ==========================================
        console.log('\n🎯 === PLANNED TRANSACTIONS ANALYSIS ===');
        
        const plannedTransactions = await prisma.plannedTransaction.findMany({
            where: { userId },
            include: {
                subcategory: true,
                group: true,
                account: true
            },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📊 Planned Transactions dell'utente: ${plannedTransactions.length}`);

        // Dettaglio di ogni planned transaction
        plannedTransactions.forEach((pt, i) => {
            console.log(`\n📝 ${i+1}. [${pt.id}] ${pt.title}`);
            console.log(`   Importo: €${pt.amount}`);
            console.log(`   Frequenza: ${pt.frequency}`);
            console.log(`   Conferma: ${pt.confirmationMode}`);
            console.log(`   Attiva: ${pt.isActive ? 'SÌ' : 'NO'}`);
            console.log(`   Prossima scadenza: ${pt.nextDueDate}`);
            console.log(`   Data inizio: ${pt.startDate}`);
            console.log(`   Sottocategoria: ${pt.subcategory?.name || 'NESSUNA'}`);
            console.log(`   Gruppo: ${pt.group?.name || 'NESSUNO'}`);
            console.log(`   Account: ${pt.account?.name || 'NESSUNO'}`);

            // Controlla se la scadenza potrebbe causare problemi
            const nextDue = new Date(pt.nextDueDate);
            const now = new Date();
            const diffHours = (nextDue - now) / (1000 * 60 * 60);
            
            if (pt.isActive && pt.confirmationMode === 'AUTOMATIC') {
                if (diffHours <= 0) {
                    console.log(`   ⚠️  SCADUTA! (${Math.abs(diffHours).toFixed(1)} ore fa)`);
                    console.log(`   🚨 POTENZIALE CAUSA LOOP: Transaction AUTOMATIC scaduta!`);
                } else if (diffHours <= 24) {
                    console.log(`   ⏰ Scade tra ${diffHours.toFixed(1)} ore`);
                }
            }
        });

        // ==========================================
        // 2. ANALISI TRANSAZIONI RECENTI
        // ==========================================
        console.log('\n\n🎯 === RECENT TRANSACTIONS ANALYSIS ===');
        
        const recentTransactions = await prisma.transaction.findMany({
            where: { 
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // Ultimi 3 giorni
                }
            },
            include: {
                subcategory: true
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        
        console.log(`📊 Transazioni recenti (ultimi 3 giorni): ${recentTransactions.length}`);
        
        if (recentTransactions.length > 0) {
            recentTransactions.forEach((tx, i) => {
                console.log(`${i+1}. ${tx.createdAt.toISOString()} - €${tx.amount} - ${tx.note || 'Senza nota'}`);
            });
        }

        // ==========================================
        // 3. ANALISI CONTI DELL'UTENTE
        // ==========================================
        console.log('\n\n🎯 === ACCOUNTS ANALYSIS ===');
        
        const accounts = await prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`📊 Conti dell'utente: ${accounts.length}`);
        
        accounts.forEach((acc, i) => {
            console.log(`${i+1}. [${acc.id}] ${acc.name}`);
            console.log(`   Tipo: ${acc.type || 'Non specificato'}`);
            console.log(`   Saldo iniziale: €${acc.initialBalance || 0}`);
            console.log(`   Attivo: ${acc.isActive ? 'SÌ' : 'NO'}`);
        });

        // ==========================================
        // 4. ANALISI CATEGORIE E SOTTOCATEGORIE
        // ==========================================
        console.log('\n\n🎯 === CATEGORIES ANALYSIS ===');
        
        const subcategories = await prisma.subcategory.findMany({
            where: { userId },
            include: {
                category: true
            },
            orderBy: { name: 'asc' }
        });
        
        console.log(`📊 Sottocategorie dell'utente: ${subcategories.length}`);
        
        // Raggruppa per categoria
        const categoryGroups = {};
        subcategories.forEach(sub => {
            const catName = sub.category?.name || 'Senza categoria';
            if (!categoryGroups[catName]) {
                categoryGroups[catName] = [];
            }
            categoryGroups[catName].push(sub.name);
        });

        Object.entries(categoryGroups).forEach(([catName, subs]) => {
            console.log(`📁 ${catName}: ${subs.join(', ')}`);
        });

        // ==========================================
        // 5. RICERCA PROBLEMI SPECIFICI
        // ==========================================
        console.log('\n\n🔍 === PROBLEMI SPECIFICI IDENTIFICATI ===');
        
        let problemsFound = 0;

        // Planned transactions con date problematiche
        const badDateTransactions = plannedTransactions.filter(pt => {
            const nextDue = new Date(pt.nextDueDate);
            const start = new Date(pt.startDate);
            
            return (
                isNaN(nextDue.getTime()) || 
                isNaN(start.getTime()) ||
                start > nextDue ||
                nextDue.getFullYear() < 2020 ||
                nextDue.getFullYear() > 2030
            );
        });
        
        if (badDateTransactions.length > 0) {
            problemsFound++;
            console.log(`🚨 PROBLEMA ${problemsFound}: ${badDateTransactions.length} planned transactions con date invalide`);
            badDateTransactions.forEach(pt => {
                console.log(`   - ${pt.title}: nextDue=${pt.nextDueDate}, start=${pt.startDate}`);
            });
        }

        // Planned transactions AUTOMATIC scadute
        const now = new Date();
        const overdueAutoTransactions = plannedTransactions.filter(pt => {
            const nextDue = new Date(pt.nextDueDate);
            return pt.isActive && pt.confirmationMode === 'AUTOMATIC' && nextDue <= now;
        });
        
        if (overdueAutoTransactions.length > 0) {
            problemsFound++;
            console.log(`🚨 PROBLEMA ${problemsFound}: ${overdueAutoTransactions.length} planned transactions AUTOMATIC scadute!`);
            console.log('   Queste potrebbero causare il loop infinito di auto-materializzazione!');
            overdueAutoTransactions.forEach(pt => {
                const hoursOverdue = (now - new Date(pt.nextDueDate)) / (1000 * 60 * 60);
                console.log(`   - ${pt.title}: scaduta ${hoursOverdue.toFixed(1)} ore fa`);
            });
        }

        // Riferimenti rotti
        const brokenReferences = [];
        for (const pt of plannedTransactions) {
            if (pt.subId && !pt.subcategory) {
                brokenReferences.push(`${pt.title}: subcategory ${pt.subId} mancante`);
            }
            if (pt.groupId && !pt.group) {
                brokenReferences.push(`${pt.title}: group ${pt.groupId} mancante`);
            }
            if (pt.accountId && !pt.account) {
                brokenReferences.push(`${pt.title}: account ${pt.accountId} mancante`);
            }
        }
        
        if (brokenReferences.length > 0) {
            problemsFound++;
            console.log(`🚨 PROBLEMA ${problemsFound}: ${brokenReferences.length} riferimenti rotti`);
            brokenReferences.forEach(ref => console.log(`   - ${ref}`));
        }

        // ==========================================
        // 6. RACCOMANDAZIONI SPECIFICHE
        // ==========================================
        console.log('\n\n💡 === RACCOMANDAZIONI SPECIFICHE ===');
        
        if (problemsFound === 0) {
            console.log('✅ Nessun problema evidente nei dati di questo utente.');
            console.log('🔍 Il problema potrebbe essere nella logica del frontend React.');
            console.log('\n🛠️  PROSSIMI PASSI CONSIGLIATI:');
            console.log('1. Aggiungi console.log() nei hooks React per tracciare i loop');
            console.log('2. Usa il debug script del frontend nel browser');
            console.log('3. Controlla se ci sono dipendenze cicliche nei useEffect');
            console.log('4. Verifica che i token di autenticazione non scadano causando re-fetch continui');
        } else {
            console.log(`🔧 Trovati ${problemsFound} problemi che potrebbero causare il freeze!`);
            
            if (overdueAutoTransactions.length > 0) {
                console.log('\n🚨 AZIONE URGENTE: Disabilita le planned transactions AUTOMATIC scadute:');
                overdueAutoTransactions.forEach(pt => {
                    console.log(`   UPDATE planned_transaction SET "isActive" = false WHERE id = '${pt.id}';`);
                });
            }
            
            if (badDateTransactions.length > 0) {
                console.log('\n🛠️  Correggi le date problematiche o elimina le transactions invalide');
            }
            
            if (brokenReferences.length > 0) {
                console.log('\n🔗 Ripara i riferimenti rotti nelle planned transactions');
            }
        }

    } catch (error) {
        console.error('❌ Errore durante l\'analisi:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Esegui l'analisi
analyzeUserSpecificData();