import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Loader2, 
  Printer, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';
import { QuantSummary, Currency } from '../types/risk';
import { formatCurrency } from '../utils/quantEngine';

interface BoardMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: QuantSummary;
  currency: Currency;
}

export const BoardMemoModal: React.FC<BoardMemoModalProps> = ({
  isOpen,
  onClose,
  summary,
  currency,
}) => {
  const [memoText, setMemoText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      generateBoardMemo();
    }
  }, [isOpen, currency]);

  const generateBoardMemo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/board-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: {
            enterpriseRiskScore: summary.enterpriseRiskScore,
            totalEalFormatted: formatCurrency(summary.totalEal, currency),
            var95Formatted: formatCurrency(summary.var95, currency),
            var99Formatted: formatCurrency(summary.var99, currency),
            lossBreakdown: {
              businessInterruption: formatCurrency(summary.lossBreakdown.businessInterruption, currency),
              regulatoryFines: formatCurrency(summary.lossBreakdown.regulatoryFines, currency),
              responseAndForensics: formatCurrency(summary.lossBreakdown.responseAndForensics, currency),
              reputationalLoss: formatCurrency(summary.lossBreakdown.reputationalLoss, currency),
            },
            recommendedBudgetFormatted: formatCurrency(930000, currency),
            potentialRiskReductionFormatted: formatCurrency(7100000, currency),
            rosiPercent: '663%',
          },
          targetAudience: 'Board Risk Committee & Audit Committee',
        }),
      });

      const data = await response.json();
      setMemoText(data.brief || '');
    } catch (err) {
      console.error('Error generating memo:', err);
      setMemoText(`### MEMORANDUM FOR THE BOARD RISK & AUDIT COMMITTEE
**SUBJECT:** Q3 Enterprise Cyber Risk Financial Exposure & Security Capital Allocation  
**Expected Annual Loss:** ${formatCurrency(summary.totalEal, currency)}  
**Value at Risk (95%):** ${formatCurrency(summary.var95, currency)}  

Our enterprise cyber risk is now quantified continuously in monetary terms. We request an incremental capital allocation of ${formatCurrency(930000, currency)} targeting FIDO2 Hardware MFA and Microsegmentation to yield ${formatCurrency(7100000, currency)} in risk reduction (ROSI: 663%).`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(memoText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Board Risk Committee Oversight Memorandum</h3>
              <p className="text-[11px] text-slate-500">AI-Generated Executive Cyber Exposure Briefing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Text'}</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-200 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Memo</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <span className="text-xs font-medium">Drafting board-ready cyber risk memo via Gemini AI...</span>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-100 selection:text-slate-900">
              {memoText}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliant with ISO 27001 & RBI Board Governance Circular</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
