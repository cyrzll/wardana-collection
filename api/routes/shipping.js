const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/cost', async (req, res) => {
  const { destination_name, weight = 1000, courier = 'jne' } = req.body;
  
  const apiKey = process.env.RAJA_ONGKIR_API_KEY || '';
  const baseUrl = process.env.RAJA_ONGKIR_API_URL || 'https://rajaongkir.komerce.id/api/v1/';
  
  if (!destination_name) {
    return res.status(400).json({ error: 'Destination name required' });
  }

  console.log('--- Shipping Calculation Start ---');
  console.log('Destination Name:', destination_name);
  console.log('Weight:', weight);

  try {
    // 1. Search for destination ID
    const cleanName = destination_name
      .replace(/KOTA /gi, '')
      .replace(/KABUPATEN /gi, '')
      .replace(/KAB\. /gi, '')
      .trim();
    
    console.log('Searching for Clean Name:', cleanName);

    let searchRes = await axios.get(`${baseUrl}destination/domestic-destination`, {
      params: { search: cleanName },
      headers: { key: apiKey }
    });
    
    let destinations = searchRes.data?.data || [];
    console.log('Search Results Count:', destinations.length);
    
    if (destinations.length === 0) {
      console.log('No results for clean name, trying full name:', destination_name);
      const fallbackRes = await axios.get(`${baseUrl}destination/domestic-destination`, {
        params: { search: destination_name },
        headers: { key: apiKey }
      });
      destinations = fallbackRes.data?.data || [];
    }

    if (destinations.length === 0) {
      console.error('Destination not found even with fallback');
      return res.status(404).json({ error: 'Destinasi tidak ditemukan di database RajaOngkir' });
    }
    
    const destinationId = destinations[0].id;
    console.log('Found Destination ID:', destinationId, 'Label:', destinations[0].label);
    
    // 2. Search for Origin ID (Kediri)
    const originSearch = await axios.get(`${baseUrl}destination/domestic-destination`, {
      params: { search: 'Kediri' },
      headers: { key: apiKey }
    });
    const origins = originSearch.data?.data || [];
    const originId = origins.find(o => o.label.toUpperCase().includes('KOTA KEDIRI'))?.id || origins[0]?.id || 1391;
    console.log('Using Origin ID:', originId);

    // 3. Get Shipping Cost
    const allCouriers = 'jne:sicepat:jnt:tiki:pos:anteraja:wahana';
    console.log('Calculating cost for couriers:', allCouriers);
    
    const params = new URLSearchParams();
    params.append('origin', originId.toString());
    params.append('destination', destinationId.toString());
    params.append('weight', weight.toString());
    params.append('courier', allCouriers);
    params.append('price', 'lowest');

    const costRes = await axios.post(`${baseUrl}calculate/domestic-cost`, params, {
      headers: { 
        'key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('RajaOngkir Response Status:', costRes.data?.meta?.code);
    console.log('Shipping Options Found:', costRes.data?.data?.length || 0);

    res.json(costRes.data);
  } catch (error) {
    console.error('--- Shipping Error Details ---');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data));
    }
    
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.meta?.message || 'Gagal menghitung ongkir' 
    });
  }
});

module.exports = router;
