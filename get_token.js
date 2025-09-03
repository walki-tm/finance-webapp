// Vai nella console del browser (F12) e esegui questo script
// per ottenere il token salvato nel localStorage

console.log('Token salvato nel localStorage:');
const token = localStorage.getItem('token');
if (token) {
    console.log(token);
    
    // Test rapido dell'API
    fetch('http://localhost:3001/api/transactions?year=2025&month=9&limit=200', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('🔍 Transazioni per settembre 2025:');
        console.log('Total items:', data.length);
        
        if (data.length > 0) {
            console.log('Prime 3 transazioni:');
            data.slice(0, 3).forEach((tx, i) => {
                console.log(`${i+1}. ID: ${tx.id}, Date: ${tx.date}, Amount: ${tx.amount}, Description: ${tx.description}`);
            });
        } else {
            console.log('Nessuna transazione trovata per settembre 2025');
        }
        
        // Test per agosto per confronto
        return fetch('http://localhost:3001/api/transactions?year=2025&month=8&limit=200', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    })
    .then(response => response.json())
    .then(data => {
        console.log('🔍 Transazioni per agosto 2025:');
        console.log('Total items:', data.length);
        
        if (data.length > 0) {
            console.log('Prime 3 transazioni:');
            data.slice(0, 3).forEach((tx, i) => {
                console.log(`${i+1}. ID: ${tx.id}, Date: ${tx.date}, Amount: ${tx.amount}, Description: ${tx.description}`);
            });
        }
    })
    .catch(error => {
        console.error('Errore nella chiamata API:', error);
    });
    
} else {
    console.log('Nessun token trovato nel localStorage');
    console.log('Tutti gli item nel localStorage:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`${key}: ${localStorage.getItem(key)}`);
    }
}
