import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id || '0')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID required' })
  
  await prisma.voucher.delete({
    where: { id }
  })

  return { success: true }
})
