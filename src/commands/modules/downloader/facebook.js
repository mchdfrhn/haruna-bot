import { ytdlp } from '#features/platforms/ytdlp.js'
import { facebookService } from '#features/platforms/facebook.js'

export default {
  name: 'facebook',
  aliases: ['fb', 'fbdl', 'facebookdl'],
  category: 'downloader',
  description: 'Unduh video Facebook / Reels dari link',
  usage: ['facebook <link>'],
  examples: ['facebook https://www.facebook.com/reel/123456789', 'fb https://fb.watch/abc123/'],
  cooldown: 30_000,

  async execute(ctx) {
    const url = ctx.args[0]
    if (!url) return ctx.usage('Cara pakai: `!facebook <link>`\nContoh: `!fb https://fb.watch/abc123/`')

    await ctx.typing()
    await ctx.react('⏳')

    try {
      const result = await facebookService.resolve(url)
      const buf = await facebookService.toBuffer(result.url)
      const caption = result.title ? `${result.title}\n${result.hasHd ? '📺 HD tersedia' : ''}` : ''
      await ctx.sendMedia('video', buf, caption, { mimetype: 'video/mp4' })
      await ctx.react('✅')
    } catch (err) {
      // Resolver bawaan gagal → coba yt-dlp (jika terpasang)
      const fb = await ytdlp.downloadIfAvailable(url).catch(() => null)
      if (fb) {
        await ctx.sendMedia('video', fb.buffer, fb.title, { mimetype: 'video/mp4' })
        return ctx.react('✅')
      }
      await ctx.react('❌')
      await ctx.usage(`❌ ${err.message}`)
    }
  },
}
