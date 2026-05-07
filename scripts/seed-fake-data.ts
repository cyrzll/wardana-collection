import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding daily fake data (2 weeks)...')

  // 1. Cleanup old orders to reset the dataset
  await prisma.orderItem.deleteMany()
  await prisma.orderStatus.deleteMany()
  await prisma.order.deleteMany()
  console.log('Old orders cleared.')

  // 2. Ensure Categories exist
  const categories = ['Tops', 'Bottoms', 'Outerwear', 'Accessories', 'Footwear']
  const categoryRecords = []
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    })
    categoryRecords.push(cat)
  }

  // 3. Ensure Genders exist
  const genders = ['Men', 'Women', 'Unisex']
  const genderRecords = []
  for (const name of genders) {
    const gen = await prisma.gender.upsert({
      where: { name },
      update: {},
      create: { name }
    })
    genderRecords.push(gen)
  }

  // 4. Ensure a User exists
  const user = await prisma.user.upsert({
    where: { email: 'customer@wardana.com' },
    update: {},
    create: {
      username: 'Premium Customer',
      email: 'customer@wardana.com',
      password: 'password123',
      level: 'user',
      status: 'active'
    }
  })

  // 5. Ensure Products exist with cost_price
  const productsData = [
    { name: 'Heritage Wool Coat', price: 2499000, cost: 1200000, cat: 'Outerwear', gen: 'Unisex' },
    { name: 'Minimalist Silk Shirt', price: 899000, cost: 350000, cat: 'Tops', gen: 'Women' },
    { name: 'Architectural Trousers', price: 1299000, cost: 500000, cat: 'Bottoms', gen: 'Men' },
    { name: 'Raw Denim Jacket', price: 1599000, cost: 700000, cat: 'Outerwear', gen: 'Men' },
    { name: 'Leather Chelsea Boots', price: 3299000, cost: 1800000, cat: 'Footwear', gen: 'Unisex' },
    { name: 'Cashmere Scarf', price: 749000, cost: 200000, cat: 'Accessories', gen: 'Unisex' },
    { name: 'Structured Blazer', price: 2199000, cost: 950000, cat: 'Outerwear', gen: 'Women' },
    { name: 'Cotton Poplin Shirt', price: 599000, cost: 150000, cat: 'Tops', gen: 'Men' },
  ]

  const createdProducts = []
  for (const p of productsData) {
    const category = categoryRecords.find(c => c.name === p.cat)
    const gender = genderRecords.find(g => g.name === p.gen)
    
    // Using findFirst because 'name' is not unique in schema
    let product = await prisma.product.findFirst({ where: { name: p.name } })
    
    if (product) {
      product = await prisma.product.update({
        where: { id: product.id },
        data: {
          price: p.price,
          cost_price: p.cost,
          selling_price: p.price,
          category_id: category.id,
          gender_id: gender.id,
          stock: 100
        }
      })
    } else {
      product = await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          cost_price: p.cost,
          selling_price: p.price,
          description: `Premium ${p.name} designed with WARDANA minimalist aesthetic.`,
          category_id: category.id,
          gender_id: gender.id,
          stock: 100,
          images: JSON.stringify(['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop']),
          variants: JSON.stringify([{ name: 'Classic Black', hex: '#000000' }]),
          sizes: JSON.stringify(['S', 'M', 'L', 'XL'])
        }
      })
    }
    createdProducts.push(product)
  }

  // 6. Create Daily Completed Orders for the last 14 days
  console.log('Generating orders for each day (last 14 days)...')
  for (let i = 14; i >= 0; i--) {
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - i)
    // Randomize time during business hours
    orderDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 59), 0, 0)

    // Generate 1 to 3 orders for every single day
    const numOrders = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < numOrders; j++) {
      const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)]
      const qty = Math.floor(Math.random() * 2) + 1
      const total = randomProduct.price * qty

      await prisma.order.create({
        data: {
          user_id: user.id,
          order_number: `WRD-DAILY-${i}-${j}-${Math.floor(1000 + Math.random() * 9000)}`,
          total_amount: total,
          shipping_fee: 25000,
          discount_amount: 0,
          final_amount: total + 25000,
          status: 'selesai',
          payment_method: 'wardanapay',
          payment_status: 'paid',
          recipient_name: 'Premium Customer',
          phone: '08123456789',
          full_address: 'Luxury Street No. 1, Jakarta',
          created_at: orderDate,
          updated_at: orderDate,
          items: {
            create: {
              product_id: randomProduct.id,
              product_name: randomProduct.name,
              quantity: qty,
              price: randomProduct.price,
              variant: 'Classic Black',
              size: 'M',
              image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop'
            }
          },
          statuses: {
            create: {
              status: 'selesai',
              description: 'Pesanan telah diterima dan diselesaikan oleh pembeli',
              created_at: orderDate
            }
          }
        }
      })
    }
  }

  console.log('Daily seeding finished successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
