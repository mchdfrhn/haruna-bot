// Kode bahasa (ISO 639-1) yang didukung Google Translate / TTS — dipakai untuk membedakan
// kode bahasa dari kata biasa (mis. "ok", "to") pada argumen command.
export const LANG_CODES = new Set([
  'af', 'sq', 'ar', 'hy', 'bn', 'bs', 'bg', 'ca', 'zh', 'hr', 'cs', 'da', 'nl', 'en', 'eo', 'et', 'tl', 'fi', 'fr',
  'de', 'el', 'gu', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'jw', 'kn', 'km', 'ko', 'la', 'lv', 'ml', 'mr', 'my', 'ne',
  'no', 'pl', 'pt', 'pa', 'ro', 'ru', 'sr', 'si', 'sk', 'es', 'su', 'sw', 'sv', 'ta', 'te', 'th', 'tr', 'uk', 'ur',
  'vi', 'cy',
])

// Pecah "<lang?> <teks>" → { lang, text }. Kode bahasa hanya dikenali jika ada di LANG_CODES
// dan masih ada teks setelahnya (atau teks diambil dari pesan yang di-reply).
export function splitLangArg(args, fallbackLang, hasFallbackText = false) {
  const first = args[0]?.toLowerCase()
  if (first && LANG_CODES.has(first) && (args.length > 1 || hasFallbackText)) {
    return { lang: first, text: args.slice(1).join(' ') }
  }
  return { lang: fallbackLang, text: args.join(' ') }
}
