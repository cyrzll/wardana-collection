import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const category_id = query.category_id ? parseInt(query.category_id as string) : undefined
  const gender_id = query.gender_id ? parseInt(query.gender_id as string) : undefined

  const products = await prisma.product.findMany({
    where: {
      category_id,
      gender_id
    },
    include: {
      category: true,
      gender: true
    }
  })

  return products.map((p: any) => ({ 
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    category_id: p.category_id,
    gender_id: p.gender_id,
    category_name: p.category?.name,
    gender_name: p.gender?.name,
    images: JSON.parse(p.images || '[]'),
    options: JSON.parse(p.options || '[]'),
    sizes: JSON.parse(p.sizes || '[]'),
    cost_price: p.cost_price || 0,
    selling_price: p.selling_price || 0,
    discount: p.discount || 0,
    stock: p.stock || 0,
    variants: p.variants ? JSON.parse(p.variants) : []
  }))
})
