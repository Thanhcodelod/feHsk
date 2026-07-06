// =============================================================================
// Lightweight pinyin support for the reading "toggle pinyin" feature.
//
// Accurate pinyin for arbitrary text requires a full dictionary + segmentation,
// which is out of scope for an offline demo. Strategy:
//   1. Prefer explicit, hand-aligned pinyin supplied by the seed data (each
//      Chinese string can carry space-separated syllables, one per character).
//   2. Fall back to a built-in map of the most common HSK characters so the
//      toggle still does something useful when pinyin wasn't supplied.
// =============================================================================

/** Common single-character pinyin (subset — extend freely). */
export const COMMON_PINYIN: Record<string, string> = {
  我: "wǒ", 你: "nǐ", 他: "tā", 她: "tā", 们: "men", 的: "de", 是: "shì",
  不: "bù", 了: "le", 在: "zài", 有: "yǒu", 和: "hé", 人: "rén", 这: "zhè",
  那: "nà", 中: "zhōng", 国: "guó", 大: "dà", 小: "xiǎo", 上: "shàng",
  下: "xià", 来: "lái", 去: "qù", 好: "hǎo", 会: "huì", 说: "shuō", 话: "huà",
  看: "kàn", 听: "tīng", 读: "dú", 写: "xiě", 学: "xué", 生: "shēng",
  老: "lǎo", 师: "shī", 朋: "péng", 友: "yǒu", 家: "jiā", 里: "lǐ", 想: "xiǎng",
  要: "yào", 吃: "chī", 饭: "fàn", 喝: "hē", 茶: "chá", 水: "shuǐ", 天: "tiān",
  日: "rì", 月: "yuè", 年: "nián", 今: "jīn", 明: "míng", 昨: "zuó",
  时: "shí", 候: "hòu", 现: "xiàn", 点: "diǎn", 分: "fēn", 星: "xīng",
  期: "qī", 很: "hěn", 太: "tài", 都: "dōu", 也: "yě", 就: "jiù", 还: "hái",
  没: "méi", 能: "néng", 可: "kě", 以: "yǐ", 因: "yīn", 为: "wèi", 所: "suǒ",
  但: "dàn", 如: "rú", 果: "guǒ", 什: "shén", 么: "me", 谁: "shuí", 哪: "nǎ",
  怎: "zěn", 样: "yàng", 多: "duō", 少: "shǎo", 钱: "qián", 买: "mǎi",
  卖: "mài", 东: "dōng", 西: "xī", 南: "nán", 北: "běi", 车: "chē", 走: "zǒu",
  坐: "zuò", 站: "zhàn", 高: "gāo", 兴: "xìng", 爱: "ài", 喜: "xǐ", 欢: "huān",
  工: "gōng", 作: "zuò", 事: "shì", 问: "wèn", 题: "tí", 回: "huí", 答: "dá",
  对: "duì", 错: "cuò", 真: "zhēn", 觉: "jué", 得: "de", 意: "yì", 思: "sī",
  开: "kāi", 始: "shǐ", 完: "wán", 用: "yòng", 到: "dào", 从: "cóng",
  给: "gěi", 让: "ràng", 把: "bǎ", 被: "bèi", 比: "bǐ", 最: "zuì", 更: "gèng",
  非: "fēi", 常: "cháng", 身: "shēn", 体: "tǐ", 医: "yī",
  院: "yuàn", 电: "diàn", 脑: "nǎo", 视: "shì", 影: "yǐng", 书: "shū",
  报: "bào", 纸: "zhǐ", 名: "míng", 字: "zì", 男: "nán", 女: "nǚ", 孩: "hái",
  子: "zi", 爸: "bà", 妈: "mā", 哥: "gē", 姐: "jiě", 弟: "dì", 妹: "mèi",
  休: "xiū", 木: "mù", 林: "lín", 森: "sēn", 火: "huǒ", 山: "shān", 田: "tián",
  力: "lì", 拥: "yōng", 具: "jù", 启: "qǐ", 发: "fā", 示: "shì",
};

export interface RubyPair {
  char: string;
  pinyin: string;
}

/**
 * Produce ruby (character + pinyin) pairs for a Chinese string.
 * @param text   Chinese text.
 * @param pinyin Optional space-separated syllables aligned one-per-character.
 *               When omitted, falls back to COMMON_PINYIN.
 */
export function toRuby(text: string, pinyin?: string | null): RubyPair[] {
  const chars = Array.from(text);
  const syllables = pinyin ? pinyin.trim().split(/\s+/) : null;

  // Only treat supplied pinyin as aligned if the count matches the number of
  // Chinese characters (ignoring punctuation/spaces).
  const hanziOnly = chars.filter((c) => /[一-鿿]/.test(c));
  const aligned =
    syllables && syllables.length === hanziOnly.length ? syllables : null;

  let idx = 0;
  return chars.map((char) => {
    if (!/[一-鿿]/.test(char)) return { char, pinyin: "" };
    let py = "";
    if (aligned) py = aligned[idx] ?? "";
    else py = COMMON_PINYIN[char] ?? "";
    idx += 1;
    return { char, pinyin: py };
  });
}
