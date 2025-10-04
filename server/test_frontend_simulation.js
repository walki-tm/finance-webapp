/**
 * 🎭 FRONTEND SIMULATION TEST
 * Simula esattamente le chiamate API che fa il frontend al caricamento
 */

import http from 'http'

// Token JWT reale ottenuto dal login test
const TEST_JWT_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJjbWY5MTJlY2swMDAxcnNmMjJmNzdoZm5nIiwiZW1haWwiOiJtLnZlbmV6aWEwMkBvdXRsb29rLml0IiwiaWF0IjoxNzU5NDA1NDE0LCJleHAiOjE3NjAwMTAyMTR9.J07tR7BBn0xzM7WnnOkcLzgyP1qfpfHUBGogm5I7X0c'

function makeAPIRequest(path, method = 'GET', port = 3001, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Authorization': TEST_JWT_TOKEN,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            duration: Date.now() - startTime,
            rawData: data
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            parseError: error.message,
            duration: Date.now() - startTime,
            rawData: data
          })
        }
      })
    })

    const startTime = Date.now()
    
    req.on('error', (err) => {
      reject({
        error: err.message,
        duration: Date.now() - startTime
      })
    })

    // Timeout configurabile
    req.setTimeout(timeout, () => {
      req.destroy()
      reject({
        error: `Request timeout (${timeout}ms)`,
        duration: Date.now() - startTime
      })
    })

    req.end()
  })
}

async function simulateFrontendLoading() {
  console.log('🎭 FRONTEND SIMULATION TEST')
  console.log('Simulando esattamente le chiamate API che fa il frontend al caricamento...\n')
  
  // Queste sono le chiamate API che la homepage dovrebbe fare
  const apiCalls = [
    { name: 'Categories', path: '/api/categories' },
    { name: 'Current Month Transactions', path: '/api/transactions?year=2025&month=10&limit=200' },
    { name: 'Budgets Current Year', path: '/api/budgets?year=2025' },
    { name: 'Accounts Stats', path: '/api/accounts/stats' },
    { name: 'Planned Transactions', path: '/api/planned-transactions' },
    { name: 'Planned Transactions Due', path: '/api/planned-transactions/due' },
    { name: 'Planned Transactions Groups', path: '/api/planned-transactions/groups' },
    { name: 'Planned Transactions Upcoming', path: '/api/planned-transactions/upcoming?limit=5' }
  ]

  const results = []

  for (const apiCall of apiCalls) {
    console.log(`🔍 Testing ${apiCall.name} (${apiCall.path})...`)
    
    try {
      const result = await makeAPIRequest(apiCall.path)
      
      if (result.statusCode === 200) {
        console.log(`✅ SUCCESS - ${result.duration}ms`)
        
        // Controlla se i dati sono validi
        if (result.data && typeof result.data === 'object') {
          if (Array.isArray(result.data)) {
            console.log(`   📊 Data: Array with ${result.data.length} items`)
          } else {
            console.log(`   📊 Data: Object with ${Object.keys(result.data).length} keys`)
          }
        } else {
          console.log(`   ⚠️  Data: ${typeof result.data} - ${result.rawData?.substring(0, 100)}`)
        }
        
        results.push({ ...apiCall, status: 'SUCCESS', duration: result.duration, statusCode: result.statusCode })
      } else {
        console.log(`❌ HTTP ERROR - ${result.duration}ms - Status: ${result.statusCode}`)
        console.log(`   Error: ${result.rawData?.substring(0, 200)}`)
        results.push({ ...apiCall, status: 'HTTP_ERROR', duration: result.duration, statusCode: result.statusCode })
      }
    } catch (error) {
      console.log(`💥 FAILED - ${error.duration}ms - Error: ${error.error}`)
      
      if (error.error.includes('timeout')) {
        console.log(`   🚨 TIMEOUT: Questa API sta causando il blocco dell'app!`)
      }
      
      results.push({ ...apiCall, status: 'FAILED', duration: error.duration, error: error.error })
    }
    
    console.log('')
  }
  
  console.log('📊 === RIEPILOGO RISULTATI ===')
  console.log('')
  
  const successful = results.filter(r => r.status === 'SUCCESS')
  const failed = results.filter(r => r.status === 'FAILED')
  const httpErrors = results.filter(r => r.status === 'HTTP_ERROR')
  
  console.log(`✅ Successful: ${successful.length}`)
  console.log(`❌ Failed: ${failed.length}`)
  console.log(`⚠️  HTTP Errors: ${httpErrors.length}`)
  
  if (failed.length > 0) {
    console.log('')
    console.log('🚨 PROBLEMATIC APIs (causing timeouts):')
    failed.forEach(api => {
      console.log(`   - ${api.name}: ${api.error}`)
    })
  }
  
  const slowAPIs = results.filter(r => r.duration > 1000)
  if (slowAPIs.length > 0) {
    console.log('')
    console.log('🐌 SLOW APIs (>1s):')
    slowAPIs.forEach(api => {
      console.log(`   - ${api.name}: ${api.duration}ms`)
    })
  }
  
  console.log('')
  console.log('✅ Simulation completata!')
  
  // Suggerimenti
  console.log('')
  console.log('💡 SUGGERIMENTI:')
  if (failed.length > 0) {
    console.log('- Le API che vanno in timeout stanno bloccando l\'applicazione')
    console.log('- Controlla i log del server per vedere dove si bloccano le query')
    console.log('- Potrebbero essere problemi di connessione al database')
  } else if (slowAPIs.length > 0) {
    console.log('- API lente potrebbero causare UX scadente')
    console.log('- Considera di ottimizzare le query del database')
  } else {
    console.log('- Tutte le API funzionano correttamente')
    console.log('- Il problema potrebbe essere nel frontend React (loop infinito, useState, useEffect)')
    console.log('- Controlla la console del browser per errori JavaScript')
  }
}

simulateFrontendLoading()