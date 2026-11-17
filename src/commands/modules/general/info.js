import { F } from '#helpers/index.js'
import { commandRegistry } from '#commands/registry.js'
import SETTINGS from '#environment/settings.js'

export default {
  name: 'info',
  aliases: ['about', 'botinfo'],
  category: 'general',
  description: 'Info bot: uptime, memori, jumlah command',
  usage: ['info'],
  examples: ['info'],
  cooldown: 10_000,

  async execute(ctx) {
    const uptime = F.formatDuration(process.uptime() * 1000)
    const mem = process.memoryUsage()
    const memMB = (mem.heapUsed / 1024 / 1024).toFixed(1)

    const text = [
      `*🤖 ${SETTINGS.botName}*`,
      '',
      `⏱ Uptime: *${uptime}*`,
      `💾 Memory: *${memMB} MB*`,
      `📦 Commands: *${commandRegistry.count()}*`,
      `🟢 Status: *Online*`,
    ].join('\n')

    await ctx.reply(text)
  },
}
