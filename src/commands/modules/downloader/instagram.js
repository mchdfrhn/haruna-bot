import { ytdlp } from '#features/platforms/ytdlp.js'
import { instagramService } from '#features/platforms/instagram.js'

export default {
  name: 'instagram',
  aliases: ['ig', 'igdl', 'reels'],
  category: 'downloader',
  description: 'Unduh foto/video/carousel Instagram (post & reel)',
  usage: ['instagram <link>'],
  examples: ['instagram https://www.instagram.com/reel/AbCdEf/', 'ig https://www.instagram.com/p/AbCdEf/'],
  cooldown: 30_000,

  async execute(ctx) {
    const url = ctx.args[0]
    if (!url) return ctx.usage('Cara pakai: `!instagram <link>`\nContoh: `!ig https://www.instagram.com/reel/AbCdEf/`')

    await ctx.typing()
    await ctx.react('⏳')

    try {
      const result = await instagramService.resolve(url)

      if (result.type === 'carousel') {
        for (const item of result.items.slice(0, 10)) {
          const buf = await instagramService.toBuffer(item.url)
          await ctx.sendMedia(item.type === 'video' ? 'video' : 'image', buf, '', { mimetype: item.type === 'video' ? 'video/mp4' : 'image/jpeg' })
        }
      } else if (result.type === 'video') {
        const buf = await instagramService.toBuffer(result.url)
        await ctx.sendMedia('video', buf, '', { mimetype: 'video/mp4' })
      } else if (result.type === 'image') {
        const buf = await instagramService.toBuffer(result.url)
        await ctx.sendMedia('image', buf, '', { mimetype: 'image/jpeg' })
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
