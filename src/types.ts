export type Stage =
  | "question"
  | "context"
  | "spreads"
  | "shuffle"
  | "select"
  | "reveal"
  | "interpreting"
  | "result";
export type SpreadLayout = "single" | "row" | "six-grid" | "celtic-cross";
export type Spread = {
  id: string;
  name: string;
  cards: number;
  available: boolean;
  duration: number;
  positions: string[];
  layout?: SpreadLayout;
};
export type RevealedCard = {
  positionId: number;
  position: string;
  cardId: string;
  cardName: string;
  orientation: "upright" | "reversed";
};
export type Section = {
  evidenceIds: string[];
  position: string;
  cardId: string;
  cardName: string;
  orientation: string;
  keywords: string[];
  baseMeaning: string;
  contextualMeaning: string;
  relation: string;
  reflectionQuestion: string;
};
export type Interpretation = {
  locale?: "en" | "zh-CN";
  headline: string;
  userContext?: string;
  synthesis: string;
  relations: { text: string; evidenceIds: string[] }[];
  groups?: {
    title: string;
    positions: string[];
    summary: string;
    evidenceIds?: string[];
  }[];
  sections: Section[];
  assumptions: string[];
  actionPlan: {
    action: string;
    reason: string;
    timeframe: string;
    observableSignal: string;
    evidenceIds: string[];
  }[];
  nextStep: string;
  generation: {
    mode: "ai" | "rules";
    model: string | null;
    promptVersion: string;
  };
  confidence: {
    level: string;
    score: number;
    meaning: string;
    uncertainty: string;
  };
  safety: string;
};
