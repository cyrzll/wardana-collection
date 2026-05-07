import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { p as prisma } from '../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.email) || !(body == null ? void 0 : body.password)) {
    throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
  }
  return await prisma.user.create({
    data: {
      username: body.username || body.email.split("@")[0],
      email: body.email,
      password: body.password,
      level: body.level || "user",
      status: body.status || "active",
      profile_image: body.profile_image || "/images/profile/default-profile.jpeg"
    }
  });
});

export { index_post as default };
//# sourceMappingURL=index.post7.mjs.map
