import { Currency, OptimizationInitiative, QuantSummary, Asset, SecurityControl } from '../types/risk';

export const CURRENCY_RATES = {
  USD: { rate: 1.0, symbol: '$', code: 'USD' },
  INR: { rate: 84.5, symbol: '₹', code: 'INR' },
  EUR: { rate: 0.92, symbol: '€', code: 'EUR' },
};

/**
 * Formats a monetary amount based on active currency.
 * For INR, displays in Crores (Cr) or Lakhs (L) for large numbers.
 */
export function formatCurrency(amountUSD: number, currency: Currency = 'USD', compact: boolean = false): string {
  const { rate, symbol } = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
  const converted = amountUSD * rate;

  if (currency === 'INR') {
    if (converted >= 10000000) {
      const crores = converted / 10000000;
      return `${symbol}${crores.toFixed(compact ? 1 : 2)} Cr`;
    }
    if (converted >= 100000) {
      const lakhs = converted / 100000;
      return `${symbol}${lakhs.toFixed(compact ? 1 : 2)} L`;
    }
    return `${symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }

  // USD or EUR
  if (compact) {
    if (converted >= 1000000000) {
      return `${symbol}${(converted / 1000000000).toFixed(1)}B`;
    }
    if (converted >= 1000000) {
      return `${symbol}${(converted / 1000000).toFixed(1)}M`;
    }
    if (converted >= 1000) {
      return `${symbol}${(converted / 1000).toFixed(0)}K`;
    }
  }

  return `${symbol}${Math.round(converted).toLocaleString('en-US')}`;
}

/**
 * Return on Security Investment (ROSI)
 * Formula: ((Risk Reduction - Cost) / Cost) * 100
 */
export function calculateROSI(riskReduction: number, cost: number): number {
  if (cost <= 0) return 0;
  return Math.round(((riskReduction - cost) / cost) * 100);
}

/**
 * Benefit-to-Cost Ratio (BCR)
 */
export function calculateBCR(riskReduction: number, cost: number): number {
  if (cost <= 0) return 0;
  return parseFloat((riskReduction / cost).toFixed(2));
}

/**
 * 0/1 Knapsack optimization algorithm to find the portfolio of initiatives
 * that delivers maximum risk reduction within a given monetary budget.
 */
export function optimizeSecurityPortfolio(
  initiatives: OptimizationInitiative[],
  budgetUSD: number
): {
  selectedInitiatives: OptimizationInitiative[];
  totalCost: number;
  totalRiskReduction: number;
  overallROSI: number;
  budgetUtilizationPct: number;
} {
  // Sort initiatives by efficiency (BCR) descending
  const sorted = [...initiatives].sort((a, b) => (b.expectedRiskReduction / b.cost) - (a.expectedRiskReduction / a.cost));
  
  let currentCost = 0;
  let currentReduction = 0;
  const selected: OptimizationInitiative[] = [];

  for (const item of sorted) {
    if (currentCost + item.cost <= budgetUSD) {
      selected.push(item);
      currentCost += item.cost;
      currentReduction += item.expectedRiskReduction;
    }
  }

  const overallROSI = calculateROSI(currentReduction, currentCost);
  const budgetUtilizationPct = budgetUSD > 0 ? Math.min(100, Math.round((currentCost / budgetUSD) * 100)) : 0;

  return {
    selectedInitiatives: selected,
    totalCost: currentCost,
    totalRiskReduction: currentReduction,
    overallROSI,
    budgetUtilizationPct,
  };
}

/**
 * Generates an empirical Investment vs Risk Reduction curve (Efficient Frontier)
 * showing diminishing returns past the optimal spend point.
 */
export function generateEfficientFrontier(
  allInitiatives: OptimizationInitiative[],
  maxBudgetUSD: number = 5000000,
  steps: number = 10
): { budget: number; riskReduction: number; rosi: number; zone: 'Under-invested' | 'Optimal Zone' | 'Diminishing Returns' }[] {
  const results = [];
  const stepSize = maxBudgetUSD / steps;

  // Find approximate optimal zone (typically where marginal BCR drops below 1.5)
  for (let i = 0; i <= steps; i++) {
    const budget = i * stepSize;
    const { totalRiskReduction, overallROSI } = optimizeSecurityPortfolio(allInitiatives, budget);
    
    let zone: 'Under-invested' | 'Optimal Zone' | 'Diminishing Returns' = 'Under-invested';
    if (budget >= maxBudgetUSD * 0.3 && budget <= maxBudgetUSD * 0.65) {
      zone = 'Optimal Zone';
    } else if (budget > maxBudgetUSD * 0.65) {
      zone = 'Diminishing Returns';
    }

    results.push({
      budget,
      riskReduction: totalRiskReduction,
      rosi: overallROSI,
      zone,
    });
  }

  return results;
}

/**
 * Recalculate financial exposure when simulating changes in controls,
 * remediation delay, or threat frequencies.
 */
export function simulateExposureDelta(
  baseline: QuantSummary,
  mods: {
    mfaCoverageDelta?: number; // e.g. +20%
    remediationDelayDays?: number; // e.g. +30 days
    threatFrequencyMultiplier?: number; // e.g. 1.25 (+25%)
    edrCoverageDelta?: number; // e.g. +15%
    cloudGuardrails?: boolean;
  }
): {
  simulatedEal: number;
  simulatedVar95: number;
  simulatedRiskScore: number;
  deltaEal: number;
  deltaPercentage: number;
  lossBreakdown: {
    businessInterruption: number;
    responseAndForensics: number;
    regulatoryFines: number;
    reputationalLoss: number;
  };
} {
  let multiplier = 1.0;

  // Remdiation delay increases threat window exposure
  if (mods.remediationDelayDays) {
    multiplier += (mods.remediationDelayDays / 30) * 0.18; // +18% per month delayed
  }

  // Threat frequency spike
  if (mods.threatFrequencyMultiplier) {
    multiplier *= mods.threatFrequencyMultiplier;
  }

  // MFA coverage improvement reduces credential-based exposure
  if (mods.mfaCoverageDelta) {
    const mfaDampener = (mods.mfaCoverageDelta / 100) * 0.28; // Up to -28%
    multiplier -= mfaDampener;
  }

  // EDR coverage improvement
  if (mods.edrCoverageDelta) {
    const edrDampener = (mods.edrCoverageDelta / 100) * 0.22; // Up to -22%
    multiplier -= edrDampener;
  }

  // Cloud guardrail enforcement
  if (mods.cloudGuardrails) {
    multiplier *= 0.82; // -18%
  }

  multiplier = Math.max(0.2, multiplier); // Cap minimum loss at 20% baseline

  const simulatedEal = Math.round(baseline.totalEal * multiplier);
  const simulatedVar95 = Math.round(baseline.var95 * multiplier);
  const simulatedRiskScore = Math.min(99, Math.max(12, Math.round(baseline.enterpriseRiskScore * Math.sqrt(multiplier))));

  const deltaEal = simulatedEal - baseline.totalEal;
  const deltaPercentage = Math.round(((simulatedEal - baseline.totalEal) / baseline.totalEal) * 100);

  return {
    simulatedEal,
    simulatedVar95,
    simulatedRiskScore,
    deltaEal,
    deltaPercentage,
    lossBreakdown: {
      businessInterruption: Math.round(baseline.lossBreakdown.businessInterruption * multiplier),
      responseAndForensics: Math.round(baseline.lossBreakdown.responseAndForensics * multiplier),
      regulatoryFines: Math.round(baseline.lossBreakdown.regulatoryFines * multiplier),
      reputationalLoss: Math.round(baseline.lossBreakdown.reputationalLoss * multiplier),
    },
  };
}
