export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = process.env.DISTRICT_API_URL || 'https://wilayah.id/api'
  
  try {
    return await $fetch(`${baseUrl}/provinces.json`) as any
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengambil data provinsi' })
  }
})
