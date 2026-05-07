import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'Name is required' })

  return await prisma.gender.create({
    data: {
      name: body.name
    }
  })
})
