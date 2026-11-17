import { db } from '#storage/connection.js'

export default {
  name: 'tools',
  aliases: ['tool', 'admin'],
  category: 'owner',
  description: 'Jalankan query SQL langsung ke database (berbahaya)',
  usage: ['tools db <query SQL>'],
  examples: ['tools db SELECT COUNT(*) AS n FROM users'],
  cooldown: 0, ownerOnly: true,

  async execute(ctx) {
    const sub = ctx.args[0]?.toLowerCase()

    if (sub === 'db' || sub === 'query') {
      const query = ctx.rawArgs.replace(/^(db|query)\s+/i, '')
      if (!query) return ctx.usage('Cara pakai: `!tools db <query SQL>`')
      try {
        const result = query.trim().toUpperCase().startsWith('SELECT') ? db.prepare(query).all() : db.prepare(query).run()
        await ctx.reply(`✅ Query OK:\n\`\`\`\n${JSON.stringify(result, null, 2).slice(0, 3000)}\n\`\`\``)
      } catch (err) { await ctx.reply(`❌ ${err.message}`) }
      return
    }

    await ctx.usage('Cara pakai: `!tools db <query SQL>`')
  },
}
