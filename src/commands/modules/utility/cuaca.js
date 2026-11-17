import { downloaderService } from '#features/downloader.js'

export default {
  name: 'cuaca',
  aliases: ['weather', 'cekcuaca'],
  category: 'utility',
  description: 'Cek cuaca saat ini di suatu kota',
  usage: ['cuaca <nama kota>'],
  examples: ['cuaca Jakarta', 'cuaca Bandung'],
  cooldown: 10_000,

  async execute(ctx) {
    const city = ctx.rawArgs
    if (!city) return ctx.usage('Cara pakai: `!cuaca <nama kota>`\nContoh: `!cuaca Jakarta`')

    try {
      const data = await downloaderService.fetchJson(`https://wttr.in/${encodeURIComponent(city)}`, {
        format: '%l|%C|%t|%f|%h|%w|%p', lang: 'id',
      })
      const [loc, cond, temp, feels, hum, wind, rain] = String(data).trim().split('|')
      if (!cond || /unknown location|not found/i.test(String(data))) return ctx.reply(`❌ Kota "${city}" tidak ditemukan.`)

      await ctx.reply([
        `🌤️ *Cuaca ${loc?.trim() || city}*`,
        '',
        `☁️ Kondisi   : ${cond}`,
        `🌡️ Suhu      : ${temp} (terasa ${feels})`,
        `💧 Kelembapan: ${hum}`,
        `💨 Angin     : ${wind}`,
        `🌧️ Hujan     : ${rain}`,
      ].join('\n'))
    } catch (err) {
      // wttr.in membalas 404/500 untuk nama kota yang tidak dikenal
      await ctx.reply([404, 500].includes(err.status) ? `❌ Kota "${city}" tidak ditemukan.` : `❌ ${err.message}`)
    }
  },
}
