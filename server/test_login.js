/**
 * 🔑 TEST LOGIN
 * Ottiene un token JWT valido per i test
 */

import http from 'http'

function makeLoginRequest(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: email,
      password: password
    })

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            duration: Date.now() - startTime
          })
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            parseError: error.message,
            rawData: data,
            duration: Date.now() - startTime
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

    req.setTimeout(5000, () => {
      req.destroy()
      reject({
        error: 'Request timeout (5s)',
        duration: Date.now() - startTime
      })
    })

    req.write(postData)
    req.end()
  })
}

async function testLogin() {
  console.log('🔑 TEST LOGIN - Ottenendo token JWT valido...\n')
  
  // Credenziali reali fornite dall'utente
  const testCredentials = [
    { email: 'm.venezia02@outlook.it', password: 'capocchia23' }
  ]

  for (const creds of testCredentials) {
    console.log(`🔍 Trying login with ${creds.email}...`)
    
    try {
      const result = await makeLoginRequest(creds.email, creds.password)
      
      if (result.statusCode === 200 && result.data?.token) {
        console.log(`✅ LOGIN SUCCESS - ${result.duration}ms`)
        console.log(`👤 User: ${result.data.user?.name || 'Unknown'}`)
        console.log(`🎫 Token: Bearer ${result.data.token.substring(0, 50)}...`)
        console.log('')
        console.log('🎯 Use this token in test_frontend_simulation.js:')
        console.log(`const TEST_JWT_TOKEN = 'Bearer ${result.data.token}'`)
        return result.data.token
      } else {
        console.log(`❌ LOGIN FAILED - ${result.duration}ms - Status: ${result.statusCode}`)
        console.log(`   Error: ${result.data?.error || result.rawData}`)
      }
    } catch (error) {
      console.log(`💥 LOGIN ERROR - ${error.duration}ms - ${error.error}`)
    }
    
    console.log('')
  }
  
  console.log('❌ Nessun login riuscito. Controlla le credenziali nel database.')
  console.log('💡 Puoi anche copiare un token JWT dal localStorage del browser.')
  
  return null
}

testLogin()