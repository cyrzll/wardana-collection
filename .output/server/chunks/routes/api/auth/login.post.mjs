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

const login_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { email: identifier, password } = body;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier }
      ],
      password
    }
  });
  if (!user) throw createError({ statusCode: 401, statusMessage: "Invalid credentials" });
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      level: user.level,
      profile_image: user.profile_image
    }
  };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
