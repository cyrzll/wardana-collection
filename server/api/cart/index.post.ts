import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, product_id, type, quantity, variant_name, size } = body

  if (!user_id || !product_id || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Authentication required' })
  }

  // Handle Cart logic
  if (type === 'cart') {
    // Check for existing item with SAME variant and size
    const existing = await prisma.cart.findFirst({
      where: { 
        user_id, 
        product_id, 
        type: 'cart', 
        variant_name: variant_name || null, 
        size: size || null 
      }
    })

    if (existing) {
      return await prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (parseInt(quantity) || 1) }
      })
    }
    
    return await prisma.cart.create({
      data: {
        user_id,
        product_id,
        type: 'cart',
        quantity: parseInt(quantity) || 1,
        variant_name: variant_name || null,
        size: size || null
      }
    })
  }

  // Handle Wishlist logic
  if (type === 'wishlist') {
    // Check if this specific variant/size is already in wishlist
    const existing = await prisma.cart.findFirst({
      where: { 
        user_id, 
        product_id, 
        type: 'wishlist',
        variant_name: variant_name || null,
        size: size || null
      }
    })

    if (existing) return { message: 'Already in wishlist' }

    return await prisma.cart.create({
      data: {
        user_id,
        product_id,
        type: 'wishlist',
        quantity: 1,
        variant_name: variant_name || null,
        size: size || null
      }
    })
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid type' })
})
