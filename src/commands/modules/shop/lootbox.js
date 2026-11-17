import { lootboxService } from '#features/economy/lootbox.js'

const RARITY_EMOJI = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨' }

export default {
  name: 'lootbox',
  aliases: ['gacha', 'buka', 'openbox'],
  category: 'shop',
  description: 'Buka 1 Lootbox Standar untuk dapat item acak',
  usage: ['lootbox'],
  examples: ['lootbox'],
  cooldown: 5_000,

  async execute(ctx) {
    try {
      const result = lootboxService.open(ctx.sender)
      const emoji = RARITY_EMOJI[result.rarity] ?? '🎁'
      const newBadge = result.isNew ? ' 🆕' : ''
      await ctx.reply(`🎉 *Lootbox Opened!*\n\n${emoji} *${result.item.name}* (${result.rarity})${newBadge}`)
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
