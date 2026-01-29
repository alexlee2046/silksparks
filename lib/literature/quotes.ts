/**
 * Classical Literature Quotes Database
 *
 * A curated collection of quotes from classical Chinese astrology texts.
 * Sources: 《滴天髓》《子平真诠》《穷通宝鉴》
 */

import type { LiteratureQuote } from "./types";

/**
 * Day Master (日主) quotes from 《滴天髓》
 */
const DAY_MASTER_QUOTES: LiteratureQuote[] = [
  // 甲木
  {
    id: "dty-jia-1",
    source: "滴天髓",
    chapter: "天干论·甲木",
    originalText: "甲木参天，脱胎要火",
    translation: "甲木如参天大树，要成材需要火来煅炼",
    context: "说明甲木的本性刚健，需要阳光温暖才能茁壮成长",
    category: "day_master",
    applicableDayMasters: ["甲"],
    applicableElements: ["木"],
  },
  {
    id: "dty-jia-2",
    source: "滴天髓",
    chapter: "天干论·甲木",
    originalText: "春不容金，秋不容土",
    translation: "春天的甲木不宜见金克伐，秋天不宜见土泄气",
    context: "春木旺盛怕金，秋木衰弱怕泄",
    category: "day_master",
    applicableDayMasters: ["甲"],
    applicableSeasons: ["spring", "autumn"],
  },
  // 乙木
  {
    id: "dty-yi-1",
    source: "滴天髓",
    chapter: "天干论·乙木",
    originalText: "乙木虽柔，刲羊解牛",
    translation: "乙木虽然柔弱，却能以柔克刚",
    context: "乙木如藤蔓，看似柔弱却有韧性",
    category: "day_master",
    applicableDayMasters: ["乙"],
    applicableElements: ["木"],
  },
  {
    id: "dty-yi-2",
    source: "滴天髓",
    chapter: "天干论·乙木",
    originalText: "怀丁抱丙，跨凤乘猴",
    translation: "乙木得丙丁火相助，能驾驭金气",
    context: "乙木需要火来暖身，也能借火制金",
    category: "day_master",
    applicableDayMasters: ["乙"],
  },
  // 丙火
  {
    id: "dty-bing-1",
    source: "滴天髓",
    chapter: "天干论·丙火",
    originalText: "丙火猛烈，欺霜侮雪",
    translation: "丙火威力强大，能融化霜雪",
    context: "丙火如太阳，光明磊落，威猛刚烈",
    category: "day_master",
    applicableDayMasters: ["丙"],
    applicableElements: ["火"],
  },
  {
    id: "dty-bing-2",
    source: "滴天髓",
    chapter: "天干论·丙火",
    originalText: "能煅庚金，逢辛反怯",
    translation: "丙火能煅炼庚金，却对辛金温和",
    context: "丙火与辛金相合，阳刚遇阴柔",
    category: "day_master",
    applicableDayMasters: ["丙"],
  },
  // 丁火
  {
    id: "dty-ding-1",
    source: "滴天髓",
    chapter: "天干论·丁火",
    originalText: "丁火柔中，内性昭融",
    translation: "丁火柔和，内心光明通达",
    context: "丁火如烛光，照亮黑暗，温暖细腻",
    category: "day_master",
    applicableDayMasters: ["丁"],
    applicableElements: ["火"],
  },
  {
    id: "dty-ding-2",
    source: "滴天髓",
    chapter: "天干论·丁火",
    originalText: "抱乙而孝，合壬而忠",
    translation: "丁火依附乙木而生，与壬水相合而专一",
    context: "丁火需要木生，与壬水相合成木",
    category: "day_master",
    applicableDayMasters: ["丁"],
  },
  // 戊土
  {
    id: "dty-wu-1",
    source: "滴天髓",
    chapter: "天干论·戊土",
    originalText: "戊土固重，既中且正",
    translation: "戊土厚重稳固，居中守正",
    context: "戊土如高山大地，稳重可靠",
    category: "day_master",
    applicableDayMasters: ["戊"],
    applicableElements: ["土"],
  },
  {
    id: "dty-wu-2",
    source: "滴天髓",
    chapter: "天干论·戊土",
    originalText: "静翕动辟，万物司命",
    translation: "静时收敛，动时开放，主宰万物",
    context: "戊土包容万物，是五行中的调和者",
    category: "day_master",
    applicableDayMasters: ["戊"],
  },
  // 己土
  {
    id: "dty-ji-1",
    source: "滴天髓",
    chapter: "天干论·己土",
    originalText: "己土卑湿，中正蓄藏",
    translation: "己土低洼润湿，蓄藏万物",
    context: "己土如田园沃土，滋养生命",
    category: "day_master",
    applicableDayMasters: ["己"],
    applicableElements: ["土"],
  },
  {
    id: "dty-ji-2",
    source: "滴天髓",
    chapter: "天干论·己土",
    originalText: "不愁木盛，不畏水狂",
    translation: "不怕木多克伐，不惧水多泛滥",
    context: "己土柔顺能化，包容性强",
    category: "day_master",
    applicableDayMasters: ["己"],
  },
  // 庚金
  {
    id: "dty-geng-1",
    source: "滴天髓",
    chapter: "天干论·庚金",
    originalText: "庚金带煞，刚健为最",
    translation: "庚金带有杀气，刚健无比",
    context: "庚金如刀剑斧钺，果断刚毅",
    category: "day_master",
    applicableDayMasters: ["庚"],
    applicableElements: ["金"],
  },
  {
    id: "dty-geng-2",
    source: "滴天髓",
    chapter: "天干论·庚金",
    originalText: "得水而清，得火而锐",
    translation: "得水淬炼则清明，得火锻造则锋利",
    context: "庚金需要水火相济才能成器",
    category: "day_master",
    applicableDayMasters: ["庚"],
  },
  // 辛金
  {
    id: "dty-xin-1",
    source: "滴天髓",
    chapter: "天干论·辛金",
    originalText: "辛金软弱，温润而清",
    translation: "辛金柔软，温润清雅",
    context: "辛金如珠宝美玉，精致敏感",
    category: "day_master",
    applicableDayMasters: ["辛"],
    applicableElements: ["金"],
  },
  {
    id: "dty-xin-2",
    source: "滴天髓",
    chapter: "天干论·辛金",
    originalText: "畏土之叠，乐水之盈",
    translation: "怕土多埋没，喜水多滋润",
    context: "辛金需要水来洗涤，才能显出光华",
    category: "day_master",
    applicableDayMasters: ["辛"],
  },
  // 壬水
  {
    id: "dty-ren-1",
    source: "滴天髓",
    chapter: "天干论·壬水",
    originalText: "壬水通河，能泄金气",
    translation: "壬水如江河，能泄金之气",
    context: "壬水浩荡，智慧深邃",
    category: "day_master",
    applicableDayMasters: ["壬"],
    applicableElements: ["水"],
  },
  {
    id: "dty-ren-2",
    source: "滴天髓",
    chapter: "天干论·壬水",
    originalText: "刚中之德，周流不滞",
    translation: "外柔内刚，周流不息",
    context: "壬水虽柔却有刚性，流动不止",
    category: "day_master",
    applicableDayMasters: ["壬"],
  },
  // 癸水
  {
    id: "dty-gui-1",
    source: "滴天髓",
    chapter: "天干论·癸水",
    originalText: "癸水至弱，达于天津",
    translation: "癸水虽弱，却能通达天际",
    context: "癸水如雨露，滋润万物",
    category: "day_master",
    applicableDayMasters: ["癸"],
    applicableElements: ["水"],
  },
  {
    id: "dty-gui-2",
    source: "滴天髓",
    chapter: "天干论·癸水",
    originalText: "龙德而运，功化斯神",
    translation: "得龙（辰）之德而运行，功效神奇",
    context: "癸水遇辰土为龙入大海",
    category: "day_master",
    applicableDayMasters: ["癸"],
  },
];

/**
 * Strength (旺衰) quotes
 */
const STRENGTH_QUOTES: LiteratureQuote[] = [
  {
    id: "zpzy-strength-1",
    source: "子平真诠",
    chapter: "论用神",
    originalText: "日主弱者宜扶，日主强者宜抑",
    translation: "日主弱需要扶持，日主强需要抑制",
    context: "用神取法的基本原则",
    category: "strength",
    applicableStrengths: ["弱", "极弱", "旺", "极旺"],
  },
  {
    id: "zpzy-strength-2",
    source: "子平真诠",
    chapter: "论用神",
    originalText: "用神专求月令，以日干配月令地支",
    translation: "用神主要看月令，以日干与月支的关系为主",
    context: "强调月令在判断旺衰中的重要性",
    category: "strength",
  },
  {
    id: "dty-strength-1",
    source: "滴天髓",
    chapter: "形气论",
    originalText: "强者抑之，弱者扶之",
    translation: "强的要压制，弱的要扶持",
    context: "取用神的基本法则",
    category: "strength",
  },
  {
    id: "dty-strength-2",
    source: "滴天髓",
    chapter: "形气论",
    originalText: "旺者宜泄，衰者宜生",
    translation: "旺盛的需要泄耗，衰弱的需要生扶",
    context: "平衡五行的原则",
    category: "strength",
    applicableStrengths: ["旺", "极旺", "弱", "极弱"],
  },
];

/**
 * Ten Gods (十神) quotes
 */
const TEN_GODS_QUOTES: LiteratureQuote[] = [
  // 印
  {
    id: "zpzy-yin-1",
    source: "子平真诠",
    chapter: "论印绶",
    originalText: "印绶主聪明，主慈善，主清高",
    translation: "印绶代表聪明智慧、慈善心肠、清高品格",
    context: "印绶的正面特质",
    category: "ten_gods",
    applicableTenGods: ["正印", "偏印"],
  },
  {
    id: "zpzy-yin-2",
    source: "子平真诠",
    chapter: "论印绶",
    originalText: "印绶喜官杀生印，忌财星坏印",
    translation: "印绶喜欢官杀来生，忌讳财星来破坏",
    context: "印绶的喜忌",
    category: "ten_gods",
    applicableTenGods: ["正印", "偏印"],
  },
  // 官
  {
    id: "zpzy-guan-1",
    source: "子平真诠",
    chapter: "论正官",
    originalText: "正官佩印，位尊身荣",
    translation: "正官配印绶，地位尊贵身份荣耀",
    context: "官印相生的组合",
    category: "ten_gods",
    applicableTenGods: ["正官"],
  },
  {
    id: "zpzy-guan-2",
    source: "子平真诠",
    chapter: "论七杀",
    originalText: "七杀有制，化为权星",
    translation: "七杀被制约，就能转化为权力",
    context: "七杀的转化",
    category: "ten_gods",
    applicableTenGods: ["偏官"],
  },
  // 财
  {
    id: "zpzy-cai-1",
    source: "子平真诠",
    chapter: "论财",
    originalText: "财旺生官，富贵双全",
    translation: "财运旺盛能生官，富贵兼得",
    context: "财生官的组合",
    category: "ten_gods",
    applicableTenGods: ["正财", "偏财"],
  },
  // 食伤
  {
    id: "zpzy-shi-1",
    source: "子平真诠",
    chapter: "论食神",
    originalText: "食神制杀，英雄独立",
    translation: "食神制约七杀，能成就英雄事业",
    context: "食神制杀的格局",
    category: "ten_gods",
    applicableTenGods: ["食神"],
  },
  {
    id: "zpzy-shang-1",
    source: "子平真诠",
    chapter: "论伤官",
    originalText: "伤官见官，为祸百端",
    translation: "伤官遇到正官，容易招祸",
    context: "伤官见官的忌讳",
    category: "ten_gods",
    applicableTenGods: ["伤官"],
  },
  // 比劫
  {
    id: "zpzy-bi-1",
    source: "子平真诠",
    chapter: "论比劫",
    originalText: "比劫帮身，最忌财多",
    translation: "比劫帮助日主，最忌财多",
    context: "比劫的作用和忌讳",
    category: "ten_gods",
    applicableTenGods: ["比肩", "劫财"],
  },
];

/**
 * Wu Xing (五行) quotes
 */
const WU_XING_QUOTES: LiteratureQuote[] = [
  {
    id: "qtbj-wood-1",
    source: "穷通宝鉴",
    chapter: "木论",
    originalText: "木生于春，喜有火暖",
    translation: "木在春天生长，喜欢有火来温暖",
    context: "春木的喜忌",
    category: "wu_xing",
    applicableElements: ["木"],
    applicableSeasons: ["spring"],
  },
  {
    id: "qtbj-fire-1",
    source: "穷通宝鉴",
    chapter: "火论",
    originalText: "火生于夏，喜有水济",
    translation: "火在夏天旺盛，喜欢有水来调和",
    context: "夏火的喜忌",
    category: "wu_xing",
    applicableElements: ["火"],
    applicableSeasons: ["summer"],
  },
  {
    id: "qtbj-metal-1",
    source: "穷通宝鉴",
    chapter: "金论",
    originalText: "金生于秋，喜有水淘",
    translation: "金在秋天旺盛，喜欢有水来淘洗",
    context: "秋金的喜忌",
    category: "wu_xing",
    applicableElements: ["金"],
    applicableSeasons: ["autumn"],
  },
  {
    id: "qtbj-water-1",
    source: "穷通宝鉴",
    chapter: "水论",
    originalText: "水生于冬，喜有火暖",
    translation: "水在冬天旺盛，喜欢有火来温暖",
    context: "冬水的喜忌",
    category: "wu_xing",
    applicableElements: ["水"],
    applicableSeasons: ["winter"],
  },
  {
    id: "qtbj-earth-1",
    source: "穷通宝鉴",
    chapter: "土论",
    originalText: "土旺四季，最喜甲木疏之",
    translation: "土在四季都旺，最喜欢甲木来疏通",
    context: "土的特性和喜忌",
    category: "wu_xing",
    applicableElements: ["土"],
  },
];

/**
 * General wisdom quotes
 */
const GENERAL_QUOTES: LiteratureQuote[] = [
  {
    id: "dty-gen-1",
    source: "滴天髓",
    chapter: "通神论",
    originalText: "命理之学，在乎通变",
    translation: "命理学问，重在灵活变通",
    context: "强调命理的灵活性",
    category: "general",
  },
  {
    id: "zpzy-gen-1",
    source: "子平真诠",
    chapter: "总论",
    originalText: "八字贵在中和，过与不及皆非",
    translation: "八字贵在平衡中和，太过或不及都不好",
    context: "强调平衡的重要性",
    category: "general",
  },
  {
    id: "smth-gen-1",
    source: "三命通会",
    chapter: "论命总诀",
    originalText: "看命先看身强弱，次看用神得失",
    translation: "论命首先看日主强弱，其次看用神是否得力",
    context: "论命的基本步骤",
    category: "general",
  },
];

/**
 * All quotes combined
 */
export const ALL_QUOTES: LiteratureQuote[] = [
  ...DAY_MASTER_QUOTES,
  ...STRENGTH_QUOTES,
  ...TEN_GODS_QUOTES,
  ...WU_XING_QUOTES,
  ...GENERAL_QUOTES,
];

/**
 * Get quotes count
 */
export function getQuotesCount(): number {
  return ALL_QUOTES.length;
}

/**
 * Get quotes by category
 */
export function getQuotesByCategory(
  category: LiteratureQuote["category"]
): LiteratureQuote[] {
  return ALL_QUOTES.filter((q) => q.category === category);
}

/**
 * Get quotes by source
 */
export function getQuotesBySource(
  source: LiteratureQuote["source"]
): LiteratureQuote[] {
  return ALL_QUOTES.filter((q) => q.source === source);
}
