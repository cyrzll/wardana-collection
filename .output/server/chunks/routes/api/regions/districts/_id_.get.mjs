import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const _id__get = defineEventHandler(async (event) => {
  var _a;
  const id = (_a = event.context.params) == null ? void 0 : _a.id;
  const baseUrl = process.env.DISTRICT_API_URL || "https://wilayah.id/api";
  try {
    return await $fetch(`${baseUrl}/districts/${id}.json`);
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Gagal mengambil data kecamatan" });
  }
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
