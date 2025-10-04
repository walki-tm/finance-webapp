/**
 * 🔍 TEST PLANNED TRANSACTIONS API
 * Script per investigare il problema di loop infinito nell'API listPlannedTransactions
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROBLEM_USER_EMAIL = 'm.venezia02@outlook.it';
const API_BASE_URL = 'http://localhost:3001'; // Adjust if needed

console.log('🔍 INVESTIGATING PLANNED TRANSACTIONS API ISSUE...\n');

async function investigateProblem() {
  try {
    // 1. Get user info
    console.log('📊 STEP 1: Getting user information...');
    const user = await prisma.user.findUnique({
      where: { email: PROBLEM_USER_EMAIL }
    });
    
    if (!user) {
      console.log(`❌ User ${PROBLEM_USER_EMAIL} not found!`);
      return;
    }
    
    console.log(`✅ User found: ${user.id}`);
    
    // 2. Direct database query for planned transactions
    console.log('\n📊 STEP 2: Direct database query...');
    const dbPlannedTransactions = await prisma.plannedTransaction.findMany({
      where: { userId: user.id },
      include: {
        subcategory: true,
        group: true,
        account: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`✅ DB Query successful: ${dbPlannedTransactions.length} planned transactions`);
    
    // 3. Check for problematic data
    console.log('\n📊 STEP 3: Analyzing data for issues...');
    
    let issues = [];
    
    dbPlannedTransactions.forEach((pt, index) => {
      // Check for null/undefined critical fields
      if (!pt.main) {
        issues.push(`Transaction ${index + 1} (${pt.id}): Missing main field`);
      }
      
      if (pt.amount === null || pt.amount === undefined) {
        issues.push(`Transaction ${index + 1} (${pt.id}): Missing amount`);
      }
      
      // Check for invalid dates
      try {
        new Date(pt.nextDueDate);
        new Date(pt.startDate);
      } catch (e) {
        issues.push(`Transaction ${index + 1} (${pt.id}): Invalid dates`);
      }
      
      // Check for circular references or deeply nested objects
      if (pt.subcategory && typeof pt.subcategory === 'object') {
        if (JSON.stringify(pt.subcategory).length > 10000) {
          issues.push(`Transaction ${index + 1} (${pt.id}): Subcategory data too large`);
        }
      }
      
      if (pt.group && typeof pt.group === 'object') {
        if (JSON.stringify(pt.group).length > 10000) {
          issues.push(`Transaction ${index + 1} (${pt.id}): Group data too large`);
        }
      }
      
      // Check for potential JSON circular references
      try {
        JSON.stringify(pt);
      } catch (e) {
        issues.push(`Transaction ${index + 1} (${pt.id}): JSON stringify error - ${e.message}`);
      }
    });
    
    if (issues.length > 0) {
      console.log(`🚨 ISSUES FOUND: ${issues.length} problems detected:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✅ No obvious data issues found');
    }
    
    // 4. Test API endpoint directly (if backend is running)
    console.log('\n📊 STEP 4: Testing API endpoint...');
    
    // First we need a token - this is tricky without going through full auth
    console.log('⚠️  Note: Cannot test API endpoint without valid JWT token');
    console.log('   You would need to:');
    console.log('   1. Login to get a token');
    console.log('   2. Test GET /api/planned-transactions with that token');
    
    // 5. Summary and recommendations
    console.log('\n📋 SUMMARY:');
    console.log(`- Database query: ✅ ${dbPlannedTransactions.length} records`);
    console.log(`- Data issues: ${issues.length > 0 ? '🚨' : '✅'} ${issues.length} found`);
    
    if (issues.length > 0) {
      console.log('\n🛠️  RECOMMENDED ACTIONS:');
      console.log('1. Fix data issues listed above');
      console.log('2. Check backend API endpoint for infinite loops');
      console.log('3. Look for middleware that might cause recursive calls');
      console.log('4. Check if any planned transaction triggers auto-creation of others');
    } else {
      console.log('\n🔍 NEXT STEPS:');
      console.log('1. The issue is likely in the backend API logic, not the data');
      console.log('2. Check the planned transactions controller for infinite loops');
      console.log('3. Look for middleware or pre/post hooks that might recurse');
      console.log('4. Test the API endpoint manually with curl or Postman');
    }
    
  } catch (error) {
    console.error('❌ Error during investigation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run investigation
investigateProblem();