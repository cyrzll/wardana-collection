import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) throw createError({ statusCode: 400 })

  let name = '', description = '', category_id: any = null, gender_id: any = null
  let variantsConfigRaw = '[]'

  const variantFiles: Record<string, any[]> = {}

  for (const field of formData) {
    if (field.name === 'name') name = field.data.toString()
    if (field.name === 'description') description = field.data.toString()
    if (field.name === 'category_id') category_id = parseInt(field.data.toString())
    if (field.name === 'gender_id') gender_id = parseInt(field.data.toString())
    if (field.name === 'variants_config') variantsConfigRaw = field.data.toString()

    const fieldName = field.name
    if (fieldName && fieldName.startsWith('variant_') && field.filename) {
      const match = fieldName.match(/variant_(\d+)_image_/)
      if (match) {
        const vIdx = match[1]
        if (!variantFiles[vIdx]) variantFiles[vIdx] = []
        variantFiles[vIdx].push(field)
      }
    }
  }

  const variantsConfig = JSON.parse(variantsConfigRaw)
  const uploadDir = join(process.cwd(), 'public/images/product')
  try { await mkdir(uploadDir, { recursive: true }) } catch (e) {}

  const processedVariants = []
  let totalStock = 0
  const allImages: string[] = []

  for (let i = 0; i < variantsConfig.length; i++) {
    const config = variantsConfig[i]
    const variantImages: string[] = []
    
    const files = variantFiles[i] || []
    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1000)}-${file.filename}`
      await writeFile(join(uploadDir, filename), file.data)
      const imagePath = `/images/product/${filename}`
      variantImages.push(imagePath)
      allImages.push(imagePath)
    }

    processedVariants.push({
      ...config,
      images: variantImages
    })
    totalStock += parseInt(config.stock || 0)
  }

  const firstVariant = processedVariants[0] || { price: 0, costPrice: 0, discount: 0, stock: 0, sizes: [], name: 'Default' }
  const mainPrice = Math.round(parseFloat(firstVariant.price) * (1 - (parseFloat(firstVariant.discount) / 100)))

  const product = await prisma.product.create({
    data: {
      name,
      description,
      category: category_id ? { connect: { id: category_id } } : undefined,
      gender: gender_id ? { connect: { id: gender_id } } : undefined,
      cost_price: parseFloat(firstVariant.costPrice),
      discount: parseFloat(firstVariant.discount),
      price: mainPrice,
      selling_price: parseFloat(firstVariant.price),
      stock: totalStock,
      images: JSON.stringify(allImages),
      options: JSON.stringify(processedVariants.map(v => v.name)),
      sizes: JSON.stringify([...new Set(processedVariants.flatMap(v => v.sizes))]),
      variants: JSON.stringify(processedVariants)
    }
  })

  return { id: product.id }
})
