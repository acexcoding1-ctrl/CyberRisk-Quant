import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Sliders, 
  HelpCircle, 
  Layers, 
  ArrowUpRight, 
  Check, 
  Info,
  Download,
  PieChart,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceDot, 
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { OptimizationInitiative, Currency } from '../types/risk';
import { OptimizationApiResponse } from '../types/api';
import { formatCurrency } from '../utils/quantEngine';
import { api } from '../services/api';

interface InvestmentOptimizerProps {
  initiatives: OptimizationInitiative[];
  currency: Currency;
  onOpenBoardBrief: () => void;
}

export const InvestmentOptimizer: React.FC<InvestmentOptimizerProps> = ({
  initiatives,
  currency,
  onOpenBoardBrief,
}) => {
  // Budget in USD baseline
  const [budgetUSD, setBudgetUSD] = useState<number>(1000000); // $1M baseline
  const [activeInitiativeCategory, setActiveInitiativeCategory] = useState<string>('all');
  const [optimizationData, setOptimizationData] = useState<OptimizationApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Budget presets in USD (which convert cleanly to ~₹42L, ~₹85L, ~₹1.25 Cr, ~₹2.1 Cr, ~₹4.2 Cr)
  const budgetPresets = [
    { label: '$180K / ~₹1.5L', value: 180000 },
    { label: '$500K / ~₹42L', value: 500000 },
    { label: '$1.0M / ~₹85L', value: 1000000 },
    { label: '$1.5M / ~₹1.25 Cr', value: 1500000 },
    { label: '$2.5M / ~₹2.1 Cr', value: 2500000 },
    { label: '$5.0M / ~₹4.2 Cr', value: 5000000 },
  ];

  const fetchOptimization = async (budget: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getOptimizationRecommendations(budget);
      setOptimizationData(res);
    } catch (err: any) {
      setError(err?.message || 'Error fetching optimization from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimization(budgetUSD);
  }, [budgetUSD]);

  // Read results from backend optimization API
  const totalCost = optimizationData?.allocated_budget ?? 930000;
  const budgetUtilizationPct = optimizationData?.budget_utilization_pct ?? 93.0;
  const totalRiskReduction = optimizationData?.total_risk_reduction ?? 7100000;
  // ROSI comes directly from the backend response (Requirement 9)
  const overallROSI = optimizationData?.rosi ?? 663.4;
  const selectedList = optimizationData?.selected_initiatives ?? initiatives.slice(0, 5);
  const selectedIds = new Set(selectedList.map((i) => i.id));

  // Chart data from backend efficient_frontier
  const frontierCurve = optimizationData?.efficient_frontier ?? [
    { budget: 200000, risk_reduction: 2100000, rosi: 950.0, zone: 'Optimal Spend Zone' },
    { budget: 500000, risk_reduction: 4200000, rosi: 740.0, zone: 'Optimal Spend Zone' },
    { budget: 1000000, risk_reduction: 7100000, rosi: 610.0, zone: 'Optimal Spend Zone' },
    { budget: 1500000, risk_reduction: 8800000, rosi: 486.7, zone: 'Optimal Spend Zone' },
    { budget: 2500000, risk_reduction: 10500000, rosi: 320.0, zone: 'Diminishing Returns' },
    { budget: 4000000, risk_reduction: 11800000, rosi: 195.0, zone: 'Diminishing Returns' },
  ];

  const chartData = frontierCurve.map((pt) => ({
    budget: pt.budget / 1000000,
    budgetRaw: pt.budget,
    riskReduction: pt.risk_reduction / 1000000,
    riskReductionRaw: pt.risk_reduction,
    rosi: pt.rosi,
    zone: pt.zone,
    budgetLabel: formatCurrency(pt.budget, currency, true),
    reductionLabel: formatCurrency(pt.risk_reduction, currency, true),
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Capital Allocation Optimizer
              </span>
              <span className="text-xs text-slate-500">FAIR Knapsack Model</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              Security Investment & Return on Security Investment (ROSI)
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Mathematically maximize enterprise risk reduction within an explicit monetary budget. 
              Identify the optimal spend sweet spot and avoid diminishing returns.
            </p>
          </div>

          <button
            onClick={onOpenBoardBrief}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all self-start lg:self-center"
          >
            <Zap className="w-4 h-4 text-amber-200" />
            <span>Generate Board Approval Memo</span>
          </button>
        </div>

        {/* Budget Interactive Control Strip */}
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchOptimization(budgetUSD)}
                className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-lg text-xs hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Security Capital Budget Constraint:</span>
              <span className="text-xl font-extrabold text-emerald-700 font-mono-num ml-1">
                {formatCurrency(budgetUSD, currency)}
              </span>
              {isLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin ml-1" />
              )}
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {budgetPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setBudgetUSD(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    budgetUSD === preset.value
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/70'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="range"
            min="100000"
            max="5000000"
            step="50000"
            value={budgetUSD}
            onChange={(e) => setBudgetUSD(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Portfolio Outcome KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Allocated Budget */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Portfolio Spend</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono-num mt-1 block">
            {formatCurrency(totalCost, currency)}
          </span>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Budget Utilization:</span>
            <span className="font-bold text-emerald-700 font-mono-num">{budgetUtilizationPct}%</span>
          </div>
        </div>

        {/* Total Risk Reduction */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Risk Reduction (EAL)</span>
          <span className="text-2xl font-extrabold text-cyan-700 font-mono-num mt-1 block">
            {formatCurrency(totalRiskReduction, currency)}
          </span>
          <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Eliminates {Math.round((totalRiskReduction / 14850000) * 100)}% of current EAL</span>
          </div>
        </div>

        {/* Blended ROSI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Blended Portfolio ROSI</span>
          <span className="text-2xl font-extrabold text-emerald-700 font-mono-num mt-1 block">
            +{overallROSI}%
          </span>
          <div className="mt-2 text-xs text-slate-500">
            <span>Yields ${(totalRiskReduction / (totalCost || 1)).toFixed(2)} savings per $1 spent</span>
          </div>
        </div>

        {/* Initiatives Selected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Initiatives Funded</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono-num mt-1 block">
            {selectedList.length} / {initiatives.length}
          </span>
          <div className="mt-2 text-xs text-slate-500">
            <span>Selected via 0/1 Knapsack optimization</span>
          </div>
        </div>
      </div>

      {/* Diminishing Returns Curve: Investment vs Risk Reduction */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Investment vs. Risk Reduction Curve (Efficient Frontier)</h3>
              <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                Diminishing Returns Analysis
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Demonstrates where each additional dollar invested yields diminishing marginal risk reduction
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-700">Optimal Spend Zone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Diminishing Returns</span>
            </div>
          </div>
        </div>

        {/* Recharts Curve */}
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="budgetLabel" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                unit="M"
              />
              <Tooltip 
                formatter={(val: any, name: any, item: any) => [
                  item.payload.reductionLabel,
                  'Risk Reduction'
                ]}
                labelFormatter={(label) => `Budget: ${label}`}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="riskReduction" 
                stroke="#059669" 
                strokeWidth={3} 
                dot={{ fill: '#059669', r: 4 }}
                activeDot={{ r: 6, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zone Markers Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-200 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-600 block">Under-Invested Zone ($0 - $1.2M)</span>
            <p className="text-[11px] text-slate-500 mt-1">High marginal returns (&gt;8x). Fundamental controls missing (e.g. FIDO2 MFA, patch automation).</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 block">Optimal Zone ($1.2M - $2.8M)</span>
            <p className="text-[11px] text-emerald-700 mt-1">Highest capital efficiency. Blended ROSI between 550% and 850%. CISO recommended target.</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <span className="text-xs font-bold text-amber-800 block">Diminishing Returns Zone (&gt;$3M)</span>
            <p className="text-[11px] text-amber-700 mt-1">Marginal ROSI drops below 1.5x. Spend shifts toward insurance or risk acceptance.</p>
          </div>
        </div>
      </div>

      {/* Recommended Portfolio Initiatives Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Initiatives Under {formatCurrency(budgetUSD, currency)} Budget</h3>
            <p className="text-xs text-slate-500">Prioritized ranked by Benefit-to-Cost Ratio (BCR) and risk impact</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {selectedList.length} Funded Initiatives
          </span>
        </div>

        <div className="space-y-3">
          {initiatives.map((init) => {
            const isSelected = selectedIds.has(init.id);
            return (
              <div 
                key={init.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected 
                    ? 'bg-white border-slate-200 shadow-xs ring-1 ring-emerald-500/20'
                    : 'bg-slate-50/60 border-slate-200 opacity-65'
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      isSelected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {isSelected ? 'Funded in Budget' : 'Excluded by Budget Cap'}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {init.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                      BCR: {init.bcr}x
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Timeline: {init.timeWeeks} weeks
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mt-1">{init.title}</h4>
                  <p className="text-xs text-slate-600">{init.description}</p>
                </div>

                <div className="flex sm:items-center md:flex-col md:items-end justify-between gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-500 block">Implementation Cost:</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono-num">
                      {formatCurrency(init.cost, currency)}
                    </span>
                  </div>

                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-500 block">Risk Reduction (EAL):</span>
                    <span className="text-sm font-extrabold text-cyan-700 font-mono-num">
                      -{formatCurrency(init.expectedRiskReduction, currency)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-bold">
                      ROSI: +{init.rosiPct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
