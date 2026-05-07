import { PrismaClient } from '@prisma/client'
import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

const prisma = new PrismaClient()

// Initialize Firebase Admin
let serviceAccount
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} catch (e) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT. Make sure it is a valid JSON string.')
  process.exit(1)
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
})

const db = admin.database()

async function migrate() {
  console.log('🚀 Starting migration to Firebase...')

  const models = [
    { name: 'user', ref: 'users' },
    { name: 'userWallet', ref: 'user_wallets' },
    { name: 'category', ref: 'categories' },
    { name: 'gender', ref: 'genders' },
    { name: 'product', ref: 'products' },
    { name: 'cart', ref: 'cart' },
    { name: 'order', ref: 'orders' },
    { name: 'orderItem', ref: 'order_items' },
    { name: 'orderStatus', ref: 'order_statuses' },
    { name: 'voucher', ref: 'vouchers' },
    { name: 'userVoucher', ref: 'user_vouchers' },
    { name: 'address', ref: 'addresses' }
  ]

  for (const model of models) {
    console.log(`📦 Migrating ${model.name}...`)
    try {
      const data = await prisma[model.name].findMany()
      console.log(`   Found ${data.length} records.`)
      
      if (data.length === 0) continue

      const ref = db.ref(model.ref)
      
      // We'll map by ID to maintain relationships
      const updates = {}
      data.forEach(item => {
        // Convert dates to ISO strings for Firebase
        const cleanedItem = { ...item }
        Object.keys(cleanedItem).forEach(key => {
          if (cleanedItem[key] instanceof Date) {
            cleanedItem[key] = cleanedItem[key].toISOString()
          }
        })
        
        // Use the primary key as the node key
        const key = item.id || item.user_id || `item_${Math.random().toString(36).substr(2, 9)}`
        updates[key] = cleanedItem
      })

      await ref.set(updates)
      console.log(`   ✅ ${model.name} migrated successfully.`)
    } catch (error) {
      console.error(`   ❌ Error migrating ${model.name}:`, error)
    }
  }

  console.log('\n✨ Migration complete!')
  await prisma.$disconnect()
  process.exit(0)
}

migrate()
