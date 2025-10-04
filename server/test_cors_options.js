/**
 * 🧪 TEST CORS OPTIONS
 * Testa le richieste OPTIONS per verificare se il problema CORS è risolto
 */

import http from 'http'

function testOptionsRequest(path, port = 3001) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          duration: Date.now() - startTime
        })
      })
    })

    const startTime = Date.now()
    
    req.on('error', (err) => {
      reject({
        error: err.message,
        duration: Date.now() - startTime
      })
    })

    // Timeout dopo 5 secondi
    req.setTimeout(5000, () => {
      req.destroy()
      reject({
        error: 'Request timeout (5s)',
        duration: Date.now() - startTime
      })
    })

    req.end()
  })
}

async function testAllOptionsEndpoints() {
  console.log('🧪 TEST CORS OPTIONS REQUESTS\n')
  
  const endpoints = [
    '/api/categories',
    '/api/transactions',
    '/api/planned-transactions',
    '/api/planned-transactions/due',
    '/api/budgets?year=2025',
    '/api/accounts/stats'
  ]

  for (const endpoint of endpoints) {
    console.log(`🔍 Testing OPTIONS ${endpoint}...`)
    
    try {
      const result = await testOptionsRequest(endpoint)
      
      if (result.statusCode === 200) {
        console.log(`✅ SUCCESS - ${result.duration}ms - Status: ${result.statusCode}`)
        console.log(`   Headers: ${Object.keys(result.headers).length} headers received`)
        if (result.headers['access-control-allow-origin']) {
          console.log(`   CORS: ${result.headers['access-control-allow-origin']}`)
        }
      } else {
        console.log(`⚠️  UNEXPECTED - ${result.duration}ms - Status: ${result.statusCode}`)
      }
    } catch (error) {
      console.log(`❌ FAILED - ${error.duration}ms - Error: ${error.error}`)
    }
    
    console.log('')
  }
  
  console.log('✅ Test CORS completato!')
}

testAllOptionsEndpoints()