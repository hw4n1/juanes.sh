const WORDS_PER_MINUTE = 200;

/** Simple estimate based on the post's raw markdown. */
export function readingTime(rawBody: string, lang: string = 'en'): string {
  const text = rawBody
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_~`[\]()-]/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return lang === 'en' ? `${minutes} min read` : `${minutes} min de lectura`;
}
