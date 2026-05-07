export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const baseUrl = process.env.DISTRICT_API_URL || 'https://wilayah.id/api'
  
  try {
    return await $fetch(`${baseUrl}/regencies/${id}.json`)
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal mengambil data kota/kabupaten' })
  }
})
