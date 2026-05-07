export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { destination_name, weight = 1000, courier = 'jne' } = body
  
  const apiKey = (process.env.RAJA_ONGKIR_API_KEY as string) || ''
  const baseUrl = process.env.RAJA_ONGKIR_API_URL || 'https://rajaongkir.komerce.id/api/v1/'
  
  if (!destination_name) {
    throw createError({ statusCode: 400, statusMessage: 'Destination name required' })
  }

  console.log('--- Shipping Calculation Start ---')
  console.log('Destination Name:', destination_name)
  console.log('Weight:', weight)

  try {
    // 1. Search for destination ID
    const cleanName = destination_name
      .replace(/KOTA /gi, '')
      .replace(/KABUPATEN /gi, '')
      .replace(/KAB\. /gi, '')
      .trim()
    
    console.log('Searching for Clean Name:', cleanName)

    const searchRes: any = await $fetch(`${baseUrl}destination/domestic-destination`, {
      params: { search: cleanName },
      headers: { key: apiKey } as any
    })
    
    let destinations = searchRes?.data || []
    console.log('Search Results Count:', destinations.length)
    
    if (destinations.length === 0) {
      console.log('No results for clean name, trying full name:', destination_name)
      const fallbackRes: any = await $fetch(`${baseUrl}destination/domestic-destination`, {
        params: { search: destination_name },
        headers: { key: apiKey } as any
      })
      destinations = fallbackRes?.data || []
    }

    if (destinations.length === 0) {
      console.error('Destination not found even with fallback')
      throw createError({ statusCode: 404, statusMessage: 'Destinasi tidak ditemukan di database RajaOngkir' })
    }
    
    const destinationId = destinations[0].id
    console.log('Found Destination ID:', destinationId, 'Label:', destinations[0].label)
    
    // 2. Search for Origin ID (Kediri)
    const originSearch: any = await $fetch(`${baseUrl}destination/domestic-destination`, {
      params: { search: 'Kediri' },
      headers: { key: apiKey } as any
    })
    const origins = originSearch?.data || []
    const originId = origins.find((o: any) => o.label.toUpperCase().includes('KOTA KEDIRI'))?.id || origins[0]?.id || 1391
    console.log('Using Origin ID:', originId)

    // 3. Get Shipping Cost
    const allCouriers = 'jne:sicepat:jnt:tiki:pos:anteraja:wahana'
    console.log('Calculating cost for couriers:', allCouriers)
    
    const costRes: any = await $fetch(`${baseUrl}calculate/domestic-cost`, {
      method: 'POST',
      headers: { 
        'key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      } as any,
      body: new URLSearchParams({
        origin: originId.toString(),
        destination: destinationId.toString(),
        weight: weight.toString(),
        courier: allCouriers,
        price: 'lowest'
      }).toString()
    })

    console.log('RajaOngkir Response Status:', costRes?.meta?.code)
    console.log('Shipping Options Found:', costRes?.data?.length || 0)

    return costRes
  } catch (e: any) {
    console.error('--- Shipping Error Details ---')
    console.error('Message:', e.message)
    console.error('Status:', e.statusCode)
    if (e.data) console.error('Response Data:', JSON.stringify(e.data))
    
    throw createError({ 
      statusCode: e.statusCode || 500, 
      statusMessage: e.statusMessage || 'Gagal menghitung ongkir' 
    })
  }
})
