import { downloaderService } from '#features/downloader.js'

export default {
  name: 'wiki',
  aliases: ['wikipedia', 'ensiklopedia'],
  category: 'utility',
  description: 'Cari ringkasan artikel di Wikipedia Indonesia',
  usage: ['wiki <kata kunci>'],
  examples: ['wiki Candi Borobudur', 'wiki bank indonesia'],
  cooldown: 5_000,

  async execute(ctx) {
    const query = ctx.rawArgs
    if (!query) return ctx.usage('Cara pakai: `!wiki <kata kunci>`\nContoh: `!wiki Candi Borobudur`')

    try {
      // generator=search: toleran terhadap huruf besar/kecil & mengambil hasil paling relevan
      const data = await downloaderService.fetchJson('https://id.wikipedia.org/w/api.php', {
        action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrlimit: 1,
        prop: 'extracts|info', inprop: 'url', exintro: 1, explaintext: 1, redirects: 1, origin: '*', utf8: 1,
      })

      const page = Object.values(data?.query?.pages ?? {})[0]
      if (!page) return ctx.reply(`❌ Artikel "${query}" tidak ditemukan.`)

      const extract = (page.extract || 'Tidak ada deskripsi.').slice(0, 2000)
      await ctx.reply(`📖 *${page.title}*\n\n${extract}\n\n🔗 ${page.fullurl ?? ''}`.trimEnd())
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
