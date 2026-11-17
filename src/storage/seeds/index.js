import { initializeDatabase } from '#storage/initializer.js'
import { logger } from '#helpers/logger.js'

await initializeDatabase()
const { seedInitialData } = await import('./initial-data.js')
seedInitialData()
logger.info('Seed complete — run: npm start')
