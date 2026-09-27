import React, { useEffect, useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  CheckCircle2, 
  Activity, 
  Server, 
  Clock, 
  TrendingUp,
  RefreshCw,
  Zap
} from 'lucide-react';
import { AssetRiskDetail } from '../types/api';
import { Currency } from '../types/risk';
import { formatCurrency } from '../utils/quantEngine';
import { api } from '../services/api';

interface AssetDetailModalProps {
  assetId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onSimulateAction?: (actionText: string) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  assetId,
  isOpen,
  onClose,
  currency,
  onSimulateAction,
}) => {
  const [detail, setDetail] = useState<AssetRiskDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getRiskForAsset(id);
      setDetail(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch asset risk detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && assetId) {
      fetchDetail(assetId);
    } else {
      setDetail(null);
      setError(null);
    }
  }, [isOpen, assetId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">{assetId}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Detailed FAIR Risk Telemetry
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {detail?.asset_name || 'Asset Risk Deep-Dive'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {assetId && (
              <button
                onClick={() => fetchDetail(assetId)}
                disabled={isLoading}
                title="Refresh Asset Risk"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500">
                Querying FastAPI <span className="font-mono text-slate-700">/api/risk/{assetId}</span>...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Error Loading Asset Risk Data</span>
              </div>
              <p className="text-xs">{error}</p>
              <button
                onClick={() => assetId && fetchDetail(assetId)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Data Display */}
          {detail && !isLoading && (
            <>
              {/* Top KPI Quad */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Risk Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-slate-900 font-mono-num">{detail.risk_score}</span>
                    <span className="text-xs text-slate-400">/100</span>
                  </div>
                  <span className="text-[10px] font-bold text-rose-600 block mt-1 uppercase">
                    {detail.risk_tier} Tier
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Annual Probability</span>
                  <div className="text-2xl font-black text-slate-900 font-mono-num mt-1">
                    {Math.round(detail.annual_probability * 100)}%
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">FAIR Loss Event Freq</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected Loss (EAL)</span>
                  <div className="text-xl font-black text-slate-900 font-mono-num mt-1">
                    {formatCurrency(detail.financial_impact.expected_annual_loss, currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">Annualized Baseline</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">VaR (95% Conf.)</span>
                  <div className="text-xl font-black text-rose-600 font-mono-num mt-1">
                    {formatCurrency(detail.financial_impact.var_95, currency)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">1-in-20 Yr Worst Case</span>
                </div>
              </div>

              {/* Financial Impact Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Monetary Impact Decomposition
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-rose-600">
                    Downtime: {formatCurrency(detail.financial_impact.downtime_cost_per_hour, currency, true)}/hr
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Productivity</span>
                    <span className="font-bold text-slate-900 font-mono-num">
                      {formatCurrency(detail.financial_impact.breakdown.productivity, currency, true)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Regulatory Fines</span>
                    <span className="font-bold text-amber-700 font-mono-num">
                      {formatCurrency(detail.financial_impact.breakdown.regulatory_fines, currency, true)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Response / DFIR</span>
                    <span className="font-bold text-purple-700 font-mono-num">
                      {formatCurrency(detail.financial_impact.breakdown.response_cost, currency, true)}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Reputation Churn</span>
                    <span className="font-bold text-pink-700 font-mono-num">
                      {formatCurrency(detail.financial_impact.breakdown.reputation_loss, currency, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Key Risk Drivers */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Identified Risk Drivers & Telemetry Vectors
                </h4>
                <div className="space-y-1.5">
                  {detail.risk_drivers.map((driver, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2 shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions & ROSI */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Recommended Actions & Return on Security Investment
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-semibold">Grounded in Backend Optimizer</span>
                </div>

                <div className="space-y-2">
                  {detail.recommended_actions.map((act, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                            act.priority.includes('Emergency') || act.priority.includes('Immediate')
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {act.priority}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{act.action}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>Est. Cost: <strong className="text-slate-700">{formatCurrency(act.estimated_cost, currency)}</strong></span>
                          <span>•</span>
                          <span>Risk Reduction: <strong className="text-emerald-700">{formatCurrency(act.expected_risk_reduction, currency)}</strong></span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-700 font-mono-num bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          ROSI: +{act.rosi_pct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Endpoint: GET /api/risk/{assetId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
