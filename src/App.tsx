import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { TelemetryDrilldown } from './components/TelemetryDrilldown';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { InvestmentOptimizer } from './components/InvestmentOptimizer';
import { ComplianceMapping } from './components/ComplianceMapping';
import { AIDecisionAssistant } from './components/AIDecisionAssistant';
import { BoardMemoModal } from './components/BoardMemoModal';
import { 
  INITIAL_TELEMETRY_SOURCES, 
  INITIAL_BUSINESS_UNITS, 
  INITIAL_ASSETS, 
  INITIAL_FINDINGS, 
  INITIAL_SECURITY_CONTROLS, 
  INITIAL_OPTIMIZATION_INITIATIVES, 
  INITIAL_COMPLIANCE_FRAMEWORKS, 
  INITIAL_SIMULATION_SCENARIOS, 
  INITIAL_QUANT_SUMMARY 
} from './data/mockTelemetry';
import { Currency, VulnerabilityFinding, SimulationScenario } from './types/risk';
import { DashboardApiResponse, ConnectionState } from './types/api';
import { api, subscribeConnectionState, API_BASE_URL } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('executive');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [isBoardMemoOpen, setIsBoardMemoOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Backend connection & API data state
  const [backendState, setBackendState] = useState<ConnectionState>('checking');
  const [backendMessage, setBackendMessage] = useState<string>('');
  const [isRefreshingBackend, setIsRefreshingBackend] = useState<boolean>(false);
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Core telemetry state
  const [telemetrySources, setTelemetrySources] = useState(INITIAL_TELEMETRY_SOURCES);
  const [businessUnits, setBusinessUnits] = useState(INITIAL_BUSINESS_UNITS);
  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [findings, setFindings] = useState(INITIAL_FINDINGS);
  const [controls, setControls] = useState(INITIAL_SECURITY_CONTROLS);
  const [initiatives, setInitiatives] = useState(INITIAL_OPTIMIZATION_INITIATIVES);
  const [frameworks, setFrameworks] = useState(INITIAL_COMPLIANCE_FRAMEWORKS);
  const [scenarios, setScenarios] = useState(INITIAL_SIMULATION_SCENARIOS);
  const [summary, setSummary] = useState(INITIAL_QUANT_SUMMARY);

  // Load data from centralized FastAPI API service
  const loadData = async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      // 1. Health check & dashboard KPIs
      await api.getHealth();
      const dash = await api.getDashboard();
      setDashboardData(dash);

      // 2. Monitored Assets & Findings
      const [fetchedAssets, fetchedFindings, fetchedControls] = await Promise.all([
        api.getAssets(),
        api.getVulnerabilities(),
        api.getControls()
      ]);

      if (fetchedAssets && fetchedAssets.length > 0) {
        setAssets(fetchedAssets);
      }
      if (fetchedFindings && fetchedFindings.length > 0) {
        setFindings(fetchedFindings);
      }
      if (fetchedControls && fetchedControls.length > 0) {
        setControls(fetchedControls);
      }
    } catch (err: any) {
      setDashboardError(err?.message || 'Error connecting to FastAPI backend.');
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeConnectionState((state, msg) => {
      setBackendState(state);
      setBackendMessage(msg || '');
    });
    loadData();
    return () => unsubscribe();
  }, []);

  const handleRefreshBackend = async () => {
    setIsRefreshingBackend(true);
    await loadData();
    setIsRefreshingBackend(false);
  };

  // Custom mods for simulator when passed from drill-down
  const [customSimulatorMods, setCustomSimulatorMods] = useState<{
    remediationDelayDays?: number;
    mfaCoverageChange?: number;
    threatFrequencyMultiplier?: number;
  }>({});

  // Sync telemetry simulation
  const handleRefreshTelemetry = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setTelemetrySources((prev) =>
        prev.map((s) => ({
          ...s,
          lastSync: 'Just now',
          eventsIngested24h: s.eventsIngested24h.replace(/(\d+(\.\d+)?)/, (match) => {
            const num = parseFloat(match);
            return (num + 0.1).toFixed(1);
          }),
        }))
      );
    }, 1200);
  };

  // Jump from finding to simulator
  const handleSimulateFinding = (finding: VulnerabilityFinding) => {
    setCustomSimulatorMods({
      remediationDelayDays: -14, // simulate immediate hotpatch
      threatFrequencyMultiplier: 1.0,
    });
    setActiveTab('simulator');
  };

  // Toggle finding status (Mitigated vs Open)
  const handleToggleFindingStatus = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => {
        if (f.id === findingId) {
          const nextStatus = f.status === 'Mitigated' ? 'Open' : 'Mitigated';
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Enterprise Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onOpenBoardBrief={() => setIsBoardMemoOpen(true)}
        isSyncing={isSyncing}
        onRefreshTelemetry={handleRefreshTelemetry}
        backendState={backendState}
        backendUrl={API_BASE_URL}
        onRefreshBackend={handleRefreshBackend}
        isRefreshingBackend={isRefreshingBackend}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        {activeTab === 'executive' && (
          <ExecutiveDashboard
            summary={summary}
            dashboardData={dashboardData}
            isLoading={isLoadingDashboard}
            error={dashboardError}
            onRetry={loadData}
            isLiveBackend={backendState === 'connected'}
            businessUnits={businessUnits}
            findings={findings}
            assets={assets}
            currency={currency}
            onNavigateToTab={setActiveTab}
            onSimulateFinding={handleSimulateFinding}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryDrilldown
            telemetrySources={telemetrySources}
            assets={assets}
            findings={findings}
            currency={currency}
            onSimulateFinding={handleSimulateFinding}
            onToggleFindingStatus={handleToggleFindingStatus}
          />
        )}

        {activeTab === 'simulator' && (
          <ScenarioSimulator
            scenarios={scenarios}
            summary={summary}
            currency={currency}
            initialCustomMods={customSimulatorMods}
          />
        )}

        {activeTab === 'optimizer' && (
          <InvestmentOptimizer
            initiatives={initiatives}
            currency={currency}
            onOpenBoardBrief={() => setIsBoardMemoOpen(true)}
          />
        )}

        {activeTab === 'compliance' && (
          <ComplianceMapping
            frameworks={frameworks}
            currency={currency}
            onOpenBoardBrief={() => setIsBoardMemoOpen(true)}
          />
        )}

        {activeTab === 'ai-assistant' && (
          <AIDecisionAssistant
            summary={summary}
            currency={currency}
            findings={findings}
            assets={assets}
            onNavigateToTab={setActiveTab}
          />
        )}
      </main>

      {/* Board Oversight Memorandum Modal */}
      <BoardMemoModal
        isOpen={isBoardMemoOpen}
        onClose={() => setIsBoardMemoOpen(false)}
        summary={summary}
        currency={currency}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 lg:px-8 py-4 text-xs text-slate-500 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CyberRisk Quant</span>
            <span>•</span>
            <span>Continuous Cyber Risk Quantification & Investment Optimization</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Aligned with FAIR™ Institute Standards</span>
            <span>•</span>
            <span>ISO 27001</span>
            <span>•</span>
            <span>NIST CSF 2.0</span>
            <span>•</span>
            <span>RBI / SEBI CSCRF</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
