import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { 
    user_id, label, recipient_name, phone,
    province_code, province_name, city_code, city_name,
    district_code, district_name, village_code, village_name,
    postal_code, street_address, is_primary
  } = body

  if (!user_id) throw createError({ statusCode: 400, statusMessage: 'User ID required' })

  // 1. Check limit (max 3)
  const count = await prisma.address.count({ where: { user_id } })
  if (count >= 3) {
    throw createError({ statusCode: 400, statusMessage: 'Maksimal 3 alamat diperbolehkan' })
  }

  // 2. If this is primary, unset others
  if (is_primary || count === 0) {
    await prisma.address.updateMany({
      where: { user_id },
      data: { is_primary: false }
    })
  }

  // 3. Create
  const address = await prisma.address.create({
    data: {
      user_id, label, recipient_name, phone,
      province_code, province_name, city_code, city_name,
      district_code, district_name, village_code, village_name,
      postal_code, street_address,
      is_primary: is_primary || count === 0 // First address is always primary
    }
  })

  return { success: true, address }
})
