import { aiService } from '#features/ai.js'

export default {
  name: 'ai',
  aliases: ['ask', 'chat', 'gpt'],
  category: 'utility',
  description: 'Tanya jawab dengan AI (butuh API key dari owner)',
  usage: ['ai <pertanyaan>', '@bot <pertanyaan>  (mention bot)'],
  examples: ['ai jelaskan apa itu API', 'ai translate "good morning" ke bahasa Indonesia'],
  cooldown: 15_000,

  async execute(ctx) {
    if (!aiService.isAvailable()) return ctx.usage('AI tidak tersedia — owner belum mengisi API key di `.env`.')

    const prompt = ctx.rawArgs || ctx.quoted?.text?.trim()
    if (!prompt) return ctx.usage('Cara pakai: `!ai <pertanyaan>`\nContoh: `!ai jelaskan apa itu API`')

    await ctx.typing()
    await ctx.react('🤖')

    try {
      const response = await aiService.chat(prompt)
      await ctx.reply(`🤖 *AI Response*\n\n${response}`)
    } catch (err) {
      await ctx.reply(`❌ ${err.message}`)
    }
  },
}
