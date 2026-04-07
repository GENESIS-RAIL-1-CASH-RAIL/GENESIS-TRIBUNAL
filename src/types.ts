// GENESIS-TRIBUNAL v0.1 — Type definitions
// Spark #045. Hybrid cognitive cross-verification + decision authority via three-AI carousel.
// Built 2026-04-07 from Grok Round 1 diamonds.

export type VotingState =
  | "VOTE_REQUESTED"
  | "AWAITING_VOTES"
  | "AGGREGATING"
  | "CONTAMINATION_SCAN"
  | "APPROVED"
  | "HOLD"
  | "ERROR";

export type ContaminationVerdict = "CLEAN" | "SUSPICIOUS" | "CONTAMINATED";

export interface OpportunityPacket {
  opportunityId: string;
  clipSizeGbp: number;
  fusionConfidence: number; // from OVERWATCH [0,1]
  mevGuardsGreen: boolean;
  checksumGreen: boolean;
  onChainAnchorConfirmations: number;
  featureVector: [number, number, number, number]; // 4-dim from OVERWATCH
  provenanceScore: number;
  description: string;
  timestampMs: number;
}

export interface TribunalQuery {
  queryId: string;
  opportunityPacket: OpportunityPacket;
  arisPreFilterPassed: boolean; // false if escalated to Tribunal
  arisSignature: string; // HMAC by ARIS
  createdAtMs: number;
}

export interface AIVote {
  voteId: string;
  providerName: string;
  modelVersion: string;
  vote: "YES" | "NO";
  confidence: number; // [0,1]
  reason: string;
  contaminationStatus: ContaminationVerdict;
  latencyMs: number;
  timedOut: boolean;
}

export interface TribunalVerdict {
  verdictId: string;
  queryId: string;
  finalVerdict: "APPROVED" | "HOLD" | "ERROR";
  unanimous: boolean;
  yesCount: number;
  noCount: number;
  contaminatedCount: number;
  timedOutCount: number;
  individualVotes: AIVote[];
  reason: string;
  decidedAtMs: number;
  totalLatencyMs: number;
  signedQc: string; // HMAC verdict signature
}

export interface ProviderConfig {
  name: string;
  model: string;
  endpoint: string;
  inputCostPerMTokGbp: number;
  outputCostPerMTokGbp: number;
  cachedInputCostPerMTokGbp: number;
}

export interface PrecedentEntry {
  precedentId: string;
  opportunityFingerprint: [number, number, number, number, number, number];
  verdict: "APPROVED" | "HOLD";
  confidence: number;
  createdAtMs: number;
  hitCount: number;
}

export interface BudgetState {
  dailyCapGbp: number;
  spentTodayGbp: number;
  votesToday: number;
  cacheHitsToday: number;
  cacheSavingsTodayGbp: number;
  lastResetMs: number;
  silenced: boolean;
}

export interface RiskMeterReading {
  weeklyHallucinationRiskGbp: number;
  yearlyHallucinationRiskGbp: number;
  voteFreedomDataAlphaGbp: number;
  totalProtectedGbp: number;
  asOfMs: number;
}

export interface FlywheelState {
  monthsRunning: number;
  initialTribunalRate: number;
  currentTribunalRate: number;
  asymptoticFloor: number;
  monthlyDeclineRate: number;
  precedentHitRate: number;
  totalPrecedents: number;
  steadyStateReached: boolean;
}
