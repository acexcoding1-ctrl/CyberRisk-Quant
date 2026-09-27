from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .data import DEMO_ASSETS, DEMO_VULNERABILITIES, DEMO_CONTROLS
from .schemas import (
    HealthResponse,
    DashboardResponse,
    AssetBase,
    VulnerabilityFinding,
    SecurityControl,
    AssetRiskSummary,
    AssetRiskDetail,
    OptimizationResponse,
    OptimizationRequest,
    RiskQuantifyRequest,
    RiskQuantifyResponse
)
from .risk_engine import (
    build_dashboard_response,
    calculate_asset_risk_summary,
    get_asset_risk_detail,
    quantify_risk_simulation
)
from .optimization import run_portfolio_optimization

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Enterprise Cyber Risk Quantification & Investment Optimization Backend (FAIR Standards)"
)

# Enable CORS for React/Vite development and production origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Health Check
@app.get("/api/health", response_model=HealthResponse, tags=["Health"])
def get_health():
    """Health check endpoint to verify backend status."""
    return HealthResponse(
        status="healthy",
        backend=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

# 2. Dashboard KPIs
@app.get("/api/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
def get_dashboard():
    """Returns top-level quantified risk metrics, total annual monetary risk, optimized risk, projected savings, and ROSI."""
    return build_dashboard_response()

# 3. Assets
@app.get("/api/assets", response_model=List[AssetBase], tags=["Assets"])
def get_assets():
    """Returns list of enterprise monitored assets with criticality and telemetry status."""
    return [AssetBase(**asset) for asset in DEMO_ASSETS]

# 4. Vulnerabilities
@app.get("/api/vulnerabilities", response_model=List[VulnerabilityFinding], tags=["Vulnerabilities"])
def get_vulnerabilities(asset_id: Optional[str] = Query(None, description="Filter findings by affected asset ID")):
    """Returns vulnerability findings, optionally filtered by asset_id (e.g. ?asset_id=A-001)."""
    if asset_id:
        filtered = [v for v in DEMO_VULNERABILITIES if v["affected_asset_id"] == asset_id]
        return [VulnerabilityFinding(**v) for v in filtered]
    return [VulnerabilityFinding(**v) for v in DEMO_VULNERABILITIES]

# 5. Security Controls
@app.get("/api/controls", response_model=List[SecurityControl], tags=["Controls"])
def get_controls():
    """Returns security controls inventory and their measured effectiveness percentages."""
    return [SecurityControl(**ctrl) for ctrl in DEMO_CONTROLS]

# 6. Quantified Risks for All Assets
@app.get("/api/risks", response_model=List[AssetRiskSummary], tags=["Risks"])
def get_risks():
    """Returns quantified FAIR risk parameters (EAL, VaR, loss distributions, drivers) for all assets."""
    return [calculate_asset_risk_summary(asset) for asset in DEMO_ASSETS]

# 7. Detailed Risk for Selected Asset
@app.get("/api/risk/{asset_id}", response_model=AssetRiskDetail, tags=["Risks"])
def get_risk_for_asset(asset_id: str):
    """Returns deep-dive quantified risk analysis for a specific asset including risk drivers and recommended actions."""
    detail = get_asset_risk_detail(asset_id)
    if not detail:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset with ID '{asset_id}' not found in telemetry registry."
        )
    return detail

# 8. Budget-Aware Mitigation Recommendations (GET)
@app.get("/api/optimization/recommendations", response_model=OptimizationResponse, tags=["Optimization"])
def get_optimization_recommendations(
    budget_usd: float = Query(180000.0, description="Security capital budget allocation in USD")
):
    """Calculates optimal security initiative portfolio and returns recommended investments and ROSI."""
    return run_portfolio_optimization(budget_usd=budget_usd)

# 9. Mitigation Optimization (POST)
@app.post("/api/optimization", response_model=OptimizationResponse, tags=["Optimization"])
def post_optimization(payload: OptimizationRequest):
    """Optimizes supplied mitigation candidates against an explicit budget constraint."""
    return run_portfolio_optimization(
        budget_usd=payload.budget_usd,
        candidates=payload.candidates
    )

# 10. Risk Quantification Simulation (POST)
@app.post("/api/risk/quantify", response_model=RiskQuantifyResponse, tags=["Risk Quantification"])
def post_risk_quantify(payload: RiskQuantifyRequest):
    """Calculates risk delta from supplied asset, vulnerability, and control parameters."""
    return quantify_risk_simulation(payload)
