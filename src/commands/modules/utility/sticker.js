import { toStickerBuffer } from '#features/media/sticker.js'

export default {
  name: 'sticker',
  aliases: ['s', 'stiker', 'sgif'],
  category: 'utility',
  description: 'Ubah gambar/video (maks 5 detik) menjadi stiker WhatsApp',
  usage: ['sticker', 'sticker <nama pack>'],
  examples: ['(kirim gambar dengan caption) !sticker', '(reply gambar/video) !sticker Koleksiku'],
  cooldown: 10_000,

  async execute(ctx) {
    if (!ctx.hasMedia()) return ctx.usage('Kirim gambar/video dengan caption `!sticker`, atau *reply* gambar/video dengan `!sticker`.')

    const mime = ctx.msg.isMedia ? ctx.msg.mimetype : ctx.quoted?.mimetype
    if (mime && !/^(image|video)\//.test(mime)) return ctx.usage('❌ Hanya gambar atau video yang bisa dijadikan stiker.')

    await ctx.react('⏳')
    await ctx.typing()

    try {
      const buffer = await ctx.downloadMedia()
      if (!buffer) return ctx.usage('❌ Gagal mengunduh media.')

      const packName = ctx.rawArgs?.trim()
      const meta = packName ? { packName, packPublish: ctx.pushName || 'HarunaBot', emojis: ['🤖'] } : {}
      const sticker = await toStickerBuffer(buffer, meta)

      await ctx.send({ sticker, mimetype: 'image/webp' })
      await ctx.react('✅')
    } catch (err) {
      await ctx.react('❌')
      await ctx.reply(`❌ Gagal membuat stiker: ${err.message}`)
    }
  },
}
