from typing import List, Optional, Dict, Any
from .data import DEMO_INITIATIVES
from .schemas import (
    MitigationCandidate,
    SelectedInitiative,
    FrontierPoint,
    OptimizationResponse,
    OptimizationRequest
)

def run_portfolio_optimization(
    budget_usd: float,
    candidates: Optional[List[MitigationCandidate]] = None
) -> OptimizationResponse:
    # Use provided candidates or fallback to DEMO_INITIATIVES
    items: List[Dict[str, Any]] = []
    if candidates and len(candidates) > 0:
        for c in candidates:
            items.append(c.model_dump())
    else:
        items = [dict(i) for i in DEMO_INITIATIVES]
        
    # Calculate benefit-to-cost ratio (BCR) and sort greedily
    for item in items:
        cost = max(item.get("cost", 1.0), 1.0)
        reduction = item.get("expected_risk_reduction", 0.0)
        item["bcr"] = round(reduction / cost, 2)
        item["rosi_pct"] = round(((reduction - cost) / cost) * 100, 1)
        
    sorted_items = sorted(items, key=lambda x: x["bcr"], reverse=True)
    
    current_cost = 0.0
    current_reduction = 0.0
    selected: List[SelectedInitiative] = []
    
    for item in sorted_items:
        cost = item.get("cost", 0.0)
        if current_cost + cost <= budget_usd:
            selected.append(SelectedInitiative(
                id=item["id"],
                title=item["title"],
                category=item.get("category", "General Security"),
                cost=cost,
                expected_risk_reduction=item.get("expected_risk_reduction", 0.0),
                rosi_pct=item["rosi_pct"],
                bcr=item["bcr"],
                difficulty=item.get("difficulty", "Medium"),
                time_weeks=item.get("time_weeks", 4),
                business_unit=item.get("business_unit", "Enterprise-Wide"),
                target_controls=item.get("target_controls", []),
                description=item.get("description", ""),
                annual_maintenance_cost=item.get("annual_maintenance_cost", 0.0)
            ))
            current_cost += cost
            current_reduction += item.get("expected_risk_reduction", 0.0)
            
    # Calculate overall blended ROSI
    blended_rosi = 0.0
    if current_cost > 0:
        blended_rosi = round(((current_reduction - current_cost) / current_cost) * 100, 1)
        
    budget_utilization = round((current_cost / budget_usd) * 100, 1) if budget_usd > 0 else 0.0
    projected_savings = round(current_reduction - current_cost, 2)
    baseline_eal = 14850000.0
    optimized_risk = round(max(0.0, baseline_eal - current_reduction), 2)
    
    # Generate Diminishing Returns Curve (Efficient Frontier)
    frontier_points: List[FrontierPoint] = []
    step_budget = max(budget_usd * 1.5, 3000000.0) / 8.0
    running_budget = 200000.0
    
    while running_budget <= max(budget_usd * 1.5, 4500000.0):
        # Calculate optimal reduction at this budget point
        c_cost = 0.0
        c_red = 0.0
        for itm in sorted_items:
            if c_cost + itm["cost"] <= running_budget:
                c_cost += itm["cost"]
                c_red += itm["expected_risk_reduction"]
        
        f_rosi = round(((c_red - c_cost) / c_cost * 100), 1) if c_cost > 0 else 0.0
        zone = "Optimal Spend Zone" if running_budget <= 1500000.0 else "Diminishing Returns"
        
        frontier_points.append(FrontierPoint(
            budget=round(running_budget, 0),
            risk_reduction=round(c_red, 0),
            rosi=f_rosi,
            zone=zone
        ))
        running_budget += step_budget

    return OptimizationResponse(
        allocated_budget=round(current_cost, 2),
        budget_usd=budget_usd,
        budget_utilization_pct=budget_utilization,
        total_risk_reduction=round(current_reduction, 2),
        projected_savings=projected_savings,
        optimized_risk=optimized_risk,
        rosi=blended_rosi,
        selected_initiatives=selected,
        efficient_frontier=frontier_points
    )
