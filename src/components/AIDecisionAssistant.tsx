import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  HelpCircle, 
  ArrowUpRight, 
  RotateCcw, 
  Copy, 
  Check, 
  ShieldAlert,
  Loader2,
  DollarSign
} from 'lucide-react';
import { QuantSummary, Currency, VulnerabilityFinding, Asset } from '../types/risk';
import { formatCurrency } from '../utils/quantEngine';

interface AIDecisionAssistantProps {
  summary: QuantSummary;
  currency: Currency;
  findings: VulnerabilityFinding[];
  assets: Asset[];
  onNavigateToTab: (tab: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIDecisionAssistant: React.FC<AIDecisionAssistantProps> = ({
  summary,
  currency,
  findings,
  assets,
  onNavigateToTab,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to CyberRisk Quant AI Advisor
I am your Executive Cyber Risk Economist & CISO Copilot. I translate technical vulnerabilities, SIEM/EDR telemetry, and cloud configurations into **monetary exposure ($ / ₹), Expected Annual Loss (EAL), and investment recommendations**.

**You can ask me questions such as:**
- *"What is our highest financial cyber risk today?"*
- *"Which vulnerabilities contribute most to our expected losses?"*
- *"How will delaying remediation by 30 days affect our financial exposure?"*
- *"What is our compliance risk under the RBI Cyber Security Framework and SEBI CSCRF?"*
- *"How should we allocate a $1M security budget for maximum ROSI?"*`,
      timestamp: 'Just now',
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestedPrompts = [
    'What is our highest financial cyber risk today?',
    'Which vulnerabilities contribute most to our expected losses?',
    'How does delaying remediation by 30 days affect our losses?',
    'What is our compliance gap under RBI & SEBI frameworks?',
    'How should we allocate a $1M budget to maximize ROSI?',
  ];

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          context: {
            enterpriseRiskScore: summary.enterpriseRiskScore,
            totalEal: summary.totalEal,
            var95: summary.var95,
            currency,
            topAssets: assets.slice(0, 4).map((a) => ({
              name: a.name,
              criticality: a.criticality,
              eal: a.eal,
              downtimeCostPerHour: a.downtimeCostPerHour,
            })),
            topFindings: findings.slice(0, 4).map((f) => ({
              cve: f.cve,
              title: f.title,
              severity: f.severity,
              cvss: f.cvss,
              epss: f.epss,
              financialImpact: f.estimatedFinancialImpact,
            })),
          },
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: `Error generating AI analysis: ${err.message}. Please verify server status.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Gemini 3.8 Flash Engine
              </span>
              <span className="text-xs text-slate-500">Grounded in Live Telemetry & FAIR Metrics</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight">
              Natural Language Cyber Risk Copilot
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Empowering CISOs, CFOs, risk committees, and board members to interrogate enterprise cyber exposure in plain business language.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('simulator')}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Scenario Simulator</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToTab('optimizer')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Investment Optimizer</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Suggested Quick Questions */}
        <div className="mt-5 pt-4 border-t border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Suggested Executive Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={isLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 hover:border-emerald-400 hover:bg-slate-100 hover:text-slate-900 transition-all text-left shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Conversation Pane */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col min-h-[500px] shadow-sm">
        {/* Messages List */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}

              <div
                className={`p-4 rounded-2xl max-w-3xl relative group ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                }`}
              >
                {/* Copy action for assistant */}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="absolute top-3 right-3 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}

                <div className="whitespace-pre-wrap prose prose-slate max-w-none text-xs leading-relaxed space-y-2">
                  {msg.content}
                </div>

                <div className={`mt-2 text-[10px] ${msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-700" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Gemini is quantifying telemetry and estimating monetary risk...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask anything about enterprise cyber risk, EAL, VaR, or budget allocation..."
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isLoading}
            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 shrink-0"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
