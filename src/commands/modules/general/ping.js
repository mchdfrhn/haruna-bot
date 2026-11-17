export default {
  name: 'ping',
  aliases: ['p', 'latency'],
  category: 'general',
  description: 'Cek apakah bot hidup dan berapa lama responsnya',
  usage: ['ping'],
  examples: ['ping'],
  cooldown: 5_000,

  async execute(ctx) {
    const start = Date.now()
    const sent = await ctx.reply('🏓 Pong!')
    const latency = Date.now() - start
    const text = `🏓 *Pong!* \`${latency}ms\``
    // Edit pesan yang sama supaya chat tidak penuh; fallback ke pesan baru jika edit gagal
    await ctx.send({ text, edit: sent.key }).catch(() => ctx.reply(text))
  },
}
