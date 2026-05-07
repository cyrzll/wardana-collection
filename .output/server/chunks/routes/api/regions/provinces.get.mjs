import { d as defineEventHandler, c as createError, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const provinces_get = defineEventHandler(async (event) => {
  useRuntimeConfig();
  const baseUrl = process.env.DISTRICT_API_URL || "https://wilayah.id/api";
  try {
    return await $fetch(`${baseUrl}/provinces.json`);
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Gagal mengambil data provinsi" });
  }
});

export { provinces_get as default };
//# sourceMappingURL=provinces.get.mjs.map
