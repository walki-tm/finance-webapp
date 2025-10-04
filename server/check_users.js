/**
 * 👥 CHECK USERS
 * Visualizza gli utenti nel database per trovare credenziali valide
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  console.log('👥 CHECKING USERS IN DATABASE...\n')
  
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // Non mostriamo mai la password hashata per sicurezza
      }
    })

    if (users.length === 0) {
      console.log('❌ No users found in database!')
      return
    }

    console.log(`Found ${users.length} users:`)
    console.log('')

    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.name}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🆔 ID: ${user.id}`)
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`)
      console.log('')
    })

    console.log('💡 Try these emails in the browser login or update test_login.js with correct credentials.')
    console.log('💡 Common password patterns: password123, test123, 123456, admin, etc.')
    
  } catch (error) {
    console.error('❌ Error checking users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()