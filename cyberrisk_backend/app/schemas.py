from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Health Schema
class HealthResponse(BaseModel):
    status: str
    backend: str
    version: str
    timestamp: str

# Loss Breakdown & KPIs
class LossBreakdown(BaseModel):
    business_interruption: float
    regulatory_fines: float
    response_and_forensics: float
    reputational_loss: float

class TrendMonth(BaseModel):
    month: str
    eal: float
    risk_score: float
    incident_count: int

class LossExceedancePoint(BaseModel):
    exceedance_probability: float
    loss_amount: float

class DashboardKPIs(BaseModel):
    enterprise_risk_score: float
    risk_tier: str
    score_delta: float
    total_assets: int
    monitored_assets: int
    total_vulnerabilities: int
    critical_findings: int
    average_control_effectiveness: float
    var_95: float
    var_99: float

class DashboardResponse(BaseModel):
    total_annual_monetary_risk: float
    optimized_risk: float
    projected_savings: float
    rosi: float
    required_budget: float
    mitigable_percentage: float
    kpis: DashboardKPIs
    loss_breakdown: LossBreakdown
    trend_6_month: List[TrendMonth]
    loss_exceedance_curve: List[LossExceedancePoint]

# Asset Schemas
class AssetBase(BaseModel):
    id: str
    name: str
    type: str
    business_unit: str
    criticality: str
    revenue_attribution_daily: float
    downtime_cost_per_hour: float
    data_classification: str
    eal: float
    var_95: float
    control_strength_pct: float
    active_vulnerabilities: int
    host_name: str
    cloud_provider: str
    status: str

# Vulnerability Schemas
class VulnerabilityFinding(BaseModel):
    id: str
    cve: str
    title: str
    severity: str
    cvss: float
    epss: float
    affected_asset_id: str
    asset_name: str
    business_unit: str
    discovery_date: str
    estimated_financial_impact: float
    remediation_cost: float
    status: str
    threat_vector: str
    recommended_action: str
    days_open: int

# Security Control Schemas
class SecurityControl(BaseModel):
    id: str
    name: str
    category: str
    effectiveness_pct: float
    coverage_pct: float
    cost_annual: float
    risk_reduction_potential: float
    current_maturity: int
    target_maturity: int
    mapped_frameworks: List[str]

# Asset Risk Schemas
class AssetRiskSummary(BaseModel):
    asset_id: str
    asset_name: str
    risk_score: float
    annual_probability: float
    expected_annual_loss: float
    var_95: float
    threat_event_frequency: float
    vulnerability_score: float
    loss_magnitude_min: float
    loss_magnitude_mode: float
    loss_magnitude_max: float
    loss_magnitude_p95: float
    risk_tier: str
    risk_drivers: List[str]
    recommended_actions: List[str]

class ActionItem(BaseModel):
    action: str
    priority: str
    estimated_cost: float
    expected_risk_reduction: float
    rosi_pct: float

class FinancialImpactDetail(BaseModel):
    expected_annual_loss: float
    var_95: float
    var_99: float
    downtime_cost_per_hour: float
    loss_magnitude_min: float
    loss_magnitude_mode: float
    loss_magnitude_max: float
    breakdown: Dict[str, float]

class AssetRiskDetail(BaseModel):
    asset_id: str
    asset_name: str
    risk_score: float
    risk_tier: str
    annual_probability: float
    financial_impact: FinancialImpactDetail
    risk_drivers: List[str]
    recommended_actions: List[ActionItem]
    controls_summary: Dict[str, Any]
    cve_count: int

# Optimization Schemas
class MitigationCandidate(BaseModel):
    id: str
    title: str
    category: str
    cost: float
    expected_risk_reduction: float
    difficulty: str = "Medium"
    time_weeks: int = 4
    business_unit: str = "Enterprise-Wide"
    target_controls: List[str] = Field(default_factory=list)
    description: str = ""
    annual_maintenance_cost: float = 0.0

class SelectedInitiative(BaseModel):
    id: str
    title: str
    category: str
    cost: float
    expected_risk_reduction: float
    rosi_pct: float
    bcr: float
    difficulty: str
    time_weeks: int
    business_unit: str
    target_controls: List[str]
    description: str
    annual_maintenance_cost: float

class FrontierPoint(BaseModel):
    budget: float
    risk_reduction: float
    rosi: float
    zone: str

class OptimizationResponse(BaseModel):
    allocated_budget: float
    budget_usd: float
    budget_utilization_pct: float
    total_risk_reduction: float
    projected_savings: float
    optimized_risk: float
    rosi: float
    selected_initiatives: List[SelectedInitiative]
    efficient_frontier: List[FrontierPoint]

class OptimizationRequest(BaseModel):
    budget_usd: float
    candidates: Optional[List[MitigationCandidate]] = None

# Risk Quantify Schemas
class SimulationParameters(BaseModel):
    mfa_coverage_delta: float = 0.0
    remediation_delay_days: float = 0.0
    threat_frequency_multiplier: float = 1.0
    edr_coverage_delta: float = 0.0
    cloud_guardrails: bool = False

class RiskQuantifyRequest(BaseModel):
    asset_id: Optional[str] = None
    parameters: SimulationParameters
    vulnerabilities: Optional[List[VulnerabilityFinding]] = None
    controls: Optional[List[SecurityControl]] = None

class RiskQuantifyResponse(BaseModel):
    baseline_eal: float
    simulated_eal: float
    delta_eal: float
    baseline_var_95: float
    simulated_var_95: float
    delta_var_95: float
    annual_probability: float
    risk_score: float
    key_takeaways: List[str]
