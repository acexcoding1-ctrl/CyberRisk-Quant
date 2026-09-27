import { 
  Asset, 
  VulnerabilityFinding, 
  SecurityControl, 
  OptimizationInitiative, 
  QuantSummary 
} from '../types/risk';
import {
  DashboardApiResponse,
  AssetRiskSummary,
  AssetRiskDetail,
  OptimizationApiResponse,
  RiskQuantifyApiResponse,
  HealthApiResponse,
  ConnectionState
} from '../types/api';
import { 
  INITIAL_ASSETS, 
  INITIAL_FINDINGS, 
  INITIAL_SECURITY_CONTROLS, 
  INITIAL_OPTIMIZATION_INITIATIVES, 
  INITIAL_QUANT_SUMMARY 
} from '../data/mockTelemetry';

// Base URL defaults to http://localhost:8000 per specification
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

// Connection state listeners
type ConnectionListener = (state: ConnectionState, message?: string) => void;
const connectionListeners: Set<ConnectionListener> = new Set();

let currentConnectionState: ConnectionState = 'checking';
let lastStatusMessage = '';

export function subscribeConnectionState(listener: ConnectionListener): () => void {
  connectionListeners.add(listener);
  listener(currentConnectionState, lastStatusMessage);
  return () => {
    connectionListeners.delete(listener);
  };
}

function notifyConnectionState(state: ConnectionState, message?: string) {
  currentConnectionState = state;
  lastStatusMessage = message || '';
  connectionListeners.forEach((l) => l(state, lastStatusMessage));
}

export function getConnectionState(): { state: ConnectionState; message: string; url: string } {
  return {
    state: currentConnectionState,
    message: lastStatusMessage,
    url: API_BASE_URL
  };
}

/**
 * Universal JSON fetch helper with timeout and error handling.
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Centralized API Service for CyberRisk Quant
 * Communicates with FastAPI backend at VITE_API_BASE_URL (http://localhost:8000).
 */
export const api = {
  /**
   * 1. GET /api/health
   */
  async getHealth(): Promise<HealthApiResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/health`, { method: 'GET' });
      if (!res.ok) throw new Error(`Health check returned HTTP ${res.status}`);
      const data = await res.json();
      notifyConnectionState('connected', `FastAPI backend active (${API_BASE_URL})`);
      return data;
    } catch (err: any) {
      notifyConnectionState('fallback', `FastAPI unreachable at ${API_BASE_URL} — using resilient baseline`);
      return {
        status: 'degraded',
        backend: 'CyberRisk Quant Client (Offline Fallback)',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * 2. GET /api/dashboard
   * Retrieves dashboard KPIs, total annual monetary risk, optimized risk, projected savings, and ROSI.
   */
  async getDashboard(): Promise<DashboardApiResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/dashboard`, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/dashboard failed with HTTP ${res.status}`);
      const data: DashboardApiResponse = await res.json();
      notifyConnectionState('connected', `Live data synced from ${API_BASE_URL}`);
      return data;
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/dashboard unavailable (${err?.message || err}). Providing fallback telemetry.`);
      notifyConnectionState('fallback', `Backend offline at ${API_BASE_URL}. Showing baseline.`);
      return buildFallbackDashboardResponse();
    }
  },

  /**
   * 3. GET /api/assets
   * Retrieves list of monitored enterprise assets.
   */
  async getAssets(): Promise<Asset[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/assets`, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/assets failed with HTTP ${res.status}`);
      const rawAssets = await res.json();
      return rawAssets.map(normalizeAsset);
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/assets unavailable. Using baseline asset matrix.`);
      return INITIAL_ASSETS;
    }
  },

  /**
   * 4. GET /api/vulnerabilities
   * Retrieves vulnerability findings, with optional ?asset_id= filter.
   */
  async getVulnerabilities(assetId?: string): Promise<VulnerabilityFinding[]> {
    try {
      const url = assetId 
        ? `${API_BASE_URL}/api/vulnerabilities?asset_id=${encodeURIComponent(assetId)}` 
        : `${API_BASE_URL}/api/vulnerabilities`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/vulnerabilities failed with HTTP ${res.status}`);
      const raw = await res.json();
      return raw.map(normalizeFinding);
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/vulnerabilities unavailable. Using baseline findings.`);
      if (assetId) {
        return INITIAL_FINDINGS.filter((f) => f.affectedAssetId === assetId);
      }
      return INITIAL_FINDINGS;
    }
  },

  /**
   * 5. GET /api/controls
   * Retrieves security controls and their measured effectiveness percentages.
   */
  async getControls(): Promise<SecurityControl[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/controls`, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/controls failed with HTTP ${res.status}`);
      const raw = await res.json();
      return raw.map(normalizeControl);
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/controls unavailable. Using baseline controls.`);
      return INITIAL_SECURITY_CONTROLS;
    }
  },

  /**
   * 6. GET /api/risks
   * Quantified FAIR risk for all monitored assets.
   */
  async getRisks(): Promise<AssetRiskSummary[]> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/risks`, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/risks failed with HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/risks unavailable. Generating baseline asset summaries.`);
      return INITIAL_ASSETS.map((a) => ({
        asset_id: a.id,
        asset_name: a.name,
        risk_score: Math.round(100 - a.controlStrengthPct + (a.activeVulnerabilities * 6)),
        annual_probability: parseFloat((0.2 + a.activeVulnerabilities * 0.05).toFixed(2)),
        expected_annual_loss: a.eal,
        var_95: a.var95,
        threat_event_frequency: 3.5,
        vulnerability_score: 0.65,
        loss_magnitude_min: a.downtimeCostPerHour * 8,
        loss_magnitude_mode: a.eal * 0.85,
        loss_magnitude_max: a.var95 * 1.3,
        loss_magnitude_p95: a.var95,
        risk_tier: a.status === 'Critical Attention' ? 'Critical' : a.status === 'At Risk' ? 'High' : 'Medium',
        risk_drivers: [
          `Criticality: ${a.criticality}`,
          `Downtime impact: $${a.downtimeCostPerHour.toLocaleString()}/hr`,
          `${a.activeVulnerabilities} unmitigated vulnerabilities`
        ],
        recommended_actions: [
          'Accelerate 72-hour patch orchestration',
          'Deploy Zero Trust microsegmentation for ingress'
        ]
      }));
    }
  },

  /**
   * 7. GET /api/risk/{asset_id}
   * Detailed risk for selected asset (risk score, probability, financial impact, risk drivers, recommended actions).
   */
  async getRiskForAsset(assetId: string): Promise<AssetRiskDetail> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/risk/${encodeURIComponent(assetId)}`, { method: 'GET' });
      if (!res.ok) throw new Error(`GET /api/risk/${assetId} failed with HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/risk/${assetId} unavailable. Generating baseline detail.`);
      const asset = INITIAL_ASSETS.find((a) => a.id === assetId) || INITIAL_ASSETS[0];
      const vulns = INITIAL_FINDINGS.filter((f) => f.affectedAssetId === assetId);
      
      return {
        asset_id: asset.id,
        asset_name: asset.name,
        risk_score: Math.min(100, Math.round(100 - asset.controlStrengthPct + (asset.activeVulnerabilities * 7))),
        risk_tier: asset.status === 'Critical Attention' ? 'Critical' : asset.status === 'At Risk' ? 'High' : 'Medium',
        annual_probability: parseFloat((0.28 + asset.activeVulnerabilities * 0.04).toFixed(2)),
        financial_impact: {
          expected_annual_loss: asset.eal,
          var_95: asset.var95,
          var_99: Math.round(asset.var95 * 1.4),
          downtime_cost_per_hour: asset.downtimeCostPerHour,
          loss_magnitude_min: asset.downtimeCostPerHour * 8,
          loss_magnitude_mode: asset.eal * 0.85,
          loss_magnitude_max: asset.var95 * 1.35,
          breakdown: {
            productivity: Math.round(asset.eal * 0.48),
            regulatory_fines: Math.round(asset.eal * 0.22),
            response_cost: Math.round(asset.eal * 0.18),
            reputation_loss: Math.round(asset.eal * 0.12)
          }
        },
        risk_drivers: [
          `Production host: ${asset.hostName} in ${asset.cloudProvider}`,
          `Criticality: ${asset.criticality}`,
          `Financial dependency: $${asset.downtimeCostPerHour.toLocaleString()}/hr downtime cost`,
          `${vulns.length} active findings in Qualys / Wiz CSPM feeds`
        ],
        recommended_actions: vulns.map((v) => ({
          action: v.recommendedAction,
          priority: v.severity === 'Critical' ? 'Immediate' : 'High',
          estimated_cost: v.remediationCost,
          expected_risk_reduction: Math.round(v.estimatedFinancialImpact * 0.75),
          rosi_pct: Math.round(((v.estimatedFinancialImpact * 0.75 - v.remediationCost) / (v.remediationCost || 1)) * 100)
        })),
        controls_summary: {
          strength_pct: asset.controlStrengthPct,
          status: asset.status,
          data_classification: asset.dataClassification
        },
        cve_count: vulns.length
      };
    }
  },

  /**
   * 8. GET /api/optimization/recommendations?budget_usd=...
   * Budget-aware mitigation recommendations and ROSI.
   */
  async getOptimizationRecommendations(budgetUsd = 1000000): Promise<OptimizationApiResponse> {
    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/api/optimization/recommendations?budget_usd=${encodeURIComponent(budgetUsd)}`,
        { method: 'GET' }
      );
      if (!res.ok) throw new Error(`GET /api/optimization/recommendations failed with HTTP ${res.status}`);
      const data: OptimizationApiResponse = await res.json();
      return {
        ...data,
        selected_initiatives: (data.selected_initiatives || []).map(normalizeInitiative)
      };
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] /api/optimization/recommendations unavailable. Computing knapsack locally.`);
      return buildFallbackOptimizationResponse(budgetUsd);
    }
  },

  /**
   * 9. POST /api/optimization
   * Optimizes supplied mitigation candidates against a budget.
   */
  async optimizePortfolio(budgetUsd: number, candidates?: any[]): Promise<OptimizationApiResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/optimization`, {
        method: 'POST',
        body: JSON.stringify({
          budget_usd: budgetUsd,
          candidates: candidates || undefined
        })
      });
      if (!res.ok) throw new Error(`POST /api/optimization failed with HTTP ${res.status}`);
      const data: OptimizationApiResponse = await res.json();
      return {
        ...data,
        selected_initiatives: (data.selected_initiatives || []).map(normalizeInitiative)
      };
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] POST /api/optimization unavailable. Computing fallback optimization.`);
      return buildFallbackOptimizationResponse(budgetUsd);
    }
  },

  /**
   * 10. POST /api/risk/quantify
   * Calculates risk from supplied asset, vulnerability, and control data.
   */
  async quantifyRisk(payload: {
    asset_id?: string;
    parameters: {
      mfa_coverage_delta?: number;
      remediation_delay_days?: number;
      threat_frequency_multiplier?: number;
      edr_coverage_delta?: number;
      cloud_guardrails?: boolean;
    };
    vulnerabilities?: any[];
    controls?: any[];
  }): Promise<RiskQuantifyApiResponse> {
    try {
      const res = await fetchWithTimeout(`${API_BASE_URL}/api/risk/quantify`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`POST /api/risk/quantify failed with HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn(`[CyberRisk Quant API] POST /api/risk/quantify unavailable. Calculating baseline delta.`);
      const baselineEal = 14850000;
      const baselineVar95 = 28400000;
      
      const p = payload.parameters;
      const mfaFactor = 1.0 - ((p.mfa_coverage_delta || 0) / 100 * 0.42);
      const edrFactor = 1.0 - ((p.edr_coverage_delta || 0) / 100 * 0.35);
      const patchFactor = 1.0 + ((p.remediation_delay_days || 0) * 0.0085);
      const threatFactor = p.threat_frequency_multiplier || 1.0;
      const guardrailFactor = p.cloud_guardrails ? 0.88 : 1.0;

      const combined = Math.max(0.15, mfaFactor * edrFactor * patchFactor * threatFactor * guardrailFactor);
      const simEal = Math.round(baselineEal * combined);
      const simVar95 = Math.round(baselineVar95 * Math.sqrt(combined));

      return {
        baseline_eal: baselineEal,
        simulated_eal: simEal,
        delta_eal: simEal - baselineEal,
        baseline_var_95: baselineVar95,
        simulated_var_95: simVar95,
        delta_var_95: simVar95 - baselineVar95,
        annual_probability: parseFloat((0.42 * combined).toFixed(2)),
        risk_score: Math.min(100, Math.round(68 * combined)),
        key_takeaways: [
          simEal < baselineEal 
            ? `Net simulated risk reduction of $${(baselineEal - simEal).toLocaleString()} annually.`
            : `Exposure increased by $${(simEal - baselineEal).toLocaleString()} under stress parameters.`,
          'Quantitative outputs grounded in continuous telemetry.'
        ]
      };
    }
  }
};

/* ---------------- Normalization & Fallback Helpers ---------------- */

function normalizeAsset(raw: any): Asset {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    businessUnit: raw.business_unit || raw.businessUnit,
    criticality: raw.criticality,
    revenueAttributionDaily: raw.revenue_attribution_daily ?? raw.revenueAttributionDaily ?? 1000000,
    downtimeCostPerHour: raw.downtime_cost_per_hour ?? raw.downtimeCostPerHour ?? 50000,
    dataClassification: raw.data_classification || raw.dataClassification || 'PCI-DSS / Financial',
    eal: raw.eal ?? 2000000,
    var95: raw.var_95 ?? raw.var95 ?? 4500000,
    controlStrengthPct: raw.control_strength_pct ?? raw.controlStrengthPct ?? 75,
    activeVulnerabilities: raw.active_vulnerabilities ?? raw.activeVulnerabilities ?? 0,
    hostName: raw.host_name || raw.hostName || 'host.internal',
    cloudProvider: raw.cloud_provider || raw.cloudProvider || 'AWS',
    status: raw.status || 'Healthy'
  };
}

function normalizeFinding(raw: any): VulnerabilityFinding {
  return {
    id: raw.id,
    cve: raw.cve,
    title: raw.title,
    severity: raw.severity,
    cvss: raw.cvss,
    epss: raw.epss,
    affectedAssetId: raw.affected_asset_id || raw.affectedAssetId,
    assetName: raw.asset_name || raw.assetName,
    businessUnit: raw.business_unit || raw.businessUnit,
    discoveryDate: raw.discovery_date || raw.discoveryDate,
    estimatedFinancialImpact: raw.estimated_financial_impact ?? raw.estimatedFinancialImpact ?? 1000000,
    remediationCost: raw.remediation_cost ?? raw.remediationCost ?? 20000,
    status: raw.status,
    threatVector: raw.threat_vector || raw.threatVector || 'Remote Code Execution',
    recommendedAction: raw.recommended_action || raw.recommendedAction,
    daysOpen: raw.days_open ?? raw.daysOpen ?? 0
  };
}

function normalizeControl(raw: any): SecurityControl {
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    effectivenessPct: raw.effectiveness_pct ?? raw.effectivenessPct ?? 80,
    coveragePct: raw.coverage_pct ?? raw.coveragePct ?? 75,
    costAnnual: raw.cost_annual ?? raw.costAnnual ?? 150000,
    riskReductionPotential: raw.risk_reduction_potential ?? raw.riskReductionPotential ?? 1000000,
    currentMaturity: raw.current_maturity ?? raw.currentMaturity ?? 3,
    targetMaturity: raw.target_maturity ?? raw.targetMaturity ?? 5,
    mappedFrameworks: raw.mapped_frameworks || raw.mappedFrameworks || []
  };
}

function normalizeInitiative(raw: any): OptimizationInitiative {
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    cost: raw.cost,
    expectedRiskReduction: raw.expected_risk_reduction ?? raw.expectedRiskReduction ?? 0,
    rosiPct: raw.rosi_pct ?? raw.rosiPct ?? 0,
    bcr: raw.bcr ?? 0,
    difficulty: raw.difficulty || 'Medium',
    timeWeeks: raw.time_weeks ?? raw.timeWeeks ?? 4,
    businessUnit: raw.business_unit || raw.businessUnit || 'Enterprise-Wide',
    targetControls: raw.target_controls || raw.targetControls || [],
    description: raw.description || '',
    annualMaintenanceCost: raw.annual_maintenance_cost ?? raw.annualMaintenanceCost ?? 0
  };
}

function buildFallbackDashboardResponse(): DashboardApiResponse {
  return {
    total_annual_monetary_risk: INITIAL_QUANT_SUMMARY.totalEal,
    optimized_risk: 7750000,
    projected_savings: 7100000,
    rosi: 663.4,
    required_budget: 930000,
    mitigable_percentage: 47.8,
    kpis: {
      enterprise_risk_score: INITIAL_QUANT_SUMMARY.enterpriseRiskScore,
      risk_tier: 'High Risk Tier',
      score_delta: -8,
      total_assets: INITIAL_QUANT_SUMMARY.totalAssets,
      monitored_assets: INITIAL_QUANT_SUMMARY.totalAssets,
      total_vulnerabilities: INITIAL_QUANT_SUMMARY.totalVulnerabilities,
      critical_findings: 18,
      average_control_effectiveness: INITIAL_QUANT_SUMMARY.averageControlEffectiveness,
      var_95: INITIAL_QUANT_SUMMARY.var95,
      var_99: INITIAL_QUANT_SUMMARY.var99
    },
    loss_breakdown: {
      business_interruption: INITIAL_QUANT_SUMMARY.lossBreakdown.businessInterruption,
      regulatory_fines: INITIAL_QUANT_SUMMARY.lossBreakdown.regulatoryFines,
      response_and_forensics: INITIAL_QUANT_SUMMARY.lossBreakdown.responseAndForensics,
      reputational_loss: INITIAL_QUANT_SUMMARY.lossBreakdown.reputationalLoss
    },
    trend_6_month: INITIAL_QUANT_SUMMARY.trend6Month.map((t) => ({
      month: t.month,
      eal: t.eal,
      risk_score: t.riskScore,
      incident_count: t.incidentCount
    })),
    loss_exceedance_curve: INITIAL_QUANT_SUMMARY.lossExceedanceCurve.map((c) => ({
      exceedance_probability: c.exceedanceProbability,
      loss_amount: c.lossAmount
    }))
  };
}

function buildFallbackOptimizationResponse(budgetUsd: number): OptimizationApiResponse {
  const sorted = [...INITIAL_OPTIMIZATION_INITIATIVES].sort(
    (a, b) => (b.expectedRiskReduction / b.cost) - (a.expectedRiskReduction / a.cost)
  );
  
  let currentCost = 0;
  let currentReduction = 0;
  const selected: OptimizationInitiative[] = [];

  for (const item of sorted) {
    if (currentCost + item.cost <= budgetUsd) {
      selected.push(item);
      currentCost += item.cost;
      currentReduction += item.expectedRiskReduction;
    }
  }

  const rosi = currentCost > 0 
    ? Math.round(((currentReduction - currentCost) / currentCost) * 1000) / 10 
    : 0;

  const frontier = [
    { budget: 200000, risk_reduction: 2100000, rosi: 950.0, zone: 'Optimal Spend Zone' },
    { budget: 500000, risk_reduction: 4200000, rosi: 740.0, zone: 'Optimal Spend Zone' },
    { budget: 1000000, risk_reduction: 7100000, rosi: 610.0, zone: 'Optimal Spend Zone' },
    { budget: 1500000, risk_reduction: 8800000, rosi: 486.7, zone: 'Optimal Spend Zone' },
    { budget: 2500000, risk_reduction: 10500000, rosi: 320.0, zone: 'Diminishing Returns' },
    { budget: 4000000, risk_reduction: 11800000, rosi: 195.0, zone: 'Diminishing Returns' },
  ];

  return {
    allocated_budget: currentCost,
    budget_usd: budgetUsd,
    budget_utilization_pct: budgetUsd > 0 ? Math.min(100, Math.round((currentCost / budgetUsd) * 1000) / 10) : 0,
    total_risk_reduction: currentReduction,
    projected_savings: Math.max(0, currentReduction - currentCost),
    optimized_risk: Math.max(0, 14850000 - currentReduction),
    rosi,
    selected_initiatives: selected,
    efficient_frontier: frontier
  };
}
