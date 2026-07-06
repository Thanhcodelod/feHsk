// =============================================================================
// Text normalization + similarity — shared by the grader and the Speaking
// module's pronunciation feedback.
// =============================================================================

/**
 * Normalize a Chinese answer for comparison:
 *  - strip whitespace
 *  - remove Chinese + ASCII punctuation
 *  - fold fullwidth ASCII to halfwidth
 *  - lowercase (affects any latin/pinyin)
 */
export function normalizeChinese(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[，。！？、；：“”‘’（）《》〈〉·—…,.!?;:()"'`~@#$%^&*_\-+=[\]{}|/\\<>]/g, "")
    .toLowerCase()
    .trim();
}

/** Strip pinyin tone diacritics + tone numbers so "nǐ hǎo" ~= "ni3 hao3". */
export function normalizePinyin(input: string): string {
  const toneMap: Record<string, string> = {
    ā: "a", á: "a", ǎ: "a", à: "a",
    ē: "e", é: "e", ě: "e", è: "e",
    ī: "i", í: "i", ǐ: "i", ì: "i",
    ō: "o", ó: "o", ǒ: "o", ò: "o",
    ū: "u", ú: "u", ǔ: "u", ù: "u",
    ǖ: "v", ǘ: "v", ǚ: "v", ǜ: "v", ü: "v",
  };
  return input
    .toLowerCase()
    .split("")
    .map((c) => toneMap[c] ?? c)
    .join("")
    .replace(/[0-9]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/** Levenshtein edit distance. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/** Similarity in [0,1] based on normalized edit distance over characters. */
export function similarity(a: string, b: string): number {
  const na = normalizeChinese(a);
  const nb = normalizeChinese(b);
  if (na.length === 0 && nb.length === 0) return 1;
  const dist = editDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/** Character-level diff for pronunciation feedback highlighting. */
export interface CharMatch {
  char: string;
  matched: boolean;
}
export function charMatches(target: string, spoken: string): CharMatch[] {
  const t = normalizeChinese(target).split("");
  const s = new Set(normalizeChinese(spoken).split(""));
  return t.map((char) => ({ char, matched: s.has(char) }));
}
