/**
 * 🔍 TEST SPECIFIC PLANNED TRANSACTION APIS
 * Test individual API endpoints to identify which one causes infinite loops
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROBLEM_USER_EMAIL = 'm.venezia02@outlook.it';

async function testSpecificAPIs() {
  console.log('🔍 TESTING SPECIFIC API ENDPOINTS...\n');

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: PROBLEM_USER_EMAIL }
    });
    
    if (!user) {
      console.log(`❌ User ${PROBLEM_USER_EMAIL} not found!`);
      return;
    }
    
    console.log(`✅ User found: ${user.id}\n`);

    // TEST 1: Simple planned transactions query (no includes)
    console.log('📊 TEST 1: Simple planned transactions (no includes)...');
    try {
      const simplePlanned = await prisma.plannedTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      });
      console.log(`✅ SUCCESS: ${simplePlanned.length} planned transactions (simple)\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 2: Planned transactions with subcategory include only
    console.log('📊 TEST 2: Planned transactions with subcategory include...');
    try {
      const withSubcategory = await prisma.plannedTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        include: { subcategory: true }
      });
      console.log(`✅ SUCCESS: ${withSubcategory.length} planned transactions (with subcategory)\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 3: Planned transactions with group include only
    console.log('📊 TEST 3: Planned transactions with group include...');
    try {
      const withGroup = await prisma.plannedTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        include: { group: true }
      });
      console.log(`✅ SUCCESS: ${withGroup.length} planned transactions (with group)\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 4: Planned transactions with account include only
    console.log('📊 TEST 4: Planned transactions with account include...');
    try {
      const withAccount = await prisma.plannedTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        include: { account: true }
      });
      console.log(`✅ SUCCESS: ${withAccount.length} planned transactions (with account)\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 5: Full includes (current API)
    console.log('📊 TEST 5: Planned transactions with ALL includes...');
    try {
      const withAll = await prisma.plannedTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        include: { 
          subcategory: true,
          group: true,
          account: true
        }
      });
      console.log(`✅ SUCCESS: ${withAll.length} planned transactions (with all includes)\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 6: Transaction Groups
    console.log('📊 TEST 6: Transaction groups...');
    try {
      const groups = await prisma.transactionGroup.findMany({
        where: { userId: user.id },
        orderBy: { sortOrder: 'asc' }
      });
      console.log(`✅ SUCCESS: ${groups.length} transaction groups\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    // TEST 7: Due transactions (this might be the problematic one)
    console.log('📊 TEST 7: Due transactions...');
    try {
      const now = new Date();
      const due = await prisma.plannedTransaction.findMany({
        where: {
          userId: user.id,
          isActive: true,
          nextDueDate: { lte: now }
        },
        orderBy: { nextDueDate: 'asc' },
        include: {
          subcategory: true,
          group: true,
          account: true
        }
      });
      console.log(`✅ SUCCESS: ${due.length} due transactions\n`);
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
    }

    console.log('🎯 All tests completed! Check which ones failed to identify the problematic API.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificAPIs();