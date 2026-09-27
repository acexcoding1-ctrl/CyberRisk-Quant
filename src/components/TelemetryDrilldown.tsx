import React, { useState } from 'react';
import { 
  Database, 
  Activity, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  Server, 
  ArrowUpRight, 
  CheckCircle2, 
  SlidersHorizontal,
  ExternalLink,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { TelemetrySource, Asset, VulnerabilityFinding, Currency } from '../types/risk';
import { formatCurrency } from '../utils/quantEngine';
import { AssetDetailModal } from './AssetDetailModal';

interface TelemetryDrilldownProps {
  telemetrySources: TelemetrySource[];
  assets: Asset[];
  findings: VulnerabilityFinding[];
  currency: Currency;
  onSimulateFinding: (finding: VulnerabilityFinding) => void;
  onToggleFindingStatus: (id: string) => void;
  isLoading?: boolean;
}

export const TelemetryDrilldown: React.FC<TelemetryDrilldownProps> = ({
  telemetrySources,
  assets,
  findings,
  currency,
  onSimulateFinding,
  onToggleFindingStatus,
  isLoading = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sources' | 'assets' | 'vulnerabilities'>('assets');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBU, setSelectedBU] = useState<string>('all');
  const [selectedCriticality, setSelectedCriticality] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  
  // State for /api/risk/{asset_id} detail panel
  const [selectedAssetForDetail, setSelectedAssetForDetail] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Filtered assets
  const filteredAssets = assets.filter((ast) => {
    const matchesSearch = ast.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.hostName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ast.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBU = selectedBU === 'all' || ast.businessUnit === selectedBU;
    const matchesCrit = selectedCriticality === 'all' || ast.criticality.includes(selectedCriticality);
    return matchesSearch && matchesBU && matchesCrit;
  });

  // Filtered findings
  const filteredFindings = findings.filter((f) => {
    const matchesSearch = f.cve.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.assetName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBU = selectedBU === 'all' || f.businessUnit === selectedBU;
    const matchesSev = selectedSeverity === 'all' || f.severity === selectedSeverity;
    return matchesSearch && matchesBU && matchesSev;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Subtab Navigation and Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('assets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'assets'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Asset Criticality Matrix ({assets.length})
          </button>
          <button
            onClick={() => setActiveSubTab('vulnerabilities')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'vulnerabilities'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Vulnerability Backlog & Financial Attribution ({findings.length})
          </button>
          <button
            onClick={() => setActiveSubTab('sources')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'sources'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Telemetry Ingestion Connectors (6)
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assets, CVEs, hosts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* VIEW 1: ASSET CRITICALITY MATRIX */}
      {activeSubTab === 'assets' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Filters:
              </span>
              <select
                value={selectedBU}
                onChange={(e) => setSelectedBU(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:bg-white focus:outline-none"
              >
                <option value="all">All Business Units</option>
                <option value="Retail Banking & Digital Payments">Retail Banking & Digital Payments</option>
                <option value="Cloud Infrastructure & Core Services">Cloud Infrastructure & Core Services</option>
                <option value="Wealth Management & Trading">Wealth Management & Trading</option>
                <option value="Corporate Systems & Shared Services">Corporate Systems & Shared Services</option>
              </select>

              <select
                value={selectedCriticality}
                onChange={(e) => setSelectedCriticality(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:bg-white focus:outline-none"
              >
                <option value="all">All Criticality Tiers</option>
                <option value="Tier 1">Tier 1 - Mission Critical</option>
                <option value="Tier 2">Tier 2 - Operational</option>
              </select>
            </div>

            <div className="text-slate-500 text-xs">
              Showing <span className="text-slate-900 font-bold">{filteredAssets.length}</span> of {assets.length} monitored assets
            </div>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssets.map((ast) => (
              <div 
                key={ast.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          ast.criticality.includes('Tier 1')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ast.criticality.split(' - ')[0]}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {ast.cloudProvider}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          ast.status === 'Critical Attention' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          ast.status === 'At Risk' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {ast.status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">{ast.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{ast.hostName}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900 font-mono-num block">
                        {formatCurrency(ast.eal, currency)}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Expected Annual Loss</span>
                    </div>
                  </div>

                  {/* Business & Financial Criticality Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Downtime Cost / Hr</span>
                      <span className="text-xs font-bold text-rose-600 font-mono-num">
                        {formatCurrency(ast.downtimeCostPerHour, currency, true)}/hr
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Daily Rev. Dependency</span>
                      <span className="text-xs font-bold text-slate-800 font-mono-num">
                        {formatCurrency(ast.revenueAttributionDaily, currency, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">VaR (95% Conf.)</span>
                      <span className="text-xs font-bold text-slate-800 font-mono-num">
                        {formatCurrency(ast.var95, currency, true)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Control Strength & Active CVEs */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Control Strength:</span>
                    <span className="font-bold text-slate-900 font-mono-num">{ast.controlStrengthPct}%</span>
                    <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          ast.controlStrengthPct >= 80 ? 'bg-emerald-500' :
                          ast.controlStrengthPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${ast.controlStrengthPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{ast.activeVulnerabilities} Findings</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedAssetForDetail(ast.id);
                        setIsDetailModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs"
                      title="Inspect asset risk detail via /api/risk/{asset_id}"
                    >
                      <span>Risk Drivers</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssets.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
              <Server className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No assets match the search or filter criteria</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the business unit or criticality filters.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: VULNERABILITY BACKLOG & FINANCIAL ATTRIBUTION */}
      {activeSubTab === 'vulnerabilities' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Severity Filter:
              </span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 text-xs focus:bg-white focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Correlated with Qualys, Tenable, Wiz CSPM, and CISA KEV feeds
            </div>
          </div>

          <div className="space-y-3">
            {filteredFindings.map((f) => (
              <div 
                key={f.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {f.cve}
                    </span>
                    <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                      f.severity === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {f.severity} • CVSS {f.cvss}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      EPSS: {(f.epss * 100).toFixed(0)}% Exploit Prob.
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      f.status === 'Mitigated' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      f.status === 'In Progress' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {f.status} ({f.daysOpen}d open)
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{f.title}</h4>
                  <p className="text-xs text-slate-600 font-mono">
                    Affected Asset: <span className="text-slate-900 font-semibold">{f.assetName}</span> ({f.businessUnit})
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="text-emerald-700 font-semibold">Recommended Fix:</span> {f.recommendedAction}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-slate-500 block">Est. Financial Risk Exposure:</span>
                    <span className="text-base font-extrabold text-rose-600 font-mono-num">
                      {formatCurrency(f.estimatedFinancialImpact, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Fix Cost: {formatCurrency(f.remediationCost, currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSimulateFinding(f)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                    </button>
                    <button
                      onClick={() => onToggleFindingStatus(f.id)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all shadow-xs"
                    >
                      {f.status === 'Mitigated' ? 'Reopen' : 'Mark Mitigated'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredFindings.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No vulnerability findings match the selected filter</p>
              <p className="text-xs text-slate-500 mt-1">All assets in this scope meet current patch thresholds.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: TELEMETRY INGESTION CONNECTORS */}
      {activeSubTab === 'sources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {telemetrySources.map((src) => (
            <div 
              key={src.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{src.category}</span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{src.status}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-slate-900 mt-2">{src.name}</h4>
                <p className="text-xs text-slate-500 mt-1">{src.integrationTool}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Events Ingested (24h):</span>
                    <span className="font-bold text-slate-900 font-mono-num">{src.eventsIngested24h}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Active Findings:</span>
                    <span className="font-bold text-amber-700 font-mono-num">{src.activeFindings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connector Health:</span>
                    <span className="font-bold text-emerald-700 font-mono-num">{src.healthScore}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Last Polled: {src.lastSync}</span>
                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Synchronized</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Risk Detail Panel (GET /api/risk/{asset_id}) */}
      <AssetDetailModal
        assetId={selectedAssetForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        currency={currency}
      />
    </div>
  );
};
