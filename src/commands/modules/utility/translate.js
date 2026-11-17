import { downloaderService } from '#features/downloader.js'
import { splitLangArg } from '#helpers/languages.js'

// Google Translate (utama) → MyMemory (cadangan, jika Google memblokir/limit)
async function translate(text, lang) {
  try {
    const data = await downloaderService.fetchJson('https://translate.googleapis.com/translate_a/single', {
      client: 'gtx', sl: 'auto', tl: lang, dt: 't', q: text,
    })
    const result = data?.[0]?.map(p => p?.[0]).filter(Boolean).join('')
    if (result) return { result, from: typeof data?.[2] === 'string' ? data[2].toUpperCase() : 'AUTO' }
  } catch { /* lanjut ke cadangan */ }

  const data = await downloaderService.fetchJson('https://api.mymemory.translated.net/get', { q: text.slice(0, 450), langpair: `autodetect|${lang}` })
  const result = data?.responseData?.translatedText
  if (!result || data?.responseStatus !== 200) throw new Error('Layanan terjemahan sedang tidak tersedia. Coba lagi nanti.')
  return { result, from: (data.responseData.detectedLanguage || 'AUTO').toUpperCase() }
}

export default {
  name: 'translate',
  aliases: ['tl', 'terjemah'],
  category: 'utility',
  description: 'Terjemahkan teks ke bahasa lain (default: Indonesia)',
  usage: ['translate [kode_bahasa] <teks>', '(reply pesan) translate [kode_bahasa]'],
  examples: ['translate hello world', 'translate en selamat pagi', '(reply pesan) tl ja'],
  cooldown: 5_000,

  async execute(ctx) {
    const quotedText = ctx.quoted?.text?.trim()
    const { lang, text: typed } = splitLangArg(ctx.args, 'id', !!quotedText)
    const text = typed || quotedText

    if (!text) return ctx.usage('Cara pakai: `!translate [kode_bahasa] <teks>` atau reply pesan dengan `!translate [kode_bahasa]`\nContoh: `!translate en selamat pagi`')

    try {
      const { result, from } = await translate(text, lang)
      if (!result) return ctx.reply('❌ Gagal menerjemahkan.')
      await ctx.reply(`🌐 *Translate ${from} → ${lang.toUpperCase()}*\n\n${result}`)
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
