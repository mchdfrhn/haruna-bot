import { statsModel } from '#storage/models/index.js'

export default {
  name: 'heal',
  aliases: ['sembuh', 'recover'],
  category: 'rpg',
  description: 'Pulihkan HP kamu sampai penuh (cooldown 1 menit)',
  usage: ['heal'],
  examples: ['heal'],
  cooldown: 60_000,

  async execute(ctx) {
    statsModel.ensure(ctx.sender)
    statsModel.fullHeal(ctx.sender)
    const stats = statsModel.find(ctx.sender)
    await ctx.reply(`❤️ *Heal berhasil!* HP penuh: ${stats.hp}/${stats.max_hp}`)
  },
}
