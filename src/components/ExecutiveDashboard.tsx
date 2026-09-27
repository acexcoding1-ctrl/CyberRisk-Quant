import React from 'react';
import { 
  ShieldAlert, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  Layers, 
  FileText, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3, 
  Zap,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { QuantSummary, Currency, BusinessUnit, VulnerabilityFinding, Asset } from '../types/risk';
import { DashboardApiResponse } from '../types/api';
import { formatCurrency } from '../utils/quantEngine';

interface ExecutiveDashboardProps {
  summary: QuantSummary;
  dashboardData?: DashboardApiResponse | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isLiveBackend?: boolean;
  businessUnits: BusinessUnit[];
  findings: VulnerabilityFinding[];
  assets: Asset[];
  currency: Currency;
  onNavigateToTab: (tab: string) => void;
  onSimulateFinding: (finding: VulnerabilityFinding) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  summary,
  dashboardData,
  isLoading = false,
  error = null,
  onRetry,
  isLiveBackend = false,
  businessUnits,
  findings,
  assets,
  currency,
  onNavigateToTab,
  onSimulateFinding,
}) => {
  // Use real backend data from GET /api/dashboard when available, else fallback cleanly
  const totalEal = dashboardData?.total_annual_monetary_risk ?? summary.totalEal;
  const enterpriseRiskScore = dashboardData?.kpis?.enterprise_risk_score ?? summary.enterpriseRiskScore;
  const scoreDelta = dashboardData?.kpis?.score_delta ?? -8;
  const riskTier = dashboardData?.kpis?.risk_tier ?? 'High Risk Tier';
  const var95 = dashboardData?.kpis?.var_95 ?? summary.var95;
  const var99 = dashboardData?.kpis?.var_99 ?? summary.var99;
  
  // Real backend addressable savings and ROSI from /api/dashboard
  const projectedSavings = dashboardData?.projected_savings ?? 7100000;
  const rosi = dashboardData?.rosi ?? 663.4;
  const mitigablePct = dashboardData?.mitigable_percentage ?? 47.8;
  const requiredBudget = dashboardData?.required_budget ?? 930000;

  const lossBreakdown = dashboardData?.loss_breakdown ?? {
    business_interruption: summary.lossBreakdown.businessInterruption,
    regulatory_fines: summary.lossBreakdown.regulatoryFines,
    response_and_forensics: summary.lossBreakdown.responseAndForensics,
    reputational_loss: summary.lossBreakdown.reputationalLoss,
  };

  // Color palette for loss categories
  const lossCategories = [
    {
      label: 'Business Interruption & Downtime',
      amount: lossBreakdown.business_interruption,
      color: '#38bdf8', // Sky 400
      pct: Math.round((lossBreakdown.business_interruption / (totalEal || 1)) * 100),
      desc: 'Lost transactions, idle labor, and outage recovery',
    },
    {
      label: 'Regulatory Penalties & Statutory Fines',
      amount: lossBreakdown.regulatory_fines,
      color: '#f59e0b', // Amber 500
      pct: Math.round((lossBreakdown.regulatory_fines / (totalEal || 1)) * 100),
      desc: 'RBI Cyber Security, SEBI CSCRF, GDPR fines',
    },
    {
      label: 'Incident Response & Forensics',
      amount: lossBreakdown.response_and_forensics,
      color: '#a855f7', // Purple 500
      pct: Math.round((lossBreakdown.response_and_forensics / (totalEal || 1)) * 100),
      desc: 'External DFIR firms, legal counsel, ransom containment',
    },
    {
      label: 'Reputational & Customer Churn',
      amount: lossBreakdown.reputational_loss,
      color: '#ec4899', // Pink 500
      pct: Math.round((lossBreakdown.reputational_loss / (totalEal || 1)) * 100),
      desc: 'Deposit run-off, client departures, brand dilution',
    },
  ];

  // Format data for Recharts loss exceedance curve
  const curvePoints = dashboardData?.loss_exceedance_curve ?? summary.lossExceedanceCurve.map((c) => ({
    exceedance_probability: c.exceedanceProbability,
    loss_amount: c.lossAmount,
  }));

  const lecData = curvePoints.map((item) => ({
    probability: `${item.exceedance_probability}%`,
    probNum: item.exceedance_probability,
    lossFormatted: formatCurrency(item.loss_amount, currency, true),
    rawLoss: item.loss_amount,
  }));

  // Format historical trend
  const trendPoints = dashboardData?.trend_6_month ?? summary.trend6Month.map((t) => ({
    month: t.month,
    eal: t.eal,
    risk_score: t.riskScore,
    incident_count: t.incidentCount,
  }));

  const trendData = trendPoints.map((t) => ({
    month: t.month.split(' ')[0],
    eal: t.eal / 1000000,
    ealFormatted: formatCurrency(t.eal, currency, true),
    score: t.risk_score,
    incidents: t.incident_count,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Continuous Telemetry Grounded
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Updated 2 minutes ago
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Cyber Risk & Financial Exposure
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Monetary risk quantification converting technical security telemetry into Expected Annual Loss (EAL), 
              Value at Risk (VaR), and capital allocation optimization for executive leadership.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToTab('simulator')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition-all shadow-xs"
            >
              <span>Explore What-If Scenarios</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              onClick={() => onNavigateToTab('optimizer')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Zap className="w-4 h-4 text-amber-200" />
              <span>Optimize $1M+ Spend</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status / Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-700 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors"
            >
              Retry Connection
            </button>
          )}
        </div>
      )}

      {/* Main KPI Quad-Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Enterprise Risk Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Enterprise Risk Score</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
              {riskTier}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-slate-900 font-mono-num">{enterpriseRiskScore}</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts (FAIR continuous)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(5, enterpriseRiskScore))}%` }} 
            />
          </div>
        </div>

        {/* Expected Annual Loss (EAL) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Expected Annual Loss (EAL)</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Annualized
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
              {formatCurrency(totalEal, currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
            <span>Aggregated loss across {dashboardData?.kpis?.total_assets ?? 735} assets</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Derived from 50,000 Monte Carlo FAIR simulation trials.
          </p>
        </div>

        {/* Value at Risk (VaR 95%) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Value at Risk (VaR 95%)</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
              1-in-20 Yr Event
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono-num">
              {formatCurrency(var95, currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            <span>95% probability annual losses will not exceed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Max Probable Loss (99%): <span className="font-semibold text-slate-700">{formatCurrency(var99, currency, true)}</span>
          </p>
        </div>

        {/* Addressable Risk Reduction */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-300 hover:shadow-md transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Addressable Risk Reduction</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono-num">
              ROSI: +{rosi}%
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-700 font-mono-num">
              {formatCurrency(projectedSavings, currency)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{mitigablePct}% of current EAL mitigable</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Req. Security Budget: <span className="font-semibold text-slate-700">{formatCurrency(requiredBudget, currency, true)}</span>
          </p>
        </div>
      </div>

      {/* Grid: Financial Loss Breakdown + Loss Exceedance Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Financial Loss Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Annual Financial Loss Breakdown</h3>
                <p className="text-xs text-slate-500">Decomposition of the {formatCurrency(summary.totalEal, currency, true)} Expected Loss</p>
              </div>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Segmented Loss Progress Bar */}
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-100 mb-6 ring-1 ring-slate-200">
              {lossCategories.map((cat, idx) => (
                <div
                  key={idx}
                  style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                  title={`${cat.label}: ${cat.pct}%`}
                  className="h-full hover:opacity-85 transition-opacity"
                />
              ))}
            </div>

            {/* Metric Rows */}
            <div className="space-y-3.5">
              {lossCategories.map((cat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">{cat.label}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700 font-mono-num">
                          {cat.pct}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono-num">
                      {formatCurrency(cat.amount, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Primary regulatory drivers:</span>
            <span className="text-emerald-700 font-semibold">RBI Cyber Framework & SEBI CSCRF</span>
          </div>
        </div>

        {/* Loss Exceedance Curve (LEC) & Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Loss Exceedance Curve (LEC)</h3>
                <span className="text-[10px] font-semibold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                  FAIR Statistical Distribution
                </span>
              </div>
              <p className="text-xs text-slate-500">Probability (Y-axis) that annual loss will exceed specified threshold (X-axis)</p>
            </div>
            <BarChart3 className="w-5 h-5 text-sky-600" />
          </div>

          {/* Area Chart for LEC */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lecData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lecGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="lossFormatted" 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-xs">
                          <p className="font-bold text-slate-900">Exceedance Probability: {data.probability}</p>
                          <p className="text-sky-700 font-mono-num font-semibold mt-1">
                            Loss Threshold: {formatCurrency(data.rawLoss, currency)}
                          </p>
                          <p className="text-slate-500 text-[10px] mt-1">
                            There is a {data.probability} statistical likelihood that annual cyber loss exceeds this value.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="probNum" 
                  stroke="#0284c7" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#lecGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Key Reference Callouts */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">50% Exceedance (Median)</span>
              <span className="text-sm font-bold text-slate-900 font-mono-num mt-0.5 block">
                {formatCurrency(14850000, currency, true)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase text-amber-700 font-bold block">10% Exceedance (1-in-10)</span>
              <span className="text-sm font-bold text-amber-700 font-mono-num mt-0.5 block">
                {formatCurrency(28400000, currency, true)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase text-rose-700 font-bold block">1% Exceedance (1-in-100)</span>
              <span className="text-sm font-bold text-rose-700 font-mono-num mt-0.5 block">
                {formatCurrency(54000000, currency, true)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Business Unit Exposure & Top CVE Vulnerability Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Business Unit Cyber Exposure (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Business Unit Risk & Exposure</h3>
              <p className="text-xs text-slate-500">Financial cyber exposure correlated with business revenue dependencies</p>
            </div>
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3">
            {businessUnits.map((bu) => (
              <div key={bu.id} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-900">{bu.name}</span>
                    <p className="text-xs text-slate-500">{bu.head} • {bu.assetCount} Assets</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-900 font-mono-num">
                      {formatCurrency(bu.eal, currency)}
                    </span>
                    <span className="text-xs text-slate-500 block font-mono-num">
                      VaR 95%: {formatCurrency(bu.var95, currency, true)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Risk Index: {bu.riskScore}/100</span>
                      <span>Rev. Weight: {bu.revenueContributionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          bu.riskScore > 70 ? 'bg-rose-500' : bu.riskScore > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${bu.riskScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0 text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                    {bu.threatActorsTracked} Threat Actors
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risk Drivers & Unpatched CVEs (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Top Financial Cyber Risk Drivers</h3>
              <p className="text-xs text-slate-500">Technical vulnerabilities weighted by asset criticality and financial impact</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>

          <div className="space-y-3">
            {findings.slice(0, 4).map((f) => (
              <div 
                key={f.id} 
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                        {f.cve}
                      </span>
                      <span className="text-xs text-slate-800 font-semibold line-clamp-1">{f.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Asset: <span className="text-slate-800 font-medium">{f.assetName}</span> • EPSS: <span className="text-amber-700 font-bold">{f.epss}</span> (CVSS {f.cvss})
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-extrabold text-rose-600 font-mono-num block">
                      +{formatCurrency(f.estimatedFinancialImpact, currency, true)}
                    </span>
                    <span className="text-[10px] text-slate-400">Exp. Loss Contribution</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
                    {f.recommendedAction}
                  </span>
                  <button
                    onClick={() => onSimulateFinding(f)}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 shrink-0 ml-2"
                  >
                    <span>Simulate Remediation</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">Total 342 active CVEs across enterprise fleet</span>
            <button 
              onClick={() => onNavigateToTab('telemetry')} 
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>View Full Technical Backlog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
