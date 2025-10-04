/**
 * 🔍 DEBUG MIDDLEWARE
 * Traccia tutte le chiamate API per identificare il punto di blocco
 */

import { performance } from 'perf_hooks'

const activeRequests = new Map()
let requestCounter = 0

export function debugMiddleware(req, res, next) {
  const requestId = ++requestCounter
  const startTime = performance.now()
  const timestamp = new Date().toISOString()
  
  // Logga inizio richiesta
  console.log(`🚀 [${requestId}] ${timestamp} - START: ${req.method} ${req.url}`)
  if (Object.keys(req.query).length > 0) {
    console.log(`   📋 Query: ${JSON.stringify(req.query)}`)
  }
  if (req.headers.authorization) {
    console.log(`   🔐 Auth: ${req.headers.authorization.substring(0, 20)}...`)
  }
  
  // Salva richiesta attiva
  activeRequests.set(requestId, {
    method: req.method,
    url: req.url,
    startTime,
    timestamp
  })
  
  // Override della risposta per tracciare la fine
  const originalSend = res.send
  const originalJson = res.json
  
  res.send = function(body) {
    const endTime = performance.now()
    const duration = (endTime - startTime).toFixed(2)
    
    console.log(`✅ [${requestId}] COMPLETE: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)
    
    if (res.statusCode >= 400) {
      console.log(`   ❌ Error body: ${body}`)
    }
    
    // Rimuovi dalla lista delle richieste attive
    activeRequests.delete(requestId)
    
    return originalSend.call(this, body)
  }
  
  res.json = function(obj) {
    const endTime = performance.now()
    const duration = (endTime - startTime).toFixed(2)
    
    console.log(`✅ [${requestId}] COMPLETE: ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`)
    
    if (res.statusCode >= 400) {
      console.log(`   ❌ Error: ${JSON.stringify(obj)}`)
    }
    
    // Rimuovi dalla lista delle richieste attive
    activeRequests.delete(requestId)
    
    return originalJson.call(this, obj)
  }
  
  // Timeout warning per richieste lunghe
  setTimeout(() => {
    if (activeRequests.has(requestId)) {
      const elapsed = (performance.now() - startTime).toFixed(2)
      console.log(`⚠️  [${requestId}] SLOW REQUEST: ${req.method} ${req.url} - ${elapsed}ms and still running`)
    }
  }, 3000) // Warning dopo 3 secondi
  
  setTimeout(() => {
    if (activeRequests.has(requestId)) {
      const elapsed = (performance.now() - startTime).toFixed(2)
      console.log(`🚨 [${requestId}] VERY SLOW: ${req.method} ${req.url} - ${elapsed}ms and still running`)
      console.log(`   🔍 This might be the problematic request!`)
    }
  }, 10000) // Alert critico dopo 10 secondi
  
  next()
}

// Funzione per mostrare richieste attive
export function showActiveRequests() {
  console.log('\n📊 ACTIVE REQUESTS:')
  if (activeRequests.size === 0) {
    console.log('   ✅ No active requests')
  } else {
    activeRequests.forEach((req, id) => {
      const elapsed = (performance.now() - req.startTime).toFixed(2)
      console.log(`   🔄 [${id}] ${req.method} ${req.url} - ${elapsed}ms`)
    })
  }
  console.log('')
}
