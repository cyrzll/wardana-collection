import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
import { p as prisma } from '../../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const available_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const user_id = parseInt(query.user_id);
  if (!user_id) return [];
  const allActive = await prisma.voucher.findMany({
    where: {
      status: "active",
      // Optional: add date filtering
      OR: [
        { end_date: null },
        { end_date: { gt: /* @__PURE__ */ new Date() } }
      ]
    },
    include: {
      user_vouchers: {
        where: { user_id }
      }
    }
  });
  const available = allActive.filter((v) => {
    if (v.user_vouchers.length > 0) return false;
    if (v.usage_limit && v.used_count >= v.usage_limit) return false;
    if (v.target_user_type === "specific") {
      const targetIds = JSON.parse(v.target_users || "[]");
      if (!targetIds.includes(user_id)) return false;
    }
    return true;
  });
  return available.map((v) => ({
    id: v.id,
    code: v.code,
    title: v.title,
    type: v.type,
    discount_value: v.discount_value,
    discount_type: v.discount_type,
    min_purchase: v.min_purchase,
    end_date: v.end_date
  }));
});

export { available_get as default };
//# sourceMappingURL=available.get.mjs.map
