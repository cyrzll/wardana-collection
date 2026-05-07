import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user_id = parseInt(query.user_id as string)

  if (!user_id) return { cart: [], wishlist: [] }

  const items = await prisma.cart.findMany({
    where: { user_id },
    include: {
      product: true
    },
    orderBy: { created_at: 'desc' }
  })

  // Format the response
  const cart = items.filter(i => i.type === 'cart').map(i => {
    const product = i.product
    const variants = JSON.parse(product.variants || '[]')
    const selectedVariant = variants.find((v: any) => v.name === i.variant_name)
    
    // Use variant image if available, else product main image
    const displayImage = (selectedVariant?.images?.length) 
      ? selectedVariant.images[0] 
      : JSON.parse(product.images || '[]')[0]

    // Use variant price if available
    const displayPrice = selectedVariant?.price ? Math.round(selectedVariant.price * (1 - (selectedVariant.discount / 100))) : product.price

    return {
      id: i.id,
      product_id: i.product_id,
      name: product.name,
      image: displayImage,
      price: displayPrice,
      quantity: i.quantity,
      variant: i.variant_name,
      size: i.size
    }
  })

  const wishlist = items.filter(i => i.type === 'wishlist').map(i => {
    const product = i.product
    const variants = JSON.parse(product.variants || '[]')
    const selectedVariant = variants.find((v: any) => v.name === i.variant_name)
    
    const displayImage = (selectedVariant?.images?.length)
      ? selectedVariant.images[0]
      : JSON.parse(product.images || '[]')[0]

    return {
      id: i.id,
      product_id: i.product_id,
      name: product.name,
      image: displayImage,
      price: product.price,
      variant: i.variant_name,
      size: i.size
    }
  })

  return { cart, wishlist }
})
