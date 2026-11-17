import { shopService } from '#features/economy/shop.js'

export default {
  name: 'use',
  aliases: ['pakaiitem', 'consume'],
  category: 'shop',
  description: 'Pakai item: potion HP, EXP Booster, Bank Upgrade, Premium',
  usage: ['use <id_item>'],
  examples: ['use potion_hp_sm', 'use potion_exp', 'use bank_upgrade'],
  cooldown: 3_000,

  async execute(ctx) {
    const itemId = ctx.args[0]
    if (!itemId) return ctx.usage('Cara pakai: `!use <id_item>`\nLihat ID item di `!inventory`.')

    try {
      const { item, message } = shopService.use(ctx.sender, itemId)
      await ctx.reply(`✅ *${item.name}* dipakai!\n${message}`)
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
