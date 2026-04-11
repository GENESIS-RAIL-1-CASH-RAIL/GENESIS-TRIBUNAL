// GENESIS-TRIBUNAL — Input validation helpers
// T19 Wave 5: utils/validation.ts

import { OpportunityPacket } from "../types";

/**
 * Validate that an OpportunityPacket has all required fields with sane types.
 * Returns null on success, or a descriptive error string on failure.
 */
export function validateOpportunityPacket(packet: unknown): string | null {
  if (!packet || typeof packet !== "object") {
    return "opportunityPacket must be an object";
  }
  const p = packet as Partial<OpportunityPacket>;

  if (typeof p.opportunityId !== "string" || p.opportunityId.trim() === "") {
    return "opportunityPacket.opportunityId is required";
  }
  if (typeof p.clipSizeGbp !== "number" || p.clipSizeGbp <= 0) {
    return "opportunityPacket.clipSizeGbp must be a positive number";
  }
  if (typeof p.fusionConfidence !== "number" || p.fusionConfidence < 0 || p.fusionConfidence > 1) {
    return "opportunityPacket.fusionConfidence must be in [0,1]";
  }
  if (typeof p.mevGuardsGreen !== "boolean") {
    return "opportunityPacket.mevGuardsGreen must be boolean";
  }
  if (typeof p.checksumGreen !== "boolean") {
    return "opportunityPacket.checksumGreen must be boolean";
  }
  if (typeof p.onChainAnchorConfirmations !== "number") {
    return "opportunityPacket.onChainAnchorConfirmations must be a number";
  }
  if (!Array.isArray(p.featureVector) || p.featureVector.length !== 4) {
    return "opportunityPacket.featureVector must be a 4-element array";
  }
  if (typeof p.provenanceScore !== "number" || p.provenanceScore < 0 || p.provenanceScore > 1) {
    return "opportunityPacket.provenanceScore must be in [0,1]";
  }
  if (typeof p.description !== "string") {
    return "opportunityPacket.description must be a string";
  }
  if (typeof p.timestampMs !== "number") {
    return "opportunityPacket.timestampMs must be a number";
  }
  return null;
}

/**
 * Validate that a field is a non-empty string.
 */
export function requireString(value: unknown, fieldName: string): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return `${fieldName} is required and must be a non-empty string`;
  }
  return null;
}
