import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const cost_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const body = await readBody(event);
  const { destination_name, weight = 1e3, courier = "jne" } = body;
  const apiKey = process.env.RAJA_ONGKIR_API_KEY || "";
  const baseUrl = process.env.RAJA_ONGKIR_API_URL || "https://rajaongkir.komerce.id/api/v1/";
  if (!destination_name) {
    throw createError({ statusCode: 400, statusMessage: "Destination name required" });
  }
  console.log("--- Shipping Calculation Start ---");
  console.log("Destination Name:", destination_name);
  console.log("Weight:", weight);
  try {
    const cleanName = destination_name.replace(/KOTA /gi, "").replace(/KABUPATEN /gi, "").replace(/KAB\. /gi, "").trim();
    console.log("Searching for Clean Name:", cleanName);
    const searchRes = await $fetch(`${baseUrl}destination/domestic-destination`, {
      params: { search: cleanName },
      headers: { key: apiKey }
    });
    let destinations = (searchRes == null ? void 0 : searchRes.data) || [];
    console.log("Search Results Count:", destinations.length);
    if (destinations.length === 0) {
      console.log("No results for clean name, trying full name:", destination_name);
      const fallbackRes = await $fetch(`${baseUrl}destination/domestic-destination`, {
        params: { search: destination_name },
        headers: { key: apiKey }
      });
      destinations = (fallbackRes == null ? void 0 : fallbackRes.data) || [];
    }
    if (destinations.length === 0) {
      console.error("Destination not found even with fallback");
      throw createError({ statusCode: 404, statusMessage: "Destinasi tidak ditemukan di database RajaOngkir" });
    }
    const destinationId = destinations[0].id;
    console.log("Found Destination ID:", destinationId, "Label:", destinations[0].label);
    const originSearch = await $fetch(`${baseUrl}destination/domestic-destination`, {
      params: { search: "Kediri" },
      headers: { key: apiKey }
    });
    const origins = (originSearch == null ? void 0 : originSearch.data) || [];
    const originId = ((_a = origins.find((o) => o.label.toUpperCase().includes("KOTA KEDIRI"))) == null ? void 0 : _a.id) || ((_b = origins[0]) == null ? void 0 : _b.id) || 1391;
    console.log("Using Origin ID:", originId);
    const allCouriers = "jne:sicepat:jnt:tiki:pos:anteraja:wahana";
    console.log("Calculating cost for couriers:", allCouriers);
    const costRes = await $fetch(`${baseUrl}calculate/domestic-cost`, {
      method: "POST",
      headers: {
        "key": apiKey,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        origin: originId.toString(),
        destination: destinationId.toString(),
        weight: weight.toString(),
        courier: allCouriers,
        price: "lowest"
      }).toString()
    });
    console.log("RajaOngkir Response Status:", (_c = costRes == null ? void 0 : costRes.meta) == null ? void 0 : _c.code);
    console.log("Shipping Options Found:", ((_d = costRes == null ? void 0 : costRes.data) == null ? void 0 : _d.length) || 0);
    return costRes;
  } catch (e) {
    console.error("--- Shipping Error Details ---");
    console.error("Message:", e.message);
    console.error("Status:", e.statusCode);
    if (e.data) console.error("Response Data:", JSON.stringify(e.data));
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || "Gagal menghitung ongkir"
    });
  }
});

export { cost_post as default };
//# sourceMappingURL=cost.post.mjs.map
