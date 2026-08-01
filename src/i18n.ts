import type { Spread } from "./types";
export type Locale = "en" | "zh-CN";
export const localeFromPath = (path: string): Locale =>
  path === "/zh" || path.startsWith("/zh/") ? "zh-CN" : "en";
export const barePath = (path: string) =>
  localeFromPath(path) === "zh-CN" ? path.slice(3) || "/" : path;
export const pathForLocale = (path: string, locale: Locale) =>
  locale === "zh-CN"
    ? `/zh${barePath(path) === "/" ? "" : barePath(path)}`
    : barePath(path);

const zh = {
  Readings: "解读",
  "Card Meanings": "牌义",
  Learn: "了解塔罗",
  "Sign in": "登录",
  Method: "解读方法",
  Safety: "安全说明",
  Privacy: "隐私",
  Terms: "条款",
  "Reflection over certainty": "重视反思，而非确定答案",
  "A QUIET SPACE FOR REFLECTION": "一个安静的自我反思空间",
  "What would you like": "你想看清",
  "clarity on?": "什么问题？",
  "Ask an open question about what you can understand, influence, or approach differently.":
    "提出一个开放式问题，关注你能够理解、影响或换一种方式面对的事情。",
  "Your question": "你的问题",
  "Begin Your Reading": "开始解读",
  "For reflection, not prediction. Your choices remain your own.":
    "用于反思，而非预测。选择权始终属于你。",
  "How it works": "如何使用",
  "Ask, choose a spread, then select your own cards.":
    "提出问题、选择牌阵，再亲手选出需要的牌。",
  "Why this reading": "为什么这样解读",
  "Every interpretation stays traceable to the exact cards you draw.":
    "每一段解释都能追溯到你实际抽到的牌。",
  "Explore tarot": "探索塔罗",
  "Learn the cards, positions and reflective method.":
    "了解牌义、牌位与我们的反思方法。",
  Explore: "查看",
  "CHOOSE A SPREAD": "选择牌阵",
  "How deeply would you like": "你想从哪个角度",
  "to explore?": "深入理解？",
  "Your question remains with you throughout the reading.":
    "你的问题会贯穿整个解读过程。",
  SELECTED: "已选择",
  AVAILABLE: "可使用",
  "COMING LATER": "即将开放",
  "A deeper reflective structure": "更深入的反思结构",
  CARDS: "张牌",
  ABOUT: "约",
  MINUTES: "分钟",
  "Continue to Shuffling": "继续洗牌",
  "Hold your question": "把问题轻轻地",
  "gently in mind.": "放在心里。",
  "Shuffle the Deck": "开始洗牌",
  "Shuffling…": "正在洗牌…",
  "The order and orientation are fixed before you choose.":
    "在你选牌前，牌序和正逆位已经固定。",
  "CHOOSE THREE CARDS": "选择三张牌",
  "CHOOSE CARDS": "选择塔罗牌",
  "Notice what": "留意哪张牌",
  "draws you in.": "吸引了你。",
  "OF 3 SELECTED": "/ 3 已选择",
  "SELECTED COUNT": "已选择",
  "Move slowly. There is no wrong choice.": "慢慢来，没有所谓选错。",
  "Reveal My Cards": "翻开我的牌",
  "Reveal My Card": "翻开我的牌",
  "Your cards are ready": "三张牌已选好",
  "Your selection is ready": "所需牌已选好",
  "Choose card": "请选择第",
  "of 3": "张，共 3 张",
  "Choose from 78 tarot cards": "从 78 张塔罗牌中选择",
  Background: "背景",
  Core: "核心",
  Guidance: "建议",
  "YOUR THREE-CARD REFLECTION": "你的三张牌解读",
  "YOUR REFLECTION": "你的塔罗解读",
  "Your cards are": "你的牌已经",
  "ready.": "准备好了。",
  "Take a breath and meet them one at a time.": "深呼吸，一张一张地看看它们。",
  upright: "正位",
  reversed: "逆位",
  "YOUR READING": "你的解读",
  "A quieter view of": "换一个更安静的角度",
  "what comes next.": "看待接下来的路。",
  "New reading": "重新解读",
  "THE THREAD BETWEEN THEM": "三张牌之间的线索",
  "THE PATTERN BETWEEN THEM": "牌与牌之间的线索",
  "Base meaning": "基础牌义",
  "In your context": "结合你的问题",
  "In relation": "与其他牌的关系",
  "Your next step": "你的下一步",
  "Interpretive confidence": "解读置信度",
  "Save reading": "保存解读",
  "Was this useful?": "这次解读有帮助吗？",
  Yes: "有帮助",
  "Not yet": "暂时没有",
  "SAVE YOUR REFLECTIONS": "保存你的解读",
  "Sign in to TAROT": "登录 TAROT",
  "Reading never requires an account. Sign in only when you want to save and revisit it.":
    "无需登录也可以完成解读。只有在你希望保存并日后回看时才需要登录。",
  "Google sign-in will appear when the production client ID is configured.":
    "Google 登录配置完成后会显示在这里。",
  "Continue without account": "不登录，继续使用",
  "Write a little more so the cards have a clear question.":
    "请再多写一点，让问题更清楚。",
  "The reading could not start.": "暂时无法开始解读。",
  "Selection failed.": "选牌失败，请重试。",
  "The cards could not be revealed.": "暂时无法翻牌，请重试。",
  "Sign in failed.": "登录失败，请重试。",
  "Page not found": "找不到页面",
  "The page you requested is not available.": "你访问的页面不存在。",
  "TAROT · LEARN": "TAROT · 了解",
  "Begin a reading": "开始一次解读",
} as const;
export type Message = keyof typeof zh;
export const text = (locale: Locale, value: Message | string) =>
  locale === "zh-CN" ? (zh as Record<string, string>)[value] || value : value;
export const initialQuestion = (locale: Locale) =>
  locale === "zh-CN"
    ? "关于人生的下一阶段，我需要理解什么？"
    : "What should I understand about my next chapter?";

const spreadZh: Record<string, [string, string[]]> = {
  "general-reflection": ["综合反思", ["背景", "核心", "建议"]],
  "relationship-reflection": [
    "关系反思",
    ["你的视角", "共同状态", "健康的下一步"],
  ],
  "work-direction": ["工作与方向", ["当前现实", "阻力", "务实的下一步"]],
  "decision-clarity": ["决策澄清", ["重要因素", "复杂因素", "下一步"]],
  "daily-reflection": ["每日一牌", []],
  "single-focus": ["一张牌反思", ["当前焦点"]],
  "past-present-next": [
    "过去、现在与下一步",
    ["过去的影响", "当前现实", "下一步发展"],
  ],
  "mind-body-spirit": ["心智、身体与精神", ["心智", "身体与现实", "内在精神"]],
  "creative-block": ["创作阻碍", []],
  "relationship-check-in": ["关系检视", []],
  "whole-self": [
    "六张牌深度反思",
    [
      "当前现实",
      "深层影响",
      "主要阻力",
      "可用力量",
      "有益调整",
      "务实的下一步",
    ],
  ],
  "seasonal-review": ["阶段回顾", []],
  "celtic-cross-classic": [
    "凯尔特十字",
    [
      "当前处境",
      "主要挑战",
      "深层基础",
      "近期过去",
      "潜在可能",
      "近期发展",
      "你的态度",
      "外部影响",
      "希望与担忧",
      "整体方向",
    ],
  ],
  "celtic-cross-reflective": ["反思型凯尔特十字", []],
};
export const localizeSpread = (spread: Spread, locale: Locale): Spread => {
  if (locale === "en") return spread;
  const [name, positions] = spreadZh[spread.id];
  return {
    ...spread,
    name,
    positions: positions.length ? positions : spread.positions,
  };
};

export const infoContent: Record<
  string,
  { en: [string, string[]]; zh: [string, string[]] }
> = {
  "/learn/how-tarot-works": {
    en: [
      "How Tarot Works",
      [
        "Tarot is a structured reflection practice. A question, spread position and card meaning work together to offer a new lens—not a fixed outcome.",
        "Our draw is frozen before selection and the interpretation remains traceable to the cards you actually chose.",
      ],
    ],
    zh: [
      "塔罗如何运作",
      [
        "塔罗是一种结构化的反思方式。问题、牌阵位置和牌义共同提供一个新的观察角度，而不是固定结论。",
        "选牌前抽牌结果已经冻结，最终解释始终可以追溯到你实际选择的牌。",
      ],
    ],
  },
  "/learn/asking-good-questions": {
    en: [
      "Asking Good Questions",
      [
        "Open questions create room for useful reflection. Ask what you can understand, influence or approach differently.",
        "Avoid questions that hand your agency to a prediction.",
      ],
    ],
    zh: [
      "如何提出好问题",
      [
        "开放式问题能为有效反思留下空间。可以询问自己能够理解、影响或换一种方式处理什么。",
        "避免把自己的选择权交给某个预测结果。",
      ],
    ],
  },
  "/learn/spreads": {
    en: [
      "Tarot Spreads",
      [
        "A spread gives every card a specific job. We begin with calibrated three-card structures so the relationship between cards remains readable.",
      ],
    ],
    zh: [
      "塔罗牌阵",
      [
        "牌阵会为每张牌赋予明确作用。我们先从经过校准的三张牌结构开始，让牌与牌之间的关系保持清晰。",
      ],
    ],
  },
  "/cards": {
    en: [
      "Card Meanings",
      [
        "Card meanings are starting points rather than verdicts. Upright and reversed meanings, position and context are shown separately.",
      ],
    ],
    zh: [
      "塔罗牌义",
      ["牌义是思考的起点，不是判决。正逆位、牌位作用和问题上下文会分别展示。"],
    ],
  },
  "/about/interpretation": {
    en: [
      "Our Interpretation Method",
      [
        "The draw, source meanings, card relationships, contextual synthesis and action guidance are separate layers. AI may phrase a reading but cannot alter its evidence.",
      ],
    ],
    zh: [
      "我们的解读方法",
      [
        "抽牌结果、基础牌义、牌面关系、上下文综合和行动建议是彼此分开的层次。AI 可以组织表达，但不能改变证据。",
      ],
    ],
  },
  "/about/accuracy": {
    en: [
      "Accuracy & Uncertainty",
      [
        "Accuracy here means faithful, specific, internally consistent and useful—not certainty about the future. Confidence measures evidence coverage, not prediction.",
      ],
    ],
    zh: [
      "准确性与不确定性",
      [
        "这里的准确，是指忠实、具体、内部一致并且有用，而不是保证未来一定发生。置信度衡量的是证据覆盖程度，不是预测概率。",
      ],
    ],
  },
  "/about/history": {
    en: [
      "A Short History of Tarot",
      [
        "Tarot developed from European playing cards before becoming associated with divination. Our visual language draws on printed cards, botanical ornament and the reading table rather than generic astrology.",
      ],
    ],
    zh: [
      "塔罗简史",
      [
        "塔罗源自欧洲纸牌，后来才逐渐与占卜联系起来。网站的视觉语言取自印刷牌、植物纹样和真实牌桌，而不是泛化的星盘元素。",
      ],
    ],
  },
  "/safety": {
    en: [
      "Safety",
      [
        "TAROT does not replace medical, legal, financial or mental-health professionals. It never treats a card as a diagnosis or threat.",
      ],
    ],
    zh: [
      "安全说明",
      [
        "TAROT 不能代替医疗、法律、财务或心理健康专业人士，也不会把任何一张牌当作诊断或威胁。",
      ],
    ],
  },
  "/privacy": {
    en: [
      "Privacy",
      [
        "Questions are used to provide your reading. Anonymous readings stay in the current browser session unless you choose to save them after signing in.",
      ],
    ],
    zh: [
      "隐私",
      [
        "你的问题只用于生成本次解读。匿名解读保留在当前浏览器会话中；只有登录并主动保存后，才会进入历史记录。",
      ],
    ],
  },
  "/terms": {
    en: [
      "Terms",
      [
        "Use TAROT as a reflection aid. You remain responsible for your choices and should seek qualified advice for high-stakes decisions.",
      ],
    ],
    zh: [
      "使用条款",
      [
        "请把 TAROT 作为反思辅助工具。你仍需为自己的选择负责，并在高风险决定中寻求合格的专业意见。",
      ],
    ],
  },
};
