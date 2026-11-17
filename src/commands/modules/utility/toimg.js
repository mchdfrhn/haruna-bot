import { webpToPng } from '#features/media/sticker.js'

export default {
  name: 'toimg',
  aliases: ['toimage', 'jpg', 'png'],
  category: 'utility',
  description: 'Ubah stiker menjadi gambar PNG (stiker animasi: frame pertama)',
  usage: ['toimg'],
  examples: ['(reply stiker) !toimg'],
  cooldown: 10_000,

  async execute(ctx) {
    const q = ctx.quoted
    if (!q?.isMedia || !q.mimetype?.includes('webp')) return ctx.usage('*Reply* sebuah stiker dengan `!toimg`.')

    await ctx.react('⏳')

    try {
      const buffer = await ctx.downloadMedia()
      if (!buffer) return ctx.usage('❌ Gagal mengunduh stiker.')

      const png = await webpToPng(buffer)
      await ctx.sendMedia('image', png, q.isAnimated ? '_Stiker animasi — hanya frame pertama._' : '', { mimetype: 'image/png' })
      await ctx.react('✅')
    } catch (err) {
      await ctx.react('❌')
      await ctx.reply(`❌ Gagal mengubah stiker: ${err.message}`)
    }
  },
}
