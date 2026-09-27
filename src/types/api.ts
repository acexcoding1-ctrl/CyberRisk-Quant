import { Asset, VulnerabilityFinding, SecurityControl, OptimizationInitiative, QuantSummary } from './risk';

export interface DashboardApiResponse {
  total_annual_monetary_risk: number;
  optimized_risk: number;
  projected_savings: number;
  rosi: number;
  required_budget: number;
  mitigable_percentage: number;
  kpis: {
    enterprise_risk_score: number;
    risk_tier: string;
    score_delta: number;
    total_assets: number;
    monitored_assets: number;
    total_vulnerabilities: number;
    critical_findings: number;
    average_control_effectiveness: number;
    var_95: number;
    var_99: number;
  };
  loss_breakdown: {
    business_interruption: number;
    regulatory_fines: number;
    response_and_forensics: number;
    reputational_loss: number;
  };
  trend_6_month: {
    month: string;
    eal: number;
    risk_score: number;
    incident_count: number;
  }[];
  loss_exceedance_curve: {
    exceedance_probability: number;
    loss_amount: number;
  }[];
}

export interface AssetRiskSummary {
  asset_id: string;
  asset_name: string;
  risk_score: number;
  annual_probability: number;
  expected_annual_loss: number;
  var_95: number;
  threat_event_frequency: number;
  vulnerability_score: number;
  loss_magnitude_min: number;
  loss_magnitude_mode: number;
  loss_magnitude_max: number;
  loss_magnitude_p95: number;
  risk_tier: 'Critical' | 'High' | 'Medium' | 'Low';
  risk_drivers: string[];
  recommended_actions: string[];
}

export interface ActionItem {
  action: string;
  priority: string;
  estimated_cost: number;
  expected_risk_reduction: number;
  rosi_pct: number;
}

export interface FinancialImpactDetail {
  expected_annual_loss: number;
  var_95: number;
  var_99: number;
  downtime_cost_per_hour: number;
  loss_magnitude_min: number;
  loss_magnitude_mode: number;
  loss_magnitude_max: number;
  breakdown: {
    productivity: number;
    regulatory_fines: number;
    response_cost: number;
    reputation_loss: number;
  };
}

export interface AssetRiskDetail {
  asset_id: string;
  asset_name: string;
  risk_score: number;
  risk_tier: string;
  annual_probability: number;
  financial_impact: FinancialImpactDetail;
  risk_drivers: string[];
  recommended_actions: ActionItem[];
  controls_summary: {
    strength_pct: number;
    status: string;
    data_classification: string;
  };
  cve_count: number;
}

export interface FrontierPoint {
  budget: number;
  risk_reduction: number;
  rosi: number;
  zone: string;
}

export interface OptimizationApiResponse {
  allocated_budget: number;
  budget_usd: number;
  budget_utilization_pct: number;
  total_risk_reduction: number;
  projected_savings: number;
  optimized_risk: number;
  rosi: number;
  selected_initiatives: OptimizationInitiative[];
  efficient_frontier: FrontierPoint[];
}

export interface RiskQuantifyApiResponse {
  baseline_eal: number;
  simulated_eal: number;
  delta_eal: number;
  baseline_var_95: number;
  simulated_var_95: number;
  delta_var_95: number;
  annual_probability: number;
  risk_score: number;
  key_takeaways: string[];
}

export interface HealthApiResponse {
  status: string;
  backend: string;
  version: string;
  timestamp: string;
}

export type ConnectionState = 'connected' | 'checking' | 'fallback' | 'error';
