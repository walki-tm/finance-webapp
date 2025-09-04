/**
 * 📄 DEBUG PLANNED TRANSACTIONS: File temporaneo per debuggare il problema
 * 
 * 🎯 Scopo: Testare direttamente l'API delle transazioni pianificate
 */

// Test della funzione directly nel browser
async function testUpcomingPlannedTransactions() {
  try {
    const token = localStorage.getItem('token') // Assume che il token sia nel localStorage
    
    if (!token) {
      console.error('❌ No token found in localStorage')
      return
    }
    
    console.log('🔍 Testing /api/planned-transactions/upcoming endpoint...')
    
    const response = await fetch('/api/planned-transactions/upcoming?limit=5', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ Error body:', errorText)
      return
    }
    
    const data = await response.json()
    console.log('✅ Upcoming planned transactions:', data)
    console.log('✅ Count:', data.length)
    
    if (data.length > 0) {
      console.log('✅ First transaction details:', data[0])
    } else {
      console.log('⚠️ No upcoming transactions found')
      
      // Test anche l'endpoint normale per vedere se ci sono transazioni pianificate
      console.log('🔍 Testing /api/planned-transactions endpoint...')
      
      const allResponse = await fetch('/api/planned-transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (allResponse.ok) {
        const allData = await allResponse.json()
        console.log('✅ All planned transactions:', allData.length)
        
        const activeTransactions = allData.filter(tx => tx.isActive)
        console.log('✅ Active planned transactions:', activeTransactions.length)
        
        if (activeTransactions.length > 0) {
          const nextDueDates = activeTransactions.map(tx => ({
            id: tx.id,
            title: tx.title,
            nextDueDate: tx.nextDueDate,
            isActive: tx.isActive
          }))
          console.log('📅 Next due dates:', nextDueDates)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Esegui il test
if (typeof window !== 'undefined') {
  console.log('🚀 Debug planned transactions script loaded. Run: testUpcomingPlannedTransactions()')
  window.testUpcomingPlannedTransactions = testUpcomingPlannedTransactions
} else {
  console.log('📄 Debug script ready for browser execution')
}
