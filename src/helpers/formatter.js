export function formatDuration(ms) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`
}

export function formatNumber(n) {
  return new Intl.NumberFormat().format(n)
}

export function titleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase())
}

export function truncate(str, maxLen = 100) {
  return str.length > maxLen ? str.slice(0, maxLen - 3) + '...' : str
}

export const sleep = ms => new Promise(r => setTimeout(r, ms))

// "500" → 500, "2k" → 2000, "1.5m" → 1500000. Mengembalikan null jika bukan angka bulat positif.
export function parseAmount(input, max = Number.MAX_SAFE_INTEGER) {
  if (input == null) return null
  const m = String(input).trim().toLowerCase().replace(/[.,](?=\d{3}\b)/g, '').match(/^(\d+(?:\.\d+)?)([km])?$/)
  if (!m) return null
  const n = Math.floor(Number(m[1]) * ({ k: 1e3, m: 1e6 }[m[2]] ?? 1))
  return n > 0 && n <= max ? n : null
}
