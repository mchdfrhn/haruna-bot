import { commandRegistry } from '#commands/registry.js'
import { buildContext } from '#messages/context.js'
import { runPipeline } from '#guards/pipeline.js'
import { groupModel, botConfigModel } from '#storage/models/index.js'
import { logger } from '#helpers/logger.js'
import SETTINGS from '#environment/settings.js'

// Saat grup di-mute, hanya command ini yang masih boleh jalan (supaya admin bisa meng-unmute).
const MUTE_EXEMPT = new Set(['groupset'])

export const getPrefix = () => botConfigModel.get('bot_prefix') || SETTINGS.prefix

export async function dispatch(parsed, sock) {
  const { text, fromMe } = parsed
  if (!text) return
  if (fromMe && !SETTINGS.respondToSelf) return

  const prefix = getPrefix()
  if (!text.startsWith(prefix)) return

  const withoutPrefix = text.slice(prefix.length).trim()
  if (!withoutPrefix) return

  const [commandName] = withoutPrefix.split(/\s+/)
  if (!commandName) return

  const command = commandRegistry.get(commandName.toLowerCase())
  if (!command) return

  const ctx = buildContext(parsed, sock, { command, commandName: commandName.toLowerCase(), prefix })

  if (parsed.isGroup && groupModel.find(parsed.jid)?.mute && !MUTE_EXEMPT.has(command.name) && !ctx.isOwner()) return

  if (botConfigModel.isMaintenanceMode() && !ctx.isOwner()) {
    return ctx.reply('Bot sedang maintenance. Coba lagi nanti.').catch(() => {})
  }

  logger.debug({ command: command.name, sender: ctx.sender }, 'Command dispatched')

  try {
    if (!await runPipeline(ctx, command)) return
    await ctx.typing()
    await command.execute(ctx)
  } catch (err) {
    logger.error({ err, command: command.name, sender: ctx.sender }, 'Command error')
    await ctx.reply(`Error: ${err.message}`).catch(() => {})
  }
}
