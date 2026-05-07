import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
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

const register_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { username, email, password } = body;
  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password,
        level: "user",
        profile_image: "/images/profile/default-profile.jpeg"
      }
    });
    return { success: true, userId: user.id };
  } catch (error) {
    throw createError({ statusCode: 409, statusMessage: "User already exists" });
  }
});

export { register_post as default };
//# sourceMappingURL=register.post.mjs.map
