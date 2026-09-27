import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { SimulationScenario, QuantSummary, Currency } from '../types/risk';
import { RiskQuantifyApiResponse } from '../types/api';
import { formatCurrency, simulateExposureDelta } from '../utils/quantEngine';
import { api } from '../services/api';

interface ScenarioSimulatorProps {
  scenarios: SimulationScenario[];
  summary: QuantSummary;
  currency: Currency;
  initialCustomMods?: {
    remediationDelayDays?: number;
    mfaCoverageChange?: number;
    threatFrequencyMultiplier?: number;
  };
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  scenarios,
  summary,
  currency,
  initialCustomMods,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('custom');
  
  // Custom slider states
  const [mfaCoverageDelta, setMfaCoverageDelta] = useState<number>(
    initialCustomMods?.mfaCoverageChange || 0
  );
  const [remediationDelayDays, setRemediationDelayDays] = useState<number>(
    initialCustomMods?.remediationDelayDays || 0
  );
  const [threatFrequencyMultiplier, setThreatFrequencyMultiplier] = useState<number>(
    initialCustomMods?.threatFrequencyMultiplier || 1.0
  );
  const [edrCoverageDelta, setEdrCoverageDelta] = useState<number>(0);
  const [cloudGuardrails, setCloudGuardrails] = useState<boolean>(false);

  // Apply scenario preset
  const handleSelectScenario = (scenario: SimulationScenario) => {
    setSelectedScenarioId(scenario.id);
    if (scenario.parameterMods.mfaCoverageChange !== undefined) {
      setMfaCoverageDelta(scenario.parameterMods.mfaCoverageChange);
    } else {
      setMfaCoverageDelta(0);
    }

    if (scenario.parameterMods.remediationDelayDays !== undefined) {
      setRemediationDelayDays(scenario.parameterMods.remediationDelayDays);
    } else {
      setRemediationDelayDays(0);
    }

    if (scenario.parameterMods.threatFrequencyMultiplier !== undefined) {
      setThreatFrequencyMultiplier(scenario.parameterMods.threatFrequencyMultiplier);
    } else {
      setThreatFrequencyMultiplier(1.0);
    }

    if (scenario.parameterMods.edrCoverageChange !== undefined) {
      setEdrCoverageDelta(scenario.parameterMods.edrCoverageChange);
    } else {
      setEdrCoverageDelta(0);
    }

    if (scenario.parameterMods.cloudGuardrailEnforcement !== undefined) {
      setCloudGuardrails(scenario.parameterMods.cloudGuardrailEnforcement);
    } else {
      setCloudGuardrails(false);
    }
  };

  const handleReset = () => {
    setSelectedScenarioId('custom');
    setMfaCoverageDelta(0);
    setRemediationDelayDays(0);
    setThreatFrequencyMultiplier(1.0);
    setEdrCoverageDelta(0);
    setCloudGuardrails(false);
  };

  const [backendSimulation, setBackendSimulation] = useState<RiskQuantifyApiResponse | null>(null);
  const [isQuantifying, setIsQuantifying] = useState<boolean>(false);

  useEffect(() => {
    let isCurrent = true;
    setIsQuantifying(true);
    api.quantifyRisk({
      parameters: {
        mfa_coverage_delta: mfaCoverageDelta,
        remediation_delay_days: remediationDelayDays,
        threat_frequency_multiplier: threatFrequencyMultiplier,
        edr_coverage_delta: edrCoverageDelta,
        cloud_guardrails: cloudGuardrails,
      }
    }).then((res) => {
      if (isCurrent) {
        setBackendSimulation(res);
        setIsQuantifying(false);
      }
    }).catch(() => {
      if (isCurrent) setIsQuantifying(false);
    });
    return () => { isCurrent = false; };
  }, [mfaCoverageDelta, remediationDelayDays, threatFrequencyMultiplier, edrCoverageDelta, cloudGuardrails]);

  // Perform dynamic FAIR mathematical recalculation
  const localResult = simulateExposureDelta(summary, {
    mfaCoverageDelta,
    remediationDelayDays,
    threatFrequencyMultiplier,
    edrCoverageDelta,
    cloudGuardrails,
  });

  const simulationResult = {
    ...localResult,
    simulatedEal: backendSimulation?.simulated_eal ?? localResult.simulatedEal,
    deltaEal: backendSimulation?.delta_eal ?? localResult.deltaEal,
    simulatedVar95: backendSimulation?.simulated_var_95 ?? localResult.simulatedVar95,
    deltaVar95: backendSimulation?.delta_var_95 ?? (localResult.simulatedVar95 - summary.var95),
  };

  // Chart data comparing Baseline vs Simulated
  const comparisonData = [
    {
      name: 'Business Downtime',
      Baseline: summary.lossBreakdown.businessInterruption / 1000000,
      Simulated: simulationResult.lossBreakdown.businessInterruption / 1000000,
    },
    {
      name: 'Regulatory Fines',
      Baseline: summary.lossBreakdown.regulatoryFines / 1000000,
      Simulated: simulationResult.lossBreakdown.regulatoryFines / 1000000,
    },
    {
      name: 'Incident Response',
      Baseline: summary.lossBreakdown.responseAndForensics / 1000000,
      Simulated: simulationResult.lossBreakdown.responseAndForensics / 1000000,
    },
    {
      name: 'Reputational Loss',
      Baseline: summary.lossBreakdown.reputationalLoss / 1000000,
      Simulated: simulationResult.lossBreakdown.reputationalLoss / 1000000,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                Monte Carlo What-If Simulation
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              Cyber Risk Scenario Simulation Laboratory
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Model real-world operational changes, control deployments, or adversary campaign surges to observe immediate impact on monetary Expected Annual Loss (EAL) and 95% Value at Risk (VaR).
            </p>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 self-start lg:self-center transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Current Baseline</span>
          </button>
        </div>

        {/* Pre-configured Scenario Selector Chips */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
            Quick Executive Scenarios:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {scenarios.map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  selectedScenarioId === sc.id
                    ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  {sc.category}
                </span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5 block">
                  {sc.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Simulation Workspace Grid: Controls Sliders vs Output Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Interactive What-If Parameter Sliders (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Simulation Controls & Parameters</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Dynamic Mode</span>
          </div>

          {/* Slider 1: MFA Coverage Delta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">FIDO2 MFA Coverage Expansion</span>
              <span className="font-mono font-bold text-emerald-600">+{mfaCoverageDelta}%</span>
            </div>
            <p className="text-[11px] text-slate-500">Expands phishing-resistant keys to privileged cloud & payment ops</p>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={mfaCoverageDelta}
              onChange={(e) => {
                setSelectedScenarioId('custom');
                setMfaCoverageDelta(Number(e.target.value));
              }}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Baseline (78%)</span>
              <span>100% Mandatory Enforcement</span>
            </div>
          </div>

          {/* Slider 2: Remediation Delay / Acceleration */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Vulnerability Patch Cadence Shift</span>
              <span className={`font-mono font-bold ${remediationDelayDays > 0 ? 'text-rose-600' : remediationDelayDays < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                {remediationDelayDays > 0 ? `+${remediationDelayDays} days delay` : remediationDelayDays < 0 ? `${Math.abs(remediationDelayDays)} days accelerated` : 'Current SLA (14d)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Models window of vulnerability exposure across public-facing hosts</p>
            <input
              type="range"
              min="-14"
              max="60"
              step="1"
              value={remediationDelayDays}
              onChange={(e) => {
                setSelectedScenarioId('custom');
                setRemediationDelayDays(Number(e.target.value));
              }}
              className="w-full accent-cyan-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-14d (Emergency 72h SLA)</span>
              <span>+60d (Deferred Sprints)</span>
            </div>
          </div>

          {/* Slider 3: Threat Activity Multiplier */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">Adversary Threat Event Frequency</span>
              <span className={`font-mono font-bold ${threatFrequencyMultiplier > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {threatFrequencyMultiplier.toFixed(2)}x
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Simulates targeted geopolitical cyber campaign or zero-day discovery</p>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={threatFrequencyMultiplier}
              onChange={(e) => {
                setSelectedScenarioId('custom');
                setThreatFrequencyMultiplier(Number(e.target.value));
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.5x Calm Period</span>
              <span>1.0x Normal</span>
              <span>2.5x Coordinated Attack</span>
            </div>
          </div>

          {/* Slider 4: EDR Coverage */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">EDR Sensor Fleet Expansion</span>
              <span className="font-mono font-bold text-indigo-600">+{edrCoverageDelta}%</span>
            </div>
            <p className="text-[11px] text-slate-500">Deploys behavioral isolation agents on all remaining containers & data lakes</p>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={edrCoverageDelta}
              onChange={(e) => {
                setSelectedScenarioId('custom');
                setEdrCoverageDelta(Number(e.target.value));
              }}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Current (84%)</span>
              <span>100% Total Fleet Coverage</span>
            </div>
          </div>

          {/* Toggle: Cloud Guardrails */}
          <div className="pt-2 border-t border-slate-200">
            <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-all">
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Enforce CSPM CI/CD Guardrails</span>
                <span className="text-[11px] text-slate-500">Automatically block insecure IaC templates before deployment</span>
              </div>
              <input
                type="checkbox"
                checked={cloudGuardrails}
                onChange={(e) => {
                  setSelectedScenarioId('custom');
                  setCloudGuardrails(e.target.checked);
                }}
                className="w-4 h-4 accent-emerald-600 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Right Col: Live Simulation Impact & Financial Delta (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Simulated Financial Impact & Exposure Delta</span>
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                simulationResult.deltaEal <= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {simulationResult.deltaPercentage <= 0 ? `${simulationResult.deltaPercentage}% Risk Reduction` : `+${simulationResult.deltaPercentage}% Risk Spike`}
              </span>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              {/* Simulated EAL */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Simulated EAL</span>
                <span className="text-xl font-extrabold text-slate-900 font-mono-num mt-1 block">
                  {formatCurrency(simulationResult.simulatedEal, currency)}
                </span>
                <div className="flex items-center gap-1 text-[11px] mt-1 font-semibold">
                  {simulationResult.deltaEal <= 0 ? (
                    <span className="text-emerald-600 flex items-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {formatCurrency(Math.abs(simulationResult.deltaEal), currency, true)} saved
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{formatCurrency(simulationResult.deltaEal, currency, true)} added loss
                    </span>
                  )}
                </div>
              </div>

              {/* Simulated VaR 95% */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Simulated VaR (95%)</span>
                <span className="text-xl font-extrabold text-rose-600 font-mono-num mt-1 block">
                  {formatCurrency(simulationResult.simulatedVar95, currency)}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  1-in-20 year loss boundary
                </span>
              </div>

              {/* Risk Score */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Simulated Risk Score</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-extrabold text-slate-900 font-mono-num">
                    {simulationResult.simulatedRiskScore}
                  </span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Baseline: {summary.enterpriseRiskScore}
                </span>
              </div>
            </div>

            {/* Comparison Bar Chart */}
            <div className="mt-5">
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Loss Breakdown Comparison (USD Millions)
              </span>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="M" />
                    <Tooltip 
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}M`, '']}
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', fontSize: '11px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Simulated" fill={simulationResult.deltaEal <= 0 ? '#059669' : '#e11d48'} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Decision Guidance Callout */}
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-slate-900 block">CISO Recommendation:</span>
              <p className="text-slate-600 mt-0.5">
                {simulationResult.deltaEal <= 0
                  ? `This scenario achieves an annual exposure savings of ${formatCurrency(Math.abs(simulationResult.deltaEal), currency)}. Priority implementation should focus on the UPI payment cluster to maximize near-term ROSI.`
                  : `Delaying remediation or facing higher threat frequencies elevates Value at Risk to ${formatCurrency(simulationResult.simulatedVar95, currency)}. Regulatory audit scrutiny under RBI guidelines will intensify if unmitigated past 30 days.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
