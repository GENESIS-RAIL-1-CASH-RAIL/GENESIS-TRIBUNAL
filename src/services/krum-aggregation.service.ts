// ══════════════════════════════════════════════════════════════════════════
// KrumAggregationService — Byzantine-Robust Aggregation
// Spark #055 EvoForge Meta-Swarm — Rejects poisoned votes from TRIBUNAL panel
// Selects the vote whose sum of squared distances to all others is MINIMUM
// Safe against up to f < n/2 - 1 poisoned inputs
// ══════════════════════════════════════════════════════════════════════════

export interface Vote {
  score: number;
  confidence: number;
  verdict: string;
  voterId?: string;
}

export interface KrumResult {
  selectedVote: Vote;
  selectedIndex: number;
  distances: number[];
  robustnessGap: number; // How many poisoned votes could we survive?
}

export class KrumAggregationService {
  /**
   * Core Krum aggregation: select the most central vote
   * Formula: Krum(v₁...vₙ) = vᵢ where i = argmin Σⱼ ||vᵢ-vⱼ||²
   */
  aggregate(votes: Vote[]): KrumResult {
    if (votes.length === 0) {
      throw new Error("Cannot aggregate zero votes");
    }

    if (votes.length === 1) {
      return {
        selectedVote: votes[0],
        selectedIndex: 0,
        distances: [0],
        robustnessGap: 0,
      };
    }

    // Compute distance matrix: ||vᵢ - vⱼ||²
    const distances = this.computeDistances(votes);

    // For each vote i, compute sum of squared distances to all others
    const sumDistances: number[] = [];
    for (let i = 0; i < votes.length; i++) {
      let sum = 0;
      for (let j = 0; j < votes.length; j++) {
        if (i !== j) {
          sum += distances[i][j] * distances[i][j];
        }
      }
      sumDistances.push(sum);
    }

    // Select the vote with minimum sum (most central)
    const selectedIndex = sumDistances.indexOf(Math.min(...sumDistances));
    const selectedVote = votes[selectedIndex];

    // Robustness: Byzantine threshold is n/2. We can tolerate up to f < n/2 - 1
    const maxPoisoned = Math.floor(votes.length / 2) - 1;

    return {
      selectedVote,
      selectedIndex,
      distances: sumDistances,
      robustnessGap: maxPoisoned,
    };
  }

  /**
   * Weighted Krum: weight votes by confidence before aggregation
   */
  aggregateWeighted(votes: Vote[]): KrumResult {
    if (votes.length === 0) {
      throw new Error("Cannot aggregate zero votes");
    }

    if (votes.length === 1) {
      return {
        selectedVote: votes[0],
        selectedIndex: 0,
        distances: [0],
        robustnessGap: 0,
      };
    }

    // Scale each vote by its confidence
    const weightedVotes = votes.map(v => ({
      ...v,
      score: v.score * v.confidence,
    }));

    return this.aggregate(weightedVotes);
  }

  /**
   * Multi-Krum: selects top-k central votes and returns median/mean
   */
  aggregateTopK(votes: Vote[], k: number = Math.ceil(votes.length / 2)): {
    selectedVotes: Vote[];
    aggregatedScore: number;
    aggregatedConfidence: number;
  } {
    const result = this.aggregate(votes);
    const distances = result.distances;

    // Sort by distance and select top-k
    const indices = distances
      .map((d, i) => ({ distance: d, index: i }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, Math.min(k, votes.length))
      .map(x => x.index);

    const selectedVotes = indices.map(i => votes[i]);

    // Aggregate scores via median (more robust than mean)
    const scores = selectedVotes.map(v => v.score).sort((a, b) => a - b);
    const aggregatedScore = scores[Math.floor(scores.length / 2)];

    const confidences = selectedVotes.map(v => v.confidence).sort((a, b) => a - b);
    const aggregatedConfidence = confidences[Math.floor(confidences.length / 2)];

    return {
      selectedVotes,
      aggregatedScore,
      aggregatedConfidence,
    };
  }

  /**
   * Compute pairwise Euclidean distances
   */
  private computeDistances(votes: Vote[]): number[][] {
    const n = votes.length;
    const dist: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = this.euclideanDistance(votes[i], votes[j]);
        dist[i][j] = d;
        dist[j][i] = d;
      }
    }

    return dist;
  }

  /**
   * Euclidean distance between two votes (score + confidence)
   */
  private euclideanDistance(v1: Vote, v2: Vote): number {
    const scoreDelta = v1.score - v2.score;
    const confDelta = v1.confidence - v2.confidence;
    return Math.sqrt(scoreDelta * scoreDelta + confDelta * confDelta);
  }

  /**
   * Check if a vote is an outlier (distance > threshold from median)
   */
  isOutlier(vote: Vote, votes: Vote[], threshold: number = 2.0): boolean {
    const distances = this.computeDistances([...votes, vote]);
    const newVoteIdx = votes.length;
    const distToOthers = distances[newVoteIdx].slice(0, -1);
    const median = distToOthers.sort((a, b) => a - b)[Math.floor(distToOthers.length / 2)];
    const deviation = Math.abs(median - distToOthers[newVoteIdx - 1]);
    return deviation > threshold;
  }
}
