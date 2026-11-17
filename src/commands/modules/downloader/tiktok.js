import { ytdlp } from '#features/platforms/ytdlp.js'
import { tiktokService } from '#features/platforms/tiktok.js'
import { downloaderService } from '#features/downloader.js'

export default {
  name: 'tiktok',
  aliases: ['tt', 'tiktokdl'],
  category: 'downloader',
  description: 'Unduh video / slideshow TikTok tanpa watermark',
  usage: ['tiktok <link>'],
  examples: ['tiktok https://vt.tiktok.com/ZSabc123/', 'tt https://www.tiktok.com/@user/video/123'],
  cooldown: 30_000,

  async execute(ctx) {
    const url = ctx.args[0]
    if (!url) return ctx.usage('Cara pakai: `!tiktok <link>`\nContoh: `!tt https://vt.tiktok.com/ZSabc123/`')

    await ctx.typing()
    await ctx.react('⏳')

    try {
      const result = await tiktokService.resolve(url)

      if (result.type === 'video') {
        const buf = await tiktokService.toBuffer(result.url, result._cookie)
        await ctx.sendMedia('video', buf, `🎵 ${result.title || ''}\n👤 ${result.author || ''}`, { mimetype: 'video/mp4' })
      } else if (result.type === 'slideshow') {
        for (const imgUrl of result.images.slice(0, 10)) {
          const buf = await downloaderService.toBuffer(imgUrl)
          await ctx.sendMedia('image', buf, `📸 ${result.title}\n👤 ${result.author}`)
        }
      } else if (result.type === 'audio') {
        const buf = await tiktokService.toBuffer(result.url, result._cookie)
        await ctx.sendMedia('audio', buf, `🎵 ${result.title}\n👤 ${result.author}`, { mimetype: 'audio/mpeg', ptt: false })
      }

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
