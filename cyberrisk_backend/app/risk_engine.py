import math
from typing import List, Dict, Any, Optional
from .data import DEMO_ASSETS, DEMO_VULNERABILITIES, DEMO_CONTROLS
from .schemas import (
    AssetRiskSummary,
    AssetRiskDetail,
    FinancialImpactDetail,
    ActionItem,
    DashboardResponse,
    DashboardKPIs,
    LossBreakdown,
    TrendMonth,
    LossExceedancePoint,
    RiskQuantifyRequest,
    RiskQuantifyResponse
)

def calculate_asset_risk_summary(asset: Dict[str, Any]) -> AssetRiskSummary:
    asset_id = asset["id"]
    vulns = [v for v in DEMO_VULNERABILITIES if v["affected_asset_id"] == asset_id and v["status"] != "Mitigated"]
    
    # Calculate TEF (Threat Event Frequency) and Vulnerability based on active CVEs and EPSS
    max_epss = max([v["epss"] for v in vulns], default=0.15)
    max_cvss = max([v["cvss"] for v in vulns], default=4.0)
    
    # FAIR-grounded annual probability
    annual_probability = min(0.95, round(max_epss * (1.0 - (asset["control_strength_pct"] / 150.0)), 2))
    risk_score = min(100.0, round((max_cvss * 6) + (max_epss * 25) + (annual_probability * 15), 1))
    
    downtime_rate = asset.get("downtime_cost_per_hour", 50000.0)
    min_loss = round(downtime_rate * 8.0, 2)
    mode_loss = round(asset.get("eal", 2000000.0) * 0.85, 2)
    max_loss = round(asset.get("var_95", 5000000.0) * 1.35, 2)
    
    risk_tier = "Critical" if risk_score >= 80 else "High" if risk_score >= 60 else "Medium" if risk_score >= 40 else "Low"
    
    risk_drivers = [
        f"Criticality level: {asset['criticality']}",
        f"Daily revenue attribution: ${asset['revenue_attribution_daily']:,.0f}",
        f"{len(vulns)} unmitigated vulnerability finding(s)"
    ]
    if vulns:
        risk_drivers.append(f"Top exploit vector: {vulns[0]['cve']} ({vulns[0]['threat_vector']})")

    recommended_actions = [
        f"Prioritize immediate remediation for {len(vulns)} open CVE(s)",
        "Upgrade control strength to surpass 85% benchmark"
    ]

    return AssetRiskSummary(
        asset_id=asset["id"],
        asset_name=asset["name"],
        risk_score=risk_score,
        annual_probability=annual_probability,
        expected_annual_loss=asset.get("eal", 2000000.0),
        var_95=asset.get("var_95", 4500000.0),
        threat_event_frequency=round(3.0 + len(vulns) * 0.8, 1),
        vulnerability_score=round(max_epss, 2),
        loss_magnitude_min=min_loss,
        loss_magnitude_mode=mode_loss,
        loss_magnitude_max=max_loss,
        loss_magnitude_p95=asset.get("var_95", 4500000.0),
        risk_tier=risk_tier,
        risk_drivers=risk_drivers,
        recommended_actions=recommended_actions
    )

def get_asset_risk_detail(asset_id: str) -> Optional[AssetRiskDetail]:
    asset = next((a for a in DEMO_ASSETS if a["id"] == asset_id), None)
    if not asset:
        return None
    
    vulns = [v for v in DEMO_VULNERABILITIES if v["affected_asset_id"] == asset_id]
    open_vulns = [v for v in vulns if v["status"] != "Mitigated"]
    
    summary = calculate_asset_risk_summary(asset)
    
    # Financial breakdown
    eal = asset.get("eal", 2500000.0)
    var95 = asset.get("var_95", 5000000.0)
    var99 = round(var95 * 1.42, 2)
    
    productivity = round(eal * 0.48, 2)
    regulatory = round(eal * 0.22, 2)
    response = round(eal * 0.18, 2)
    reputation = round(eal * 0.12, 2)
    
    financial_impact = FinancialImpactDetail(
        expected_annual_loss=eal,
        var_95=var95,
        var_99=var99,
        downtime_cost_per_hour=asset.get("downtime_cost_per_hour", 50000.0),
        loss_magnitude_min=summary.loss_magnitude_min,
        loss_magnitude_mode=summary.loss_magnitude_mode,
        loss_magnitude_max=summary.loss_magnitude_max,
        breakdown={
            "productivity": productivity,
            "regulatory_fines": regulatory,
            "response_cost": response,
            "reputation_loss": reputation
        }
    )
    
    # Recommended actions
    actions: List[ActionItem] = []
    for idx, v in enumerate(open_vulns[:3]):
        actions.append(ActionItem(
            action=v["recommended_action"],
            priority="Emergency" if v["cvss"] >= 9.0 else "High",
            estimated_cost=v["remediation_cost"],
            expected_risk_reduction=round(v["estimated_financial_impact"] * 0.75, 2),
            rosi_pct=round(((v["estimated_financial_impact"] * 0.75 - v["remediation_cost"]) / (v["remediation_cost"] or 1)) * 100, 1)
        ))
    
    if not actions:
        actions.append(ActionItem(
            action="Continuous posture monitoring and routine patch compliance.",
            priority="Standard",
            estimated_cost=10000.0,
            expected_risk_reduction=150000.0,
            rosi_pct=1400.0
        ))
        
    risk_drivers = [
        f"Critical asset host: {asset['host_name']} in {asset['cloud_provider']}",
        f"Hourly outage cost: ${asset.get('downtime_cost_per_hour', 0):,.0f}/hr",
        f"Active unpatched CVEs: {len(open_vulns)}",
        f"Current control strength: {asset.get('control_strength_pct', 0)}%"
    ]
    for v in open_vulns[:2]:
        risk_drivers.append(f"{v['cve']} ({v['title']}) with EPSS exploitability {int(v['epss']*100)}%")
        
    return AssetRiskDetail(
        asset_id=asset["id"],
        asset_name=asset["name"],
        risk_score=summary.risk_score,
        risk_tier=summary.risk_tier,
        annual_probability=summary.annual_probability,
        financial_impact=financial_impact,
        risk_drivers=risk_drivers,
        recommended_actions=actions,
        controls_summary={
            "strength_pct": asset.get("control_strength_pct", 75.0),
            "status": asset.get("status", "Healthy"),
            "data_classification": asset.get("data_classification", "Financial")
        },
        cve_count=len(vulns)
    )

def build_dashboard_response() -> DashboardResponse:
    total_eal = sum(a["eal"] for a in DEMO_ASSETS)
    # Target addressable reduction
    projected_savings = 7100000.0
    required_budget = 930000.0
    optimized_risk = total_eal - projected_savings
    
    # ROSI = ((Risk Reduction - Cost) / Cost) * 100
    rosi = round(((projected_savings - required_budget) / required_budget) * 100, 1)
    mitigable_pct = round((projected_savings / total_eal) * 100, 1)
    
    return DashboardResponse(
        total_annual_monetary_risk=total_eal,
        optimized_risk=optimized_risk,
        projected_savings=projected_savings,
        rosi=rosi,
        required_budget=required_budget,
        mitigable_percentage=mitigable_pct,
        kpis=DashboardKPIs(
            enterprise_risk_score=68.0,
            risk_tier="High Risk Tier",
            score_delta=-8.0,
            total_assets=735,
            monitored_assets=735,
            total_vulnerabilities=142,
            critical_findings=18,
            average_control_effectiveness=74.2,
            var_95=28400000.0,
            var_99=41200000.0
        ),
        loss_breakdown=LossBreakdown(
            business_interruption=6400000.0,
            regulatory_fines=3100000.0,
            response_and_forensics=2900000.0,
            reputational_loss=2450000.0
        ),
        trend_6_month=[
            TrendMonth(month="Apr 2026", eal=18200000.0, risk_score=76.0, incident_count=5),
            TrendMonth(month="May 2026", eal=17400000.0, risk_score=74.0, incident_count=4),
            TrendMonth(month="Jun 2026", eal=16900000.0, risk_score=72.0, incident_count=3),
            TrendMonth(month="Jul 2026", eal=16100000.0, risk_score=71.0, incident_count=3),
            TrendMonth(month="Aug 2026", eal=15400000.0, risk_score=69.0, incident_count=2),
            TrendMonth(month="Sep 2026", eal=14850000.0, risk_score=68.0, incident_count=1),
        ],
        loss_exceedance_curve=[
            LossExceedancePoint(exceedance_probability=99.0, loss_amount=1800000.0),
            LossExceedancePoint(exceedance_probability=90.0, loss_amount=4200000.0),
            LossExceedancePoint(exceedance_probability=75.0, loss_amount=7600000.0),
            LossExceedancePoint(exceedance_probability=50.0, loss_amount=14850000.0),
            LossExceedancePoint(exceedance_probability=25.0, loss_amount=21500000.0),
            LossExceedancePoint(exceedance_probability=10.0, loss_amount=26800000.0),
            LossExceedancePoint(exceedance_probability=5.0, loss_amount=28400000.0),
            LossExceedancePoint(exceedance_probability=1.0, loss_amount=41200000.0),
        ]
    )

def quantify_risk_simulation(req: RiskQuantifyRequest) -> RiskQuantifyResponse:
    baseline_eal = 14850000.0
    baseline_var95 = 28400000.0
    
    p = req.parameters
    # MFA impact: each +10% reduces EAL by 4.2%
    mfa_factor = 1.0 - (p.mfa_coverage_delta / 100.0 * 0.42)
    # EDR impact: each +10% reduces EAL by 3.5%
    edr_factor = 1.0 - (p.edr_coverage_delta / 100.0 * 0.35)
    # Patch delay: each +10 days increases EAL by 8.5%
    patch_factor = 1.0 + (p.remediation_delay_days * 0.0085)
    # Threat multiplier directly scales frequency
    threat_factor = p.threat_frequency_multiplier
    # Cloud guardrails reduces by 12%
    guardrail_factor = 0.88 if p.cloud_guardrails else 1.0
    
    combined_multiplier = max(0.15, mfa_factor * edr_factor * patch_factor * threat_factor * guardrail_factor)
    
    simulated_eal = round(baseline_eal * combined_multiplier, 2)
    delta_eal = round(simulated_eal - baseline_eal, 2)
    
    simulated_var95 = round(baseline_var95 * math.sqrt(combined_multiplier), 2)
    delta_var95 = round(simulated_var95 - baseline_var95, 2)
    
    prob = min(0.98, max(0.05, round(0.42 * combined_multiplier, 2)))
    score = min(100.0, max(10.0, round(68.0 * combined_multiplier, 1)))
    
    takeaways = []
    if delta_eal < 0:
        takeaways.append(f"Simulation yields net risk reduction of ${abs(delta_eal):,.0f} annually.")
    else:
        takeaways.append(f"Risk increases by ${delta_eal:,.0f} due to heightened exposure or delays.")
    
    if p.mfa_coverage_delta > 0:
        takeaways.append(f"Enforcing +{p.mfa_coverage_delta}% MFA provides immediate identity layer resilience.")
    if p.remediation_delay_days < 0:
        takeaways.append(f"Accelerating patch turnaround by {abs(p.remediation_delay_days)} days significantly suppresses exploit window.")
    if p.cloud_guardrails:
        takeaways.append("Cloud guardrail automation protects against misconfiguration-driven credential leakages.")
        
    return RiskQuantifyResponse(
        baseline_eal=baseline_eal,
        simulated_eal=simulated_eal,
        delta_eal=delta_eal,
        baseline_var_95=baseline_var95,
        simulated_var_95=simulated_var95,
        delta_var_95=delta_var95,
        annual_probability=prob,
        risk_score=score,
        key_takeaways=takeaways
    )
