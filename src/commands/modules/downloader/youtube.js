import { youtubeService } from '#features/platforms/youtube.js'
import { F } from '#helpers/index.js'

const AUDIO_WORDS = new Set(['audio', 'a', 'mp3'])

export default {
  name: 'youtube',
  aliases: ['yt', 'ytdl', 'yta', 'ytmp3'],
  category: 'downloader',
  description: 'Unduh video atau audio (MP3) dari YouTube',
  usage: ['youtube <link>', 'youtube audio <link>', 'yta <link>'],
  examples: ['youtube https://youtu.be/dQw4w9WgXcQ', 'yta https://youtu.be/dQw4w9WgXcQ'],
  cooldown: 30_000,

  async execute(ctx) {
    // !yta / !ytmp3 selalu audio; !youtube audio <link> juga audio
    const audioOnly = ['yta', 'ytmp3'].includes(ctx.commandName) || AUDIO_WORDS.has(ctx.args[0]?.toLowerCase())
    const url = ctx.args.find(a => /youtu/i.test(a))

    if (!url) return ctx.usage('Cara pakai:\n`!youtube <link>` — video\n`!youtube audio <link>` atau `!yta <link>` — audio')

    await ctx.typing()
    await ctx.react('⏳')

    try {
      const r = await youtubeService.download(url, { audioOnly })
      const duration = F.formatDuration((r.duration || 0) * 1000)

      if (audioOnly) {
        await ctx.sendMedia('audio', r.buffer, '', { mimetype: 'audio/mpeg', ptt: false })
      } else {
        const info = [`🎬 ${r.title}`, r.duration ? `⏱ ${duration}` : '', r.quality ? `📺 ${r.quality}` : ''].filter(Boolean).join('\n')
        const note = r.silent ? '\n_Video tanpa suara — coba `!yta` untuk audionya._' : ''
        await ctx.sendMedia('video', r.buffer, info + note, { mimetype: 'video/mp4' })
      }
      await ctx.react('✅')
    } catch (err) {
      await ctx.react('❌')
      await ctx.usage(`❌ ${err.message}`)
    }
  },
}
