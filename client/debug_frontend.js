/**
 * FRONTEND DEBUG HELPER
 * ===================
 * This script helps identify React component issues causing frontend freeze
 * Run this in the browser console to get detailed debugging information
 */

console.log('🔍 FRONTEND DEBUG - Starting comprehensive analysis...');

// 1. Check for infinite re-renders by monitoring console errors
const originalError = console.error;
const errorCounts = {};

console.error = function(...args) {
    const message = args.join(' ');
    errorCounts[message] = (errorCounts[message] || 0) + 1;
    
    if (errorCounts[message] > 10) {
        console.warn(`🚨 POTENTIAL INFINITE LOOP DETECTED: "${message}" occurred ${errorCounts[message]} times`);
    }
    
    originalError.apply(console, args);
};

// 2. Monitor React Dev Tools for excessive renders
let renderCount = 0;
const originalRender = console.log;

// 3. Check for stuck API requests
function checkNetworkActivity() {
    console.log('📡 Checking Network Activity...');
    
    // Check if there are pending fetch requests
    const activeRequests = performance.getEntriesByType('navigation')
        .concat(performance.getEntriesByType('resource'))
        .filter(entry => entry.duration > 5000); // Requests taking > 5s
    
    console.log('🐌 Slow requests (>5s):', activeRequests);
    
    // Monitor fetch/XHR for patterns
    const originalFetch = window.fetch;
    let requestCounts = {};
    
    window.fetch = function(url, options) {
        const urlString = typeof url === 'string' ? url : url.toString();
        requestCounts[urlString] = (requestCounts[urlString] || 0) + 1;
        
        if (requestCounts[urlString] > 5) {
            console.warn(`🔄 REPEATED REQUEST DETECTED: ${urlString} called ${requestCounts[urlString]} times`);
        }
        
        console.log(`📤 API Request: ${urlString}`);
        return originalFetch.apply(this, arguments);
    };
}

// 4. Check for memory leaks
function checkMemoryUsage() {
    if (performance.memory) {
        const memory = performance.memory;
        console.log('💾 Memory Usage:', {
            used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
        });
    }
}

// 5. Check for DOM updates frequency
let domMutationCount = 0;
const observer = new MutationObserver(function(mutations) {
    domMutationCount += mutations.length;
    if (domMutationCount > 100) {
        console.warn(`🔄 HIGH DOM MUTATION RATE: ${domMutationCount} mutations detected`);
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
});

// 6. Check React component tree for issues
function analyzeReactComponents() {
    console.log('⚛️ Analyzing React Components...');
    
    // Try to access React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React DevTools detected');
        
        // Check for components that render too frequently
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook.renderers && hook.renderers.size > 0) {
            console.log('📊 Active React Renderers:', hook.renderers.size);
        }
    } else {
        console.log('❌ React DevTools not available');
    }
}

// 7. Check for stuck promises or timeouts
function checkAsyncOperations() {
    console.log('⏳ Checking for stuck async operations...');
    
    // Monitor Promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('🚨 Unhandled Promise Rejection:', event.reason);
    });
    
    // Check for long-running timers
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    let timeoutCount = 0;
    let intervalCount = 0;
    
    window.setTimeout = function(callback, delay) {
        timeoutCount++;
        console.log(`⏰ Timeout #${timeoutCount} set for ${delay}ms`);
        return originalSetTimeout.apply(this, arguments);
    };
    
    window.setInterval = function(callback, delay) {
        intervalCount++;
        console.log(`🔄 Interval #${intervalCount} set for ${delay}ms`);
        return originalSetInterval.apply(this, arguments);
    };
}

// 8. Main debugging function
function runFullDiagnosis() {
    console.log('🏥 === FULL FRONTEND DIAGNOSIS ===');
    
    checkNetworkActivity();
    checkMemoryUsage();
    analyzeReactComponents();
    checkAsyncOperations();
    
    // Check local storage for corruption
    console.log('💾 LocalStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`  ${key}: ${value?.length || 0} characters`);
    }
    
    // Check session storage
    console.log('🗂️ SessionStorage items:');
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`  ${key}: ${value?.length || 0} characters`);
    }
    
    console.log('✅ Diagnosis complete! Monitor console for warnings about infinite loops or repeated requests.');
}

// 9. Quick fixes to try
function quickFixes() {
    console.log('🔧 === QUICK FIXES TO TRY ===');
    
    console.log('1. Clear all storage:');
    console.log('   localStorage.clear(); sessionStorage.clear();');
    
    console.log('2. Check if specific components cause issues:');
    console.log('   - Temporarily comment out useBalance, useCategories, usePlannedTransactions');
    console.log('   - Add console.log at start of each hook to trace execution');
    
    console.log('3. Check browser console for:');
    console.log('   - Red errors (especially React warnings)');
    console.log('   - Network tab for repeated requests');
    console.log('   - Performance tab for long tasks');
    
    console.log('4. React strict mode double-execution:');
    console.log('   - Check if issue happens only in development');
    console.log('   - Try building for production');
}

// Auto-run diagnosis
setTimeout(() => {
    runFullDiagnosis();
    quickFixes();
    
    // Set up monitoring
    setInterval(() => {
        checkMemoryUsage();
        console.log(`🔄 DOM mutations in last interval: ${domMutationCount}`);
        domMutationCount = 0;
    }, 10000);
}, 1000);

console.log('🎯 Frontend Debug Helper loaded! Diagnosis will run automatically in 1 second.');
console.log('📋 You can also run: runFullDiagnosis() or quickFixes() manually.');