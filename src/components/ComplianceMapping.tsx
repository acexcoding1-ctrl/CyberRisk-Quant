import React, { useState } from 'react';
import { 
  FileCheck2, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Layers, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Printer
} from 'lucide-react';
import { ComplianceFramework, Currency } from '../types/risk';
import { formatCurrency } from '../utils/quantEngine';

interface ComplianceMappingProps {
  frameworks: ComplianceFramework[];
  currency: Currency;
  onOpenBoardBrief: () => void;
}

export const ComplianceMapping: React.FC<ComplianceMappingProps> = ({
  frameworks,
  currency,
  onOpenBoardBrief,
}) => {
  const [selectedFwId, setSelectedFwId] = useState<string>(frameworks[0]?.id || 'fw-1');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const activeFramework = frameworks.find((f) => f.id === selectedFwId) || frameworks[0];

  const handleExportAuditReport = () => {
    const reportText = `CYBER RISK QUANT - AUDIT EVIDENCE & REGULATORY COMPLIANCE ATTESTATION
Framework: ${activeFramework.name} (${activeFramework.standard})
Governing Body: ${activeFramework.governingBody}
Attestation Date: September 2026

1. EXECUTIVE COMPLIANCE SUMMARY:
- Overall Maturity Score: ${activeFramework.maturityScore} / 5.0
- Compliance Alignment: ${activeFramework.compliancePct}%
- Controls Total: ${activeFramework.controlsTotal} (Compliant: ${activeFramework.controlsCompliant}, Partial: ${activeFramework.controlsPartial}, Gaps: ${activeFramework.controlsGap})
- Unmitigated Financial Cyber Exposure at Risk: ${formatCurrency(activeFramework.mappedEalExposure, currency)}

2. DOMAIN-LEVEL BREAKDOWN:
${activeFramework.categories.map((c) => `* ${c.name}: Score ${c.score}/${c.total} [${c.status}] - Mapped Risk Exposure: ${formatCurrency(c.riskExposed, currency)}`).join('\n')}

3. ATTESTATION STATEMENT:
Continuous telemetry ingested from enterprise EDR, SIEM, IAM, and CSPM provides objective, real-time validation of control state, replacing periodic manual spreadsheets.`;

    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Statutory & Regulatory Governance
              </span>
              <span className="text-xs text-slate-500">Continuous Telemetry Audit Evidence</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              Cybersecurity Framework & Regulatory Mapping
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Cross-maps live security telemetry to established global and financial standards (ISO 27001, NIST CSF 2.0, CIS Controls, RBI Framework, and SEBI CSCRF), quantifying compliance gaps in monetary terms.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportAuditReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
            >
              {copiedReport ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Evidence Copied!' : 'Export Audit Dossier'}</span>
            </button>
            <button
              onClick={onOpenBoardBrief}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Board Memo</span>
            </button>
          </div>
        </div>

        {/* Framework Selector Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 overflow-x-auto pb-1 scrollbar-none">
          {frameworks.map((fw) => {
            const isSelected = fw.id === selectedFwId;
            return (
              <button
                key={fw.id}
                onClick={() => setSelectedFwId(fw.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <span>{fw.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-700 font-mono font-bold border border-slate-200">
                  {fw.compliancePct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Framework Deep Dive Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Percentage */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Compliance Alignment</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-700 font-mono-num">
              {activeFramework.compliancePct}%
            </span>
            <span className="text-xs text-slate-500">Compliant</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full" 
              style={{ width: `${activeFramework.compliancePct}%` }} 
            />
          </div>
        </div>

        {/* Maturity Score */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">CMMI Maturity Score</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
              {activeFramework.maturityScore}
            </span>
            <span className="text-sm text-slate-500">/ 5.0</span>
          </div>
          <span className="text-xs text-emerald-700 mt-2 block font-medium">Level 4: Quantitatively Managed</span>
        </div>

        {/* Controls Status Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Controls Audit Status</span>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <div>
              <span className="font-bold text-emerald-700 font-mono-num text-lg">{activeFramework.controlsCompliant}</span>
              <span className="text-[10px] text-slate-500 block">Compliant</span>
            </div>
            <div>
              <span className="font-bold text-amber-600 font-mono-num text-lg">{activeFramework.controlsPartial}</span>
              <span className="text-[10px] text-slate-500 block">Partial</span>
            </div>
            <div>
              <span className="font-bold text-rose-600 font-mono-num text-lg">{activeFramework.controlsGap}</span>
              <span className="text-[10px] text-slate-500 block">Gaps</span>
            </div>
          </div>
        </div>

        {/* Monetary Risk at Stake */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Financial Exposure at Risk</span>
          <span className="text-2xl font-extrabold text-rose-600 font-mono-num mt-1 block">
            {formatCurrency(activeFramework.mappedEalExposure, currency)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Monetary impact tied to partial & gap controls
          </span>
        </div>
      </div>

      {/* Domain Categories and Controls List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">{activeFramework.name} Domain Breakdown</h3>
            <p className="text-xs text-slate-500">{activeFramework.governingBody} • Standard: {activeFramework.standard}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {activeFramework.categories.length} Control Domains
          </span>
        </div>

        <div className="space-y-3">
          {activeFramework.categories.map((cat, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:bg-slate-100/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    cat.status === 'Compliant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    cat.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {cat.status}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Controls Score: <span className="text-slate-800 font-mono font-bold">{cat.score}</span> of {cat.total} validated via continuous telemetry
                </p>
              </div>

              <div className="flex sm:items-center md:flex-col md:items-end justify-between gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-500 block">Mapped Cyber Exposure:</span>
                  <span className={`text-sm font-extrabold font-mono-num ${cat.riskExposed > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {cat.riskExposed > 0 ? formatCurrency(cat.riskExposed, currency) : 'No Material Exposure'}
                  </span>
                </div>
                <div className="w-24 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      cat.status === 'Compliant' ? 'bg-emerald-600' : cat.status === 'Partial' ? 'bg-amber-500' : 'bg-rose-600'
                    }`}
                    style={{ width: `${(cat.score / cat.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
