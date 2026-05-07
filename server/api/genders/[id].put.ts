import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  
  const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'Name is required' })

  return await prisma.gender.update({
    where: { id },
    data: {
      name: body.name
    }
  })
})
