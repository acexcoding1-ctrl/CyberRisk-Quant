# CyberRisk Quant FastAPI Backend

Enterprise AI-powered cyber risk quantification, Expected Annual Loss (EAL) calculation, and security capital allocation optimization engine aligned with FAIR™ (Factor Analysis of Information Risk) standards.

## Project Structure

```
cyberrisk_backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app + API endpoints
│   ├── config.py            # Environment & CORS configuration
│   ├── schemas.py           # Pydantic request/response models
│   ├── data.py              # Demo assets, vulnerabilities, controls, initiatives
│   ├── risk_engine.py       # FAIR risk calculation & simulation engine
│   └── optimization.py      # Budget-based 0/1 knapsack mitigation optimizer & efficient frontier
│
├── requirements.txt
├── .env.example
├── AI_STUDIO_PROMPT.txt
└── README.md
```

## Quickstart

### 1. Create a Virtual Environment and Install Dependencies

```bash
cd cyberrisk_backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the FastAPI Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health check & version info |
| `GET` | `/api/dashboard` | Dashboard KPIs, total annual monetary risk, optimized risk, projected savings, ROSI |
| `GET` | `/api/assets` | Monitored asset list & criticality matrix |
| `GET` | `/api/vulnerabilities` | Vulnerability findings (optional query `?asset_id=A-001`) |
| `GET` | `/api/controls` | Security controls inventory & effectiveness percentages |
| `GET` | `/api/risks` | Quantified FAIR risk for all monitored assets |
| `GET` | `/api/risk/{asset_id}` | Detailed risk for selected asset (risk score, probability, financial impact, drivers, recommendations) |
| `GET` | `/api/optimization/recommendations` | Budget-aware mitigation recommendations (query `?budget_usd=180000`) |
| `POST` | `/api/optimization` | Optimize supplied mitigation candidates against an explicit budget |
| `POST` | `/api/risk/quantify` | Calculate risk delta from supplied asset, vulnerability, and control parameters |

## Frontend Integration

The React/Vite frontend automatically connects to this backend via:
```bash
VITE_API_BASE_URL="http://localhost:8000"
```
If the backend is not running, the frontend gracefully displays the connection status with automatic retries and baseline telemetry fallback.
