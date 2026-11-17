import { downloaderService } from '#features/downloader.js'
import { splitLangArg } from '#helpers/languages.js'

const MAX_CHARS = 200 // batas Google TTS per permintaan

export default {
  name: 'tts',
  aliases: ['speech', 'suara'],
  category: 'utility',
  description: 'Ubah teks menjadi pesan suara (maks 200 karakter)',
  usage: ['tts [kode_bahasa] <teks>'],
  examples: ['tts halo apa kabar', 'tts en good morning everyone'],
  cooldown: 5_000,

  async execute(ctx) {
    const quotedText = ctx.quoted?.text?.trim()
    const { lang, text: typed } = splitLangArg(ctx.args, 'id', !!quotedText)
    const text = typed || quotedText

    if (!text) return ctx.usage('Cara pakai: `!tts [kode_bahasa] <teks>`\nContoh: `!tts halo apa kabar` atau `!tts en good morning`')
    if (text.length > MAX_CHARS) return ctx.usage(`❌ Teks terlalu panjang (${text.length}/${MAX_CHARS} karakter).`)

    try {
      const buffer = await downloaderService.toBuffer(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`)
      await ctx.sendMedia('audio', buffer, '', { mimetype: 'audio/mpeg', ptt: false })
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
